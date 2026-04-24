import { db } from "./db";
import { echoPersonas, mirrorJournalEntries, chronicleDailyPulse, veilAnomalies } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Personality trait dimensions for Echo Persona
const TRAIT_DIMENSIONS = {
  compassion: { positive: ['helped', 'mercy', 'kind', 'gentle', 'forgive'], negative: ['harsh', 'punish', 'ignore'] },
  ambition: { positive: ['power', 'wealth', 'climb', 'conquer', 'expand'], negative: ['humble', 'simple', 'content'] },
  curiosity: { positive: ['explore', 'discover', 'learn', 'investigate'], negative: ['stay', 'safe', 'familiar'] },
  loyalty: { positive: ['protect', 'defend', 'stand', 'commit'], negative: ['betray', 'abandon', 'switch'] },
  wisdom: { positive: ['patience', 'think', 'wait', 'plan'], negative: ['rush', 'impulse', 'hasty'] },
  courage: { positive: ['brave', 'risk', 'face', 'challenge'], negative: ['flee', 'hide', 'avoid'] },
};

class MirrorLifeService {

  // =====================================================
  // ECHO PERSONA - Evolving AI Profile
  // =====================================================

  async getOrCreateEchoPersona(userId: string) {
    let [persona] = await db.select().from(echoPersonas).where(eq(echoPersonas.userId, userId));
    
    if (!persona) {
      [persona] = await db.insert(echoPersonas).values({
        userId,
        personalityVectors: JSON.stringify({}),
        dominantTraits: JSON.stringify([]),
        choicePatterns: JSON.stringify({}),
      }).returning();
    }
    
    return {
      ...persona,
      personalityVectors: JSON.parse(persona.personalityVectors || '{}'),
      dominantTraits: JSON.parse(persona.dominantTraits || '[]'),
      choicePatterns: JSON.parse(persona.choicePatterns || '{}'),
    };
  }

  async trackChoice(userId: string, choiceType: 'story' | 'npc' | 'building', choiceDescription: string) {
    const persona = await this.getOrCreateEchoPersona(userId);
    
    // Update counts
    const updates: any = { updatedAt: new Date() };
    if (choiceType === 'story') updates.totalChoicesMade = persona.totalChoicesMade + 1;
    if (choiceType === 'npc') updates.totalNpcInteractions = persona.totalNpcInteractions + 1;
    if (choiceType === 'building') updates.totalBuildingsPlaced = persona.totalBuildingsPlaced + 1;
    
    // Analyze choice for personality traits
    const vectors = persona.personalityVectors;
    const lowerChoice = choiceDescription.toLowerCase();
    
    for (const [trait, keywords] of Object.entries(TRAIT_DIMENSIONS)) {
      let score = vectors[trait] || 0.5;
      for (const word of keywords.positive) {
        if (lowerChoice.includes(word)) score = Math.min(1, score + 0.02);
      }
      for (const word of keywords.negative) {
        if (lowerChoice.includes(word)) score = Math.max(0, score - 0.02);
      }
      vectors[trait] = score;
    }
    
    // Determine dominant traits
    const sortedTraits = Object.entries(vectors)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([trait]) => trait);
    
    updates.personalityVectors = JSON.stringify(vectors);
    updates.dominantTraits = JSON.stringify(sortedTraits);
    
    await db.update(echoPersonas)
      .set(updates)
      .where(eq(echoPersonas.userId, userId));
    
    return { vectors, dominantTraits: sortedTraits };
  }

  async generatePersonaInsight(userId: string): Promise<string> {
    const persona = await this.getOrCreateEchoPersona(userId);
    
    if (persona.totalChoicesMade < 5) {
      return "Your parallel self is still forming. Make more choices to reveal your true nature.";
    }
    
    const traits = persona.dominantTraits;
    const vectors = persona.personalityVectors;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are the Echo - a mystical mirror that reveals truths about travelers across dimensions. Speak in second person, mystically but insightfully. Keep responses under 100 words."
        }, {
          role: "user",
          content: `Analyze this traveler's soul patterns:
Dominant traits: ${traits.join(', ')}
Trait scores: ${JSON.stringify(vectors)}
Total choices made: ${persona.totalChoicesMade}
NPC interactions: ${persona.totalNpcInteractions}
Buildings placed: ${persona.totalBuildingsPlaced}

Generate a profound insight about who they are becoming across dimensions.`
        }],
        max_tokens: 150,
      });
      
      const insight = response.choices[0]?.message?.content || "The veil clouds your reflection. Return again.";
      
      await db.update(echoPersonas)
        .set({ latestInsight: insight, insightGeneratedAt: new Date() })
        .where(eq(echoPersonas.userId, userId));
      
      return insight;
    } catch (err) {
      console.warn("[Echo Persona] Failed to generate insight:", err);
      return `Your soul leans toward ${traits[0] || 'mystery'}. ${persona.totalChoicesMade} choices have shaped you.`;
    }
  }

  // =====================================================
  // MIRROR JOURNAL - Session Summaries
  // =====================================================

  async createJournalEntry(userId: string, sessionActions: { type: string; description: string }[], durationMinutes: number) {
    if (sessionActions.length === 0) return null;
    
    // Determine tone based on action types
    const storyChoices = sessionActions.filter(a => a.type === 'story').length;
    const npcChats = sessionActions.filter(a => a.type === 'npc').length;
    const buildings = sessionActions.filter(a => a.type === 'building').length;
    
    let tone = 'balanced';
    if (storyChoices > npcChats && storyChoices > buildings) tone = 'adventurous';
    if (npcChats > storyChoices && npcChats > buildings) tone = 'social';
    if (buildings > storyChoices && buildings > npcChats) tone = 'industrious';
    
    // Determine emotional arc
    let emotionalArc = 'steady';
    if (sessionActions.length > 10) emotionalArc = 'eventful';
    if (durationMinutes > 60) emotionalArc = 'deep';
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are the Mirror Journal - a mystical record keeper who writes poetic summaries of a traveler's journey across dimensions. Write in second person, past tense. Be insightful and reflective. Keep summaries under 80 words."
        }, {
          role: "user",
          content: `Summarize this session:
Duration: ${durationMinutes} minutes
Actions: ${sessionActions.map(a => `${a.type}: ${a.description}`).join('; ')}
Tone: ${tone}

Write a brief, mystical summary of their journey today.`
        }],
        max_tokens: 120,
      });
      
      const summary = response.choices[0]?.message?.content || "The pages blur. Your journey continues.";
      
      const [entry] = await db.insert(mirrorJournalEntries).values({
        userId,
        summary,
        tone,
        keyChoices: JSON.stringify(sessionActions.slice(0, 5)),
        emotionalArc,
        sessionDurationMinutes: durationMinutes,
        actionsCount: sessionActions.length,
      }).returning();
      
      return entry;
    } catch (err) {
      console.warn("[Mirror Journal] Failed to create entry:", err);
      return null;
    }
  }

  async getRecentJournalEntries(userId: string, limit: number = 7) {
    return db.select().from(mirrorJournalEntries)
      .where(eq(mirrorJournalEntries.userId, userId))
      .orderBy(desc(mirrorJournalEntries.createdAt))
      .limit(limit);
  }

  // =====================================================
  // MORNING PULSE - Daily Check-in
  // =====================================================

  async getMorningPulse(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    let [pulse] = await db.select().from(chronicleDailyPulse)
      .where(and(
        eq(chronicleDailyPulse.userId, userId),
        eq(chronicleDailyPulse.pulseDate, today)
      ));
    
    if (!pulse) {
      // Generate today's pulse
      const activeAnomalies = await this.getActiveAnomalies();
      
      // Generate personalized greeting
      const persona = await this.getOrCreateEchoPersona(userId);
      const dominantTrait = persona.dominantTraits[0] || 'traveler';
      
      const greetings = {
        compassion: "Your kindness ripples through the dimensions today.",
        ambition: "New horizons await your conquest.",
        curiosity: "Mysteries stir beyond the veil.",
        loyalty: "Those you protect watch over you in return.",
        wisdom: "The cosmos aligns for those who wait.",
        courage: "Challenge and glory await the brave.",
        traveler: "A new day dawns across all eras."
      };
      
      const pulseMessage = greetings[dominantTrait as keyof typeof greetings] || greetings.traveler;
      
      [pulse] = await db.insert(chronicleDailyPulse).values({
        userId,
        pulseDate: today,
        overnightShellsEarned: 0, // Could add passive income later
        pendingQuestsCount: 3, // Daily quests
        activeAnomaliesCount: activeAnomalies.length,
        pulseMessage,
      }).returning();
    }
    
    return {
      ...pulse,
      activeAnomalies: await this.getActiveAnomalies(),
      isNewDay: !pulse.claimed,
    };
  }

  async claimMorningPulse(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const [pulse] = await db.select().from(chronicleDailyPulse)
      .where(and(
        eq(chronicleDailyPulse.userId, userId),
        eq(chronicleDailyPulse.pulseDate, today)
      ));
    
    if (!pulse) {
      return { success: false, message: "No pulse available today" };
    }
    
    if (pulse.claimed) {
      return { success: false, message: "Already claimed today's pulse" };
    }
    
    await db.update(chronicleDailyPulse)
      .set({ claimed: true, claimedAt: new Date() })
      .where(eq(chronicleDailyPulse.id, pulse.id));
    
    return { 
      success: true, 
      message: pulse.pulseMessage || "May your journey be prosperous.",
      shellsEarned: pulse.overnightShellsEarned || 0,
    };
  }

  // =====================================================
  // VEIL ANOMALIES - Surprise Events
  // =====================================================

  async getActiveAnomalies() {
    const now = new Date();
    return db.select().from(veilAnomalies)
      .where(and(
        eq(veilAnomalies.isActive, true),
        lte(veilAnomalies.startAt, now),
        gte(veilAnomalies.endAt, now)
      ));
  }

  async triggerRandomAnomaly(): Promise<any> {
    const ANOMALY_TEMPLATES = [
      {
        code: `shell_storm_${Date.now()}`,
        title: "Shell Storm",
        description: "A dimensional rift spills Shells across all eras! Earn 2x Shells for the next 4 hours.",
        effectType: "shell_multiplier",
        effectConfig: JSON.stringify({ multiplier: 2 }),
        durationHours: 4,
        glowColor: "cyan",
        icon: "coins",
      },
      {
        code: `era_rift_${Date.now()}`,
        title: "Era Rift",
        description: "The boundaries between eras thin. All eras are accessible with no travel cost.",
        effectType: "era_unlock",
        effectConfig: JSON.stringify({ freeTravel: true }),
        durationHours: 6,
        glowColor: "purple",
        icon: "zap",
      },
      {
        code: `npc_awakening_${Date.now()}`,
        title: "NPC Awakening",
        description: "NPCs across dimensions share deeper insights. Conversations reveal hidden knowledge.",
        effectType: "npc_special",
        effectConfig: JSON.stringify({ insightBonus: true }),
        durationHours: 8,
        glowColor: "pink",
        icon: "users",
      },
      {
        code: `quest_surge_${Date.now()}`,
        title: "Quest Surge",
        description: "The cosmos rewards the diligent. Quest rewards are doubled!",
        effectType: "quest_bonus",
        effectConfig: JSON.stringify({ rewardMultiplier: 2 }),
        durationHours: 3,
        glowColor: "yellow",
        icon: "star",
      },
      {
        code: `mirror_clarity_${Date.now()}`,
        title: "Mirror Clarity",
        description: "Your Echo speaks with unusual clarity. Gain deeper personality insights.",
        effectType: "echo_boost",
        effectConfig: JSON.stringify({ insightQuality: 'enhanced' }),
        durationHours: 12,
        glowColor: "emerald",
        icon: "eye",
      },
    ];
    
    const template = ANOMALY_TEMPLATES[Math.floor(Math.random() * ANOMALY_TEMPLATES.length)];
    const now = new Date();
    const endAt = new Date(now.getTime() + template.durationHours * 60 * 60 * 1000);
    
    const [anomaly] = await db.insert(veilAnomalies).values({
      code: template.code,
      title: template.title,
      description: template.description,
      startAt: now,
      endAt,
      effectType: template.effectType,
      effectConfig: template.effectConfig,
      isGlobal: true,
      glowColor: template.glowColor,
      icon: template.icon,
    }).returning();
    
    console.log(`[Veil Anomaly] Triggered: ${template.title} until ${endAt.toISOString()}`);
    return anomaly;
  }

  // Check if any anomaly effect applies
  async getActiveEffects() {
    const anomalies = await this.getActiveAnomalies();
    const effects: Record<string, any> = {};
    
    for (const anomaly of anomalies) {
      try {
        const config = JSON.parse(anomaly.effectConfig || '{}');
        effects[anomaly.effectType] = { ...config, anomalyTitle: anomaly.title };
      } catch (e) {}
    }
    
    return effects;
  }
}

export const mirrorLifeService = new MirrorLifeService();

// Seed initial anomaly on startup for demo
(async () => {
  try {
    const active = await mirrorLifeService.getActiveAnomalies();
    if (active.length === 0) {
      console.log("[Veil Anomaly] No active anomalies, triggering welcome event...");
      await mirrorLifeService.triggerRandomAnomaly();
    } else {
      console.log("[Veil Anomaly]", active.length, "active anomalies");
    }
  } catch (err) {
    console.warn("[Veil Anomaly] Startup check failed:", err);
  }
})();
