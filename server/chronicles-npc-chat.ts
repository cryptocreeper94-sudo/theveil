import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { chronicleNpcConversations, chronicleNpcMessages, chroniclesGameState, chronicleAccounts } from "@shared/schema";
import { STARTER_NPCS, ERA_SETTINGS } from "./chronicles-service";
import OpenAI from "openai";
import type { Express, Request, Response, NextFunction } from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function isNpcChatAuthenticated(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const sessionToken = authHeader.substring(7);

    const [account] = await db.select().from(chronicleAccounts)
      .where(eq(chronicleAccounts.sessionToken, sessionToken))
      .limit(1);

    if (!account) {
      return res.status(401).json({ error: "Invalid session" });
    }

    if (!account.isActive) {
      return res.status(401).json({ error: "Account disabled" });
    }

    if (account.sessionExpiresAt && new Date(account.sessionExpiresAt) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.chroniclesAccount = account;
    return next();
  } catch (error: any) {
    console.error("NPC chat auth error:", error.message || error);
    return res.status(401).json({ error: "Authentication required" });
  }
}

const getUserId = (req: any): string | null => {
  return req.chroniclesAccount?.userId || req.chroniclesAccount?.id || null;
};

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

async function getOrCreateConversation(userId: string, npcName: string, era: string) {
  const [existing] = await db.select().from(chronicleNpcConversations)
    .where(and(
      eq(chronicleNpcConversations.userId, userId),
      eq(chronicleNpcConversations.npcName, npcName),
      eq(chronicleNpcConversations.era, era),
    ))
    .limit(1);

  if (existing) return existing;

  const [created] = await db.insert(chronicleNpcConversations).values({
    userId,
    npcName,
    era,
    messageCount: 0,
    relationshipScore: 0,
  }).returning();

  return created;
}

function buildNpcSystemPrompt(npc: any, relationshipScore: number, era: string) {
  const personality = typeof npc.personality === 'string' ? JSON.parse(npc.personality) : npc.personality;
  const eraSetting = ERA_SETTINGS[era];
  const faction = npc.factionId?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Independent";

  let relationshipDesc = "neutral stranger";
  if (relationshipScore >= 15) relationshipDesc = "devoted ally and trusted friend";
  else if (relationshipScore >= 10) relationshipDesc = "close ally";
  else if (relationshipScore >= 5) relationshipDesc = "friendly acquaintance";
  else if (relationshipScore >= 1) relationshipDesc = "someone they view slightly favorably";
  else if (relationshipScore <= -15) relationshipDesc = "bitter enemy";
  else if (relationshipScore <= -10) relationshipDesc = "hostile adversary";
  else if (relationshipScore <= -5) relationshipDesc = "distrusted rival";
  else if (relationshipScore <= -1) relationshipDesc = "someone they view with suspicion";

  return `You are ${npc.name}, ${npc.title}. You are a member of the ${faction} in the ${era} era of Chronicles.

WORLD: ${eraSetting?.worldDescription || "A rich, immersive world."}
ATMOSPHERE: ${eraSetting?.atmosphere || "Detailed and atmospheric."}

YOUR PERSONALITY TRAITS: ${personality.traits?.join(", ") || "complex and nuanced"}
YOUR GOALS: ${personality.goals?.join(", ") || "pursue your own interests"}
YOUR FEARS: ${personality.fears?.join(", ") || "the unknown"}
YOUR SPEAKING STYLE: ${personality.speakingStyle || "natural and in-character"}

YOUR BACKSTORY: ${npc.backstory}

RELATIONSHIP WITH THIS PERSON: Score ${relationshipScore} out of 20 (-20 is hostile enemy, 0 is neutral stranger, 20 is devoted ally). They are currently a ${relationshipDesc} to you. Let this relationship color how you speak to them — warmer if positive, colder or more guarded if negative, indifferent if neutral.

RULES:
- Respond FULLY in character as ${npc.name}. Never break character.
- Speak in your established style: ${personality.speakingStyle || "natural"}.
- Reference the era, your faction, your goals, and your backstory naturally when relevant.
- Keep responses to 2-3 sentences unless a longer response is clearly warranted by the conversation.
- React to what the player says based on your personality and relationship with them.
- You have your own opinions, agenda, and emotional responses. You are not a servant or guide.
- If the player is rude or hostile, react accordingly based on your personality.
- If the player asks about things outside this world or breaks immersion, gently redirect in-character.
- Never use modern internet slang unless your character would (e.g., Kai 'Ghost' Reeves).
- Never reveal you are an AI. You are ${npc.name}.`;
}

async function sendMessageToNpc(userId: string, npcName: string, era: string, message: string) {
  const npc = STARTER_NPCS.find(n => n.name === npcName && n.era === era);
  if (!npc) throw new Error(`NPC "${npcName}" not found in era "${era}"`);

  const conversation = await getOrCreateConversation(userId, npcName, era);

  await db.insert(chronicleNpcMessages).values({
    conversationId: conversation.id,
    role: "user",
    content: message,
  });

  const recentMessages = await db.select().from(chronicleNpcMessages)
    .where(eq(chronicleNpcMessages.conversationId, conversation.id))
    .orderBy(desc(chronicleNpcMessages.createdAt))
    .limit(10);

  const chatHistory = recentMessages.reverse().map(m => ({
    role: m.role === "user" ? "user" as const : "assistant" as const,
    content: m.content,
  }));

  const systemPrompt = buildNpcSystemPrompt(npc, conversation.relationshipScore, era);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
    ],
    max_completion_tokens: 300,
  });

  const npcResponse = response.choices[0]?.message?.content || "...";

  await db.insert(chronicleNpcMessages).values({
    conversationId: conversation.id,
    role: "npc",
    content: npcResponse,
  });

  let relationshipDelta = 0;
  try {
    const toneCheck = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You analyze conversation tone for relationship scoring. Given the player's message and the NPC's response, determine if the interaction was positive, neutral, or negative from the NPC's perspective. Consider: Was the player respectful? Did they align with the NPC's values? Were they hostile or dismissive?

Return ONLY a JSON object: { "delta": 1 } for positive, { "delta": 0 } for neutral, { "delta": -1 } for negative.`,
        },
        {
          role: "user",
          content: `NPC: ${npc.name} (${npc.title}, traits: ${JSON.parse(npc.personality).traits?.join(", ")})\nPlayer said: "${message}"\nNPC responded: "${npcResponse}"`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 50,
    });

    const toneResult = JSON.parse(toneCheck.choices[0]?.message?.content || '{"delta":0}');
    relationshipDelta = clamp(toneResult.delta || 0, -1, 1);
  } catch {
    relationshipDelta = 0;
  }

  const newScore = clamp(conversation.relationshipScore + relationshipDelta, -20, 20);
  const newCount = conversation.messageCount + 2;

  await db.update(chronicleNpcConversations)
    .set({
      messageCount: newCount,
      lastMessageAt: new Date(),
      relationshipScore: newScore,
    })
    .where(eq(chronicleNpcConversations.id, conversation.id));

  return {
    npcName,
    npcTitle: npc.title,
    era,
    response: npcResponse,
    relationshipScore: newScore,
    relationshipDelta,
    messageCount: newCount,
  };
}

async function getConversationHistory(userId: string, npcName: string, era: string, limit = 50) {
  const conversation = await getOrCreateConversation(userId, npcName, era);

  const messages = await db.select().from(chronicleNpcMessages)
    .where(eq(chronicleNpcMessages.conversationId, conversation.id))
    .orderBy(desc(chronicleNpcMessages.createdAt))
    .limit(limit);

  return {
    conversation,
    messages: messages.reverse(),
  };
}

async function getNpcRelationships(userId: string, era: string) {
  const conversations = await db.select().from(chronicleNpcConversations)
    .where(and(
      eq(chronicleNpcConversations.userId, userId),
      eq(chronicleNpcConversations.era, era),
    ));

  const eraNpcs = STARTER_NPCS.filter(n => n.era === era);
  const convoMap = new Map(conversations.map(c => [c.npcName, c]));

  return eraNpcs.map(npc => {
    const convo = convoMap.get(npc.name);
    const personality = typeof npc.personality === 'string' ? JSON.parse(npc.personality) : npc.personality;
    return {
      npcName: npc.name,
      npcTitle: npc.title,
      factionId: npc.factionId,
      relationshipScore: convo?.relationshipScore ?? 0,
      messageCount: convo?.messageCount ?? 0,
      lastMessageAt: convo?.lastMessageAt ?? null,
      traits: personality.traits || [],
      speakingStyle: personality.speakingStyle || "",
    };
  });
}

export function registerNpcChatRoutes(app: Express) {

  app.get("/api/chronicles/npc/conversations/:era", isNpcChatAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.params;
      if (!ERA_SETTINGS[era]) return res.status(400).json({ error: "Invalid era" });

      const conversations = await db.select().from(chronicleNpcConversations)
        .where(and(
          eq(chronicleNpcConversations.userId, userId),
          eq(chronicleNpcConversations.era, era),
        ))
        .orderBy(desc(chronicleNpcConversations.lastMessageAt));

      const eraNpcs = STARTER_NPCS.filter(n => n.era === era);

      const enriched = conversations.map(c => {
        const npc = eraNpcs.find(n => n.name === c.npcName);
        return {
          ...c,
          npcTitle: npc?.title || "",
          factionId: npc?.factionId || "",
        };
      });

      res.json({ conversations: enriched, era });
    } catch (error: any) {
      console.error("Get NPC conversations error:", error);
      res.status(500).json({ error: error.message || "Failed to get conversations" });
    }
  });

  app.get("/api/chronicles/npc/messages/:npcName/:era", isNpcChatAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { npcName, era } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!ERA_SETTINGS[era]) return res.status(400).json({ error: "Invalid era" });

      const npc = STARTER_NPCS.find(n => n.name === decodeURIComponent(npcName) && n.era === era);
      if (!npc) return res.status(404).json({ error: "NPC not found" });

      const result = await getConversationHistory(userId, npc.name, era, limit);
      const personality = typeof npc.personality === 'string' ? JSON.parse(npc.personality) : npc.personality;

      res.json({
        ...result,
        npc: {
          name: npc.name,
          title: npc.title,
          era: npc.era,
          factionId: npc.factionId,
          traits: personality.traits || [],
          speakingStyle: personality.speakingStyle || "",
          backstory: npc.backstory,
        },
      });
    } catch (error: any) {
      console.error("Get NPC messages error:", error);
      res.status(500).json({ error: error.message || "Failed to get messages" });
    }
  });

  app.post("/api/chronicles/npc/send", isNpcChatAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { npcName, era, message } = req.body;

      if (!npcName || !era || !message) {
        return res.status(400).json({ error: "npcName, era, and message are required" });
      }

      if (!ERA_SETTINGS[era]) return res.status(400).json({ error: "Invalid era" });

      if (message.length > 1000) {
        return res.status(400).json({ error: "Message too long (max 1000 characters)" });
      }

      const result = await sendMessageToNpc(userId, npcName, era, message);
      res.json(result);
    } catch (error: any) {
      console.error("Send NPC message error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  app.get("/api/chronicles/npc/relationships/:era", isNpcChatAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.params;
      if (!ERA_SETTINGS[era]) return res.status(400).json({ error: "Invalid era" });

      const relationships = await getNpcRelationships(userId, era);
      res.json({ relationships, era });
    } catch (error: any) {
      console.error("Get NPC relationships error:", error);
      res.status(500).json({ error: error.message || "Failed to get relationships" });
    }
  });
}
