import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { chroniclesGameState, chronicleDailySituations, chronicleAccounts } from "@shared/schema";
import { SEASON_ZERO_QUESTS, ERA_SETTINGS } from "./chronicles-service";
import OpenAI from "openai";
import type { Response, NextFunction } from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TimePeriod = "dawn" | "morning" | "afternoon" | "evening" | "night" | "midnight";

const ERA_TIME_LABELS: Record<string, Record<TimePeriod, string>> = {
  medieval: {
    dawn: "first light",
    morning: "morning bells",
    afternoon: "high sun",
    evening: "dusk",
    night: "eventide",
    midnight: "witching hour",
  },
  wildwest: {
    dawn: "sunup",
    morning: "early ridin'",
    afternoon: "high noon",
    evening: "sundown",
    night: "campfire hours",
    midnight: "dead of night",
  },
  modern: {
    dawn: "dawn",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
    midnight: "midnight",
  },
};

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 23) return "night";
  return "midnight";
}

export function getWorldTime(era: string, timezone?: string) {
  const now = new Date();

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
      });
      const parts = formatter.formatToParts(now);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

      const hour = parseInt(getPart("hour"), 10);
      const minute = parseInt(getPart("minute"), 10);
      const dayOfWeek = getPart("weekday");
      const year = getPart("year");
      const month = getPart("month");
      const day = getPart("day");
      const worldDate = `${year}-${month}-${day}`;

      const period = getTimePeriod(hour);
      const eraLabels = ERA_TIME_LABELS[era] || ERA_TIME_LABELS.modern;
      const eraLabel = eraLabels[period];
      const isDaytime = hour >= 6 && hour < 20;

      return { hour, minute, period, eraLabel, isDaytime, worldDate, dayOfWeek };
    } catch {
      // fall through to default
    }
  }

  const hour = now.getHours();
  const minute = now.getMinutes();
  const period = getTimePeriod(hour);
  const eraLabels = ERA_TIME_LABELS[era] || ERA_TIME_LABELS.modern;
  const eraLabel = eraLabels[period];
  const isDaytime = hour >= 6 && hour < 20;
  const worldDate = now.toISOString().split("T")[0];
  const dayOfWeek = DAYS_OF_WEEK[now.getDay()];

  return { hour, minute, period, eraLabel, isDaytime, worldDate, dayOfWeek };
}

function getTodayDateString(timezone?: string): string {
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
      return formatter.format(new Date());
    } catch {
      // fall through
    }
  }
  return new Date().toISOString().split("T")[0];
}

export async function assignDailySituation(userId: string, era: string) {
  const today = getTodayDateString();

  const [existing] = await db.select().from(chronicleDailySituations)
    .where(and(
      eq(chronicleDailySituations.userId, userId),
      eq(chronicleDailySituations.era, era),
      eq(chronicleDailySituations.assignedDate, today),
    ))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [gameState] = await db.select().from(chroniclesGameState)
    .where(eq(chroniclesGameState.userId, userId))
    .limit(1);

  const completedSet = new Set(gameState?.completedSituations || []);

  const available = SEASON_ZERO_QUESTS.filter(q =>
    q.era === era && !completedSet.has(q.id)
  );

  let situationId: string;
  let title: string;
  let description: string;
  let isAiGenerated = false;

  if (available.length > 0) {
    const picked = available[Math.floor(Math.random() * available.length)];
    situationId = picked.id;
    title = picked.title;
    description = picked.description;
  } else {
    isAiGenerated = true;
    const eraSetting = ERA_SETTINGS[era] || ERA_SETTINGS.modern;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You generate daily life situations for Chronicles, a parallel life simulation game.
ERA: ${era} — ${eraSetting.worldDescription}
ATMOSPHERE: ${eraSetting.atmosphere}

Generate a unique daily situation that fits this era. It should feel like something that happens TO the player in their daily life — not a quest or mission.

Return JSON:
{
  "title": "Short evocative title",
  "description": "2-3 vivid sentences describing the situation",
  "choices": [
    { "id": "a", "text": "First option", "outcome": "Brief outcome description" },
    { "id": "b", "text": "Second option", "outcome": "Brief outcome description" },
    { "id": "c", "text": "Third option", "outcome": "Brief outcome description" }
  ]
}`
          },
          {
            role: "user",
            content: `Generate a fresh daily situation for the ${era} era. Make it immersive and personal.`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const generated = JSON.parse(response.choices[0]?.message?.content || '{}');
      situationId = `ai_${era}_${Date.now()}`;
      title = generated.title || "A New Day";
      description = generated.description || "Something unexpected crosses your path today.";
    } catch {
      situationId = `ai_${era}_${Date.now()}`;
      title = "A New Day Unfolds";
      description = "Life in this era doesn't pause. Something unexpected crosses your path today — how you respond is entirely up to you.";
    }
  }

  const [inserted] = await db.insert(chronicleDailySituations).values({
    userId,
    situationId,
    era,
    title,
    description,
    isAiGenerated,
    assignedDate: today,
  }).returning();

  return inserted;
}

export async function getDailySituations(userId: string, era: string) {
  const today = getTodayDateString();

  const situations = await db.select().from(chronicleDailySituations)
    .where(and(
      eq(chronicleDailySituations.userId, userId),
      eq(chronicleDailySituations.era, era),
      eq(chronicleDailySituations.assignedDate, today),
    ));

  return situations;
}

export async function completeDailySituation(userId: string, situationId: string) {
  const [updated] = await db.update(chronicleDailySituations)
    .set({
      isCompleted: true,
      completedAt: new Date(),
    })
    .where(and(
      eq(chronicleDailySituations.userId, userId),
      eq(chronicleDailySituations.situationId, situationId),
    ))
    .returning();

  return updated;
}

async function isWorldClockAuthenticated(req: any, res: Response, next: NextFunction) {
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
    console.error("World clock auth error:", error.message || error);
    return res.status(401).json({ error: "Authentication required" });
  }
}

export function registerWorldClockRoutes(app: any) {
  app.get("/api/chronicles/world-clock/:era", (req: any, res: Response) => {
    try {
      const { era } = req.params;
      const timezone = req.query.timezone as string | undefined;

      if (!era || !["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era. Must be: modern, medieval, or wildwest" });
      }

      const worldTime = getWorldTime(era, timezone);
      res.json(worldTime);
    } catch (error: any) {
      console.error("World clock error:", error);
      res.status(500).json({ error: error.message || "Failed to get world time" });
    }
  });

  app.get("/api/chronicles/daily-situations/:era", isWorldClockAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.userId || req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.params;
      if (!era || !["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const situations = await getDailySituations(userId, era);
      res.json({ situations });
    } catch (error: any) {
      console.error("Get daily situations error:", error);
      res.status(500).json({ error: error.message || "Failed to get daily situations" });
    }
  });

  app.post("/api/chronicles/daily-situations/assign", isWorldClockAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.userId || req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.body;
      if (!era || !["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era. Must be: modern, medieval, or wildwest" });
      }

      const situation = await assignDailySituation(userId, era);
      res.json({ situation });
    } catch (error: any) {
      console.error("Assign daily situation error:", error);
      res.status(500).json({ error: error.message || "Failed to assign daily situation" });
    }
  });

  app.post("/api/chronicles/daily-situations/complete", isWorldClockAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.userId || req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { situationId } = req.body;
      if (!situationId) {
        return res.status(400).json({ error: "situationId is required" });
      }

      const completed = await completeDailySituation(userId, situationId);
      if (!completed) {
        return res.status(404).json({ error: "Situation not found" });
      }

      res.json({ situation: completed });
    } catch (error: any) {
      console.error("Complete daily situation error:", error);
      res.status(500).json({ error: error.message || "Failed to complete daily situation" });
    }
  });
}
