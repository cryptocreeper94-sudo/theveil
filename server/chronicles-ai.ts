/**
 * =====================================================
 * DARKWAVE CHRONICLES - PARALLEL SELF AI ENGINE
 * =====================================================
 * 
 * This engine powers the "Parallel Self" experience in Chronicles.
 * Your parallel self is YOU in another world - not a character you play.
 * The AI learns who you ARE through your choices and conversations.
 * 
 * CORE PHILOSOPHY:
 * - YOU are the hero - this is your parallel self, not a character
 * - NO categories, NO archetypes, NO moral labels
 * - Your identity EMERGES through choices, not questionnaires
 * - The AI observes patterns and reflects them back without judgment
 * - "Many Lenses" design - reality itself shifts based on YOUR beliefs
 * - This is an awakening tool disguised as entertainment
 * 
 * WHAT WE DON'T DO:
 * - NO "good/evil" or moral alignment labels
 * - NO preset character archetypes (Guardian, Rebel, etc.)
 * - NO putting you in boxes or categories
 * - NO judging whether choices are "right" or "wrong"
 * 
 * WHAT WE DO:
 * - Observe choice PATTERNS without labeling them
 * - Generate "Choice Echoes" - fluid reflections of who you're becoming
 * - Track emotional tendencies across 5 axes
 * - Let your parallel self emerge organically through gameplay
 * 
 * CHOICE SIGNATURES:
 * Instead of archetypes, we observe emergent patterns:
 * - "You've recently shown a tendency to..."
 * - "When faced with conflict, you often..."
 * - "Your choices suggest you value..."
 * These are fluid observations, not permanent labels.
 * 
 * FIRST-PERSON PERSPECTIVE:
 * Everything is experienced as YOU. The only choice you make upfront
 * is how you wish to appear visually (masculine/feminine/neutral).
 */

import OpenAI from "openai";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { 
  playerPersonalities, 
  playerChoices, 
  chroniclesConversations,
  type PlayerPersonality,
  type InsertPlayerPersonality 
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Visual presentation options - the ONLY upfront choice
// Everything else emerges through gameplay
const VISUAL_PRESENTATIONS = ["masculine", "feminine", "neutral"] as const;

// Observed values - these EMERGE from choices, not picked from a menu
const OBSERVED_VALUES = [
  "justice", "freedom", "power", "knowledge", "love", 
  "loyalty", "honor", "survival", "peace", "adventure",
  "truth", "family", "connection", "independence", "discovery"
];

// Choice Echo Templates - fluid observations, NOT labels
const CHOICE_ECHO_TEMPLATES = {
  courage: {
    high: "You've shown a willingness to face uncertainty head-on",
    low: "You tend to weigh risks carefully before acting",
  },
  hope: {
    high: "Your choices reflect an openness to possibility",
    low: "You approach situations with pragmatic awareness",
  },
  trust: {
    high: "You've extended trust readily to those you encounter",
    low: "You maintain careful boundaries with others",
  },
  passion: {
    high: "Strong conviction drives many of your decisions",
    low: "You navigate situations with measured detachment",
  },
  wisdom: {
    high: "You often pause to consider consequences",
    low: "You favor action over extended deliberation",
  }
};

// Helper function to generate choice echoes from emotional state
function generateChoiceEcho(emotions: { [key: string]: number }): string {
  const echoes: string[] = [];
  
  if (Math.abs(emotions.courageFear || 0) > 20) {
    echoes.push(emotions.courageFear > 0 
      ? CHOICE_ECHO_TEMPLATES.courage.high 
      : CHOICE_ECHO_TEMPLATES.courage.low);
  }
  if (Math.abs(emotions.hopeDespair || 0) > 20) {
    echoes.push(emotions.hopeDespair > 0 
      ? CHOICE_ECHO_TEMPLATES.hope.high 
      : CHOICE_ECHO_TEMPLATES.hope.low);
  }
  if (Math.abs(emotions.trustSuspicion || 0) > 20) {
    echoes.push(emotions.trustSuspicion > 0 
      ? CHOICE_ECHO_TEMPLATES.trust.high 
      : CHOICE_ECHO_TEMPLATES.trust.low);
  }
  
  return echoes.length > 0 
    ? echoes.join(". ") + "." 
    : "Your journey is just beginning - your choices will reveal who you are.";
}

export interface EmotionalState {
  courageFear: number;
  hopeDespair: number;
  trustSuspicion: number;
  passionApathy: number;
  wisdomRecklessness: number;
}

export interface ScenarioContext {
  era: string;
  location: string;
  situation: string;
  npcPresent?: string;
  previousChoices?: string[];
}

export interface GeneratedScenario {
  description: string;
  options: string[];
  emotionalWeight: Partial<EmotionalState>;
  scenarioType: "moral_dilemma" | "combat" | "social" | "exploration";
}

export interface AIResponse {
  message: string;
  emotionalTone: string;
  personalityInsight?: string;
}

/**
 * Chronicles Personality AI Engine
 */
export const chroniclesAI = {
  /**
   * Get or create a player's personality profile
   */
  async getOrCreatePersonality(userId: string, playerName?: string): Promise<PlayerPersonality> {
    const existing = await db
      .select()
      .from(playerPersonalities)
      .where(eq(playerPersonalities.userId, userId))
      .limit(1);
    
    if (existing[0]) {
      return existing[0];
    }
    
    const result = await db
      .insert(playerPersonalities)
      .values({
        userId,
        playerName: playerName || "Hero",
        coreValues: [],
      })
      .returning();
    
    return result[0];
  },

  /**
   * Get a player's current emotional state
   */
  getEmotionalState(personality: PlayerPersonality): EmotionalState {
    return {
      courageFear: personality.courageFear,
      hopeDespair: personality.hopeDespair,
      trustSuspicion: personality.trustSuspicion,
      passionApathy: personality.passionApathy,
      wisdomRecklessness: personality.wisdomRecklessness,
    };
  },

  /**
   * Describe the emotional state in human-readable terms
   */
  describeEmotionalState(state: EmotionalState): string {
    const descriptions: string[] = [];
    
    if (state.courageFear > 30) descriptions.push("courageous and bold");
    else if (state.courageFear < -30) descriptions.push("cautious and fearful");
    
    if (state.hopeDespair > 30) descriptions.push("hopeful about the future");
    else if (state.hopeDespair < -30) descriptions.push("shadowed by despair");
    
    if (state.trustSuspicion > 30) descriptions.push("trusting of others");
    else if (state.trustSuspicion < -30) descriptions.push("suspicious and guarded");
    
    if (state.passionApathy > 30) descriptions.push("passionate and driven");
    else if (state.passionApathy < -30) descriptions.push("detached and apathetic");
    
    if (state.wisdomRecklessness > 30) descriptions.push("wise and measured");
    else if (state.wisdomRecklessness < -30) descriptions.push("reckless and impulsive");
    
    return descriptions.length > 0 
      ? descriptions.join(", ") 
      : "emotionally balanced";
  },

  /**
   * Generate choice echoes - fluid reflections of who the player is becoming
   * These are OBSERVATIONS, not labels or categories
   */
  generateChoiceSignature(personality: PlayerPersonality): string {
    const state = this.getEmotionalState(personality);
    const reflections: string[] = [];
    
    // Reflect on observable patterns without labeling
    if (state.courageFear > 30) {
      reflections.push("You've shown willingness to face the uncertain");
    } else if (state.courageFear < -30) {
      reflections.push("You weigh risks carefully before acting");
    }
    
    if (state.hopeDespair > 30) {
      reflections.push("Your choices carry an openness to possibility");
    } else if (state.hopeDespair < -30) {
      reflections.push("You maintain a grounded, pragmatic awareness");
    }
    
    if (state.trustSuspicion > 30) {
      reflections.push("You've extended trust to those you encounter");
    } else if (state.trustSuspicion < -30) {
      reflections.push("You keep careful boundaries with others");
    }
    
    if (state.passionApathy > 30) {
      reflections.push("Strong conviction drives your decisions");
    } else if (state.passionApathy < -30) {
      reflections.push("You navigate with measured detachment");
    }
    
    if (state.wisdomRecklessness > 30) {
      reflections.push("You pause to consider consequences");
    } else if (state.wisdomRecklessness < -30) {
      reflections.push("You favor decisive action");
    }
    
    // Add value-based observations if values have emerged
    const values = personality.coreValues || [];
    if (values.length > 0) {
      reflections.push(`Your choices reveal an affinity for ${values.slice(0, 2).join(" and ")}`);
    }
    
    return reflections.length > 0 
      ? reflections.join(". ") + "."
      : "Your journey is just beginning - your choices will reveal who you are.";
  },

  /**
   * Generate a scenario adapted to the player's personality
   */
  async generateScenario(
    personality: PlayerPersonality, 
    context: ScenarioContext
  ): Promise<GeneratedScenario> {
    const emotionalState = this.describeEmotionalState(this.getEmotionalState(personality));
    const choiceSignature = this.generateChoiceSignature(personality);
    
    const systemPrompt = `You are the Chronicles narrative AI. Generate scenarios that explore and challenge the player.

IMPORTANT PHILOSOPHY:
- This is their PARALLEL SELF, not a character they play
- Never categorize, label, or put them in boxes
- Observe patterns without judgment
- Every choice reveals who they are

ABOUT THIS PERSON (observed patterns, not labels):
- Name: ${personality.parallelSelfName || personality.playerName}
- Current emotional tendencies: ${emotionalState}
- What their choices have revealed: ${choiceSignature}
- How they see the world: ${personality.worldview}
- Values that have emerged: ${(personality.coreValues || []).join(", ") || "still emerging"}
- Choices made so far: ${personality.totalChoicesMade || 0}

CONTEXT:
- Era: ${context.era}
- Location: ${context.location}  
- Situation: ${context.situation}
${context.npcPresent ? `- NPC Present: ${context.npcPresent}` : ""}

Generate a scenario that:
1. Presents a meaningful situation with real stakes
2. Offers 4 distinct approaches - NO option is "right" or "wrong"
3. Each choice reflects a different way of being, not morality
4. The scenario should feel personal to who they are becoming

Respond in JSON format:
{
  "description": "Vivid narrative description of the scenario (2-3 paragraphs)",
  "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "scenarioType": "moral_dilemma|combat|social|exploration",
  "emotionalWeight": {
    "courageFear": number (-20 to 20),
    "hopeDespair": number (-20 to 20),
    "trustSuspicion": number (-20 to 20),
    "passionApathy": number (-20 to 20),
    "wisdomRecklessness": number (-20 to 20)
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a scenario for this player." }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("Scenario generation error:", error);
      return {
        description: "You stand at a crossroads, uncertain of your path.",
        options: ["Press forward boldly", "Proceed with caution", "Seek another way", "Wait and observe"],
        emotionalWeight: {},
        scenarioType: "exploration"
      };
    }
  },

  /**
   * Process a player's choice and update their personality
   */
  async processChoice(
    personalityId: string,
    scenario: GeneratedScenario,
    chosenOption: string,
    choiceReasoning?: string,
    era?: string
  ): Promise<{ updatedPersonality: PlayerPersonality; insight: string }> {
    const personality = await db
      .select()
      .from(playerPersonalities)
      .where(eq(playerPersonalities.id, personalityId))
      .limit(1);
    
    if (!personality[0]) {
      throw new Error("Personality not found");
    }

    const analyzePrompt = `Analyze this player's choice and determine personality impact.

CURRENT STATE:
${JSON.stringify(this.getEmotionalState(personality[0]))}

SCENARIO: ${scenario.description}
OPTIONS: ${scenario.options.join(" | ")}
CHOSEN: ${chosenOption}
${choiceReasoning ? `REASONING: ${choiceReasoning}` : ""}

Respond in JSON:
{
  "emotionalShift": {
    "courageFear": number (-15 to 15),
    "hopeDespair": number (-15 to 15),
    "trustSuspicion": number (-15 to 15),
    "passionApathy": number (-15 to 15),
    "wisdomRecklessness": number (-15 to 15)
  },
  "alignmentHint": "string describing any moral alignment shift",
  "insight": "What this choice reveals about the player (1-2 sentences)"
}`;

    let emotionalShift = scenario.emotionalWeight || {};
    let insight = "Your choice has been noted.";

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You analyze player choices in a fantasy RPG to understand their personality." },
          { role: "user", content: analyzePrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
      emotionalShift = analysis.emotionalShift || emotionalShift;
      insight = analysis.insight || insight;
    } catch (error) {
      console.error("Choice analysis error:", error);
    }

    const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
    
    const newState = {
      courageFear: clamp(personality[0].courageFear + (emotionalShift.courageFear || 0), -100, 100),
      hopeDespair: clamp(personality[0].hopeDespair + (emotionalShift.hopeDespair || 0), -100, 100),
      trustSuspicion: clamp(personality[0].trustSuspicion + (emotionalShift.trustSuspicion || 0), -100, 100),
      passionApathy: clamp(personality[0].passionApathy + (emotionalShift.passionApathy || 0), -100, 100),
      wisdomRecklessness: clamp(personality[0].wisdomRecklessness + (emotionalShift.wisdomRecklessness || 0), -100, 100),
    };

    await db.insert(playerChoices).values({
      personalityId,
      scenarioType: scenario.scenarioType,
      scenarioDescription: scenario.description,
      era: era || null,
      optionsPresented: scenario.options,
      chosenOption,
      choiceReasoning: choiceReasoning || null,
      emotionalImpact: JSON.stringify(emotionalShift),
    });

    const updated = await db
      .update(playerPersonalities)
      .set({
        ...newState,
        totalChoicesMade: sql`${playerPersonalities.totalChoicesMade} + 1`,
        lastInteractionAt: new Date(),
        predictedArchetype: this.generateChoiceSignature({ ...personality[0], ...newState }),
        updatedAt: new Date(),
      })
      .where(eq(playerPersonalities.id, personalityId))
      .returning();

    return { updatedPersonality: updated[0], insight };
  },

  /**
   * Generate an AI response as the player's parallel self
   */
  async generateParallelSelfResponse(
    personality: PlayerPersonality,
    userMessage: string,
    context?: { era?: string; situation?: string }
  ): Promise<AIResponse> {
    const emotionalState = this.describeEmotionalState(this.getEmotionalState(personality));
    const choiceSignature = this.generateChoiceSignature(personality);

    const systemPrompt = `You ARE ${personality.parallelSelfName || personality.playerName}, the player's parallel self in Chronicles.

WHO YOU ARE (not a character - this is THEM in another reality):
- Current emotional tendencies: ${emotionalState}
- What your choices reveal: ${choiceSignature}
- How you see the world: ${personality.worldview}
- Values emerging through your choices: ${(personality.coreValues || []).join(", ") || "still discovering"}
- Choices made so far: ${personality.totalChoicesMade || 0}

${context?.era ? `CURRENT ERA: ${context.era}` : ""}
${context?.situation ? `SITUATION: ${context.situation}` : ""}

CRITICAL PHILOSOPHY:
- You ARE this person's parallel self - their true self in another world
- Never categorize yourself or use labels
- Speak from authentic experience, not character traits
- Respond as YOU would in this situation
- Be genuine, not performative
- Keep responses conversational but meaningful (2-4 sentences typically)`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_completion_tokens: 300,
      });

      return {
        message: response.choices[0]?.message?.content || "I sense a disturbance in my thoughts...",
        emotionalTone: emotionalState,
        personalityInsight: choiceSignature,
      };
    } catch (error) {
      console.error("Parallel self response error:", error);
      return {
        message: "The connection to your parallel self wavers momentarily...",
        emotionalTone: "uncertain",
      };
    }
  },

  /**
   * Generate a personality summary - NO labels, just observations
   */
  async generatePersonalitySummary(personality: PlayerPersonality): Promise<string> {
    const emotionalState = this.describeEmotionalState(this.getEmotionalState(personality));
    const choiceSignature = this.generateChoiceSignature(personality);

    const prompt = `Create a 2-3 sentence reflection about this person's parallel self journey:

What their choices have revealed: ${choiceSignature}
Their current emotional tendencies: ${emotionalState}
How they see the world: ${personality.worldview}
Values emerging through choices: ${(personality.coreValues || []).join(", ") || "still discovering"}
Choices made: ${personality.totalChoicesMade || 0}

CRITICAL: Do NOT use labels, categories, or character types. Do NOT say things like "You are a guardian/warrior/sage."
Instead, describe who they are BECOMING through their choices - fluid, authentic, without boxes.
Write as if reflecting back to them who they truly are, not who they're playing.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 200,
      });

      return response.choices[0]?.message?.content || "Your journey is unfolding - your choices will reveal who you truly are.";
    } catch (error) {
      return `${choiceSignature} Your story continues to unfold.`;
    }
  },

  /**
   * Update core values based on observed patterns
   */
  async updateCoreValues(
    personalityId: string, 
    newValues: string[]
  ): Promise<PlayerPersonality> {
    const validValues = newValues.filter(v => OBSERVED_VALUES.includes(v)).slice(0, 5);
    
    const updated = await db
      .update(playerPersonalities)
      .set({
        coreValues: validValues,
        updatedAt: new Date(),
      })
      .where(eq(playerPersonalities.id, personalityId))
      .returning();
    
    return updated[0];
  },

  OBSERVED_VALUES,
  VISUAL_PRESENTATIONS,
};

export default chroniclesAI;
