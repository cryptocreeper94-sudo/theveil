import { db } from "./db";
import { eq, sql, and, desc } from "drizzle-orm";
import { chroniclesGameState, playerChoices, playerPersonalities, chronicleAccounts, landPlots, cityZones, chatUsers, chatChannels, chatMessages, voiceSamples, voiceMessages, userCredits, creditTransactions, playerLegacy, npcRelationships, worldEvents, worldEventParticipation, homeInteriors, decisionTrail, seasonProgress, playerPets } from "@shared/schema";
import OpenAI from "openai";
import { SEASON_ZERO_QUESTS, STARTER_FACTIONS, STARTER_NPCS, ERA_SETTINGS, ERAS, WORLD_ZONES, ZONE_ACTIVITIES, NPC_SCHEDULES, MINIGAME_CONFIGS, getWorldTimeInfo, getZoneAmbientState, getAllZonesForEra, NARRATIVE_ARCS } from "./chronicles-service";
import { zonePresence, minigameSessions } from "@shared/schema";
import { generateToken, hashPassword, generateTrustLayerId } from "./trustlayer-sso";
import type { Express, Request, Response, NextFunction } from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DIFFICULTY_XP: Record<string, number> = { easy: 100, medium: 250, hard: 500 };
const DIFFICULTY_SHELLS: Record<string, number> = { easy: 50, medium: 150, hard: 300 };

const ALL_ACHIEVEMENTS = [
  { id: "first_decision", name: "First Steps", description: "Made your first decision", icon: "🎯" },
  { id: "level_5", name: "Rising Star", description: "Reached level 5", icon: "⭐" },
  { id: "level_10", name: "Veteran", description: "Reached level 10", icon: "🏆" },
  { id: "explorer", name: "Explorer", description: "Completed situations in all 3 eras", icon: "🗺️" },
  { id: "social_butterfly", name: "Social Butterfly", description: "Spoken to 5+ NPCs", icon: "🦋" },
  { id: "faction_member", name: "Faction Member", description: "Joined a faction", icon: "⚔️" },
  { id: "streak_3", name: "Dedicated", description: "3 day streak", icon: "🔥" },
  { id: "streak_7", name: "Unstoppable", description: "7 day streak", icon: "💎" },
  { id: "ten_decisions", name: "Seasoned", description: "Made 10 decisions", icon: "📜" },
  { id: "hundred_shells", name: "Shell Collector", description: "Earned 100+ shells", icon: "🐚" },
];

async function isChroniclesAuthenticated(req: any, res: Response, next: NextFunction) {
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
    req.user = {
      id: account.id,
      claims: { sub: account.id },
      email: account.email
    };

    return next();
  } catch (error: any) {
    console.error("Chronicles play auth error:", error.message || error);
    return res.status(401).json({ error: "Authentication required" });
  }
}

const getPlayUserId = (req: any): string | null => {
  return req.chroniclesUser?.id || req.chroniclesAccount?.userId || req.chroniclesAccount?.id || null;
};

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export function registerChroniclesPlayRoutes(app: Express) {

  app.get("/api/chronicles/play/state", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      let [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) {
        const [created] = await db.insert(chroniclesGameState).values({
          userId,
          name: req.chroniclesAccount?.username || "Traveler",
        }).returning();
        state = created;
      }

      const nextLevelXp = state.level * 1000;
      const xpProgress = (state.experience / nextLevelXp) * 100;

      let recentLog: any[] = [];
      try {
        const parsed = JSON.parse(state.gameLog || '[]');
        recentLog = Array.isArray(parsed) ? parsed.slice(-10) : [];
      } catch { recentLog = []; }

      const completedSet = new Set(state.completedSituations || []);
      const totalSeasonQuests = SEASON_ZERO_QUESTS.length;
      const completedSeasonQuests = SEASON_ZERO_QUESTS.filter(q => completedSet.has(q.id)).length;
      const seasonProgress = Math.round((completedSeasonQuests / totalSeasonQuests) * 100);
      const seasonComplete = completedSeasonQuests >= totalSeasonQuests;

      let narrativeProgress: Record<string, number> = {};
      try { narrativeProgress = JSON.parse(state.narrativeProgress || '{}'); } catch { narrativeProgress = {}; }

      const eraProgress: Record<string, { total: number; completed: number; pct: number; activeArc?: any; nextArc?: any }> = {};
      for (const era of ["modern", "medieval", "wildwest"]) {
        const eraQuests = SEASON_ZERO_QUESTS.filter(q => q.era === era);
        const eraCompleted = eraQuests.filter(q => completedSet.has(q.id)).length;
        
        const currentChapter = narrativeProgress[era] || 0;
        const nextChapter = currentChapter + 1;
        const eraArcs = NARRATIVE_ARCS[era] || [];
        const activeArc = eraArcs.find((arc: any) => arc.chapter === currentChapter) || null;
        const nextArc = eraArcs.find((arc: any) => arc.chapter === nextChapter) || (currentChapter === 0 ? eraArcs[0] : null);

        const totalEraSituationsCompleted = (state.completedSituations || []).filter((sId: string) => {
          const q = SEASON_ZERO_QUESTS.find(sq => sq.id === sId);
          if (q) return q.era === era;
          return typeof sId === 'string' && sId.startsWith(`daily_${era}`);
        }).length;

        eraProgress[era] = { 
          total: eraQuests.length, 
          completed: eraCompleted, 
          pct: Math.round((eraCompleted / eraQuests.length) * 100),
          activeArc,
          nextArc: nextArc ? {
            ...nextArc,
            currentProgress: totalEraSituationsCompleted,
            required: nextArc.requiredDecisions
          } : null
        };
      }

      const eraUnlocks = {
        modern: { unlocked: true, requiredLevel: 1 },
        medieval: { unlocked: state.level >= 5, requiredLevel: 5 },
        wildwest: { unlocked: state.level >= 10, requiredLevel: 10 },
      };

      res.json({
        gameState: state,
        state,
        nextLevelXp,
        xpProgress,
        recentLog,
        seasonProgress,
        seasonComplete,
        totalSeasonQuests,
        completedSeasonQuests,
        eraProgress,
        eraUnlocks,
      });
    } catch (error: any) {
      console.error("Get play state error:", error);
      res.status(500).json({ error: error.message || "Failed to get game state" });
    }
  });

  app.post("/api/chronicles/play/scenario", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.body;
      if (!era || !ERA_SETTINGS[era]) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const eraLevelRequirements: Record<string, number> = { modern: 1, medieval: 5, wildwest: 10 };
      const requiredLevel = eraLevelRequirements[era] || 1;
      if (state.level < requiredLevel) {
        return res.status(403).json({ 
          error: `You need to reach level ${requiredLevel} to unlock the ${ERA_SETTINGS[era]?.worldDescription ? era : "unknown"} era`,
          requiredLevel,
          currentLevel: state.level,
        });
      }

      const completedSet = new Set(state.completedSituations || []);

      const available = SEASON_ZERO_QUESTS.filter(q => {
        if (q.era !== era) return false;
        if (completedSet.has(q.id)) return false;
        if (q.prerequisite && !completedSet.has(q.prerequisite)) return false;
        return true;
      });

      let narrativeProgress: Record<string, number> = {};
      try { narrativeProgress = JSON.parse(state.narrativeProgress || '{}'); } catch { narrativeProgress = {}; }
      
      const currentChapter = narrativeProgress[era] || 0;
      const nextChapter = currentChapter + 1;
      const eraArcs = NARRATIVE_ARCS[era] || [];
      const pendingArc = eraArcs.find((arc: any) => arc.chapter === nextChapter);
      
      const completedEraSituations = (state.completedSituations || []).filter((sId: string) => {
        const q = SEASON_ZERO_QUESTS.find(sq => sq.id === sId);
        if (q) return q.era === era;
        return typeof sId === 'string' && sId.startsWith(`daily_${era}`);
      }).length;

      let situation: any;
      let isGenerated = false;
      let isStoryEvent = false;

      if (pendingArc && completedEraSituations >= pendingArc.requiredDecisions && !completedSet.has(pendingArc.id)) {
        isStoryEvent = true;
        isGenerated = true;
        situation = {
          id: pendingArc.id,
          title: `Chapter ${pendingArc.chapter}: ${pendingArc.title}`,
          description: `The world shifts around you. You are on the precipice of a major revelation. ${pendingArc.description}`,
          difficulty: "hard",
          category: "story_event",
          isStoryEvent: true,
          arc: pendingArc,
          educationalTheme: `This moment tests your core philosophy and advances your overarching journey in the ${ERA_SETTINGS[era]?.worldDescription.split(' ')[0] || ''} era.`
        };
      } else if (available.length > 0) {
        const arrival = available.filter(q => q.category === "arrival");
        if (arrival.length > 0) {
          situation = arrival[0];
        } else {
          situation = available[Math.floor(Math.random() * available.length)];
        }
      } else {
        isGenerated = true;
        const completedQuests = SEASON_ZERO_QUESTS.filter(q => q.era === era && completedSet.has(q.id));
        const recentTitles = completedQuests.slice(-5).map(q => q.title).join(", ");
        const eraNpcs = STARTER_NPCS.filter(n => n.era === era).map(n => `${n.name} (${n.title})`).join(", ");
        const relationships = state.npcRelationships ? JSON.parse(state.npcRelationships || '{}') : {};
        const relSummary = Object.entries(relationships)
          .filter(([k]) => STARTER_NPCS.some(n => n.name === k && n.era === era))
          .map(([k, v]: [string, any]) => `${k}: ${v > 0 ? 'ally' : v < 0 ? 'rival' : 'neutral'} (${v})`)
          .join(", ") || "No established relationships yet";
        try {
          const genRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You generate DAILY LIFE SITUATIONS for Chronicles — a parallel life simulation, NOT an RPG.

ERA: ${era} — ${ERA_SETTINGS[era].worldDescription}
ATMOSPHERE: ${ERA_SETTINGS[era].atmosphere}
KEY NPCs: ${eraNpcs}
PLAYER RELATIONSHIPS: ${relSummary}
PLAYER LEVEL: ${state.level} | Decisions: ${state.decisionsRecorded}
RECENT SITUATIONS: ${recentTitles || "None yet"}

RULES:
- Create a situation that HAPPENS TO the player, not a quest or mission
- Life throws things at people — relationships, crises, opportunities, moral dilemmas, community needs
- NO right or wrong answer. Every choice reveals character, not morality.
- Weave in real historical/educational context naturally (don't lecture — make learning organic)
- Reference NPCs and existing relationships when appropriate
- Make it feel like a real day in a real parallel life
- Vary the categories: life_event, encounter, crisis, opportunity, moral_dilemma, community, partnership, conflict

Return JSON:
{
  "id": "daily_${era}_${Date.now()}",
  "title": "Short evocative title",
  "description": "2-3 sentences. Vivid, personal, immersive. The player is IN this moment.",
  "difficulty": "easy|medium|hard",
  "category": "one of the categories above",
  "npcInvolved": "NPC name or null",
  "educationalTheme": "One sentence about the real-world knowledge woven in"
}`
              },
              { role: "user", content: `Generate a fresh, unique daily situation for this player. Make it something they haven't seen before — not a repeat of: ${recentTitles}. Player stats — Wisdom: ${state.wisdom}, Courage: ${state.courage}, Compassion: ${state.compassion}, Cunning: ${state.cunning}, Influence: ${state.influence}.` }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 600,
          });
          situation = JSON.parse(genRes.choices[0]?.message?.content || '{}');
          if (!situation.id) situation.id = `daily_${era}_${Date.now()}`;
          if (!situation.difficulty) situation.difficulty = "medium";
        } catch {
          situation = {
            id: `daily_${era}_${Date.now()}`,
            title: "A New Day Unfolds",
            description: "Life in this era doesn't pause. Something unexpected crosses your path today — how you respond is entirely up to you.",
            difficulty: "medium",
            category: "life_event",
          };
        }
      }

      const difficulty = situation.difficulty || "medium";
      const xpReward = DIFFICULTY_XP[difficulty] || 250;
      const shellsReward = DIFFICULTY_SHELLS[difficulty] || 150;

      const eraSetting = ERA_SETTINGS[era];
      const npcContext = situation.npcInvolved
        ? STARTER_NPCS.find(n => n.name === situation.npcInvolved)
        : null;
      const npcDetail = npcContext
        ? `\nKEY NPC IN THIS SCENE: ${npcContext.name} — ${npcContext.title}. Personality: ${npcContext.personality}. Backstory: ${npcContext.backstory}. Write them as a real person with their own agenda.`
        : "";
      const eduContext = situation.educationalTheme
        ? `\nEDUCATIONAL THREAD: Weave in this real knowledge naturally (don't lecture): "${situation.educationalTheme}"`
        : "";
      const relationships = state.npcRelationships ? JSON.parse(state.npcRelationships || '{}') : {};
      const npcRelNote = npcContext && relationships[npcContext.name] !== undefined
        ? `\nPLAYER'S RELATIONSHIP WITH ${npcContext.name.toUpperCase()}: Score ${relationships[npcContext.name]} (${relationships[npcContext.name] > 5 ? "strong ally" : relationships[npcContext.name] > 0 ? "friendly" : relationships[npcContext.name] < -5 ? "enemy" : relationships[npcContext.name] < 0 ? "tense" : "neutral"}). Reference this relationship naturally in how the NPC interacts with the player.`
        : "";

      let scenario;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are the narrative engine for Chronicles — a parallel life simulation where the player is THEMSELVES living in another era. NOT an RPG. No heroes, no villains, no right answers. Just life.

ERA: ${era} — ${eraSetting.worldDescription}
ATMOSPHERE: ${eraSetting.atmosphere}
${npcDetail}${npcRelNote}${eduContext}

PLAYER:
- Level ${state.level} | Wisdom ${state.wisdom} | Courage ${state.courage} | Compassion ${state.compassion} | Cunning ${state.cunning} | Influence ${state.influence}
- ${state.decisionsRecorded} decisions made so far

PHILOSOPHY — READ CAREFULLY:
- This is a MIRROR, not a game. Choices reveal who the player IS, not who they should be.
- There are NO right or wrong answers — only authentic human responses
- Each choice reflects a different WAY OF BEING — pragmatic, compassionate, bold, cautious, cunning, principled
- NEVER judge choices. NEVER hint that one is "better." Present them equally.
- NPCs are REAL PEOPLE with their own goals, not quest-givers. They react based on relationship history.
- The player's choice WILL affect their relationship with any involved NPC

Write a rich, immersive scene. Make the player feel PRESENT. Describe sights, sounds, smells. Then offer exactly 4 choices that each feel like something a real person might actually do.

Return JSON:
{
  "title": "scenario title",
  "description": "2-3 vivid paragraphs — cinematic, personal, immersive",
  "educationalNote": "One fascinating real-world fact the player learns from this situation (optional, only if natural)",
  "choices": [
    { "id": "a", "text": "What you DO (first person, natural)", "hint": "The value or instinct this reflects" },
    { "id": "b", "text": "...", "hint": "..." },
    { "id": "c", "text": "...", "hint": "..." },
    { "id": "d", "text": "...", "hint": "..." }
  ]
}`
            },
            {
              role: "user",
              content: `Situation: "${situation.title}" — ${situation.description}`
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1500,
        });

        scenario = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch {
        scenario = {
          title: situation.title,
          description: situation.description,
          choices: [
            { id: "a", text: "Take decisive action", hint: "Shows courage and determination" },
            { id: "b", text: "Seek more information first", hint: "Shows wisdom and caution" },
            { id: "c", text: "Try to help everyone involved", hint: "Shows compassion and empathy" },
            { id: "d", text: "Find a clever workaround", hint: "Shows cunning and resourcefulness" },
          ],
        };
      }

      res.json({
        scenario: {
          id: situation.id,
          title: scenario.title || situation.title,
          description: scenario.description || situation.description,
          choices: scenario.choices || [],
          educationalNote: scenario.educationalNote || undefined,
          difficulty,
          era,
          shellsReward,
          xpReward,
          npcInvolved: situation.npcInvolved || undefined,
          category: situation.category || undefined,
          isGenerated,
        },
        generated: isGenerated,
      });
    } catch (error: any) {
      console.error("Generate scenario error:", error);
      res.status(500).json({ error: error.message || "Failed to generate scenario" });
    }
  });

  app.post("/api/chronicles/play/decide", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { scenarioId, choiceId, choiceText, era } = req.body;
      if (!scenarioId || !choiceId || !choiceText) {
        return res.status(400).json({ error: "scenarioId, choiceId, and choiceText are required" });
      }

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      let quest = SEASON_ZERO_QUESTS.find(q => q.id === scenarioId);
      
      let arcEvent = null;
      if (!quest) {
        for (const [eraKey, arcs] of Object.entries(NARRATIVE_ARCS)) {
          const found = arcs.find((a: any) => a.id === scenarioId);
          if (found) {
            arcEvent = found;
            quest = {
              id: found.id,
              era: eraKey,
              title: found.title,
              description: found.description,
              difficulty: "hard",
              category: "story_event",
            } as any;
            break;
          }
        }
      }
      const difficulty = quest?.difficulty || "medium";
      const baseXp = DIFFICULTY_XP[difficulty] || 250;
      const baseShells = DIFFICULTY_SHELLS[difficulty] || 150;

      let consequences = "";
      let statChanges = { wisdom: 0, courage: 0, compassion: 0, cunning: 0, influence: 0 };
      let npcRelChanges: Record<string, number> = {};
      let xpEarned = baseXp;
      let shellsEarned = baseShells;
      let educationalInsight = "";

      const involvedNpcs = (quest as any)?.relationshipImpact || [];
      const npcInvolved = (quest as any)?.npcInvolved || null;
      const allInvolvedSet = new Set<string>([...(npcInvolved ? [npcInvolved] : []), ...involvedNpcs]);
      const allInvolved = Array.from(allInvolvedSet);
      const npcListStr = allInvolved.length > 0
        ? `NPCs INVOLVED: ${allInvolved.join(", ")}. Your response MUST include relationship changes for each.`
        : "No specific NPCs involved.";

      try {
        const eraSetting = ERA_SETTINGS[era || state.currentEra] || ERA_SETTINGS.modern;
        const currentRels = JSON.parse(state.npcRelationships || '{}');
        const relContext = allInvolved.map(n => `${n}: ${currentRels[n] || 0}`).join(", ");

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You analyze choices in Chronicles — a parallel life simulation. NOT an RPG.

ERA: ${era || state.currentEra} — ${eraSetting.worldDescription}
${npcListStr}
${relContext ? `CURRENT RELATIONSHIP SCORES: ${relContext}` : ""}
${(quest as any)?.educationalTheme ? `EDUCATIONAL CONTEXT: ${(quest as any).educationalTheme}` : ""}

PHILOSOPHY: There are no right or wrong choices. Every choice reveals character. Do NOT praise or punish — simply narrate what happens BECAUSE of the choice. NPC reactions should be realistic — some will agree with the choice, others won't. That's life.

Return JSON:
{
  "consequences": "2-3 vivid sentences of what happens next. Include NPC reactions if involved. Show REAL consequences — actions have ripple effects.",
  "statChanges": { "wisdom": -5 to 5, "courage": -5 to 5, "compassion": -5 to 5, "cunning": -5 to 5, "influence": -5 to 5 },
  "npcRelChanges": { ${allInvolved.map(n => `"${n}": -3 to 3`).join(", ")} },
  "educationalInsight": "One sentence connecting this moment to a real historical/life lesson (make it fascinating, not preachy)",
  "xpEarned": ${baseXp},
  "shellsEarned": ${baseShells}
}`
            },
            {
              role: "user",
              content: `Situation: "${quest?.title || scenarioId}". The player chose: "${choiceText}". Player stats: Wisdom ${state.wisdom}, Courage ${state.courage}, Compassion ${state.compassion}, Cunning ${state.cunning}, Influence ${state.influence}. Level ${state.level}, ${state.decisionsRecorded} decisions so far.`
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 700,
        });

        const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
        consequences = analysis.consequences || "Your choice echoes through time...";
        if (analysis.statChanges) {
          statChanges = {
            wisdom: clamp(analysis.statChanges.wisdom || 0, -5, 5),
            courage: clamp(analysis.statChanges.courage || 0, -5, 5),
            compassion: clamp(analysis.statChanges.compassion || 0, -5, 5),
            cunning: clamp(analysis.statChanges.cunning || 0, -5, 5),
            influence: clamp(analysis.statChanges.influence || 0, -5, 5),
          };
        }
        if (analysis.npcRelChanges) {
          npcRelChanges = analysis.npcRelChanges;
        }
        educationalInsight = analysis.educationalInsight || "";
        xpEarned = analysis.xpEarned || baseXp;
        shellsEarned = analysis.shellsEarned || baseShells;
      } catch {
        consequences = "Your decision ripples through the world, its full impact yet to be revealed...";
      }

      const newExperience = state.experience + xpEarned;
      const newShells = state.shellsEarned + shellsEarned;
      const newWisdom = clamp(state.wisdom + statChanges.wisdom, 0, 100);
      const newCourage = clamp(state.courage + statChanges.courage, 0, 100);
      const newCompassion = clamp(state.compassion + statChanges.compassion, 0, 100);
      const newCunning = clamp(state.cunning + statChanges.cunning, 0, 100);
      const newInfluence = clamp(state.influence + statChanges.influence, 0, 100);
      const newDecisions = state.decisionsRecorded + 1;

      const completedSituations = [...(state.completedSituations || [])];
      if (!completedSituations.includes(scenarioId)) {
        completedSituations.push(scenarioId);
      }

      let narrativeProgress: Record<string, number> = {};
      try { narrativeProgress = JSON.parse(state.narrativeProgress || '{}'); } catch { narrativeProgress = {}; }
      
      if (arcEvent && !completedSituations.includes(scenarioId)) {
        narrativeProgress[arcEvent.era || era] = arcEvent.chapter;
      }

      let newLevel = state.level;
      let leveledUp = false;
      while (newExperience >= newLevel * 1000) {
        newLevel++;
        leveledUp = true;
      }

      const currentRels = JSON.parse(state.npcRelationships || '{}');
      for (const [npcName, change] of Object.entries(npcRelChanges)) {
        const delta = clamp(Number(change) || 0, -3, 3);
        currentRels[npcName] = clamp((currentRels[npcName] || 0) + delta, -20, 20);
      }

      let gameLog: any[] = [];
      try { gameLog = JSON.parse(state.gameLog || '[]'); } catch { gameLog = []; }
      const questTitle = quest?.title || SEASON_ZERO_QUESTS.find(q => q.id === scenarioId)?.title || scenarioId;
      gameLog.push({
        type: "decision",
        action: questTitle,
        message: consequences.substring(0, 120),
        title: questTitle,
        description: consequences,
        era: era || state.currentEra,
        timestamp: new Date().toISOString(),
        xpEarned,
        shellsEarned,
        statChanges,
        npcRelChanges: Object.keys(npcRelChanges).length > 0 ? npcRelChanges : undefined,
        educationalInsight: educationalInsight || undefined,
      });
      if (gameLog.length > 50) gameLog = gameLog.slice(-50);

      const now = new Date();
      let newStreak = state.currentStreak;
      let longestStreak = state.longestStreak;
      if (state.lastPlayedAt) {
        const lastPlayed = new Date(state.lastPlayedAt);
        const diffHours = (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 20 && diffHours <= 48) {
          newStreak++;
        } else if (diffHours > 48) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      if (newStreak > longestStreak) longestStreak = newStreak;

      const [updatedState] = await db.update(chroniclesGameState).set({
        experience: newExperience,
        shellsEarned: newShells,
        wisdom: newWisdom,
        courage: newCourage,
        compassion: newCompassion,
        cunning: newCunning,
        influence: newInfluence,
        decisionsRecorded: newDecisions,
        situationsCompleted: completedSituations.length,
        completedSituations,
        level: newLevel,
        gameLog: JSON.stringify(gameLog),
        npcRelationships: JSON.stringify(currentRels),
        narrativeProgress: JSON.stringify(narrativeProgress),
        currentStreak: newStreak,
        longestStreak,
        lastPlayedAt: now,
        currentEra: era || state.currentEra,
        updatedAt: now,
      }).where(eq(chroniclesGameState.userId, userId)).returning();

      const existingAchievements = new Set(state.achievements || []);
      const newAchievements: string[] = [];

      const checkAchievement = (id: string, condition: boolean) => {
        if (!existingAchievements.has(id) && condition) newAchievements.push(id);
      };

      checkAchievement("first_decision", newDecisions >= 1);
      checkAchievement("level_5", newLevel >= 5);
      checkAchievement("level_10", newLevel >= 10);

      const completedEras = new Set(completedSituations.map(s => {
        const q = SEASON_ZERO_QUESTS.find(quest => quest.id === s);
        return q?.era;
      }).filter(Boolean));
      checkAchievement("explorer", completedEras.size >= 3);

      checkAchievement("social_butterfly", (updatedState?.npcsSpokenTo || []).length >= 5);
      checkAchievement("faction_member", (updatedState?.factionsJoined || []).length >= 1);
      checkAchievement("streak_3", newStreak >= 3);
      checkAchievement("streak_7", newStreak >= 7);
      checkAchievement("ten_decisions", newDecisions >= 10);
      checkAchievement("hundred_shells", newShells >= 100);

      if (newAchievements.length > 0) {
        const allAchievements = [...(state.achievements || []), ...newAchievements];
        await db.update(chroniclesGameState).set({
          achievements: allAchievements,
        }).where(eq(chroniclesGameState.userId, userId));
      }

      res.json({
        success: true,
        consequences,
        statChanges,
        npcRelChanges: Object.keys(npcRelChanges).length > 0 ? npcRelChanges : undefined,
        educationalInsight: educationalInsight || undefined,
        xpEarned,
        shellsEarned,
        newLevel: leveledUp ? newLevel : undefined,
        newAchievements,
        updatedState,
      });
    } catch (error: any) {
      console.error("Process decision error:", error);
      res.status(500).json({ error: error.message || "Failed to process decision" });
    }
  });

  app.get("/api/chronicles/play/achievements", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      const earnedSet = new Set(state?.achievements || []);

      const achievements = ALL_ACHIEVEMENTS.map(a => ({
        ...a,
        earned: earnedSet.has(a.id),
        earnedAt: earnedSet.has(a.id) ? state?.updatedAt?.toISOString() : undefined,
      }));

      res.json({ achievements });
    } catch (error: any) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: error.message || "Failed to get achievements" });
    }
  });

  app.get("/api/chronicles/play/leaderboard", async (_req: Request, res: Response) => {
    try {
      const players = await db.select({
        name: chroniclesGameState.name,
        level: chroniclesGameState.level,
        experience: chroniclesGameState.experience,
        currentEra: chroniclesGameState.currentEra,
        situationsCompleted: chroniclesGameState.situationsCompleted,
      }).from(chroniclesGameState)
        .orderBy(desc(chroniclesGameState.level), desc(chroniclesGameState.experience))
        .limit(20);

      const leaderboard = players.map((p, i) => ({
        rank: i + 1,
        name: p.name.length > 3 ? p.name.substring(0, 3) + "..." : p.name,
        level: p.level,
        experience: p.experience,
        era: p.currentEra,
        situationsCompleted: p.situationsCompleted,
      }));

      res.json({ leaderboard });
    } catch (error: any) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: error.message || "Failed to get leaderboard" });
    }
  });

  app.post("/api/chronicles/play/npc-chat", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { npcId, message, era } = req.body;
      if (!npcId || !message) {
        return res.status(400).json({ error: "npcId and message are required" });
      }

      const npc = STARTER_NPCS.find(n => n.name === npcId || n.factionId === npcId);
      if (!npc) {
        return res.status(404).json({ error: "NPC not found" });
      }

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const isFirstChat = !(state.npcsSpokenTo || []).includes(npcId);

      let personality: any = {};
      try { personality = JSON.parse(npc.personality); } catch {}

      const eraSetting = ERA_SETTINGS[era || npc.era] || ERA_SETTINGS.modern;

      let npcResponse = "";
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are ${npc.name}, ${npc.title}, in the ${era || npc.era} era of Chronicles.

PERSONALITY: ${personality.traits?.join(", ") || "complex"}
GOALS: ${personality.goals?.join(", ") || "mysterious"}
FEARS: ${personality.fears?.join(", ") || "unknown"}
SPEAKING STYLE: ${personality.speakingStyle || "natural"}
BACKSTORY: ${npc.backstory}

WORLD: ${eraSetting.worldDescription}
ATMOSPHERE: ${eraSetting.atmosphere}

Stay completely in character. Respond naturally as ${npc.name} would. Keep responses 2-4 sentences.`
            },
            { role: "user", content: message }
          ],
          max_completion_tokens: 300,
        });
        npcResponse = response.choices[0]?.message?.content || "...";
      } catch {
        npcResponse = `*${npc.name} regards you thoughtfully* That's an interesting thought. Perhaps we should discuss this further another time.`;
      }

      let xpEarned = 0;
      if (isFirstChat) {
        xpEarned = 10;
        const updatedNpcs = [...(state.npcsSpokenTo || []), npcId];
        await db.update(chroniclesGameState).set({
          npcsSpokenTo: updatedNpcs,
          experience: state.experience + 10,
          updatedAt: new Date(),
        }).where(eq(chroniclesGameState.userId, userId));
      }

      res.json({
        response: npcResponse,
        npcName: npc.name,
        npcTitle: npc.title,
        xpEarned,
      });
    } catch (error: any) {
      console.error("NPC chat error:", error);
      res.status(500).json({ error: error.message || "Failed to chat with NPC" });
    }
  });

  app.get("/api/chronicles/city/plots", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const era = (req.query.era as string) || "modern";
      const userId = getPlayUserId(req);

      const plots = await db.select().from(landPlots)
        .where(eq(landPlots.zoneId, `city_${era}`));

      if (plots.length === 0) {
        const defaultPlots = generateDefaultCityPlots(era);
        const inserted = await db.insert(landPlots).values(defaultPlots).returning();
        return res.json({ plots: inserted.map(p => formatPlot(p, userId)) });
      }

      res.json({ plots: plots.map(p => formatPlot(p, userId)) });
    } catch (error: any) {
      console.error("Get city plots error:", error);
      res.status(500).json({ error: error.message || "Failed to get city plots" });
    }
  });

  app.post("/api/chronicles/city/build", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { plotId, buildingId, era } = req.body;
      if (!plotId || !buildingId || !era) {
        return res.status(400).json({ error: "plotId, buildingId, and era are required" });
      }

      const [plot] = await db.select().from(landPlots).where(eq(landPlots.id, plotId)).limit(1);
      if (!plot) return res.status(404).json({ error: "Plot not found" });
      if (plot.ownerId && plot.ownerId !== userId) return res.status(403).json({ error: "This plot is already owned by someone else" });
      if (plot.buildingData) return res.status(400).json({ error: "This plot already has a building" });

      const catalog: Record<string, any[]> = {
        modern: [
          { id: "coffee_shop", name: "Coffee Shop", emoji: "☕", type: "shop", tier: "free", cost: 0 },
          { id: "tech_startup", name: "Tech Startup", emoji: "💻", type: "shop", tier: "free", cost: 0 },
          { id: "boutique", name: "Boutique", emoji: "👗", type: "shop", tier: "premium", cost: 500 },
          { id: "restaurant", name: "Restaurant", emoji: "🍽️", type: "shop", tier: "premium", cost: 750 },
          { id: "art_gallery", name: "Art Gallery", emoji: "🖼️", type: "shop", tier: "premium", cost: 600 },
          { id: "coworking", name: "Co-Working Space", emoji: "🏢", type: "office", tier: "premium", cost: 800 },
          { id: "penthouse", name: "Penthouse Suite", emoji: "🏙️", type: "residential", tier: "elite", cost: 2000 },
          { id: "nightclub", name: "Nightclub", emoji: "🎵", type: "entertainment", tier: "elite", cost: 1500 },
        ],
        medieval: [
          { id: "market_stall", name: "Market Stall", emoji: "🏪", type: "shop", tier: "free", cost: 0 },
          { id: "cottage", name: "Cottage", emoji: "🏠", type: "residential", tier: "free", cost: 0 },
          { id: "tavern", name: "Tavern", emoji: "🍺", type: "shop", tier: "premium", cost: 500 },
          { id: "blacksmith", name: "Blacksmith", emoji: "⚒️", type: "shop", tier: "premium", cost: 600 },
          { id: "apothecary", name: "Apothecary", emoji: "⚗️", type: "shop", tier: "premium", cost: 450 },
          { id: "guild_hall", name: "Guild Hall", emoji: "🏛️", type: "office", tier: "premium", cost: 900 },
          { id: "castle_tower", name: "Castle Tower", emoji: "🏰", type: "monument", tier: "elite", cost: 2500 },
          { id: "cathedral", name: "Cathedral", emoji: "⛪", type: "monument", tier: "elite", cost: 2000 },
        ],
        wildwest: [
          { id: "general_store", name: "General Store", emoji: "🏬", type: "shop", tier: "free", cost: 0 },
          { id: "homestead", name: "Homestead", emoji: "🏚️", type: "residential", tier: "free", cost: 0 },
          { id: "saloon", name: "Saloon", emoji: "🥃", type: "shop", tier: "premium", cost: 500 },
          { id: "sheriffs_office", name: "Sheriff's Office", emoji: "⭐", type: "office", tier: "premium", cost: 600 },
          { id: "assay_office", name: "Assay Office", emoji: "⚖️", type: "shop", tier: "premium", cost: 450 },
          { id: "telegraph", name: "Telegraph Office", emoji: "📡", type: "office", tier: "premium", cost: 700 },
          { id: "bank", name: "Frontier Bank", emoji: "🏦", type: "office", tier: "elite", cost: 2000 },
          { id: "ranch", name: "Grand Ranch", emoji: "🐄", type: "residential", tier: "elite", cost: 1800 },
        ],
      };

      const building = (catalog[era] || []).find((b: any) => b.id === buildingId);
      if (!building) return res.status(400).json({ error: "Invalid building type" });

      const isPremium = plot.plotSize === "premium";
      if (!isPremium && building.tier !== "free") {
        return res.status(400).json({ error: "Non-premium plots only allow free buildings" });
      }

      if (building.cost > 0) {
        const [state] = await db.select().from(chroniclesGameState)
          .where(eq(chroniclesGameState.userId, userId)).limit(1);
        if (!state || state.shellsEarned < building.cost) {
          return res.status(400).json({ error: `Not enough shells. Need ${building.cost}, have ${state?.shellsEarned || 0}` });
        }
        await db.update(chroniclesGameState).set({
          shellsEarned: state.shellsEarned - building.cost,
          updatedAt: new Date(),
        }).where(eq(chroniclesGameState.userId, userId));
      }

      const [updated] = await db.update(landPlots).set({
        ownerId: userId,
        ownerType: "player",
        buildingData: JSON.stringify({ id: building.id, name: building.name, emoji: building.emoji, type: building.type, tier: building.tier }),
        isForSale: false,
        purchasedAt: new Date(),
      }).where(eq(landPlots.id, plotId)).returning();

      res.json({
        success: true,
        plot: formatPlot(updated, userId),
        building,
        shellsSpent: building.cost,
      });
    } catch (error: any) {
      console.error("Build error:", error);
      res.status(500).json({ error: error.message || "Failed to build" });
    }
  });

  app.get("/api/chronicles/city/leaderboard", async (_req: Request, res: Response) => {
    try {
      const allPlots = await db.select().from(landPlots);
      const ownerCounts: Record<string, { count: number; ownerId: string }> = {};
      for (const plot of allPlots) {
        if (plot.ownerId && plot.ownerType === "player" && plot.buildingData) {
          ownerCounts[plot.ownerId] = ownerCounts[plot.ownerId] || { count: 0, ownerId: plot.ownerId };
          ownerCounts[plot.ownerId].count++;
        }
      }
      const sorted = Object.values(ownerCounts).sort((a, b) => b.count - a.count).slice(0, 10);

      const leaderboard = [];
      for (const entry of sorted) {
        const [state] = await db.select({ name: chroniclesGameState.name, currentEra: chroniclesGameState.currentEra })
          .from(chroniclesGameState).where(eq(chroniclesGameState.userId, entry.ownerId)).limit(1);
        leaderboard.push({
          name: state?.name || "Builder",
          buildings: entry.count,
          era: state?.currentEra || "modern",
        });
      }

      res.json({ leaderboard });
    } catch (error: any) {
      console.error("City leaderboard error:", error);
      res.status(500).json({ error: error.message || "Failed to get leaderboard" });
    }
  });

  app.get("/api/chronicles/play/progress", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);

      const completedSet = new Set<string>(state?.completedSituations || []);
      const totalQuests = SEASON_ZERO_QUESTS.length;
      const completedQuests = SEASON_ZERO_QUESTS.filter(q => completedSet.has(q.id)).length;

      const playerPlots = state ? await db.select().from(landPlots)
        .where(eq(landPlots.ownerId, userId)) : [];
      const cityBuildsCount = playerPlots.filter(p => p.buildingData).length;

      const hasOnboarded = !!state;
      const hasDecisions = (state?.decisionsRecorded || 0) > 0;
      const hasMultipleEras = (() => {
        const eras = new Set<string>();
        for (const id of (state?.completedSituations || [])) {
          const q = SEASON_ZERO_QUESTS.find(quest => quest.id === id);
          if (q) eras.add(q.era);
        }
        return eras.size >= 2;
      })();
      const hasCityBuild = cityBuildsCount > 0;
      const hasNpcRelationships = (() => {
        try {
          const rels = JSON.parse(state?.npcRelationships || '{}');
          return Object.keys(rels).length > 0;
        } catch { return false; }
      })();

      const chapters: Record<string, "completed" | "current" | "locked"> = {
        awakening: hasOnboarded ? "completed" : "current",
        foundation: hasOnboarded ? (cityBuildsCount > 0 ? "completed" : "current") : "locked",
        play: hasOnboarded ? (hasDecisions ? (completedQuests >= totalQuests ? "completed" : "current") : "current") : "locked",
        world: hasOnboarded ? (hasNpcRelationships ? "completed" : "current") : "locked",
        city: hasOnboarded ? (hasCityBuild ? "completed" : "current") : "locked",
        connections: hasNpcRelationships && hasMultipleEras ? "current" : "locked",
        exploration: (state?.level || 1) >= 3 ? "current" : "locked",
        legacy: (state?.level || 1) >= 10 ? "current" : "locked",
      };

      res.json({
        chapters,
        stats: {
          totalQuests,
          completedQuests,
          cityBuildsCount,
          level: state?.level || 1,
          decisionsRecorded: state?.decisionsRecorded || 0,
          npcsSpokenTo: (state?.npcsSpokenTo || []).length,
          factionsJoined: (state?.factionsJoined || []).length,
        },
      });
    } catch (error: any) {
      console.error("Get progress error:", error);
      res.status(500).json({ error: error.message || "Failed to get progress" });
    }
  });
}

function generateDefaultCityPlots(era: string) {
  const plots = [];
  const zoneId = `city_${era}`;

  for (let i = 0; i < 6; i++) {
    plots.push({
      zoneId,
      plotX: i,
      plotY: 0,
      plotSize: "premium" as const,
      basePrice: 1000,
      currentPrice: 1000,
      isForSale: true,
    });
  }

  for (let i = 0; i < 12; i++) {
    plots.push({
      zoneId,
      plotX: i,
      plotY: i % 4 + 1,
      plotSize: "standard" as const,
      basePrice: 0,
      currentPrice: 0,
      isForSale: true,
    });
  }

  const npcBuildings: Record<string, Array<{ idx: number; building: any; ownerName: string }>> = {
    modern: [
      { idx: 0, building: { id: "coffee_shop", name: "Coffee Shop", emoji: "☕", type: "shop", tier: "premium" }, ownerName: "City NPC" },
      { idx: 2, building: { id: "tech_startup", name: "Tech Startup", emoji: "💻", type: "shop", tier: "premium" }, ownerName: "City NPC" },
    ],
    medieval: [
      { idx: 1, building: { id: "tavern", name: "Tavern", emoji: "🍺", type: "shop", tier: "premium" }, ownerName: "Town NPC" },
      { idx: 3, building: { id: "blacksmith", name: "Blacksmith", emoji: "⚒️", type: "shop", tier: "premium" }, ownerName: "Town NPC" },
    ],
    wildwest: [
      { idx: 0, building: { id: "saloon", name: "Saloon", emoji: "🥃", type: "shop", tier: "premium" }, ownerName: "Town NPC" },
      { idx: 4, building: { id: "sheriffs_office", name: "Sheriff's Office", emoji: "⭐", type: "office", tier: "premium" }, ownerName: "Town NPC" },
    ],
  };

  for (const npc of (npcBuildings[era] || [])) {
    if (plots[npc.idx]) {
      plots[npc.idx] = {
        ...plots[npc.idx],
        ownerId: "npc",
        ownerType: "npc" as any,
        buildingData: JSON.stringify(npc.building),
        isForSale: false,
      } as any;
    }
  }

  return plots;
}

function formatPlot(plot: any, userId: string | null) {
  const building = plot.buildingData ? (() => {
    try { return JSON.parse(plot.buildingData); } catch { return null; }
  })() : null;

  return {
    id: plot.id,
    x: plot.plotX,
    z: plot.plotY,
    type: plot.plotSize === "premium" ? "town_square" : "commercial",
    owner: plot.ownerId || undefined,
    ownerName: plot.ownerType === "npc" ? "Town NPC" : (plot.ownerId === userId ? "You" : (plot.ownerId ? "Another Player" : undefined)),
    isOwner: plot.ownerId === userId,
    building,
    isPremium: plot.plotSize === "premium",
    price: plot.currentPrice || 0,
  };
}

export function registerChroniclesChatRoutes(app: Express) {

  app.post("/api/chronicles/chat/link", async (req: any, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization required" });
      }
      const token = authHeader.split(" ")[1];
      let decoded: any;
      try {
        const jwt = await import("jsonwebtoken");
        decoded = jwt.default.verify(token, process.env.CHRONICLES_JWT_SECRET || "");
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const accountId = decoded.accountId;
      const [account] = await db.select().from(chronicleAccounts)
        .where(eq(chronicleAccounts.id, accountId)).limit(1);
      if (!account) return res.status(404).json({ error: "Chronicles account not found" });

      const chatUsername = `chr_${account.username}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const [existing] = await db.select().from(chatUsers)
        .where(eq(chatUsers.username, chatUsername)).limit(1);

      if (existing) {
        const chatToken = generateToken(existing.id, existing.trustLayerId || '');
        return res.json({
          success: true,
          chatToken,
          chatUser: { id: existing.id, username: existing.username, displayName: existing.displayName, avatarColor: existing.avatarColor },
        });
      }

      const trustLayerId = generateTrustLayerId();
      const passwordHash = await hashPassword(`chronicles_${accountId}_${Date.now()}`);
      const avatarColors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, accountId)).limit(1);
      const displayName = state?.name || account.username;

      const [newChatUser] = await db.insert(chatUsers).values({
        username: chatUsername,
        email: `${chatUsername}@chronicles.darkwave.io`,
        passwordHash,
        displayName,
        avatarColor,
        role: "member",
        trustLayerId,
      }).returning();

      const chatToken = generateToken(newChatUser.id, trustLayerId);

      res.json({
        success: true,
        chatToken,
        chatUser: { id: newChatUser.id, username: newChatUser.username, displayName: newChatUser.displayName, avatarColor: newChatUser.avatarColor },
        isNew: true,
      });
    } catch (error: any) {
      console.error("Chronicles chat link error:", error);
      res.status(500).json({ error: error.message || "Failed to link chat" });
    }
  });

  app.get("/api/chronicles/chat/channels", async (_req: Request, res: Response) => {
    try {
      const channels = await db.select().from(chatChannels)
        .where(eq(chatChannels.category, "chronicles"));

      const eraMap: Record<string, string> = {
        "chronicles-modern": "modern",
        "chronicles-medieval": "medieval",
        "chronicles-wildwest": "wildwest",
        "chronicles-general": "general",
        "chronicles-voice": "voice",
      };

      const formatted = channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        era: eraMap[ch.name] || "general",
        isVoice: ch.name === "chronicles-voice",
      }));

      res.json({ success: true, channels: formatted });
    } catch (error: any) {
      console.error("Get chronicles channels error:", error);
      res.status(500).json({ error: error.message || "Failed to get channels" });
    }
  });

  app.get("/api/chronicles/chat/messages/:channelId", async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const limit = Math.min(50, Number(req.query.limit ?? 30));

      const msgs = await db.select({
        id: chatMessages.id,
        channelId: chatMessages.channelId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        username: chatUsers.username,
        displayName: chatUsers.displayName,
        avatarColor: chatUsers.avatarColor,
      })
        .from(chatMessages)
        .innerJoin(chatUsers, eq(chatMessages.userId, chatUsers.id))
        .where(eq(chatMessages.channelId, channelId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

      res.json({ success: true, messages: msgs.reverse() });
    } catch (error: any) {
      console.error("Get chronicles messages error:", error);
      res.status(500).json({ error: error.message || "Failed to get messages" });
    }
  });

  app.post("/api/chronicles/chat/messages/:channelId", async (req: any, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Auth required" });

      const { channelId } = req.params;
      const { content, chatUserId } = req.body;

      if (!content || !chatUserId) {
        return res.status(400).json({ error: "Content and chatUserId are required" });
      }

      const [user] = await db.select().from(chatUsers)
        .where(eq(chatUsers.id, chatUserId)).limit(1);
      if (!user) return res.status(404).json({ error: "Chat user not found" });

      const [msg] = await db.insert(chatMessages).values({
        channelId,
        userId: chatUserId,
        content,
      }).returning();

      res.json({
        success: true,
        message: {
          id: msg.id,
          channelId: msg.channelId,
          content: msg.content,
          createdAt: msg.createdAt,
          username: user.username,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
        },
      });
    } catch (error: any) {
      console.error("Send chronicles message error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  app.get("/api/chronicles/voice/status", async (req: any, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization required" });
      }
      const token = authHeader.split(" ")[1];
      let decoded: any;
      try {
        const jwt = await import("jsonwebtoken");
        decoded = jwt.default.verify(token, process.env.CHRONICLES_JWT_SECRET || "");
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const accountId = decoded.accountId;

      const samples = await db.select().from(voiceSamples)
        .where(eq(voiceSamples.userId, accountId));

      const readySamples = samples.filter(s => s.cloneStatus === "ready");
      const processingSamples = samples.filter(s => s.cloneStatus === "processing");
      const pendingSamples = samples.filter(s => s.cloneStatus === "pending");

      const [credits] = await db.select().from(userCredits)
        .where(eq(userCredits.userId, accountId)).limit(1);

      res.json({
        success: true,
        voice: {
          totalSamples: samples.length,
          readyCount: readySamples.length,
          processingCount: processingSamples.length,
          pendingCount: pendingSamples.length,
          isReady: readySamples.length > 0,
          activeCloneId: readySamples[0]?.voiceCloneId || null,
          provider: readySamples[0]?.voiceCloneProvider || null,
        },
        credits: {
          balance: credits?.creditBalance || 0,
          voiceCloneCost: 50,
          voiceMessageCost: 5,
        },
      });
    } catch (error: any) {
      console.error("Voice status error:", error);
      res.status(500).json({ error: error.message || "Failed to get voice status" });
    }
  });

  app.post("/api/chronicles/voice/train", async (req: any, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization required" });
      }
      const token = authHeader.split(" ")[1];
      let decoded: any;
      try {
        const jwt = await import("jsonwebtoken");
        decoded = jwt.default.verify(token, process.env.CHRONICLES_JWT_SECRET || "");
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const accountId = decoded.accountId;
      const { transcriptText } = req.body;

      const [credits] = await db.select().from(userCredits)
        .where(eq(userCredits.userId, accountId)).limit(1);

      const cloneCost = 50;
      if (!credits || credits.creditBalance < cloneCost) {
        return res.status(400).json({
          error: `Not enough credits. Need ${cloneCost}, have ${credits?.creditBalance || 0}`,
          creditsNeeded: cloneCost,
          currentBalance: credits?.creditBalance || 0,
        });
      }

      const [sample] = await db.insert(voiceSamples).values({
        userId: accountId,
        transcriptText: transcriptText || "Voice training sample",
        cloneStatus: "pending",
      }).returning();

      await db.update(userCredits).set({
        creditBalance: credits.creditBalance - cloneCost,
        lifetimeCreditsSpent: credits.lifetimeCreditsSpent + cloneCost,
        updatedAt: new Date(),
      }).where(eq(userCredits.userId, accountId));

      await db.insert(creditTransactions).values({
        userId: accountId,
        type: "usage",
        amount: -cloneCost,
        balanceAfter: credits.creditBalance - cloneCost,
        description: "Voice clone training initiated",
        category: "voice_clone",
      });

      res.json({
        success: true,
        sample: {
          id: sample.id,
          status: sample.cloneStatus,
          creditsSpent: cloneCost,
        },
      });
    } catch (error: any) {
      console.error("Voice train error:", error);
      res.status(500).json({ error: error.message || "Failed to start voice training" });
    }
  });

  const STARTER_CITIES = [
    { id: "nashville", name: "Nashville", state: "TN", desc: "Music City — where creativity meets Southern hospitality", zone: "Downtown Nashville" },
    { id: "austin", name: "Austin", state: "TX", desc: "Live Music Capital — keep it weird, keep it real", zone: "Downtown Austin" },
    { id: "denver", name: "Denver", state: "CO", desc: "Mile High City — where the mountains meet ambition", zone: "LoDo District" },
    { id: "portland", name: "Portland", state: "OR", desc: "Rose City — sustainability meets innovation", zone: "Pearl District" },
    { id: "atlanta", name: "Atlanta", state: "GA", desc: "The A — culture, hip-hop, and Southern charm", zone: "Midtown Atlanta" },
    { id: "chicago", name: "Chicago", state: "IL", desc: "The Windy City — deep dish dreams and lakefront living", zone: "River North" },
    { id: "seattle", name: "Seattle", state: "WA", desc: "Emerald City — tech, coffee, and Pacific Northwest vibes", zone: "Capitol Hill" },
    { id: "miami", name: "Miami", state: "FL", desc: "Magic City — art deco, ocean breeze, Latin fusion", zone: "Wynwood" },
    { id: "new_york", name: "New York", state: "NY", desc: "The Big Apple — if you can make it here...", zone: "Brooklyn Heights" },
    { id: "los_angeles", name: "Los Angeles", state: "CA", desc: "City of Angels — dreams, sun, and endless possibility", zone: "Silver Lake" },
    { id: "new_orleans", name: "New Orleans", state: "LA", desc: "The Big Easy — jazz, soul food, and deep history", zone: "French Quarter" },
    { id: "philadelphia", name: "Philadelphia", state: "PA", desc: "City of Brotherly Love — where it all began", zone: "Old City" },
    { id: "san_francisco", name: "San Francisco", state: "CA", desc: "The Golden City — innovation on the bay", zone: "Mission District" },
    { id: "detroit", name: "Detroit", state: "MI", desc: "Motor City — resilience, rebirth, and Motown", zone: "Midtown Detroit" },
    { id: "phoenix", name: "Phoenix", state: "AZ", desc: "Valley of the Sun — desert dreams and desert storms", zone: "Roosevelt Row" },
  ];

  const STARTER_ITEMS = [
    { id: "phone", name: "Smartphone", emoji: "📱", desc: "Your connection to the world", category: "essential" },
    { id: "keys", name: "House Keys", emoji: "🔑", desc: "Keys to your new starter home", category: "essential" },
    { id: "wallet", name: "Digital Wallet", emoji: "💳", desc: "500 Echoes loaded and ready", category: "essential" },
    { id: "backpack", name: "Backpack", emoji: "🎒", desc: "For carrying supplies", category: "gear" },
    { id: "journal", name: "Chronicle Journal", emoji: "📓", desc: "Records your decisions and legacy", category: "special" },
    { id: "compass", name: "Portal Compass", emoji: "🧭", desc: "Points toward era portals when they unlock", category: "special" },
  ];

  app.get("/api/chronicles/portal-entry/status", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Auth required" });

      let [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);

      if (!state) {
        const [created] = await db.insert(chroniclesGameState).values({
          userId,
          name: req.chroniclesAccount?.username || "Traveler",
        }).returning();
        state = created;
      }

      res.json({
        portalCompleted: state.portalCompleted,
        homeCity: state.homeCity,
        echoBalance: state.echoBalance,
        level: state.level,
        cities: STARTER_CITIES,
      });
    } catch (error: any) {
      console.error("Portal status error:", error);
      res.status(500).json({ error: "Failed to get portal status" });
    }
  });

  app.post("/api/chronicles/portal-entry/enter", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Auth required" });
      const { cityId } = req.body;

      const city = STARTER_CITIES.find(c => c.id === cityId);
      if (!city) return res.status(400).json({ error: "Invalid city" });

      let [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);

      if (!state) {
        const [created] = await db.insert(chroniclesGameState).values({
          userId,
          name: req.chroniclesAccount?.username || "Traveler",
        }).returning();
        state = created;
      }

      if (state.portalCompleted) {
        return res.json({ alreadyCompleted: true, homeCity: state.homeCity, echoBalance: state.echoBalance });
      }

      const starterInventory = JSON.stringify(STARTER_ITEMS);
      const now = new Date();
      const arrivalLog = JSON.stringify([{
        title: "Stepped Through the Portal",
        description: `You arrived in ${city.name}, ${city.state}. A new life begins in the ${city.zone}.`,
        xpEarned: 100,
        shellsEarned: 0,
        timestamp: now.toISOString(),
      }, {
        title: "Received Starter Kit",
        description: "Portal Compass, Chronicle Journal, Backpack, and 500 Echoes",
        xpEarned: 0,
        shellsEarned: 0,
        timestamp: now.toISOString(),
      }]);

      const [updated] = await db.update(chroniclesGameState)
        .set({
          portalCompleted: true,
          homeCity: cityId,
          echoBalance: 500,
          inventory: starterInventory,
          experience: (state.experience || 0) + 100,
          lastOfflineCheck: now,
          lastPlayedAt: now,
          gameLog: arrivalLog,
          updatedAt: now,
        })
        .where(eq(chroniclesGameState.userId, userId))
        .returning();

      const playerName = req.chroniclesAccount?.firstName || req.chroniclesAccount?.username || "Traveler";

      res.json({
        success: true,
        city,
        playerName,
        echoBalance: 500,
        inventory: STARTER_ITEMS,
        xpEarned: 100,
        cinematic: `The portal light fades behind you. You blink against the sudden warmth of a ${city.state === "FL" || city.state === "TX" || city.state === "AZ" ? "blazing" : "gentle"} afternoon sun. The sounds of ${city.name} wash over you — ${
          city.id === "nashville" ? "distant guitar strings drifting from Broadway, the hum of traffic on 2nd Avenue" :
          city.id === "austin" ? "live music bleeding from Sixth Street, the click of food truck windows opening" :
          city.id === "new_york" ? "taxi horns blaring, the rumble of the subway beneath your feet, a thousand conversations" :
          city.id === "los_angeles" ? "palm trees rustling in the breeze, the distant roar of the 405" :
          city.id === "chicago" ? "the L train rattling overhead, wind off the lake carrying the scent of deep dish" :
          city.id === "miami" ? "reggaeton pulsing from a passing car, ocean salt on the breeze" :
          city.id === "seattle" ? "rain on the pavement, espresso machines hissing, ferry horns in the distance" :
          city.id === "denver" ? "the crisp mountain air, skateboards on concrete, craft beer conversations" :
          city.id === "portland" ? "bicycle bells, the aroma of artisan coffee, street musicians finding their groove" :
          city.id === "atlanta" ? "trap beats from passing cars, cicadas in the peach trees, construction cranes turning" :
          city.id === "new_orleans" ? "brass bands echoing through the Quarter, the sweet smell of beignets and chicory coffee" :
          city.id === "philadelphia" ? "cheesesteaks sizzling, church bells ringing, the echo of history in cobblestone streets" :
          city.id === "san_francisco" ? "cable car bells clanging, fog rolling through the Golden Gate, tech chatter in every cafe" :
          city.id === "detroit" ? "Motown rhythms from an open window, the hum of electric vehicles, the pulse of rebirth" :
          "the city alive around you, full of possibility"
        }. You check your pocket — a phone, house keys to a place in the ${city.zone}, and a digital wallet showing 500 Echoes. Your new life starts now.`,
      });
    } catch (error: any) {
      console.error("Portal entry error:", error);
      res.status(500).json({ error: error.message || "Failed to enter portal" });
    }
  });

  app.get("/api/chronicles/world/offline-summary", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Auth required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);

      if (!state || !state.lastOfflineCheck) {
        return res.json({ events: [], timePassed: 0, summary: null });
      }

      const lastCheck = new Date(state.lastOfflineCheck);
      const now = new Date();
      const hoursOffline = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60));

      if (hoursOffline < 1) {
        return res.json({ events: [], timePassed: 0, summary: null });
      }

      const pendingEvents: any[] = [];
      const city = STARTER_CITIES.find(c => c.id === state.homeCity) || STARTER_CITIES[0];

      if (hoursOffline >= 4) {
        pendingEvents.push({
          id: `offline_mail_${Date.now()}`,
          type: "mail",
          title: "You have mail",
          description: `While you were away, a letter arrived at your place in ${city.zone}. Looks like a community notice about upcoming changes in the neighborhood.`,
          echoReward: 5,
          timestamp: now.toISOString(),
        });
      }

      if (hoursOffline >= 8) {
        pendingEvents.push({
          id: `offline_neighbor_${Date.now()}`,
          type: "neighbor",
          title: "Neighbor stopped by",
          description: `Your neighbor knocked while you were out. They left a note: "Wanted to introduce myself. Hope to catch you around!"`,
          echoReward: 10,
          timestamp: now.toISOString(),
        });
      }

      if (hoursOffline >= 12) {
        pendingEvents.push({
          id: `offline_opportunity_${Date.now()}`,
          type: "opportunity",
          title: "Local opportunity",
          description: `A flyer was left on your door about a community project looking for volunteers in ${city.name}. Could be a way to meet people and build reputation.`,
          echoReward: 15,
          timestamp: now.toISOString(),
        });
      }

      if (hoursOffline >= 24) {
        pendingEvents.push({
          id: `offline_event_${Date.now()}`,
          type: "city_event",
          title: `${city.name} City Event`,
          description: `A ${["block party", "street festival", "community market", "neighborhood cleanup", "local concert"][Math.floor(Math.random() * 5)]} happened in ${city.zone} while you were away. Word is it was quite the scene.`,
          echoReward: 25,
          timestamp: now.toISOString(),
        });
      }

      const summary = hoursOffline >= 4
        ? `You've been away for ${hoursOffline >= 24 ? `${Math.floor(hoursOffline / 24)} day${Math.floor(hoursOffline / 24) > 1 ? "s" : ""} and ${hoursOffline % 24} hours` : `${hoursOffline} hours`}. Life in ${city.name} kept moving without you.`
        : null;

      await db.update(chroniclesGameState)
        .set({
          lastOfflineCheck: now,
          pendingEvents: JSON.stringify(pendingEvents),
          offlineSummary: summary,
          updatedAt: now,
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        events: pendingEvents,
        timePassed: hoursOffline,
        summary,
        city: city.name,
      });
    } catch (error: any) {
      console.error("Offline summary error:", error);
      res.status(500).json({ error: "Failed to get offline summary" });
    }
  });

  app.post("/api/chronicles/world/acknowledge-events", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Auth required" });

      const { eventIds } = req.body;
      if (!Array.isArray(eventIds)) return res.status(400).json({ error: "Invalid event IDs" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);
      if (!state) return res.status(404).json({ error: "No game state" });

      const pending = JSON.parse(state.pendingEvents || '[]');
      const acknowledged = pending.filter((e: any) => eventIds.includes(e.id));
      const remaining = pending.filter((e: any) => !eventIds.includes(e.id));
      const totalEchoes = acknowledged.reduce((sum: number, e: any) => sum + (e.echoReward || 0), 0);

      const existingLog = JSON.parse(state.gameLog || '[]');
      const newEntries = acknowledged.map((e: any) => ({
        title: e.title,
        description: e.description,
        xpEarned: 0,
        shellsEarned: 0,
        timestamp: new Date().toISOString(),
      }));

      await db.update(chroniclesGameState)
        .set({
          pendingEvents: JSON.stringify(remaining),
          echoBalance: (state.echoBalance || 0) + totalEchoes,
          offlineSummary: null,
          gameLog: JSON.stringify([...existingLog, ...newEntries].slice(-50)),
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({ success: true, echoesEarned: totalEchoes, newBalance: (state.echoBalance || 0) + totalEchoes });
    } catch (error: any) {
      console.error("Acknowledge events error:", error);
      res.status(500).json({ error: "Failed to acknowledge events" });
    }
  });

  app.post("/api/chronicles/economy/spend", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Auth required" });

      const { amount, itemId, itemName, category } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);
      if (!state) return res.status(404).json({ error: "No game state" });
      if ((state.echoBalance || 0) < amount) return res.status(400).json({ error: "Insufficient Echoes", balance: state.echoBalance });

      const inventory = JSON.parse(state.inventory || '[]');
      if (itemId) {
        inventory.push({ id: itemId, name: itemName || itemId, category: category || "purchase", acquiredAt: new Date().toISOString() });
      }

      const existingLog = JSON.parse(state.gameLog || '[]');
      existingLog.push({
        title: `Purchased ${itemName || "item"}`,
        description: `Spent ${amount} Echoes${category ? ` at the ${category}` : ""}`,
        xpEarned: 10,
        shellsEarned: 0,
        timestamp: new Date().toISOString(),
      });

      await db.update(chroniclesGameState)
        .set({
          echoBalance: (state.echoBalance || 0) - amount,
          inventory: JSON.stringify(inventory),
          experience: (state.experience || 0) + 10,
          gameLog: JSON.stringify(existingLog.slice(-50)),
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({ success: true, newBalance: (state.echoBalance || 0) - amount, inventory });
    } catch (error: any) {
      console.error("Economy spend error:", error);
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  // ============================================
  // FAITH & SPIRITUAL LIFE SYSTEM
  // ============================================

  const SACRED_TEXTS: Record<string, any[]> = {
    cepher: [
      { id: "genesis", book: "Bere'shiyth (Genesis)", category: "torah", chapters: 50, description: "The beginning of all things — creation, the fall, the flood, and the patriarchs." },
      { id: "exodus", book: "Shemoth (Exodus)", category: "torah", chapters: 40, description: "The deliverance from Egypt, the giving of the Torah at Sinai, and the building of the Tabernacle." },
      { id: "leviticus", book: "Vayiqra (Leviticus)", category: "torah", chapters: 27, description: "The laws of holiness, sacrifice, and priestly service." },
      { id: "numbers", book: "Bemidbar (Numbers)", category: "torah", chapters: 36, description: "The wilderness wanderings and the counting of Israel." },
      { id: "deuteronomy", book: "Devariym (Deuteronomy)", category: "torah", chapters: 34, description: "Moses' final words and the renewal of the covenant before entering the Promised Land." },
      { id: "joshua", book: "Yahusha (Joshua)", category: "history", chapters: 24, description: "The conquest and settlement of the land of Canaan." },
      { id: "judges", book: "Shophetiym (Judges)", category: "history", chapters: 21, description: "The cycle of faithfulness and rebellion in the time of the judges." },
      { id: "ruth", book: "Ruth", category: "history", chapters: 4, description: "A story of loyalty, redemption, and the lineage of King David." },
      { id: "1samuel", book: "Shemu'el Ri'shon (1 Samuel)", category: "history", chapters: 31, description: "The rise of the monarchy — Samuel, Saul, and David." },
      { id: "2samuel", book: "Shemu'el Sheniy (2 Samuel)", category: "history", chapters: 24, description: "David's reign and the establishment of Jerusalem." },
      { id: "psalms", book: "Tehilliym (Psalms)", category: "poetry", chapters: 150, description: "Songs of praise, lament, wisdom, and prophecy — the prayer book of Israel." },
      { id: "proverbs", book: "Mishley (Proverbs)", category: "wisdom", chapters: 31, description: "Wisdom for daily living — the fear of YAHUAH is the beginning of knowledge." },
      { id: "ecclesiastes", book: "Qoheleth (Ecclesiastes)", category: "wisdom", chapters: 12, description: "The search for meaning — vanity of vanities, all is vanity." },
      { id: "song", book: "Shiyr HaShiyriym (Song of Songs)", category: "wisdom", chapters: 8, description: "A love poem expressing the deepest human and divine intimacy." },
      { id: "isaiah", book: "Yesha'yahu (Isaiah)", category: "prophets", chapters: 66, description: "Prophecies of judgment, redemption, and the coming Messiah." },
      { id: "jeremiah", book: "Yirmeyahu (Jeremiah)", category: "prophets", chapters: 52, description: "The weeping prophet's warnings before the destruction of Jerusalem." },
      { id: "ezekiel", book: "Yechezq'el (Ezekiel)", category: "prophets", chapters: 48, description: "Visions of divine glory, judgment, and the restoration of Israel." },
      { id: "daniel", book: "Daniy'el (Daniel)", category: "prophets", chapters: 12, description: "Prophecies of empires, the end times, and faithfulness under persecution." },
      { id: "matthew", book: "Mattithyahu (Matthew)", category: "gospels", chapters: 28, description: "The Gospel of the Kingdom — Yahusha as the promised Messiah." },
      { id: "mark", book: "Marqus (Mark)", category: "gospels", chapters: 16, description: "The Gospel of action — the servant Messiah who came to give his life." },
      { id: "luke", book: "Luqas (Luke)", category: "gospels", chapters: 24, description: "The Gospel of compassion — Yahusha as the Son of Man for all people." },
      { id: "john", book: "Yochanon (John)", category: "gospels", chapters: 21, description: "The Gospel of divinity — In the beginning was the Word." },
      { id: "acts", book: "Ma'asiym (Acts)", category: "gospels", chapters: 28, description: "The birth of the early assembly and the spread of the Good News." },
      { id: "romans", book: "Romaiym (Romans)", category: "letters", chapters: 16, description: "Paul's masterwork on salvation by grace through faith." },
      { id: "revelation", book: "Chizayon (Revelation)", category: "prophecy", chapters: 22, description: "The unveiling of the end times and the triumph of the Lamb." },
      { id: "enoch", book: "Chanok (1 Enoch)", category: "cepher_exclusive", chapters: 108, description: "The Book of the Watchers, the Parables, and the astronomical writings. Quoted by Jude. Reveals the fallen angels, the origin of nephilim, and the coming judgment." },
      { id: "2enoch", book: "Chanok Sheniy (2 Enoch)", category: "cepher_exclusive", chapters: 68, description: "The Secrets of Enoch — his journey through the seven heavens and the creation narrative as told by the Most High." },
      { id: "jubilees", book: "Yovheliym (Jubilees)", category: "cepher_exclusive", chapters: 50, description: "The Little Genesis — a detailed retelling of creation through Moses, organized by jubilee cycles. Reveals the sacred calendar and the war between the spirits of truth and falsehood." },
      { id: "jasher", book: "Yashar (Jasher)", category: "cepher_exclusive", chapters: 91, description: "The Book of the Upright — referenced in Joshua and 2 Samuel. A detailed history from Adam through the Judges, filling in gaps the other books leave silent." },
      { id: "wisdom", book: "Chokmah Shlomoh (Wisdom of Solomon)", category: "cepher_exclusive", chapters: 19, description: "Deep wisdom on righteousness, the nature of wisdom itself, and the destiny of the faithful." },
      { id: "sirach", book: "Sirach (Ecclesiasticus)", category: "cepher_exclusive", chapters: 51, description: "Practical wisdom for daily living — the fear of the Most High applied to every aspect of life." },
      { id: "tobit", book: "Toviyahu (Tobit)", category: "cepher_exclusive", chapters: 14, description: "A story of faith, healing, and angelic intervention in the life of a righteous family." },
      { id: "2esdras", book: "Ezra Reviy'iy (2 Esdras / 4 Ezra)", category: "cepher_exclusive", chapters: 16, description: "Apocalyptic visions given to Ezra — prophecies of the end times, the coming Messiah, and the restoration of all things." },
      { id: "baruch", book: "Baruk (Baruch)", category: "cepher_exclusive", chapters: 6, description: "The words of Jeremiah's scribe — prayers of repentance and the promise of return from exile." },
      { id: "maccabees1", book: "Makkabiym Ri'shon (1 Maccabees)", category: "cepher_exclusive", chapters: 16, description: "The revolt against Greek oppression and the rededication of the Temple — the origin of Chanukah." },
      { id: "maccabees2", book: "Makkabiym Sheniy (2 Maccabees)", category: "cepher_exclusive", chapters: 15, description: "Miraculous accounts of divine intervention during the Maccabean revolt." },
    ],
  };

  const CONGREGATIONS: Record<string, any[]> = {
    modern: [
      { id: "community_chapel", name: "Community Chapel", type: "non-denominational", description: "A welcoming congregation focused on studying the complete scriptures, including the books most churches leave out. Ursula leads weekly Cepher study groups here.", schedule: "Sunday 10am, Wednesday 7pm", leader: "Ursula" },
      { id: "city_cathedral", name: "City Cathedral", type: "traditional", description: "The grand cathedral downtown where generations have worshipped. Traditional liturgy, powerful organ music, and a sense of sacred history.", schedule: "Sunday 8am & 11am", leader: "Pastor Morrison" },
      { id: "storefront_church", name: "Cornerstone Fellowship", type: "charismatic", description: "A vibrant storefront church in the heart of the neighborhood. Energetic worship, passionate preaching, and a tight-knit community that takes care of its own.", schedule: "Sunday 11am, Friday 7pm", leader: "Pastor Williams" },
      { id: "home_fellowship", name: "Home Fellowship Group", type: "house_church", description: "A small gathering in someone's living room. No formal structure — just people reading scripture together, sharing meals, and being real about life.", schedule: "Thursday 7pm", leader: "Various" },
    ],
    medieval: [
      { id: "village_chapel", name: "The Village Chapel", type: "parish", description: "The stone chapel at the heart of the village where the faithful gather for mass. Simple but sacred, with hand-painted icons and candlelight.", schedule: "Daily Matins, Sunday High Mass", leader: "Father Thomas" },
      { id: "abbey_scriptorium", name: "The Abbey Scriptorium", type: "monastic", description: "Sister Ursula's hidden sanctuary within the abbey walls. Monks copy manuscripts by candlelight while she guards texts that the Church has tried to suppress.", schedule: "Night prayers, secret study sessions", leader: "Sister Ursula" },
      { id: "forest_shrine", name: "The Forest Shrine", type: "celtic", description: "A sacred grove where the old Celtic Christian traditions live on — prayers that honor creation, rituals that predate Rome's influence, and the complete scriptures.", schedule: "Solstice gatherings, dawn prayers", leader: "Brother Aidan" },
      { id: "cathedral", name: "The Grand Cathedral", type: "cathedral", description: "The bishop's seat of power. Magnificent stained glass, soaring arches, and political intrigue behind every confession.", schedule: "Daily hours, Sunday solemn mass", leader: "Bishop Renault" },
    ],
    wildwest: [
      { id: "frontier_church", name: "Frontier Church", type: "frontier", description: "A whitewashed wooden church on the edge of town. Mother Ursula preaches here on Sundays, and her sermons draw people from miles around — she teaches from the complete Cepher, not just the approved texts.", schedule: "Sunday 10am", leader: "Mother Ursula" },
      { id: "camp_meeting", name: "Revival Camp Meeting", type: "revival", description: "A tent meeting ground outside town where traveling preachers set up for week-long revivals. Singing, testifying, and the kind of preaching that makes you feel every word in your bones.", schedule: "Seasonal revivals", leader: "Traveling evangelists" },
      { id: "mission", name: "San Miguel Mission", type: "mission", description: "An old Spanish mission with thick adobe walls, a bell tower, and centuries of prayer soaked into the stone. A place of refuge for anyone — outlaw or saint.", schedule: "Daily vespers, Sunday mass", leader: "Padre Esteban" },
      { id: "prayer_circle", name: "Settlers' Prayer Circle", type: "informal", description: "An informal gathering around a campfire where frontier families pray together, share scripture, and support each other through the hardships of frontier life.", schedule: "Nightly around sundown", leader: "Community" },
    ],
  };

  const COMMUNITY_EVENTS: Record<string, any[]> = {
    modern: [
      { id: "potluck", name: "Community Potluck", type: "fellowship", description: "Monthly gathering after service where everyone brings a dish and shares a meal together.", echoReward: 15, faithXp: 20 },
      { id: "bible_study", name: "Cepher Study Group", type: "study", description: "Ursula's deep-dive into the books most people have never read — tonight: the Book of Enoch and the Watchers.", echoReward: 25, faithXp: 40 },
      { id: "food_bank", name: "Food Bank Volunteering", type: "service", description: "Serving the community by helping at the local food bank — faith in action.", echoReward: 30, faithXp: 35 },
      { id: "prayer_vigil", name: "Evening Prayer Vigil", type: "prayer", description: "A quiet evening of communal prayer and meditation on scripture.", echoReward: 10, faithXp: 30 },
      { id: "youth_night", name: "Youth Night", type: "fellowship", description: "Games, music, and real conversations about faith and life for the younger generation.", echoReward: 15, faithXp: 15 },
      { id: "baptism", name: "Baptism Ceremony", type: "ceremony", description: "A sacred immersion ceremony at the river — a public declaration of faith.", echoReward: 50, faithXp: 100, minFaithLevel: 3 },
    ],
    medieval: [
      { id: "feast_day", name: "Saint's Feast Day", type: "festival", description: "The village celebrates with food, music, and stories of the saints. The whole community comes together.", echoReward: 20, faithXp: 25 },
      { id: "manuscript_study", name: "Secret Manuscript Reading", type: "study", description: "Sister Ursula opens the hidden library for those brave enough to read the forbidden books — tonight: Jubilees.", echoReward: 35, faithXp: 50 },
      { id: "pilgrimage", name: "Local Pilgrimage", type: "journey", description: "Walk the ancient pilgrim's path to the holy well, praying at each station along the way.", echoReward: 25, faithXp: 40 },
      { id: "almsgiving", name: "Almsgiving Day", type: "service", description: "Distribution of bread and coin to the poor at the abbey gates.", echoReward: 20, faithXp: 30 },
      { id: "vespers", name: "Evening Vespers", type: "prayer", description: "Candlelit evening prayers with Gregorian chant echoing through stone corridors.", echoReward: 10, faithXp: 20 },
      { id: "ordination", name: "Ordination Ceremony", type: "ceremony", description: "A solemn ceremony of dedication — committing your life to sacred service.", echoReward: 75, faithXp: 120, minFaithLevel: 5 },
    ],
    wildwest: [
      { id: "sunday_dinner", name: "Sunday Dinner on the Ground", type: "fellowship", description: "After Mother Ursula's sermon, the whole community spreads blankets and shares food. The best conversations happen here.", echoReward: 15, faithXp: 20 },
      { id: "cepher_reading", name: "Cepher Reading by Firelight", type: "study", description: "Mother Ursula reads from the Book of Jasher by campfire light, drawing connections to the frontier life.", echoReward: 30, faithXp: 45 },
      { id: "barn_raising", name: "Community Barn Raising", type: "service", description: "The whole community comes together to build a barn for a family in need — faith is what you do, not just what you say.", echoReward: 35, faithXp: 35 },
      { id: "hymn_sing", name: "Evening Hymn Sing", type: "prayer", description: "Gather on the church porch as the sun sets, singing old hymns that carry across the frontier.", echoReward: 10, faithXp: 20 },
      { id: "healing_prayer", name: "Healing Prayer Service", type: "prayer", description: "Mother Ursula lays hands on the sick and prays. Whether it's faith or frontier grit, people get better.", echoReward: 20, faithXp: 40 },
      { id: "dedication", name: "Frontier Dedication", type: "ceremony", description: "A dedication ceremony under the open sky — committing your land, your work, and your life to something greater.", echoReward: 60, faithXp: 100, minFaithLevel: 4 },
    ],
  };

  // GET /api/chronicles/faith/status
  app.get("/api/chronicles/faith/status", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const era = state.currentEra || "modern";
      const sacredTextsRead = JSON.parse(state.sacredTextsRead || '[]');
      const spiritualJournal = JSON.parse(state.spiritualJournal || '[]');
      const congregations = CONGREGATIONS[era] || [];
      const events = (COMMUNITY_EVENTS[era] || []).filter(e => !e.minFaithLevel || (state.faithLevel || 0) >= e.minFaithLevel);
      const relationships = JSON.parse(state.npcRelationships || '{}');
      const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
      const ursulaName = eraUrsulaNames[era] || "Ursula";
      const ursulaRelationship = relationships[ursulaName] || 0;

      const now = new Date();
      const lastService = state.lastServiceAt ? new Date(state.lastServiceAt) : null;
      const lastPrayer = state.lastPrayerAt ? new Date(state.lastPrayerAt) : null;
      const canAttendService = !lastService || (now.getTime() - lastService.getTime()) > 4 * 3600000;
      const canPray = !lastPrayer || (now.getTime() - lastPrayer.getTime()) > 1800000;

      res.json({
        faithLevel: state.faithLevel || 0,
        faithXpToNext: ((state.faithLevel || 0) + 1) * 100,
        spiritualPath: state.spiritualPath,
        sacredTextsRead,
        totalTexts: SACRED_TEXTS.cepher.length,
        servicesAttended: state.servicesAttended || 0,
        congregationId: state.congregationId,
        prayerStreak: state.prayerStreak || 0,
        canAttendService,
        canPray,
        congregations,
        upcomingEvents: events,
        ursulaRelationship,
        ursulaName,
        era,
        recentJournal: spiritualJournal.slice(-5),
      });
    } catch (error: any) {
      console.error("Faith status error:", error);
      res.status(500).json({ error: "Failed to load faith status" });
    }
  });

  // GET /api/chronicles/faith/sacred-texts
  app.get("/api/chronicles/faith/sacred-texts", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const sacredTextsRead = JSON.parse(state.sacredTextsRead || '[]');
      const category = (req.query.category as string) || "all";

      let texts = SACRED_TEXTS.cepher;
      if (category !== "all") {
        texts = texts.filter(t => t.category === category);
      }

      res.json({
        texts: texts.map(t => ({
          ...t,
          read: sacredTextsRead.includes(t.id),
        })),
        categories: ["torah", "history", "poetry", "wisdom", "prophets", "gospels", "letters", "prophecy", "cepher_exclusive"],
        totalRead: sacredTextsRead.length,
        totalTexts: SACRED_TEXTS.cepher.length,
      });
    } catch (error: any) {
      console.error("Sacred texts error:", error);
      res.status(500).json({ error: "Failed to load sacred texts" });
    }
  });

  // POST /api/chronicles/faith/read-text - Read a sacred text passage (AI-generated)
  app.post("/api/chronicles/faith/read-text", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { textId } = req.body;
      if (!textId) return res.status(400).json({ error: "Text ID required" });

      const text = SACRED_TEXTS.cepher.find(t => t.id === textId);
      if (!text) return res.status(404).json({ error: "Sacred text not found" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const era = state.currentEra || "modern";
      const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
      const ursulaName = eraUrsulaNames[era] || "Ursula";
      const isCepherExclusive = text.category === "cepher_exclusive";

      let passage;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are generating a reading experience for "${text.book}" from the Cepher Bible in Chronicles.

The player is reading this text in the ${era} era. ${ursulaName} is their spiritual guide.

${isCepherExclusive ? `IMPORTANT: This is one of the books EXCLUDED from most modern Bibles but preserved in the Cepher. ${ursulaName} considers these texts essential to understanding the full picture of scripture. Treat this text with deep reverence and scholarly accuracy.` : ""}

Generate a meaningful passage and ${ursulaName}'s commentary on it. The passage should feel authentic to the actual biblical text (using the sacred names: YAHUAH, Yahusha, Ruach HaQodesh). ${ursulaName}'s commentary should draw connections between the ancient text and the player's life, making it personally relevant.

Return JSON:
{
  "passageTitle": "Chapter/section title",
  "passage": "2-3 paragraphs of the sacred text in reverent, authentic style using the sacred names",
  "ursulaCommentary": "${ursulaName}'s personal insight connecting this passage to the player's journey (2-3 sentences, in her voice)",
  "reflectionQuestion": "A penetrating question ${ursulaName} poses to the player for personal reflection",
  "historicalContext": "One fascinating historical/scholarly fact about this text (1-2 sentences)"
}`
            },
            { role: "user", content: `Generate a reading from ${text.book}: "${text.description}"` }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1000,
        });
        passage = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch {
        passage = {
          passageTitle: `From ${text.book}`,
          passage: text.description,
          ursulaCommentary: `${ursulaName} looks at you thoughtfully. "This text has much to teach us, if we have ears to hear."`,
          reflectionQuestion: "What does this passage stir in your heart?",
          historicalContext: `This text is part of the Cepher's ${text.chapters}-chapter collection.`,
        };
      }

      const sacredTextsRead = JSON.parse(state.sacredTextsRead || '[]');
      const isNew = !sacredTextsRead.includes(textId);
      if (isNew) {
        sacredTextsRead.push(textId);
      }

      const faithXpGained = isNew ? (isCepherExclusive ? 30 : 15) : 5;
      const echoReward = isNew ? (isCepherExclusive ? 20 : 10) : 0;
      const newFaithXp = (state.faithLevel || 0) * 100 + faithXpGained;
      const newFaithLevel = Math.floor(newFaithXp / 100);

      const journal = JSON.parse(state.spiritualJournal || '[]');
      journal.push({
        type: "reading",
        textId,
        book: text.book,
        passageTitle: passage.passageTitle,
        timestamp: new Date().toISOString(),
      });

      await db.update(chroniclesGameState)
        .set({
          sacredTextsRead: JSON.stringify(sacredTextsRead),
          faithLevel: newFaithLevel,
          echoBalance: (state.echoBalance || 0) + echoReward,
          spiritualJournal: JSON.stringify(journal.slice(-100)),
          experience: (state.experience || 0) + faithXpGained,
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        passage,
        text,
        isNew,
        faithXpGained,
        echoReward,
        faithLevel: newFaithLevel,
        totalTextsRead: sacredTextsRead.length,
      });
    } catch (error: any) {
      console.error("Read text error:", error);
      res.status(500).json({ error: "Failed to read sacred text" });
    }
  });

  // POST /api/chronicles/faith/attend-service
  app.post("/api/chronicles/faith/attend-service", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { congregationId } = req.body;

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const era = state.currentEra || "modern";
      const congregations = CONGREGATIONS[era] || [];
      const congregation = congregations.find(c => c.id === congregationId);
      if (!congregation) return res.status(404).json({ error: "Congregation not found" });

      const now = new Date();
      const lastService = state.lastServiceAt ? new Date(state.lastServiceAt) : null;
      if (lastService && (now.getTime() - lastService.getTime()) < 4 * 3600000) {
        return res.status(429).json({ error: "You've attended a service recently. Come back later." });
      }

      const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
      const ursulaName = eraUrsulaNames[era] || "Ursula";
      const isUrsulaLed = congregation.leader === ursulaName || congregation.leader === "Sister Ursula" || congregation.leader === "Mother Ursula";

      let serviceExperience;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Generate an immersive worship service experience at "${congregation.name}" (${congregation.type}) in the ${era} era of Chronicles.

${congregation.description}

${isUrsulaLed ? `${ursulaName} is leading this service. She teaches from the complete Cepher Bible, including the books most don't know about. Her teaching style is warm, deeply insightful, and personally challenging. She uses the sacred names (YAHUAH, Yahusha).` : `The service is led by ${congregation.leader}.`}

Make it feel like the player is THERE. Sights, sounds, atmosphere. The service should feel authentic to the era and denomination.

Return JSON:
{
  "title": "Service title or theme",
  "atmosphere": "1-2 sentences describing the sights, sounds, and feeling of arriving",
  "sermon": "2-3 paragraphs of the teaching/sermon — make it personally meaningful, not generic",
  "communityMoment": "A brief scene of fellowship — a conversation, a shared meal, a moment of connection with another worshipper",
  "personalInsight": "A thought that stays with the player after the service (1-2 sentences)",
  "scriptureReference": "The scripture passage referenced in the teaching"
}`
            },
            { role: "user", content: `Generate a worship service experience. Player faith level: ${state.faithLevel}, services attended: ${state.servicesAttended}` }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1200,
        });
        serviceExperience = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch {
        serviceExperience = {
          title: "A Gathering of the Faithful",
          atmosphere: `The ${congregation.name} fills with the warmth of gathered souls.`,
          sermon: "The teaching today speaks of perseverance and the faithfulness of the Most High through all seasons of life.",
          communityMoment: "After the service, someone extends a hand of welcome and invites you to stay for fellowship.",
          personalInsight: "You leave with a renewed sense of purpose.",
          scriptureReference: "Tehilliym (Psalms) 23",
        };
      }

      const faithXpGained = isUrsulaLed ? 50 : 30;
      const echoReward = 20;
      const newServicesAttended = (state.servicesAttended || 0) + 1;

      const relationships = JSON.parse(state.npcRelationships || '{}');
      if (isUrsulaLed) {
        relationships[ursulaName] = clamp((relationships[ursulaName] || 0) + 2, -20, 20);
      }

      const journal = JSON.parse(state.spiritualJournal || '[]');
      journal.push({
        type: "service",
        congregation: congregation.name,
        title: serviceExperience.title,
        timestamp: new Date().toISOString(),
      });

      const newFaithXp = (state.faithLevel || 0) * 100 + faithXpGained;
      const newFaithLevel = Math.floor(newFaithXp / 100);

      await db.update(chroniclesGameState)
        .set({
          servicesAttended: newServicesAttended,
          lastServiceAt: now,
          congregationId,
          faithLevel: newFaithLevel,
          echoBalance: (state.echoBalance || 0) + echoReward,
          npcRelationships: JSON.stringify(relationships),
          spiritualJournal: JSON.stringify(journal.slice(-100)),
          experience: (state.experience || 0) + faithXpGained,
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        service: serviceExperience,
        congregation,
        faithXpGained,
        echoReward,
        faithLevel: newFaithLevel,
        servicesAttended: newServicesAttended,
        ursulaRelationshipChange: isUrsulaLed ? 2 : 0,
      });
    } catch (error: any) {
      console.error("Attend service error:", error);
      res.status(500).json({ error: "Failed to attend service" });
    }
  });

  // POST /api/chronicles/faith/pray
  app.post("/api/chronicles/faith/pray", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { intention } = req.body;

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const now = new Date();
      const lastPrayer = state.lastPrayerAt ? new Date(state.lastPrayerAt) : null;
      if (lastPrayer && (now.getTime() - lastPrayer.getTime()) < 1800000) {
        return res.status(429).json({ error: "Take time to reflect on your last prayer before praying again." });
      }

      const era = state.currentEra || "modern";
      const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
      const ursulaName = eraUrsulaNames[era] || "Ursula";

      const lastPrayerDate = lastPrayer ? lastPrayer.toDateString() : null;
      const todayStr = now.toDateString();
      const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();
      let newStreak = state.prayerStreak || 0;
      if (lastPrayerDate === todayStr) {
        // already prayed today, no streak change
      } else if (lastPrayerDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      let prayerResponse;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Generate a prayer and meditation moment for a player in the ${era} era of Chronicles.

${intention ? `The player's prayer intention: "${intention}"` : "The player is praying without a specific intention — seeking peace and guidance."}

Prayer streak: ${newStreak} days. Faith level: ${state.faithLevel}.

Create an intimate, reverent moment. Use the sacred names (YAHUAH, Yahusha) naturally. Include a scripture from the Cepher that relates to their intention or state of mind. This should feel personal and genuine, not formulaic.

Return JSON:
{
  "atmosphere": "A brief description of the prayer setting and moment (1-2 sentences)",
  "prayer": "A heartfelt prayer in first person — what rises from the heart (2-3 sentences)",
  "scripture": "A comforting or guiding scripture passage from the Cepher",
  "scriptureSource": "Book and chapter reference",
  "innerPeace": "What the player feels after praying (1-2 sentences — warmth, clarity, peace, conviction)",
  "ursulaWhisper": "${ursulaName}'s gentle encouragement if she's nearby, or null if the player is alone"
}`
            },
            { role: "user", content: intention ? `Prayer intention: ${intention}` : "Seeking peace and guidance" }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 600,
        });
        prayerResponse = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch {
        prayerResponse = {
          atmosphere: "A quiet moment of stillness settles over you.",
          prayer: "YAHUAH, I come before you seeking wisdom and peace. Guide my steps in this world.",
          scripture: "Trust in YAHUAH with all your heart, and lean not on your own understanding.",
          scriptureSource: "Mishley (Proverbs) 3:5",
          innerPeace: "A gentle warmth fills your chest. You feel heard.",
          ursulaWhisper: null,
        };
      }

      const faithXpGained = 15 + Math.min(newStreak * 2, 20);
      const echoReward = newStreak >= 7 ? 10 : 5;

      const journal = JSON.parse(state.spiritualJournal || '[]');
      journal.push({
        type: "prayer",
        intention: intention || "general",
        streak: newStreak,
        timestamp: new Date().toISOString(),
      });

      const newFaithXp = (state.faithLevel || 0) * 100 + faithXpGained;
      const newFaithLevel = Math.floor(newFaithXp / 100);

      await db.update(chroniclesGameState)
        .set({
          prayerStreak: newStreak,
          lastPrayerAt: now,
          faithLevel: newFaithLevel,
          echoBalance: (state.echoBalance || 0) + echoReward,
          wisdom: (state.wisdom || 10) + (newStreak >= 7 ? 1 : 0),
          spiritualJournal: JSON.stringify(journal.slice(-100)),
          experience: (state.experience || 0) + faithXpGained,
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        prayer: prayerResponse,
        faithXpGained,
        echoReward,
        prayerStreak: newStreak,
        faithLevel: newFaithLevel,
        wisdomGained: newStreak >= 7 ? 1 : 0,
      });
    } catch (error: any) {
      console.error("Prayer error:", error);
      res.status(500).json({ error: "Failed to process prayer" });
    }
  });

  // POST /api/chronicles/faith/attend-event
  app.post("/api/chronicles/faith/attend-event", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: "Event ID required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const era = state.currentEra || "modern";
      const events = COMMUNITY_EVENTS[era] || [];
      const event = events.find(e => e.id === eventId);
      if (!event) return res.status(404).json({ error: "Event not found" });

      if (event.minFaithLevel && (state.faithLevel || 0) < event.minFaithLevel) {
        return res.status(403).json({ error: `Requires faith level ${event.minFaithLevel}`, currentLevel: state.faithLevel });
      }

      let eventExperience;
      try {
        const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
        const ursulaName = eraUrsulaNames[era] || "Ursula";

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Generate an immersive community event experience for "${event.name}" (${event.type}) in the ${era} era.

${event.description}

Make the player feel PRESENT at this gathering. Include other community members, conversations, moments of genuine human connection. This is life simulation — make it feel real.

Return JSON:
{
  "narrative": "2-3 vivid paragraphs describing the player's experience at the event",
  "highlight": "The most memorable moment (1-2 sentences)",
  "connection": "A meaningful interaction with another person at the event",
  "takeaway": "What the player carries with them from this experience"
}`
            },
            { role: "user", content: `Generate community event experience. Player faith level: ${state.faithLevel}, era: ${era}` }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 800,
        });
        eventExperience = JSON.parse(response.choices[0]?.message?.content || '{}');
      } catch {
        eventExperience = {
          narrative: `You arrive at ${event.name} and find a warm welcome. ${event.description}`,
          highlight: "A moment of genuine connection with the community.",
          connection: "Someone reaches out and shares their story with you.",
          takeaway: "You leave feeling more connected to the people around you.",
        };
      }

      const journal = JSON.parse(state.spiritualJournal || '[]');
      journal.push({
        type: "event",
        eventId,
        name: event.name,
        timestamp: new Date().toISOString(),
      });

      const faithXpGained = event.faithXp || 20;
      const echoReward = event.echoReward || 15;
      const newFaithXp = (state.faithLevel || 0) * 100 + faithXpGained;
      const newFaithLevel = Math.floor(newFaithXp / 100);

      await db.update(chroniclesGameState)
        .set({
          faithLevel: newFaithLevel,
          echoBalance: (state.echoBalance || 0) + echoReward,
          compassion: (state.compassion || 10) + (event.type === "service" ? 1 : 0),
          influence: (state.influence || 10) + (event.type === "ceremony" ? 1 : 0),
          spiritualJournal: JSON.stringify(journal.slice(-100)),
          experience: (state.experience || 0) + faithXpGained,
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        event: eventExperience,
        eventInfo: event,
        faithXpGained,
        echoReward,
        faithLevel: newFaithLevel,
      });
    } catch (error: any) {
      console.error("Attend event error:", error);
      res.status(500).json({ error: "Failed to attend event" });
    }
  });

  // POST /api/chronicles/faith/talk-to-ursula - Direct conversation with Ursula
  app.post("/api/chronicles/faith/talk-to-ursula", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });

      const [state] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId))
        .limit(1);

      if (!state) return res.status(404).json({ error: "Game state not found" });

      const era = state.currentEra || "modern";
      const eraUrsulaNames: Record<string, string> = { modern: "Ursula", medieval: "Sister Ursula", wildwest: "Mother Ursula" };
      const ursulaName = eraUrsulaNames[era] || "Ursula";
      const ursulaData = STARTER_NPCS.find(n => n.name === ursulaName);
      const relationships = JSON.parse(state.npcRelationships || '{}');
      const relScore = relationships[ursulaName] || 0;

      let reply;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are ${ursulaName} in the ${era} era of Chronicles.

${ursulaData?.backstory || "A keeper of sacred texts who guides seekers toward truth."}

PERSONALITY: ${ursulaData?.personality || "Compassionate, scholarly, deeply spiritual"}

RELATIONSHIP WITH PLAYER: ${relScore > 5 ? "Deep trust and friendship" : relScore > 0 ? "Growing warmth" : relScore < -5 ? "Guarded and cautious" : relScore < 0 ? "Slightly wary" : "Neutral but open"}

YOUR KNOWLEDGE: You know the complete Cepher Bible — all 87 books. You can quote from Enoch, Jubilees, Jasher, Wisdom of Solomon, Sirach, Tobit, 2 Esdras, Baruch, Maccabees, and all the standard texts. You use the sacred names: YAHUAH (the Most High), Yahusha (the Messiah), Ruach HaQodesh (the Holy Spirit). You believe the removed books were suppressed for political reasons, not theological ones.

SPEAKING STYLE: Warm, deeply thoughtful, quotes scripture naturally, asks questions that pierce the heart. You don't preach at people — you walk with them. You meet people where they are.

${era === "medieval" ? "You speak with medieval formality but genuine warmth. You're cautious about who you share the hidden texts with." : era === "wildwest" ? "You're frontier-tough but tender-hearted. Plain-spoken wisdom. You've buried your husband and kept preaching. You don't suffer fools but you love everyone." : "You're a former professor who left academia for truth. Approachable, intellectually rigorous, spiritually grounded."}

Respond as ${ursulaName} in character. Keep responses 2-4 sentences. Be genuine, not preachy. If the player asks about scripture, quote from the Cepher (including the hidden books when relevant).`
            },
            { role: "user", content: message }
          ],
          max_completion_tokens: 300,
        });
        reply = response.choices[0]?.message?.content || `${ursulaName} considers your words thoughtfully.`;
      } catch {
        reply = `${ursulaName} nods slowly. "That's a profound question. Let me think on it and we can talk more."`;
      }

      relationships[ursulaName] = clamp((relationships[ursulaName] || 0) + 1, -20, 20);

      await db.update(chroniclesGameState)
        .set({
          npcRelationships: JSON.stringify(relationships),
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        reply,
        ursulaName,
        relationshipScore: relationships[ursulaName],
      });
    } catch (error: any) {
      console.error("Talk to Ursula error:", error);
      res.status(500).json({ error: "Failed to talk to Ursula" });
    }
  });

  // =====================================================
  // LIVING WORLD SYSTEM ROUTES
  // =====================================================

  app.get("/api/chronicles/world/zones/:era", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const era = req.params.era;
      if (!["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }
      const zones = getAllZonesForEra(era);
      const time = getWorldTimeInfo(era);

      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const activePresence = await db.select().from(zonePresence)
        .where(and(eq(zonePresence.era, era), eq(zonePresence.isActive, true)));

      const playerCounts: Record<string, number> = {};
      for (const p of activePresence) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (p.lastHeartbeat > fiveMinAgo) {
          playerCounts[p.zoneId] = (playerCounts[p.zoneId] || 0) + 1;
        }
      }

      const myPresence = activePresence.find(p => p.userId === userId);

      res.json({
        era,
        time,
        zones: zones.map(z => ({
          ...z,
          playersHere: playerCounts[z.id] || 0,
          isCurrentZone: myPresence?.zoneId === z.id,
        })),
        currentZone: myPresence?.zoneId || null,
      });
    } catch (error: any) {
      console.error("Get world zones error:", error);
      res.status(500).json({ error: "Failed to get world zones" });
    }
  });

  app.get("/api/chronicles/world/zone/:era/:zoneId", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const { era, zoneId } = req.params;
      if (!["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const ambient = getZoneAmbientState(era, zoneId);
      if (!ambient) {
        return res.status(404).json({ error: "Zone not found" });
      }

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activePlayers = await db.select().from(zonePresence)
        .where(and(
          eq(zonePresence.era, era),
          eq(zonePresence.zoneId, zoneId),
          eq(zonePresence.isActive, true),
        ));

      const recentPlayers = activePlayers.filter(p => p.lastHeartbeat > fiveMinAgo);
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const state = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
      const playerLevel = state[0]?.level || 1;
      const relationships = state[0]?.npcRelationships ? JSON.parse(state[0].npcRelationships as string) : {};

      res.json({
        ...ambient,
        activities: ambient.activities.map(a => ({
          ...a,
          isAvailable: playerLevel >= a.requiredLevel,
          minigameConfig: a.minigameType ? MINIGAME_CONFIGS[a.minigameType] : undefined,
        })),
        npcsPresent: ambient.npcsPresent.map(n => ({
          ...n,
          relationshipScore: relationships[n.name] || 0,
        })),
        playersPresent: recentPlayers.filter(p => p.userId !== userId).map(p => ({
          odActivity: p.activity,
          since: p.enteredAt,
        })),
        playerCount: recentPlayers.length,
      });
    } catch (error: any) {
      console.error("Get zone detail error:", error);
      res.status(500).json({ error: "Failed to get zone" });
    }
  });

  app.post("/api/chronicles/world/enter-zone", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { era, zoneId } = req.body;
      if (!era || !zoneId) return res.status(400).json({ error: "era and zoneId required" });

      const zones = WORLD_ZONES[era];
      if (!zones?.find(z => z.id === zoneId)) {
        return res.status(400).json({ error: "Invalid zone" });
      }

      await db.update(zonePresence)
        .set({ isActive: false })
        .where(and(eq(zonePresence.userId, userId), eq(zonePresence.isActive, true)));

      await db.insert(zonePresence).values({
        userId,
        era,
        zoneId,
        isActive: true,
      });

      await db.update(chroniclesGameState)
        .set({ currentZone: zoneId, updatedAt: new Date() })
        .where(eq(chroniclesGameState.userId, userId));

      const ambient = getZoneAmbientState(era, zoneId);

      let arrivalNarrative = "";
      try {
        const zone = WORLD_ZONES[era]?.find(z => z.id === zoneId);
        const time = getWorldTimeInfo(era);
        const npcsHere = ambient?.npcsPresent || [];
        const activitiesHere = ambient?.activities || [];

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: `You are narrating a living world scene in a ${era} era parallel life simulation. The player just walked into ${zone?.name}. Describe what they see happening — the ambient life, people doing things, sounds, smells. This is a LIVING scene already in progress. 2-3 vivid sentences. Present tense.

TIME: ${time.period} (${time.hour}:${String(time.minute).padStart(2, "0")})
ZONE: ${zone?.name} — ${zone?.description}
${npcsHere.length > 0 ? `NPCs HERE: ${npcsHere.map(n => `${n.name} (${n.activity})`).join(", ")}` : "No notable people around."}
${activitiesHere.length > 0 ? `ACTIVITIES HAPPENING: ${activitiesHere.map(a => `${a.name} — ${a.description}`).join("; ")}` : ""}

Write the scene as if the player is stepping into it. The world doesn't stop for them — they're joining what's already happening.`
          }],
          max_completion_tokens: 200,
        });
        arrivalNarrative = response.choices[0]?.message?.content || "";
      } catch {
        const zone = WORLD_ZONES[era]?.find(z => z.id === zoneId);
        arrivalNarrative = `You arrive at ${zone?.name}. ${zone?.description}.`;
      }

      const gameLog = JSON.parse((await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)))[0]?.gameLog as string || "[]");
      gameLog.unshift({
        timestamp: new Date().toISOString(),
        type: "zone_enter",
        message: `Arrived at ${WORLD_ZONES[era]?.find(z => z.id === zoneId)?.name}`,
      });
      if (gameLog.length > 50) gameLog.length = 50;
      await db.update(chroniclesGameState)
        .set({ gameLog: JSON.stringify(gameLog), updatedAt: new Date() })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        zoneId,
        arrivalNarrative,
        ambient,
      });
    } catch (error: any) {
      console.error("Enter zone error:", error);
      res.status(500).json({ error: "Failed to enter zone" });
    }
  });

  app.post("/api/chronicles/world/heartbeat", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      await db.update(zonePresence)
        .set({ lastHeartbeat: new Date() })
        .where(and(eq(zonePresence.userId, userId), eq(zonePresence.isActive, true)));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Heartbeat failed" });
    }
  });

  app.post("/api/chronicles/world/do-activity", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { activityId, era } = req.body;
      if (!activityId || !era) return res.status(400).json({ error: "activityId and era required" });

      const eraPrefix = era === "modern" ? "mod_" : era === "medieval" ? "med_" : "ww_";
      const activity = ZONE_ACTIVITIES.find(a => a.id === activityId && a.id.startsWith(eraPrefix));
      if (!activity) return res.status(404).json({ error: "Activity not found" });

      if (activity.activityType === "minigame" && activity.minigameType) {
        return res.json({
          type: "minigame",
          minigameType: activity.minigameType,
          config: MINIGAME_CONFIGS[activity.minigameType],
          activity,
        });
      }

      const state = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
      if (!state[0]) return res.status(404).json({ error: "No game state" });
      const playerLevel = state[0].level || 1;
      if (playerLevel < activity.requiredLevel) {
        return res.status(403).json({ error: `Requires level ${activity.requiredLevel}` });
      }

      let narrative = "";
      try {
        const time = getWorldTimeInfo(era);
        const npcContext = activity.npcNames.length > 0
          ? `NPCs involved: ${activity.npcNames.join(", ")}. Write them in character.`
          : "";

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: `You are narrating a ${era} era living world activity. The player is participating in: "${activity.name}" — ${activity.description}. Time: ${time.period}. ${npcContext}
${activity.toolsInvolved ? `Tools/equipment involved: ${activity.toolsInvolved.join(", ")}` : ""}

Write 2-3 vivid sentences of what happens. Include sensory details. If NPCs are present, show them reacting naturally. The activity should feel authentic to the era. End with a sense of accomplishment or progression.`
          }],
          max_completion_tokens: 200,
        });
        narrative = response.choices[0]?.message?.content || `You participate in ${activity.name}.`;
      } catch {
        narrative = `You spend time at ${activity.name}. ${activity.description}`;
      }

      const newEchoes = (state[0].echoBalance || 0) + activity.echoReward;
      const newExperience = (state[0].experience || 0) + activity.xpReward;

      const gameLog = JSON.parse(state[0].gameLog as string || "[]");
      gameLog.unshift({
        timestamp: new Date().toISOString(),
        type: "activity",
        message: `${activity.emoji} ${activity.name}: +${activity.echoReward} Echoes, +${activity.xpReward} XP`,
      });
      if (gameLog.length > 50) gameLog.length = 50;

      await db.update(chroniclesGameState)
        .set({
          echoBalance: newEchoes,
          experience: newExperience,
          gameLog: JSON.stringify(gameLog),
          currentActivity: activity.name,
          updatedAt: new Date(),
        })
        .where(eq(chroniclesGameState.userId, userId));

      res.json({
        type: "activity_complete",
        narrative,
        rewards: { echoes: activity.echoReward, xp: activity.xpReward },
        activity,
      });
    } catch (error: any) {
      console.error("Do activity error:", error);
      res.status(500).json({ error: "Failed to do activity" });
    }
  });

  app.post("/api/chronicles/world/minigame/submit", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { gameType, score, era, zoneId } = req.body;
      if (!gameType || score === undefined || !era) {
        return res.status(400).json({ error: "gameType, score, and era required" });
      }

      const config = MINIGAME_CONFIGS[gameType];
      if (!config) return res.status(400).json({ error: "Invalid game type" });

      const clampedScore = Math.min(Math.max(0, score), config.maxScore);
      const echosEarned = Math.round(clampedScore * config.echoMultiplier);
      const xpEarned = Math.round(clampedScore * 0.2);

      const existing = await db.select().from(minigameSessions)
        .where(and(eq(minigameSessions.userId, userId), eq(minigameSessions.gameType, gameType)))
        .orderBy(desc(minigameSessions.highScore))
        .limit(1);

      const previousHigh = existing[0]?.highScore || 0;
      const isNewHigh = clampedScore > previousHigh;

      await db.insert(minigameSessions).values({
        userId,
        era,
        zoneId: zoneId || "unknown",
        gameType,
        score: clampedScore,
        highScore: isNewHigh ? clampedScore : previousHigh,
        result: clampedScore >= 80 ? "excellent" : clampedScore >= 50 ? "good" : "practice",
        echosEarned,
      });

      const state = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
      if (state[0]) {
        const newEchoes = (state[0].echoBalance || 0) + echosEarned;
        const newExperience = (state[0].experience || 0) + xpEarned;

        const gameLog = JSON.parse(state[0].gameLog as string || "[]");
        gameLog.unshift({
          timestamp: new Date().toISOString(),
          type: "minigame",
          message: `${config.emoji} ${config.name}: Score ${clampedScore}${isNewHigh ? " (NEW HIGH SCORE!)" : ""} — +${echosEarned} Echoes`,
        });
        if (gameLog.length > 50) gameLog.length = 50;

        await db.update(chroniclesGameState)
          .set({
            echoBalance: newEchoes,
            experience: newExperience,
            gameLog: JSON.stringify(gameLog),
            updatedAt: new Date(),
          })
          .where(eq(chroniclesGameState.userId, userId));
      }

      res.json({
        score: clampedScore,
        highScore: isNewHigh ? clampedScore : previousHigh,
        isNewHighScore: isNewHigh,
        echosEarned,
        xpEarned,
        result: clampedScore >= 80 ? "excellent" : clampedScore >= 50 ? "good" : "practice",
        gameName: config.name,
      });
    } catch (error: any) {
      console.error("Minigame submit error:", error);
      res.status(500).json({ error: "Failed to submit score" });
    }
  });

  app.get("/api/chronicles/world/minigame/scores/:gameType", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { gameType } = req.params;
      const config = MINIGAME_CONFIGS[gameType];
      if (!config) return res.status(400).json({ error: "Invalid game type" });

      const sessions = await db.select().from(minigameSessions)
        .where(and(eq(minigameSessions.userId, userId), eq(minigameSessions.gameType, gameType)))
        .orderBy(desc(minigameSessions.playedAt))
        .limit(10);

      const highScore = sessions.reduce((max, s) => Math.max(max, s.score), 0);
      const totalEchoes = sessions.reduce((sum, s) => sum + s.echosEarned, 0);

      res.json({
        gameType,
        gameName: config.name,
        sessions,
        highScore,
        totalEchoes,
        gamesPlayed: sessions.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get scores" });
    }
  });

  // =====================================================
  // TUTORIAL PROGRESS
  // =====================================================

  app.post("/api/chronicles/tutorial/progress", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { step, completed } = req.body;

      const updates: any = { updatedAt: new Date() };
      if (typeof step === "number") updates.tutorialStep = step;
      if (typeof completed === "boolean") updates.tutorialCompleted = completed;

      await db.update(chroniclesGameState)
        .set(updates)
        .where(eq(chroniclesGameState.userId, userId));

      res.json({ success: true, step, completed });
    } catch (error: any) {
      console.error("Tutorial progress error:", error);
      res.status(500).json({ error: "Failed to update tutorial" });
    }
  });

  app.get("/api/chronicles/tutorial/status", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const state = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
      if (!state[0]) return res.json({ tutorialStep: 0, tutorialCompleted: false });
      res.json({
        tutorialStep: state[0].tutorialStep || 0,
        tutorialCompleted: state[0].tutorialCompleted || false,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get tutorial status" });
    }
  });

  // =====================================================
  // LEGACY & FAMILY SYSTEM
  // =====================================================

  app.get("/api/chronicles/legacy/tree", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const legacies = await db.select().from(playerLegacy)
        .where(eq(playerLegacy.userId, userId))
        .orderBy(playerLegacy.generation);
      const activeLegacy = legacies.find(l => l.isActive);
      res.json({
        legacies,
        activeLegacy,
        totalGenerations: legacies.length,
        legacyScore: legacies.reduce((sum, l) => sum + l.legacyScore, 0),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/legacy/new-life", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { era, characterName, profession } = req.body;
      const [activeLegacy] = await db.select().from(playerLegacy)
        .where(and(eq(playerLegacy.userId, userId), eq(playerLegacy.isActive, true)))
        .limit(1);
      let generation = 1;
      let parentId = null;
      let inheritanceTraits: string[] = [];
      if (activeLegacy) {
        const [gameState] = await db.select().from(chroniclesGameState)
          .where(eq(chroniclesGameState.userId, userId)).limit(1);
        await db.update(playerLegacy).set({
          isActive: false, completedAt: new Date(),
          deathYear: activeLegacy.birthYear + 40 + Math.floor(Math.random() * 40),
          finalWisdom: gameState?.wisdom || 10, finalCourage: gameState?.courage || 10,
          finalCompassion: gameState?.compassion || 10, finalCunning: gameState?.cunning || 10,
          finalInfluence: gameState?.influence || 10,
          legacyScore: (gameState?.situationsCompleted || 0) * 10 + (gameState?.level || 1) * 50,
        }).where(eq(playerLegacy.id, activeLegacy.id));
        generation = activeLegacy.generation + 1;
        parentId = activeLegacy.id;
        const stats = [
          { name: "wisdom", val: gameState?.wisdom || 10 }, { name: "courage", val: gameState?.courage || 10 },
          { name: "compassion", val: gameState?.compassion || 10 }, { name: "cunning", val: gameState?.cunning || 10 },
          { name: "influence", val: gameState?.influence || 10 },
        ].sort((a, b) => b.val - a.val);
        inheritanceTraits = stats.slice(0, 2).map(s => s.name);
        const bonuses: any = { wisdom: 10, courage: 10, compassion: 10, cunning: 10, influence: 10 };
        for (const trait of inheritanceTraits) {
          bonuses[trait] = Math.min(20, (gameState as any)?.[trait] || 10) + 2;
        }
        await db.update(chroniclesGameState).set({
          currentEra: era || "modern", level: 1, experience: 0,
          wisdom: bonuses.wisdom, courage: bonuses.courage, compassion: bonuses.compassion,
          cunning: bonuses.cunning, influence: bonuses.influence,
          situationsCompleted: 0, currentZone: null, currentActivity: null,
          name: characterName || "Traveler", updatedAt: new Date(),
        }).where(eq(chroniclesGameState.userId, userId));
      }
      const eraYears: Record<string, number> = { medieval: 800 + Math.floor(Math.random() * 500), wildwest: 1850 + Math.floor(Math.random() * 50), modern: 1980 + Math.floor(Math.random() * 30) };
      const [newLegacy] = await db.insert(playerLegacy).values({
        userId, era: era || "modern", characterName: characterName || "Traveler",
        generation, parentLegacyId: parentId, birthYear: eraYears[era] || 2000,
        profession: profession || null, inheritanceTraits: JSON.stringify(inheritanceTraits),
      }).returning();
      res.json({
        legacy: newLegacy, generation, inheritedTraits: inheritanceTraits,
        message: generation > 1 ? `A new life begins. Generation ${generation}. The echoes of your ancestor guide you.` : `Your first life begins. Make it count.`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/legacy/end-life", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { causeOfDeath, epitaph } = req.body;
      const [activeLegacy] = await db.select().from(playerLegacy)
        .where(and(eq(playerLegacy.userId, userId), eq(playerLegacy.isActive, true))).limit(1);
      if (!activeLegacy) return res.status(400).json({ error: "No active life to end" });
      const [gameState] = await db.select().from(chroniclesGameState)
        .where(eq(chroniclesGameState.userId, userId)).limit(1);
      const keyDecisions = await db.select().from(decisionTrail)
        .where(eq(decisionTrail.userId, userId)).orderBy(desc(decisionTrail.createdAt)).limit(10);
      const legacyScore = (gameState?.situationsCompleted || 0) * 10 + (gameState?.level || 1) * 50 + (gameState?.faithLevel || 0) * 20;
      await db.update(playerLegacy).set({
        isActive: false, completedAt: new Date(),
        deathYear: activeLegacy.birthYear + 30 + Math.floor(Math.random() * 50),
        causeOfDeath: causeOfDeath || "natural causes",
        epitaph: epitaph || `A ${activeLegacy.profession || "traveler"} who lived fully.`,
        finalWisdom: gameState?.wisdom || 10, finalCourage: gameState?.courage || 10,
        finalCompassion: gameState?.compassion || 10, finalCunning: gameState?.cunning || 10,
        finalInfluence: gameState?.influence || 10, legacyScore,
        keyDecisions: JSON.stringify(keyDecisions.map(d => ({ title: d.situationTitle, choice: d.choiceMade }))),
        children: Math.floor(Math.random() * 4),
      }).where(eq(playerLegacy.id, activeLegacy.id));
      const [sp] = await db.select().from(seasonProgress).where(eq(seasonProgress.userId, userId)).limit(1);
      if (sp) { await db.update(seasonProgress).set({ totalLegacies: sp.totalLegacies + 1, updatedAt: new Date() }).where(eq(seasonProgress.id, sp.id)); }
      res.json({ legacy: activeLegacy, legacyScore, message: `${activeLegacy.characterName}'s story has ended. Legacy Score: ${legacyScore}. Their choices echo through time.`, canStartNewLife: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // RELATIONSHIP SYSTEM
  // =====================================================

  app.get("/api/chronicles/relationships", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      const era = gameState?.currentEra || "modern";
      const relationships = await db.select().from(npcRelationships)
        .where(and(eq(npcRelationships.userId, userId), eq(npcRelationships.era, era)));
      const npcsForEra = STARTER_NPCS.filter(n => n.era === era);
      const enriched = npcsForEra.map(npc => {
        const npcKey = npc.name.toLowerCase().replace(/\s+/g, '_');
        const rel = relationships.find(r => r.npcId === npcKey);
        const personality = JSON.parse(npc.personality);
        return {
          npcId: npcKey, name: npc.name, title: npc.title, faction: npc.factionId,
          relationship: rel ? {
            type: rel.relationshipType, affinity: rel.affinity, trust: rel.trust,
            romance: rel.romance, rivalry: rel.rivalry, fear: rel.fear,
            interactionCount: rel.interactionCount, isRomanceable: rel.isRomanceable,
            isRival: rel.isRival, isAlly: rel.isAlly,
          } : { type: "stranger", affinity: 0, trust: 0, romance: 0, rivalry: 0, fear: 0, interactionCount: 0, isRomanceable: false, isRival: false, isAlly: false },
          traits: personality.traits || [],
        };
      });
      res.json({ era, relationships: enriched });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/relationships/update", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { npcId, era, interactionType, delta } = req.body;
      if (!npcId || !era) return res.status(400).json({ error: "npcId and era required" });
      const clampVal = (v: number) => Math.min(100, Math.max(-100, v));
      let [rel] = await db.select().from(npcRelationships)
        .where(and(eq(npcRelationships.userId, userId), eq(npcRelationships.npcId, npcId), eq(npcRelationships.era, era))).limit(1);
      if (!rel) {
        [rel] = await db.insert(npcRelationships).values({
          userId, npcId, era,
          affinity: clampVal(delta?.affinity || 0), trust: clampVal(delta?.trust || 0),
          romance: clampVal(delta?.romance || 0), rivalry: clampVal(delta?.rivalry || 0), fear: clampVal(delta?.fear || 0),
          interactionCount: 1, lastInteraction: new Date(),
          relationshipHistory: JSON.stringify([{ type: interactionType || "interaction", date: new Date().toISOString() }]),
        }).returning();
      } else {
        const newAffinity = clampVal(rel.affinity + (delta?.affinity || 0));
        const newTrust = clampVal(rel.trust + (delta?.trust || 0));
        const newRomance = clampVal(rel.romance + (delta?.romance || 0));
        const newRivalry = clampVal(rel.rivalry + (delta?.rivalry || 0));
        const newFear = clampVal(rel.fear + (delta?.fear || 0));
        let relType = "acquaintance";
        if (newAffinity >= 60 && newTrust >= 40) relType = "friend";
        if (newAffinity >= 80 && newTrust >= 60) relType = "close_friend";
        if (newRomance >= 50 && newAffinity >= 40) relType = "romantic_interest";
        if (newRomance >= 80 && newTrust >= 60) relType = "partner";
        if (newRivalry >= 60) relType = "rival";
        if (newFear >= 60) relType = "feared";
        if (newAffinity <= -50) relType = "enemy";
        const history = JSON.parse(rel.relationshipHistory || '[]');
        history.push({ type: interactionType || "interaction", date: new Date().toISOString(), delta });
        if (history.length > 50) history.splice(0, history.length - 50);
        [rel] = await db.update(npcRelationships).set({
          affinity: newAffinity, trust: newTrust, romance: newRomance, rivalry: newRivalry, fear: newFear,
          relationshipType: relType, interactionCount: rel.interactionCount + 1, lastInteraction: new Date(),
          isRomanceable: newRomance >= 30, isRival: newRivalry >= 40, isAlly: newAffinity >= 50 && newTrust >= 40,
          relationshipHistory: JSON.stringify(history), updatedAt: new Date(),
        }).where(eq(npcRelationships.id, rel.id)).returning();
      }
      res.json({ relationship: rel });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/relationships/gift", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { npcId, era, itemName, itemValue } = req.body;
      if (!npcId || !era || !itemName) return res.status(400).json({ error: "npcId, era, and itemName required" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      if (!gameState) return res.status(404).json({ error: "No game state" });
      const inventory = JSON.parse(gameState.inventory || '[]');
      const itemIdx = inventory.findIndex((i: any) => i.name === itemName || i.id === itemName);
      if (itemIdx === -1) return res.status(400).json({ error: "Item not in inventory" });
      inventory.splice(itemIdx, 1);
      await db.update(chroniclesGameState).set({ inventory: JSON.stringify(inventory), updatedAt: new Date() }).where(eq(chroniclesGameState.userId, userId));
      const affinityBoost = Math.min(20, (itemValue || 5));
      const trustBoost = Math.floor(affinityBoost / 2);
      let [rel] = await db.select().from(npcRelationships)
        .where(and(eq(npcRelationships.userId, userId), eq(npcRelationships.npcId, npcId), eq(npcRelationships.era, era))).limit(1);
      if (!rel) {
        [rel] = await db.insert(npcRelationships).values({
          userId, npcId, era, affinity: affinityBoost, trust: trustBoost,
          interactionCount: 1, lastInteraction: new Date(),
          giftsGiven: JSON.stringify([{ item: itemName, date: new Date().toISOString() }]),
        }).returning();
      } else {
        const gifts = JSON.parse(rel.giftsGiven || '[]');
        gifts.push({ item: itemName, date: new Date().toISOString() });
        [rel] = await db.update(npcRelationships).set({
          affinity: Math.min(100, rel.affinity + affinityBoost), trust: Math.min(100, rel.trust + trustBoost),
          interactionCount: rel.interactionCount + 1, lastInteraction: new Date(),
          giftsGiven: JSON.stringify(gifts), updatedAt: new Date(),
        }).where(eq(npcRelationships.id, rel.id)).returning();
      }
      res.json({ relationship: rel, message: `Gift received warmly. Affinity +${affinityBoost}, Trust +${trustBoost}.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // DYNAMIC WORLD EVENTS
  // =====================================================

  const WORLD_EVENT_TEMPLATES: Record<string, Array<{ type: string; title: string; description: string; severity: string; duration: number; effects: any }>> = {
    medieval: [
      { type: "plague", title: "The Sweating Sickness", description: "A mysterious illness sweeps through the villages. The sick pile up faster than healers can treat them.", severity: "major", duration: 48, effects: { healthRisk: 20, faithBonus: 5 } },
      { type: "war", title: "Border War Declared", description: "The neighboring kingdom has marched on the border. The lord calls all able-bodied men to arms.", severity: "critical", duration: 72, effects: { courageTest: true, dangerLevel: "high" } },
      { type: "festival", title: "Harvest Festival", description: "The harvest is bountiful! The village erupts in celebration — feasting, jousting, and dancing under the stars.", severity: "minor", duration: 24, effects: { happinessBoost: 15, socialOpportunities: true } },
      { type: "famine", title: "The Lean Winter", description: "Crops failed. Grain stores are dangerously low. People hoard what they have.", severity: "major", duration: 72, effects: { foodScarcity: true, faithTest: true } },
      { type: "discovery", title: "Ancient Ruins Uncovered", description: "Farmers digging a new well struck stone — the entrance to ancient catacombs.", severity: "minor", duration: 48, effects: { wisdomGain: 5, dangerLevel: "medium" } },
      { type: "rebellion", title: "Peasant Uprising", description: "The taxes are too high. A charismatic speaker rallies the common folk in the town square.", severity: "major", duration: 48, effects: { courageTest: true, influenceOpportunity: 15 } },
    ],
    wildwest: [
      { type: "gold_rush", title: "Gold Strike at Dead Man's Creek", description: "A prospector stumbled out of the hills with a nugget the size of a fist. Everyone's heading for the creek.", severity: "major", duration: 72, effects: { wealthOpportunity: 30, lawlessness: 20 } },
      { type: "outlaw_raid", title: "Black Canyon Gang Rides", description: "Riders on the horizon. The Black Canyon Gang is heading straight for town.", severity: "critical", duration: 24, effects: { courageTest: true, combatRisk: "high" } },
      { type: "drought", title: "The Great Dry", description: "No rain for three months. Cattle are dying. Wells run low. Tempers run high.", severity: "major", duration: 96, effects: { resourceScarcity: true, conflictRisk: 15 } },
      { type: "railroad", title: "Railroad Coming Through", description: "The Pacific Railroad Company announces a new line through town. Land values soar.", severity: "minor", duration: 48, effects: { economicBoom: 25, landDisputes: true } },
      { type: "showdown", title: "High Noon Showdown", description: "A notorious gunslinger has called out the sheriff. The whole town holds its breath.", severity: "major", duration: 12, effects: { courageTest: true, cunningOpportunity: 15 } },
      { type: "stampede", title: "Cattle Stampede", description: "Thunder spooked the herd. Three thousand head of cattle are barreling toward the settlement.", severity: "critical", duration: 6, effects: { dangerLevel: "extreme", quickDecision: true } },
    ],
    modern: [
      { type: "data_breach", title: "Nexus Corp Data Breach", description: "Millions of personal records leaked. The underground claims credit. Everyone's data is exposed.", severity: "critical", duration: 48, effects: { cunningOpportunity: 20, trustCrisis: true } },
      { type: "protest", title: "City-Wide Protests", description: "The Civic Alliance has organized a massive demonstration. Thousands fill the streets.", severity: "major", duration: 36, effects: { influenceOpportunity: 15, riskLevel: "medium" } },
      { type: "market_crash", title: "Market Crash", description: "Stock markets plunge 30% overnight. Banks freeze accounts. Some see disaster — others see opportunity.", severity: "critical", duration: 72, effects: { cunningOpportunity: 25, economicCrisis: true } },
      { type: "tech_breakthrough", title: "Genesis Labs Breakthrough", description: "Genesis Labs announces a breakthrough in gene therapy that could extend life by decades.", severity: "minor", duration: 48, effects: { wisdomGain: 5, ethicalDilemma: true } },
      { type: "blackout", title: "City-Wide Blackout", description: "The power grid goes down. No phones, no internet, no security systems. In the darkness, alliances shift.", severity: "major", duration: 24, effects: { survivalChallenge: true, crimeIncrease: 25 } },
      { type: "election", title: "The Election", description: "Election day. Every faction has a candidate. Votes can be bought, stolen, or earned.", severity: "major", duration: 48, effects: { influenceOpportunity: 30, cunningOpportunity: 15 } },
    ],
  };

  app.get("/api/chronicles/events/active", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      const era = gameState?.currentEra || "modern";
      let activeEvents = await db.select().from(worldEvents).where(and(eq(worldEvents.era, era), eq(worldEvents.isActive, true)));
      const now = new Date();
      for (const evt of activeEvents) {
        if (evt.endsAt && new Date(evt.endsAt) < now) {
          await db.update(worldEvents).set({ isActive: false, outcome: "The event has passed into history." }).where(eq(worldEvents.id, evt.id));
        }
      }
      activeEvents = activeEvents.filter(e => !e.endsAt || new Date(e.endsAt) >= now);
      if (activeEvents.length === 0 && Math.random() < 0.25) {
        const templates = WORLD_EVENT_TEMPLATES[era] || [];
        if (templates.length > 0) {
          const template = templates[Math.floor(Math.random() * templates.length)];
          const allZones = WORLD_ZONES[era] || [];
          const affectedZoneIds = allZones.slice(0, 2 + Math.floor(Math.random() * 3)).map((z: any) => z.id);
          const [newEvent] = await db.insert(worldEvents).values({
            era, eventType: template.type, title: template.title, description: template.description,
            severity: template.severity, affectedZones: JSON.stringify(affectedZoneIds),
            endsAt: new Date(Date.now() + template.duration * 60 * 60 * 1000), effects: JSON.stringify(template.effects),
          }).returning();
          activeEvents.push(newEvent);
        }
      }
      const participations = activeEvents.length > 0
        ? await db.select().from(worldEventParticipation).where(eq(worldEventParticipation.userId, userId)) : [];
      res.json({
        era, events: activeEvents.map(e => ({
          ...e, effects: JSON.parse(e.effects || '{}'), affectedZones: JSON.parse(e.affectedZones || '[]'),
          playerParticipated: participations.some(p => p.eventId === e.id),
          timeRemaining: e.endsAt ? Math.max(0, new Date(e.endsAt).getTime() - Date.now()) : null,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/events/participate", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { eventId, action } = req.body;
      if (!eventId || !action) return res.status(400).json({ error: "eventId and action required" });
      const [event] = await db.select().from(worldEvents).where(and(eq(worldEvents.id, eventId), eq(worldEvents.isActive, true))).limit(1);
      if (!event) return res.status(404).json({ error: "Event not found or expired" });
      const [existing] = await db.select().from(worldEventParticipation)
        .where(and(eq(worldEventParticipation.eventId, eventId), eq(worldEventParticipation.userId, userId))).limit(1);
      if (existing) return res.status(400).json({ error: "Already participated" });
      const contribution = 10 + Math.floor(Math.random() * 40);
      const effects = JSON.parse(event.effects || '{}');
      let rewardText = "";
      const statUpdates: any = { updatedAt: new Date() };
      if (effects.wisdomGain) { statUpdates.wisdom = sql`wisdom + ${effects.wisdomGain}`; rewardText += `Wisdom +${effects.wisdomGain}. `; }
      if (effects.courageTest) { statUpdates.courage = sql`courage + 3`; rewardText += "Courage +3. "; }
      if (effects.faithBonus) { statUpdates.faithLevel = sql`faith_level + ${effects.faithBonus}`; rewardText += `Faith +${effects.faithBonus}. `; }
      if (effects.influenceOpportunity) { statUpdates.influence = sql`influence + 5`; rewardText += "Influence +5. "; }
      if (effects.cunningOpportunity) { statUpdates.cunning = sql`cunning + 3`; rewardText += "Cunning +3. "; }
      const echoReward = contribution * 2;
      statUpdates.echoBalance = sql`echo_balance + ${echoReward}`;
      statUpdates.experience = sql`experience + ${contribution * 5}`;
      rewardText += `+${echoReward} Echoes. +${contribution * 5} XP.`;
      await db.update(chroniclesGameState).set(statUpdates).where(eq(chroniclesGameState.userId, userId));
      await db.insert(worldEventParticipation).values({ eventId, userId, action, contribution, reward: rewardText });
      await db.update(worldEvents).set({ participantCount: event.participantCount + 1 }).where(eq(worldEvents.id, eventId));
      res.json({ participation: { action, contribution, reward: rewardText }, message: `You ${action}. Contribution: ${contribution}. ${rewardText}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/events/history", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const pastEvents = await db.select().from(worldEvents).where(eq(worldEvents.isActive, false)).orderBy(desc(worldEvents.createdAt)).limit(20);
      const myParticipations = await db.select().from(worldEventParticipation).where(eq(worldEventParticipation.userId, userId));
      res.json({
        events: pastEvents.map(e => ({
          ...e, participated: myParticipations.some(p => p.eventId === e.id),
          myContribution: myParticipations.find(p => p.eventId === e.id)?.contribution || 0,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // HOME INTERIORS & PROPERTY
  // =====================================================

  const HOME_UPGRADES: Record<string, Array<{ id: string; name: string; cost: number; type: string; buff?: string; buffValue?: number; description: string }>> = {
    medieval: [
      { id: "med_hearth", name: "Stone Hearth", cost: 50, type: "furniture", buff: "comfort", buffValue: 2, description: "A proper stone hearth keeps the cold at bay" },
      { id: "med_bed", name: "Feather Bed", cost: 80, type: "furniture", buff: "rest_bonus", buffValue: 5, description: "Sleep like nobility on goose-down feathers" },
      { id: "med_chest", name: "Iron-Bound Chest", cost: 40, type: "furniture", buff: "storage", buffValue: 5, description: "Secure storage for your valuables" },
      { id: "med_table", name: "Oak Dining Table", cost: 60, type: "furniture", buff: "social", buffValue: 3, description: "A fine table for hosting visitors" },
      { id: "med_tapestry", name: "Woven Tapestry", cost: 100, type: "decoration", buff: "influence", buffValue: 3, description: "A beautiful tapestry depicting a great hunt" },
      { id: "med_bookshelf", name: "Scholar's Bookshelf", cost: 120, type: "furniture", buff: "wisdom", buffValue: 5, description: "Fill it with knowledge from across the realm" },
      { id: "med_forge", name: "Personal Forge", cost: 200, type: "room", buff: "crafting", buffValue: 10, description: "A small forge for metalworking" },
      { id: "med_chapel", name: "Private Chapel", cost: 250, type: "room", buff: "faith", buffValue: 8, description: "A quiet place for prayer and reflection" },
      { id: "med_garden", name: "Herb Garden", cost: 80, type: "room", buff: "healing", buffValue: 5, description: "Grow medicinal herbs at home" },
      { id: "med_guards", name: "Guard Post", cost: 150, type: "security", buff: "security", buffValue: 5, description: "A watchman's post at your gate" },
    ],
    wildwest: [
      { id: "ww_stove", name: "Cast Iron Stove", cost: 60, type: "furniture", buff: "comfort", buffValue: 3, description: "Heats the cabin and cooks your meals" },
      { id: "ww_bunk", name: "Proper Bunk", cost: 50, type: "furniture", buff: "rest_bonus", buffValue: 4, description: "Better than sleeping on the floor" },
      { id: "ww_gun_rack", name: "Gun Rack", cost: 40, type: "furniture", buff: "security", buffValue: 3, description: "Keep your weapons ready and organized" },
      { id: "ww_safe", name: "Iron Safe", cost: 100, type: "furniture", buff: "storage", buffValue: 8, description: "Even outlaws can't crack this" },
      { id: "ww_stable", name: "Horse Stable", cost: 150, type: "room", buff: "travel", buffValue: 10, description: "House and care for your horse" },
      { id: "ww_workshop", name: "Workshop", cost: 120, type: "room", buff: "crafting", buffValue: 8, description: "Fix saddles, whittle, and tinker" },
      { id: "ww_well", name: "Deep Well", cost: 80, type: "room", buff: "sustainability", buffValue: 5, description: "Fresh water even in the driest season" },
      { id: "ww_porch", name: "Covered Porch", cost: 70, type: "decoration", buff: "social", buffValue: 4, description: "A fine place to entertain visitors" },
      { id: "ww_watchtower", name: "Watchtower", cost: 200, type: "security", buff: "security", buffValue: 8, description: "See trouble coming from miles away" },
      { id: "ww_rocking_chair", name: "Rocking Chair", cost: 30, type: "furniture", buff: "comfort", buffValue: 2, description: "Perfect for watching the sunset" },
    ],
    modern: [
      { id: "mod_smart_home", name: "Smart Home System", cost: 100, type: "furniture", buff: "comfort", buffValue: 5, description: "Control everything from your phone" },
      { id: "mod_gaming_setup", name: "Gaming Setup", cost: 80, type: "furniture", buff: "social", buffValue: 4, description: "High-end PC and streaming rig" },
      { id: "mod_home_office", name: "Home Office", cost: 120, type: "room", buff: "cunning", buffValue: 5, description: "A proper workspace for serious work" },
      { id: "mod_gym", name: "Home Gym", cost: 150, type: "room", buff: "courage", buffValue: 5, description: "Stay fit without leaving home" },
      { id: "mod_security", name: "Security System", cost: 90, type: "security", buff: "security", buffValue: 6, description: "Cameras, alarms, and smart locks" },
      { id: "mod_art", name: "Art Collection", cost: 200, type: "decoration", buff: "influence", buffValue: 5, description: "Curated contemporary art pieces" },
      { id: "mod_library", name: "Personal Library", cost: 100, type: "furniture", buff: "wisdom", buffValue: 5, description: "Walls of books, floor to ceiling" },
      { id: "mod_meditation", name: "Meditation Room", cost: 130, type: "room", buff: "faith", buffValue: 6, description: "A peaceful space for spiritual practice" },
      { id: "mod_rooftop", name: "Rooftop Terrace", cost: 180, type: "room", buff: "social", buffValue: 8, description: "Entertain guests under the city skyline" },
      { id: "mod_panic_room", name: "Panic Room", cost: 250, type: "security", buff: "security", buffValue: 10, description: "When things go sideways, you disappear" },
    ],
  };

  app.get("/api/chronicles/home", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      const era = gameState?.currentEra || "modern";
      let [home] = await db.select().from(homeInteriors).where(and(eq(homeInteriors.userId, userId), eq(homeInteriors.era, era))).limit(1);
      if (!home) {
        const homeTypes: Record<string, string> = { medieval: "cottage", wildwest: "cabin", modern: "apartment" };
        const homeNames: Record<string, string> = { medieval: "Humble Cottage", wildwest: "Frontier Cabin", modern: "Studio Apartment" };
        [home] = await db.insert(homeInteriors).values({ userId, era, homeType: homeTypes[era] || "cottage", homeName: homeNames[era] || "Starter Home" }).returning();
      }
      const availableUpgrades = (HOME_UPGRADES[era] || []).filter(u => {
        const all = [...JSON.parse(home.furniture || '[]'), ...JSON.parse(home.decorations || '[]'), ...JSON.parse(home.rooms || '[]')];
        return !all.includes(u.id);
      });
      let currentVisitor = null;
      const visitors = JSON.parse(home.visitors || '[]');
      if (!home.lastVisitorAt || Date.now() - new Date(home.lastVisitorAt).getTime() > 30 * 60 * 1000) {
        if (Math.random() < 0.3) {
          const eraNpcs = STARTER_NPCS.filter(n => n.era === era);
          if (eraNpcs.length > 0) {
            const v = eraNpcs[Math.floor(Math.random() * eraNpcs.length)];
            currentVisitor = { name: v.name, title: v.title, reason: "stopped by to visit" };
            visitors.push({ ...currentVisitor, date: new Date().toISOString() });
            if (visitors.length > 20) visitors.splice(0, visitors.length - 20);
            await db.update(homeInteriors).set({ visitors: JSON.stringify(visitors), lastVisitorAt: new Date(), updatedAt: new Date() }).where(eq(homeInteriors.id, home.id));
          }
        }
      }
      res.json({
        home: { ...home, rooms: JSON.parse(home.rooms || '[]'), furniture: JSON.parse(home.furniture || '[]'), decorations: JSON.parse(home.decorations || '[]'), activeBuffs: JSON.parse(home.activeBuffs || '[]'), visitors: visitors.slice(-5) },
        availableUpgrades, currentVisitor,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/home/upgrade", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { upgradeId } = req.body;
      if (!upgradeId) return res.status(400).json({ error: "upgradeId required" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      if (!gameState) return res.status(404).json({ error: "No game state" });
      const era = gameState.currentEra;
      const upgrade = (HOME_UPGRADES[era] || []).find(u => u.id === upgradeId);
      if (!upgrade) return res.status(404).json({ error: "Upgrade not found" });
      if (gameState.echoBalance < upgrade.cost) return res.status(400).json({ error: `Not enough Echoes. Need ${upgrade.cost}, have ${gameState.echoBalance}` });
      let [home] = await db.select().from(homeInteriors).where(and(eq(homeInteriors.userId, userId), eq(homeInteriors.era, era))).limit(1);
      if (!home) return res.status(404).json({ error: "No home found" });
      await db.update(chroniclesGameState).set({ echoBalance: gameState.echoBalance - upgrade.cost, updatedAt: new Date() }).where(eq(chroniclesGameState.userId, userId));
      const furniture = JSON.parse(home.furniture || '[]');
      const decorations = JSON.parse(home.decorations || '[]');
      const rooms = JSON.parse(home.rooms || '[]');
      const buffs = JSON.parse(home.activeBuffs || '[]');
      if (upgrade.type === "decoration") decorations.push(upgrade.id);
      else if (upgrade.type === "room") rooms.push(upgrade.id);
      else furniture.push(upgrade.id);
      if (upgrade.buff) buffs.push({ buff: upgrade.buff, value: upgrade.buffValue || 1, source: upgrade.id });
      const comfortBoost = upgrade.buff === "comfort" ? (upgrade.buffValue || 1) : 0;
      const securityBoost = upgrade.buff === "security" ? (upgrade.buffValue || 1) : 0;
      const storageBoost = upgrade.buff === "storage" ? (upgrade.buffValue || 0) : 0;
      [home] = await db.update(homeInteriors).set({
        furniture: JSON.stringify(furniture), decorations: JSON.stringify(decorations), rooms: JSON.stringify(rooms),
        activeBuffs: JSON.stringify(buffs), comfortLevel: home.comfortLevel + comfortBoost,
        securityLevel: home.securityLevel + securityBoost, storageCapacity: home.storageCapacity + storageBoost,
        totalUpgrades: home.totalUpgrades + 1, shellsInvested: home.shellsInvested + upgrade.cost,
        homeLevel: Math.floor((home.totalUpgrades + 1) / 3) + 1, updatedAt: new Date(),
      }).where(eq(homeInteriors.id, home.id)).returning();
      res.json({ home, upgrade, message: `${upgrade.name} installed! ${upgrade.description}`, newBalance: gameState.echoBalance - upgrade.cost });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // BLOCKCHAIN DECISION TRAIL
  // =====================================================

  app.post("/api/chronicles/chain/record", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { era, decisionType, situationTitle, choiceMade, consequences, statChanges } = req.body;
      if (!situationTitle || !choiceMade) return res.status(400).json({ error: "situationTitle and choiceMade required" });
      const [lastBlock] = await db.select().from(decisionTrail).where(eq(decisionTrail.userId, userId)).orderBy(desc(decisionTrail.blockNumber)).limit(1);
      const blockNumber = (lastBlock?.blockNumber || 0) + 1;
      const previousHash = lastBlock?.blockHash || "0x0000000000000000000000000000000000000000000000000000000000000000";
      const timestamp = Date.now();
      const { createHash } = await import("crypto");
      let nonce = 0;
      let blockHash = "";
      const difficulty = Math.min(3, Math.floor(blockNumber / 10) + 1);
      const target = "0".repeat(difficulty);
      do {
        const data = `${previousHash}:${userId}:${situationTitle}:${choiceMade}:${timestamp}:${nonce}`;
        blockHash = "0x" + createHash("sha256").update(data).digest("hex");
        nonce++;
      } while (!blockHash.substring(2, 2 + difficulty).startsWith(target) && nonce < 10000);
      const merkleData = `${decisionType || "choice"}:${situationTitle}:${choiceMade}:${JSON.stringify(consequences || {})}`;
      const merkleRoot = "0x" + createHash("sha256").update(merkleData).digest("hex");
      const guardianSignature = "0x" + createHash("sha256")
        .update(`guardian:${blockHash}:${merkleRoot}:${process.env.TRUSTLAYER_API_SECRET || "darkwave-guardian"}`)
        .digest("hex");
      const [block] = await db.insert(decisionTrail).values({
        userId, era: era || "modern", decisionType: decisionType || "choice",
        situationTitle, choiceMade, consequences: JSON.stringify(consequences || {}),
        statChanges: JSON.stringify(statChanges || {}), blockHash, previousHash,
        blockNumber, merkleRoot, nonce, difficulty, timestamp, verified: true, guardianSignature,
      }).returning();
      const [sp] = await db.select().from(seasonProgress).where(eq(seasonProgress.userId, userId)).limit(1);
      if (sp) { await db.update(seasonProgress).set({ totalDecisions: sp.totalDecisions + 1, updatedAt: new Date() }).where(eq(seasonProgress.id, sp.id)); }
      else { await db.insert(seasonProgress).values({ userId, totalDecisions: 1, erasExplored: JSON.stringify([era || "modern"]) }); }
      res.json({
        block: { blockNumber: block.blockNumber, blockHash: block.blockHash, previousHash: block.previousHash, merkleRoot: block.merkleRoot, nonce: block.nonce, difficulty: block.difficulty, timestamp: block.timestamp, verified: block.verified, guardianSignature: block.guardianSignature, decision: { type: block.decisionType, title: block.situationTitle, choice: block.choiceMade } },
        message: `Decision recorded on-chain. Block #${block.blockNumber}. Verified by Guardian.`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/chain/history", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const chain = await db.select().from(decisionTrail).where(eq(decisionTrail.userId, userId)).orderBy(decisionTrail.blockNumber);
      let isValid = true;
      for (let i = 1; i < chain.length; i++) {
        if (chain[i].previousHash !== chain[i - 1].blockHash) { isValid = false; break; }
      }
      res.json({
        chain: chain.map(b => ({ blockNumber: b.blockNumber, blockHash: b.blockHash, previousHash: b.previousHash, merkleRoot: b.merkleRoot, decision: { type: b.decisionType, title: b.situationTitle, choice: b.choiceMade, era: b.era }, timestamp: b.timestamp, verified: b.verified })),
        totalBlocks: chain.length, chainValid: isValid, latestBlock: chain.length > 0 ? chain[chain.length - 1].blockHash : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/chain/verify/:blockHash", async (req: Request, res: Response) => {
    try {
      const { blockHash } = req.params;
      const [block] = await db.select().from(decisionTrail).where(eq(decisionTrail.blockHash, blockHash)).limit(1);
      if (!block) return res.status(404).json({ error: "Block not found", verified: false });
      const { createHash } = await import("crypto");
      const data = `${block.previousHash}:${block.userId}:${block.situationTitle}:${block.choiceMade}:${block.timestamp}:${block.nonce}`;
      const recomputedHash = "0x" + createHash("sha256").update(data).digest("hex");
      res.json({
        verified: recomputedHash === block.blockHash,
        block: { blockNumber: block.blockNumber, blockHash: block.blockHash, merkleRoot: block.merkleRoot, decision: { type: block.decisionType, title: block.situationTitle, era: block.era }, timestamp: block.timestamp, guardianSignature: block.guardianSignature },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // SEASON ZERO COMPLETION
  // =====================================================

  app.get("/api/chronicles/season/progress", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      let [progress] = await db.select().from(seasonProgress).where(eq(seasonProgress.userId, userId)).limit(1);
      if (!progress) { [progress] = await db.insert(seasonProgress).values({ userId }).returning(); }
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      const legacies = await db.select().from(playerLegacy).where(eq(playerLegacy.userId, userId));
      const chainBlocks = await db.select().from(decisionTrail).where(eq(decisionTrail.userId, userId));
      const totalQuestsPerEra = Math.max(1, Math.floor(SEASON_ZERO_QUESTS.length / 3));
      const completedSituations: string[] = gameState?.completedSituations || [];
      const medievalCompleted = completedSituations.filter(s => s.startsWith("med_")).length;
      const wildwestCompleted = completedSituations.filter(s => s.startsWith("ww_")).length;
      const modernCompleted = completedSituations.filter(s => s.startsWith("mod_")).length;
      const medievalProgress = Math.min(100, Math.round((medievalCompleted / totalQuestsPerEra) * 100));
      const wildwestProgress = Math.min(100, Math.round((wildwestCompleted / totalQuestsPerEra) * 100));
      const modernProgress = Math.min(100, Math.round((modernCompleted / totalQuestsPerEra) * 100));
      const finaleUnlocked = medievalProgress >= 50 && wildwestProgress >= 50 && modernProgress >= 50 && legacies.length >= 3 && chainBlocks.length >= 10;
      const seasonScore = (gameState?.situationsCompleted || 0) * 10 + legacies.reduce((sum, l) => sum + l.legacyScore, 0) + chainBlocks.length * 5 + (gameState?.faithLevel || 0) * 3;
      await db.update(seasonProgress).set({
        medievalProgress, wildwestProgress, modernProgress, totalLegacies: legacies.length,
        totalDecisions: chainBlocks.length, finaleUnlocked, seasonScore,
        erasExplored: JSON.stringify(Array.from(new Set(legacies.map(l => l.era)))), updatedAt: new Date(),
      }).where(eq(seasonProgress.id, progress.id));
      const rels = await db.select().from(npcRelationships).where(eq(npcRelationships.userId, userId));
      const homes = await db.select().from(homeInteriors).where(eq(homeInteriors.userId, userId));
      const totalHomeUpgrades = homes.reduce((sum, h) => sum + h.totalUpgrades, 0);
      const milestones = [
        { id: "first_life", title: "First Life Lived", description: "Complete your first legacy", done: legacies.filter(l => !l.isActive).length >= 1 },
        { id: "three_eras", title: "Time Traveler", description: "Explore all 3 eras", done: Array.from(new Set(legacies.map(l => l.era))).length >= 3 },
        { id: "chain_started", title: "On the Record", description: "Record 10 decisions on-chain", done: chainBlocks.length >= 10 },
        { id: "family_tree", title: "Family Tree", description: "Live 3 generations", done: legacies.length >= 3 },
        { id: "faithful", title: "Person of Faith", description: "Reach Faith Level 5", done: (gameState?.faithLevel || 0) >= 5 },
        { id: "homemaker", title: "Home Sweet Home", description: "Upgrade your home 5 times", done: totalHomeUpgrades >= 5 },
        { id: "social_butterfly", title: "Social Butterfly", description: "Have 5+ NPC relationships", done: rels.length >= 5 },
        { id: "medieval_master", title: "Medieval Master", description: "50%+ Medieval progress", done: medievalProgress >= 50 },
        { id: "frontier_legend", title: "Frontier Legend", description: "50%+ Wild West progress", done: wildwestProgress >= 50 },
        { id: "modern_mogul", title: "Modern Mogul", description: "50%+ Modern progress", done: modernProgress >= 50 },
        { id: "finale_ready", title: "Finale Unlocked", description: "Meet all requirements for the Season Zero Finale", done: finaleUnlocked },
      ];
      res.json({
        seasonId: "season_zero", seasonName: "Season Zero: The Awakening",
        progress: { medieval: medievalProgress, wildwest: wildwestProgress, modern: modernProgress },
        totalLegacies: legacies.length, totalDecisions: chainBlocks.length, seasonScore, finaleUnlocked,
        finaleCompleted: progress.finaleCompleted, seasonOneUnlocked: progress.seasonOneUnlocked,
        milestones, completedMilestones: milestones.filter(m => m.done).length, totalMilestones: milestones.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/season/complete-finale", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const [progress] = await db.select().from(seasonProgress).where(eq(seasonProgress.userId, userId)).limit(1);
      if (!progress) return res.status(400).json({ error: "No season progress found" });
      if (!progress.finaleUnlocked) return res.status(400).json({ error: "Finale not yet unlocked" });
      if (progress.finaleCompleted) return res.status(400).json({ error: "Finale already completed" });
      const [gameState] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId)).limit(1);
      const finalScore = progress.seasonScore + 500;
      const shellsReward = Math.floor(finalScore / 10);
      const rewards = [
        { type: "shells", amount: shellsReward, description: "Season Zero Completion Bonus" },
        { type: "title", value: "Season Zero Pioneer", description: "Exclusive title" },
        { type: "badge", value: "season_zero_complete", description: "Season Zero badge" },
        { type: "legacy_bonus", value: "+5 inheritance stats", description: "Future generations start with +5 to inherited stats" },
      ];
      const { createHash } = await import("crypto");
      const completionHash = "0x" + createHash("sha256").update(`season_zero:complete:${userId}:${finalScore}:${Date.now()}`).digest("hex");
      await db.update(seasonProgress).set({
        finaleCompleted: true, seasonOneUnlocked: true, seasonScore: finalScore,
        completionRewards: JSON.stringify(rewards), completedAt: new Date(), updatedAt: new Date(),
      }).where(eq(seasonProgress.id, progress.id));
      if (gameState) {
        await db.update(chroniclesGameState).set({
          shellsEarned: gameState.shellsEarned + shellsReward,
          achievements: [...(gameState.achievements || []), "season_zero_complete", "season_zero_pioneer"],
          updatedAt: new Date(),
        }).where(eq(chroniclesGameState.userId, userId));
      }
      res.json({ completed: true, finalScore, completionHash, rewards, seasonOneUnlocked: true, message: "Congratulations! You have completed Season Zero: The Awakening. Your legacy echoes across time. Season One awaits." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // SEASON ONE VOTING
  // =====================================================

  app.post("/api/chronicles/season/vote", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { eras, features, suggestion } = req.body;
      console.log(`[Season Vote] User ${userId} voted - eras: ${JSON.stringify(eras)}, features: ${JSON.stringify(features)}, suggestion: ${suggestion || "none"}`);
      res.json({ success: true, message: "Vote recorded! Thank you for shaping Season One." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // VOICE & NARRATION SYSTEM
  // =====================================================

  app.post("/api/chronicles/voice/narrate", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { text, voice, era } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });
      const voiceMap: Record<string, string> = { medieval: "alloy", wildwest: "echo", modern: "nova", narrator: "onyx", female: "shimmer", male: "fable" };
      const selectedVoice = voiceMap[voice || era || "narrator"] || "onyx";
      try {
        const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: selectedVoice as any, input: text.substring(0, 500) });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.set({ "Content-Type": "audio/mpeg", "Content-Length": buffer.length.toString() });
        res.send(buffer);
      } catch (ttsError: any) {
        console.error("[Voice] TTS error:", ttsError.message);
        res.status(503).json({ error: "Voice synthesis unavailable", fallback: text });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/voice/available", async (_req: Request, res: Response) => {
    res.json({
      voices: [
        { id: "narrator", name: "The Narrator", description: "Deep, authoritative narration", era: "all" },
        { id: "medieval", name: "Medieval Voice", description: "Warm, storytelling tone", era: "medieval" },
        { id: "wildwest", name: "Frontier Voice", description: "Rugged, weathered tone", era: "wildwest" },
        { id: "modern", name: "Modern Voice", description: "Clear, contemporary tone", era: "modern" },
        { id: "female", name: "Female NPC", description: "Gentle, expressive voice", era: "all" },
        { id: "male", name: "Male NPC", description: "Warm, conversational voice", era: "all" },
      ],
      enabled: true,
    });
  });

  // =====================================================
  // PET & COMPANION SYSTEM
  // =====================================================

  const ERA_PETS: Record<string, Array<{ species: string; breed: string; emoji: string; ability: string; secondaryAbility?: string; rarity: string; description: string }>> = {
    medieval: [
      { species: "dog", breed: "Wolfhound", emoji: "🐕", ability: "guarding", secondaryAbility: "tracking", rarity: "common", description: "Loyal Irish Wolfhound, fierce in battle and gentle at home" },
      { species: "dog", breed: "Mastiff", emoji: "🐕", ability: "guarding", rarity: "common", description: "Massive English Mastiff, guardian of the estate" },
      { species: "horse", breed: "Destrier", emoji: "🐴", ability: "travel", secondaryAbility: "jousting", rarity: "rare", description: "Noble war horse, bred for knights and lords" },
      { species: "horse", breed: "Palfrey", emoji: "🐴", ability: "travel", rarity: "common", description: "Gentle riding horse for daily journeys" },
      { species: "falcon", breed: "Peregrine", emoji: "🦅", ability: "hunting", secondaryAbility: "scouting", rarity: "rare", description: "Swift Peregrine Falcon, the hunter's prize" },
      { species: "falcon", breed: "Gyrfalcon", emoji: "🦅", ability: "hunting", rarity: "legendary", description: "Rare white Gyrfalcon, symbol of royalty" },
      { species: "cat", breed: "Mouser", emoji: "🐈", ability: "pest_control", secondaryAbility: "companionship", rarity: "common", description: "Quick barn cat, keeps grain stores safe" },
      { species: "raven", breed: "Tower Raven", emoji: "🐦‍⬛", ability: "messaging", secondaryAbility: "intelligence", rarity: "uncommon", description: "Intelligent raven, carries messages across the realm" },
    ],
    wildwest: [
      { species: "horse", breed: "Mustang", emoji: "🐎", ability: "travel", secondaryAbility: "herding", rarity: "common", description: "Wild Mustang, untamed spirit of the frontier" },
      { species: "horse", breed: "Quarter Horse", emoji: "🐎", ability: "travel", secondaryAbility: "racing", rarity: "uncommon", description: "Fast Quarter Horse, perfect for cattle work" },
      { species: "horse", breed: "Appaloosa", emoji: "🐎", ability: "travel", rarity: "rare", description: "Spotted Appaloosa, prized by native tribes" },
      { species: "dog", breed: "Blue Heeler", emoji: "🐕", ability: "herding", secondaryAbility: "guarding", rarity: "common", description: "Tough cattle dog, tireless worker" },
      { species: "dog", breed: "Coonhound", emoji: "🐕", ability: "tracking", secondaryAbility: "hunting", rarity: "common", description: "Keen-nosed tracker, follows any trail" },
      { species: "mule", breed: "Pack Mule", emoji: "🫏", ability: "hauling", secondaryAbility: "travel", rarity: "common", description: "Sturdy mule, carries supplies across rough terrain" },
      { species: "hawk", breed: "Red-Tail", emoji: "🦅", ability: "scouting", rarity: "uncommon", description: "Sharp-eyed Red-Tailed Hawk, spots danger from miles away" },
      { species: "snake", breed: "King Snake", emoji: "🐍", ability: "pest_control", rarity: "uncommon", description: "Harmless King Snake, keeps rattlers away from camp" },
    ],
    modern: [
      { species: "dog", breed: "German Shepherd", emoji: "🐕", ability: "guarding", secondaryAbility: "tracking", rarity: "common", description: "Intelligent K9-trained German Shepherd" },
      { species: "dog", breed: "Golden Retriever", emoji: "🐕", ability: "companionship", secondaryAbility: "therapy", rarity: "common", description: "Loving Golden Retriever, best friend material" },
      { species: "dog", breed: "Husky", emoji: "🐕", ability: "companionship", secondaryAbility: "travel", rarity: "uncommon", description: "Energetic Siberian Husky, loves adventure" },
      { species: "cat", breed: "Maine Coon", emoji: "🐈", ability: "companionship", secondaryAbility: "pest_control", rarity: "uncommon", description: "Massive Maine Coon, gentle giant of cats" },
      { species: "cat", breed: "Siamese", emoji: "🐈", ability: "companionship", rarity: "common", description: "Vocal Siamese cat, always has something to say" },
      { species: "parrot", breed: "African Grey", emoji: "🦜", ability: "intelligence", secondaryAbility: "messaging", rarity: "rare", description: "Brilliant African Grey Parrot, can learn 1000+ words" },
      { species: "turtle", breed: "Red-Eared Slider", emoji: "🐢", ability: "zen", rarity: "common", description: "Peaceful turtle, teaches patience and mindfulness" },
      { species: "ferret", breed: "Sable Ferret", emoji: "🦦", ability: "scouting", secondaryAbility: "companionship", rarity: "uncommon", description: "Playful ferret, curious explorer of every corner" },
    ],
  };

  const ABILITY_DESCRIPTIONS: Record<string, { name: string; icon: string; desc: string }> = {
    guarding: { name: "Guardian", icon: "🛡️", desc: "Protects your home and warns of danger" },
    tracking: { name: "Tracker", icon: "🔍", desc: "Finds lost items and tracks creatures" },
    hunting: { name: "Hunter", icon: "🎯", desc: "Helps catch food and game" },
    scouting: { name: "Scout", icon: "👁️", desc: "Reveals hidden paths and secrets" },
    travel: { name: "Mount", icon: "🗺️", desc: "Faster travel between locations" },
    herding: { name: "Herder", icon: "🐄", desc: "Manages livestock and animals" },
    companionship: { name: "Companion", icon: "💝", desc: "Boosts morale and happiness" },
    pest_control: { name: "Pest Control", icon: "🪤", desc: "Keeps vermin away from stores" },
    messaging: { name: "Messenger", icon: "📨", desc: "Delivers messages to NPCs" },
    intelligence: { name: "Clever", icon: "🧠", desc: "Learns tricks and solves puzzles" },
    hauling: { name: "Pack Animal", icon: "📦", desc: "Carries extra supplies and goods" },
    jousting: { name: "War Mount", icon: "⚔️", desc: "Trained for combat situations" },
    therapy: { name: "Therapy", icon: "🩹", desc: "Heals stress and anxiety" },
    racing: { name: "Racer", icon: "🏁", desc: "Competes in races for prizes" },
    zen: { name: "Zen Master", icon: "🧘", desc: "Provides calm and inner peace" },
  };

  app.get("/api/chronicles/pets", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = (req.query.era as string) || undefined;
      
      let pets;
      if (era) {
        pets = await db.select().from(playerPets)
          .where(and(eq(playerPets.userId, userId), eq(playerPets.era, era), eq(playerPets.isActive, true)))
          .orderBy(desc(playerPets.isCompanion), desc(playerPets.bondLevel));
      } else {
        pets = await db.select().from(playerPets)
          .where(and(eq(playerPets.userId, userId), eq(playerPets.isActive, true)))
          .orderBy(desc(playerPets.isCompanion), desc(playerPets.bondLevel));
      }
      
      const companion = pets.find(p => p.isCompanion);
      
      res.json({
        pets,
        companion,
        totalPets: pets.length,
        abilityDescriptions: ABILITY_DESCRIPTIONS,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/pets/available", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const era = (req.query.era as string) || "modern";
      const available = ERA_PETS[era] || ERA_PETS.modern;
      res.json({ pets: available, era, abilityDescriptions: ABILITY_DESCRIPTIONS });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/pets/adopt", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { era, petIndex, name } = req.body;
      
      if (!era || petIndex === undefined || !name) {
        return res.status(400).json({ error: "Missing era, petIndex, or name" });
      }
      
      const available = ERA_PETS[era];
      if (!available || !available[petIndex]) {
        return res.status(400).json({ error: "Invalid pet selection" });
      }
      
      const petTemplate = available[petIndex];
      
      const existingPets = await db.select().from(playerPets)
        .where(and(eq(playerPets.userId, userId), eq(playerPets.era, era), eq(playerPets.isActive, true)));
      
      if (existingPets.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 pets per era. Release one first." });
      }
      
      const alreadyHasBreed = existingPets.find(p => p.breed === petTemplate.breed);
      if (alreadyHasBreed) {
        return res.status(400).json({ error: `You already have a ${petTemplate.breed}` });
      }
      
      const randomTraits: string[] = [];
      const traitPool = ["playful", "loyal", "brave", "curious", "gentle", "fierce", "stubborn", "clever", "lazy", "energetic", "affectionate", "independent"];
      for (let i = 0; i < 2; i++) {
        const t = traitPool[Math.floor(Math.random() * traitPool.length)];
        if (!randomTraits.includes(t)) randomTraits.push(t);
      }
      
      const isFirstPet = existingPets.length === 0;
      
      const [newPet] = await db.insert(playerPets).values({
        userId,
        era,
        name: name.trim().substring(0, 30),
        species: petTemplate.species,
        breed: petTemplate.breed,
        emoji: petTemplate.emoji,
        primaryAbility: petTemplate.ability,
        secondaryAbility: petTemplate.secondaryAbility || null,
        traits: JSON.stringify(randomTraits),
        appearance: JSON.stringify({ rarity: petTemplate.rarity }),
        isCompanion: isFirstPet,
        happiness: 70,
        bondLevel: 10,
      }).returning();
      
      res.json({
        pet: newPet,
        message: `${name} has been adopted! ${isFirstPet ? "They are now your active companion." : ""}`,
        abilityInfo: ABILITY_DESCRIPTIONS[petTemplate.ability],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/pets/:petId/interact", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { petId } = req.params;
      const { action } = req.body;
      
      const [pet] = await db.select().from(playerPets)
        .where(and(eq(playerPets.id, petId), eq(playerPets.userId, userId)))
        .limit(1);
      
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      
      const now = new Date();
      let bondGain = 0;
      let happinessGain = 0;
      let energyChange = 0;
      let message = "";
      let reward: any = null;
      
      const updates: any = { updatedAt: now };
      
      switch (action) {
        case "feed": {
          const lastFed = pet.lastFed ? new Date(pet.lastFed).getTime() : 0;
          const hoursSinceFed = (now.getTime() - lastFed) / (1000 * 60 * 60);
          if (hoursSinceFed < 1) {
            return res.json({ pet, message: `${pet.name} isn't hungry yet. Check back in a bit!`, changed: false });
          }
          bondGain = 3;
          happinessGain = 10;
          energyChange = 15;
          updates.lastFed = now;
          updates.totalFeedings = pet.totalFeedings + 1;
          updates.health = Math.min(100, pet.health + 5);
          const feedReactions = [
            `${pet.name} gobbles it up happily! ${pet.emoji}`,
            `${pet.name} nudges your hand for more!`,
            `${pet.name} wags their tail gratefully!`,
            `${pet.name} savors every bite!`,
          ];
          message = feedReactions[Math.floor(Math.random() * feedReactions.length)];
          break;
        }
        case "train": {
          if (pet.energy < 20) {
            return res.json({ pet, message: `${pet.name} is too tired to train. Let them rest!`, changed: false });
          }
          const lastTrained = pet.lastTrained ? new Date(pet.lastTrained).getTime() : 0;
          const hoursSinceTrained = (now.getTime() - lastTrained) / (1000 * 60 * 60);
          if (hoursSinceTrained < 2) {
            return res.json({ pet, message: `${pet.name} needs a break between training sessions.`, changed: false });
          }
          bondGain = 5;
          happinessGain = -5;
          energyChange = -25;
          updates.lastTrained = now;
          updates.totalTrainings = pet.totalTrainings + 1;
          
          const shouldLevelUp = pet.totalTrainings > 0 && (pet.totalTrainings + 1) % 5 === 0;
          if (shouldLevelUp && pet.abilityLevel < 10) {
            updates.abilityLevel = pet.abilityLevel + 1;
            message = `Training complete! ${pet.name}'s ${ABILITY_DESCRIPTIONS[pet.primaryAbility]?.name || pet.primaryAbility} leveled up to ${pet.abilityLevel + 1}! 🎉`;
          } else {
            const trainReactions = [
              `${pet.name} learns a new trick! Good ${pet.species}!`,
              `${pet.name} is getting stronger and smarter!`,
              `Training went well! ${pet.name} is improving fast!`,
            ];
            message = trainReactions[Math.floor(Math.random() * trainReactions.length)];
          }
          break;
        }
        case "play": {
          if (pet.energy < 10) {
            return res.json({ pet, message: `${pet.name} is too tired to play right now.`, changed: false });
          }
          bondGain = 8;
          happinessGain = 20;
          energyChange = -15;
          updates.lastPlayed = now;
          updates.totalPlaySessions = pet.totalPlaySessions + 1;
          const playReactions = [
            `${pet.name} rolls over excitedly! So much fun!`,
            `${pet.name} chases after the toy with pure joy!`,
            `${pet.name} brings you a stick - play again!`,
            `You and ${pet.name} have an amazing time together!`,
          ];
          message = playReactions[Math.floor(Math.random() * playReactions.length)];
          
          if (Math.random() < 0.15) {
            reward = { type: "shells", amount: 10 + Math.floor(Math.random() * 20) };
            message += ` ${pet.name} found ${reward.amount} shells while playing! 🐚`;
          }
          break;
        }
        case "rest": {
          energyChange = 30;
          happinessGain = 5;
          message = `${pet.name} takes a peaceful nap and recovers energy. 😴`;
          break;
        }
        default:
          return res.status(400).json({ error: "Invalid action. Use: feed, train, play, or rest" });
      }
      
      updates.bondLevel = Math.min(pet.maxBond, pet.bondLevel + bondGain);
      updates.happiness = Math.max(0, Math.min(100, pet.happiness + happinessGain));
      updates.energy = Math.max(0, Math.min(100, pet.energy + energyChange));
      
      const newBond = updates.bondLevel;
      if (pet.stage === "young" && newBond >= 30) {
        updates.stage = "adolescent";
        message += ` ${pet.name} has grown into an adolescent! 🌟`;
      } else if (pet.stage === "adolescent" && newBond >= 60) {
        updates.stage = "adult";
        message += ` ${pet.name} is now a fully grown adult! 💪`;
      } else if (pet.stage === "adult" && newBond >= 90) {
        updates.stage = "legendary";
        message += ` ${pet.name} has reached LEGENDARY status! ✨`;
      }
      
      const [updatedPet] = await db.update(playerPets)
        .set(updates)
        .where(eq(playerPets.id, petId))
        .returning();
      
      if (reward?.type === "shells") {
        await db.update(chroniclesGameState)
          .set({ shellsEarned: sql`shells_earned + ${reward.amount}` })
          .where(eq(chroniclesGameState.userId, userId));
      }
      
      res.json({
        pet: updatedPet,
        message,
        reward,
        changed: true,
        bondGain,
        abilityInfo: ABILITY_DESCRIPTIONS[pet.primaryAbility],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/pets/:petId/companion", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { petId } = req.params;
      
      const [pet] = await db.select().from(playerPets)
        .where(and(eq(playerPets.id, petId), eq(playerPets.userId, userId)))
        .limit(1);
      
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      
      await db.update(playerPets)
        .set({ isCompanion: false, updatedAt: new Date() })
        .where(and(eq(playerPets.userId, userId), eq(playerPets.era, pet.era)));
      
      const [updated] = await db.update(playerPets)
        .set({ isCompanion: true, updatedAt: new Date() })
        .where(eq(playerPets.id, petId))
        .returning();
      
      res.json({
        pet: updated,
        message: `${pet.name} is now your active companion! They'll join you on adventures.`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/pets/:petId/release", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { petId } = req.params;
      
      const [pet] = await db.select().from(playerPets)
        .where(and(eq(playerPets.id, petId), eq(playerPets.userId, userId)))
        .limit(1);
      
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      
      await db.update(playerPets)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(playerPets.id, petId));
      
      res.json({
        message: `${pet.name} has been released back into the wild. They'll remember you fondly. 🌿`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/pets/summary", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const pets = await db.select().from(playerPets)
        .where(and(eq(playerPets.userId, userId), eq(playerPets.isActive, true)));
      
      const byEra: Record<string, any[]> = { medieval: [], wildwest: [], modern: [] };
      pets.forEach(p => {
        if (byEra[p.era]) byEra[p.era].push(p);
      });
      
      const companion = pets.find(p => p.isCompanion);
      const totalBond = pets.reduce((sum, p) => sum + p.bondLevel, 0);
      const avgBond = pets.length > 0 ? Math.round(totalBond / pets.length) : 0;
      const legendaryCount = pets.filter(p => p.stage === "legendary").length;
      
      res.json({
        totalPets: pets.length,
        byEra,
        companion: companion ? { name: companion.name, emoji: companion.emoji, era: companion.era, bond: companion.bondLevel } : null,
        avgBond,
        legendaryCount,
        needsAttention: pets.filter(p => p.happiness < 30 || p.energy < 20).map(p => ({ name: p.name, emoji: p.emoji, era: p.era })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
