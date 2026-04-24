import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface EmotionState {
  arousal: number;
  valence: number;
  socialCohesion: number;
  fear: number;
  ambition: number;
}

export interface Consequence {
  type: "immediate" | "delayed" | "ripple";
  description: string;
  affectedParties: string[];
  severity: "minor" | "moderate" | "major" | "catastrophic";
}

export interface GeneratedScenario {
  title: string;
  situation: string;
  characters: Array<{
    name: string;
    role: string;
    emotions: EmotionState;
    motivation: string;
  }>;
  choices: Array<{
    action: string;
    consequences: Consequence[];
    emotionalImpact: string;
  }>;
  worldContext: string;
  era: string;
}

const SYSTEM_PROMPT = `You are the Chronicles Scenario Generator - an AI that creates morally complex, emotionally-driven game scenarios.

CORE PHILOSOPHY:
- There are NO good guys or bad guys - only perspectives and consequences
- Every character has valid motivations from their point of view
- Emotions drive decisions: fear, ambition, loyalty, desperation
- Actions create ripples that affect the world unpredictably

EMOTION MODEL (0-100 scale):
- Arousal: Calm (0) to Agitated (100) - affects impulsiveness
- Valence: Sad (0) to Happy (100) - affects cooperation
- Social Cohesion: Isolated (0) to Bonded (100) - affects loyalty
- Fear: Secure (0) to Terrified (100) - affects fight/flight
- Ambition: Content (0) to Driven (100) - affects power-seeking

When generating scenarios:
1. Create morally grey situations with no clear "right" answer
2. Show how emotions drive characters to their choices
3. Include consequences that ripple beyond immediate actions
4. Make the player question their own assumptions
5. Show how "villains" see themselves as heroes of their own story

Respond ONLY with valid JSON matching the requested schema.`;

export async function generateScenario(
  era: string,
  emotionalTone: string,
  complexity: "simple" | "moderate" | "complex"
): Promise<GeneratedScenario> {
  const prompt = `Generate a scenario for the ${era} era with a ${emotionalTone} emotional tone. Complexity level: ${complexity}.

Return JSON with this exact structure:
{
  "title": "Scenario title",
  "situation": "2-3 sentence description of the situation",
  "era": "${era}",
  "worldContext": "Brief context about what's happening in the world",
  "characters": [
    {
      "name": "Character name",
      "role": "Their role (leader, merchant, soldier, etc)",
      "emotions": {
        "arousal": 50,
        "valence": 50,
        "socialCohesion": 50,
        "fear": 50,
        "ambition": 50
      },
      "motivation": "What drives this character"
    }
  ],
  "choices": [
    {
      "action": "What the player can do",
      "consequences": [
        {
          "type": "immediate",
          "description": "What happens right away",
          "affectedParties": ["Who is affected"],
          "severity": "moderate"
        }
      ],
      "emotionalImpact": "How this choice affects the player's reputation/relationships"
    }
  ]
}

Create 2-4 characters and 3-4 meaningful choices. Make it morally complex with no clear "right" answer.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    return JSON.parse(content) as GeneratedScenario;
  } catch {
    return {
      title: "Scenario Generation Error",
      situation: "The AI returned an unexpected format. Please try again.",
      era,
      worldContext: "Unable to parse scenario",
      characters: [],
      choices: []
    } as GeneratedScenario;
  }
}

export function randomizeEmotions(): EmotionState {
  return {
    arousal: Math.floor(Math.random() * 100),
    valence: Math.floor(Math.random() * 100),
    socialCohesion: Math.floor(Math.random() * 100),
    fear: Math.floor(Math.random() * 100),
    ambition: Math.floor(Math.random() * 100),
  };
}

export function describeEmotionalState(emotions: EmotionState): string {
  const descriptors: string[] = [];
  
  if (emotions.arousal > 70) descriptors.push("agitated");
  else if (emotions.arousal < 30) descriptors.push("calm");
  
  if (emotions.valence > 70) descriptors.push("optimistic");
  else if (emotions.valence < 30) descriptors.push("melancholic");
  
  if (emotions.socialCohesion > 70) descriptors.push("deeply loyal");
  else if (emotions.socialCohesion < 30) descriptors.push("isolated");
  
  if (emotions.fear > 70) descriptors.push("terrified");
  else if (emotions.fear < 30) descriptors.push("fearless");
  
  if (emotions.ambition > 70) descriptors.push("power-hungry");
  else if (emotions.ambition < 30) descriptors.push("content");
  
  return descriptors.length > 0 ? descriptors.join(", ") : "emotionally balanced";
}
