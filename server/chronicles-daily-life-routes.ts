import { db } from "./db";
import { eq, sql, and, desc } from "drizzle-orm";
import { chroniclesGameState, playerCareers, playerNeeds, playerDailyLog, chronicleAccounts } from "@shared/schema";
import type { Express, Request, Response, NextFunction } from "express";

const ERA_OCCUPATIONS: Record<string, Array<{ occupation: string; workplace: string; wage: number; emoji: string; description: string }>> = {
  medieval: [
    { occupation: "Blacksmith", workplace: "The Iron Forge", wage: 8, emoji: "⚒️", description: "Craft weapons, armor, and tools for the kingdom" },
    { occupation: "Farmer", workplace: "Thornfield Farm", wage: 4, emoji: "🌾", description: "Tend crops and livestock to feed the village" },
    { occupation: "Tavern Keeper", workplace: "The Rusty Tankard", wage: 6, emoji: "🍺", description: "Serve drinks, hear rumors, and manage the tavern" },
    { occupation: "Guard", workplace: "Castle Garrison", wage: 7, emoji: "🛡️", description: "Protect the town and patrol the walls" },
    { occupation: "Merchant", workplace: "Market Square", wage: 10, emoji: "💰", description: "Buy low, sell high, and trade goods across regions" },
    { occupation: "Healer", workplace: "Monastery Infirmary", wage: 6, emoji: "🌿", description: "Treat wounds and brew medicinal remedies" },
    { occupation: "Scribe", workplace: "Abbey Scriptorium", wage: 5, emoji: "📜", description: "Copy manuscripts and record the kingdom's history" },
    { occupation: "Hunter", workplace: "The Wildlands", wage: 7, emoji: "🏹", description: "Track game in the forests and provide meat and pelts" },
    { occupation: "Mason", workplace: "Cathedral Construction", wage: 9, emoji: "🧱", description: "Build walls, castles, and grand structures" },
    { occupation: "Stable Master", workplace: "Royal Stables", wage: 6, emoji: "🐴", description: "Care for horses and prepare mounts for journeys" },
  ],
  wildwest: [
    { occupation: "Sheriff", workplace: "Town Jail", wage: 10, emoji: "⭐", description: "Keep the peace and hunt down outlaws" },
    { occupation: "Rancher", workplace: "Dusty Trails Ranch", wage: 7, emoji: "🤠", description: "Raise cattle and manage the ranch hands" },
    { occupation: "Saloon Owner", workplace: "Golden Spur Saloon", wage: 9, emoji: "🥃", description: "Run the saloon, deal cards, and keep order" },
    { occupation: "Prospector", workplace: "Silver Creek Mine", wage: 5, emoji: "⛏️", description: "Pan for gold and dig for riches in the hills" },
    { occupation: "Blacksmith", workplace: "Ironhorse Forge", wage: 8, emoji: "🔨", description: "Shoe horses and craft tools for the frontier" },
    { occupation: "Doctor", workplace: "Doc's Office", wage: 12, emoji: "💊", description: "Patch up bullet wounds and cure frontier ailments" },
    { occupation: "Telegraph Operator", workplace: "Western Union Office", wage: 6, emoji: "📡", description: "Send and receive messages across the territory" },
    { occupation: "General Store Clerk", workplace: "Hawkins General Store", wage: 5, emoji: "🏪", description: "Stock shelves and serve the townsfolk" },
    { occupation: "Bounty Hunter", workplace: "Open Range", wage: 15, emoji: "🎯", description: "Track down wanted criminals for the reward" },
    { occupation: "Stagecoach Driver", workplace: "Wells Fargo Depot", wage: 8, emoji: "🐎", description: "Drive passengers and cargo across dangerous routes" },
  ],
  modern: [
    { occupation: "Software Developer", workplace: "TechNova Labs", wage: 20, emoji: "💻", description: "Write code and build the next big app" },
    { occupation: "Barista", workplace: "The Daily Grind", wage: 8, emoji: "☕", description: "Craft artisan coffee and manage the morning rush" },
    { occupation: "Paramedic", workplace: "City Hospital", wage: 15, emoji: "🚑", description: "Respond to emergencies and save lives" },
    { occupation: "Chef", workplace: "Ember & Vine", wage: 12, emoji: "👨‍🍳", description: "Create culinary masterpieces for the dinner crowd" },
    { occupation: "Mechanic", workplace: "AutoFix Garage", wage: 11, emoji: "🔧", description: "Diagnose and repair vehicles of all kinds" },
    { occupation: "Teacher", workplace: "Lincoln High School", wage: 13, emoji: "📚", description: "Shape young minds and inspire the next generation" },
    { occupation: "Freelance Artist", workplace: "Home Studio", wage: 9, emoji: "🎨", description: "Create commissions and sell your work online" },
    { occupation: "Rideshare Driver", workplace: "On the Road", wage: 10, emoji: "🚗", description: "Drive passengers around the city for tips" },
    { occupation: "Gym Trainer", workplace: "Iron Peak Fitness", wage: 11, emoji: "💪", description: "Train clients and design workout programs" },
    { occupation: "Journalist", workplace: "Metro Times", wage: 14, emoji: "📰", description: "Investigate stories and report the news" },
  ],
};

const SHIFT_SCHEDULES: Record<string, { label: string; start: number; end: number; emoji: string }> = {
  morning: { label: "Morning Shift", start: 6, end: 14, emoji: "🌅" },
  day: { label: "Day Shift", start: 9, end: 17, emoji: "☀️" },
  afternoon: { label: "Afternoon Shift", start: 14, end: 22, emoji: "🌇" },
  night: { label: "Night Shift", start: 22, end: 6, emoji: "🌙" },
};

const CAREER_RANKS = [
  { rank: "apprentice", label: "Apprentice", minDays: 0, wageMultiplier: 1.0, emoji: "🟢" },
  { rank: "journeyman", label: "Journeyman", minDays: 5, wageMultiplier: 1.3, emoji: "🔵" },
  { rank: "skilled", label: "Skilled", minDays: 15, wageMultiplier: 1.6, emoji: "🟣" },
  { rank: "expert", label: "Expert", minDays: 30, wageMultiplier: 2.0, emoji: "🟡" },
  { rank: "master", label: "Master", minDays: 50, wageMultiplier: 2.5, emoji: "🔴" },
];

const MEAL_OPTIONS: Record<string, Array<{ name: string; cost: number; hungerRestore: number; emoji: string }>> = {
  medieval: [
    { name: "Bread & Cheese", cost: 1, hungerRestore: 25, emoji: "🧀" },
    { name: "Hearty Stew", cost: 2, hungerRestore: 40, emoji: "🍲" },
    { name: "Roasted Pheasant", cost: 4, hungerRestore: 60, emoji: "🍗" },
    { name: "Royal Feast", cost: 8, hungerRestore: 100, emoji: "👑" },
  ],
  wildwest: [
    { name: "Hardtack & Jerky", cost: 1, hungerRestore: 20, emoji: "🥩" },
    { name: "Campfire Beans", cost: 2, hungerRestore: 35, emoji: "🫘" },
    { name: "Steak Dinner", cost: 4, hungerRestore: 55, emoji: "🥩" },
    { name: "Saloon Special", cost: 6, hungerRestore: 80, emoji: "🍽️" },
  ],
  modern: [
    { name: "Street Taco", cost: 2, hungerRestore: 20, emoji: "🌮" },
    { name: "Deli Sandwich", cost: 3, hungerRestore: 35, emoji: "🥪" },
    { name: "Restaurant Meal", cost: 6, hungerRestore: 55, emoji: "🍝" },
    { name: "Fine Dining", cost: 12, hungerRestore: 100, emoji: "🥂" },
  ],
};

const NEEDS_DECAY_RATES: Record<string, number> = {
  hunger: 4,
  energy: 3,
  hygiene: 2,
  social: 2,
};

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 23) return "night";
  return "late_night";
}

function isWorkHours(hour: number, shiftStart: number, shiftEnd: number): boolean {
  if (shiftStart < shiftEnd) {
    return hour >= shiftStart && hour < shiftEnd;
  }
  return hour >= shiftStart || hour < shiftEnd;
}

function getSessionContext(hour: number, career: any, needs: any) {
  const timeOfDay = getTimeOfDay(hour);
  const atWork = career && career.isActive && isWorkHours(hour, career.shiftStart, career.shiftEnd);

  let location = "home";
  let activity = "relaxing";
  let description = "";

  if (atWork) {
    location = career.workplace;
    activity = "working";
    description = `You're at ${career.workplace}, in the middle of your shift as a ${career.occupation}.`;
  } else if (timeOfDay === "early_morning") {
    location = "home";
    activity = "waking_up";
    description = "The morning light filters in. Time to start your day.";
  } else if (timeOfDay === "morning" && !atWork) {
    location = "town";
    activity = "errands";
    description = "You have some free time before your responsibilities call.";
  } else if (timeOfDay === "midday") {
    if (needs && needs.hunger < 40) {
      location = "tavern";
      activity = "eating";
      description = "Your stomach growls. Time to find something to eat.";
    } else {
      location = "town";
      activity = "exploring";
      description = "The midday sun is high. The town is bustling with activity.";
    }
  } else if (timeOfDay === "evening") {
    if (needs && needs.social < 40) {
      location = "tavern";
      activity = "socializing";
      description = "The evening crowd gathers. A good time to catch up with neighbors.";
    } else {
      location = "home";
      activity = "relaxing";
      description = "The evening settles in. You're winding down at home.";
    }
  } else if (timeOfDay === "night" || timeOfDay === "late_night") {
    if (needs && needs.energy < 30) {
      location = "home";
      activity = "sleeping";
      description = "You're exhausted. Your bed calls to you.";
    } else {
      location = "home";
      activity = "relaxing";
      description = "The night is quiet. A peaceful time to rest.";
    }
  }

  return { timeOfDay, atWork, location, activity, description };
}

function simulateOfflineTime(hoursOffline: number, needs: any, career: any) {
  const events: string[] = [];
  let echoesEarned = 0;
  let mealsEaten = 0;
  let workShiftsDone = 0;

  const updatedNeeds = { ...needs };

  for (let h = 0; h < Math.min(hoursOffline, 48); h++) {
    updatedNeeds.hunger = Math.max(0, updatedNeeds.hunger - NEEDS_DECAY_RATES.hunger);
    updatedNeeds.energy = Math.max(0, updatedNeeds.energy - NEEDS_DECAY_RATES.energy);
    updatedNeeds.hygiene = Math.max(0, updatedNeeds.hygiene - NEEDS_DECAY_RATES.hygiene);
    updatedNeeds.social = Math.max(0, updatedNeeds.social - NEEDS_DECAY_RATES.social);

    if (updatedNeeds.hunger < 20) {
      updatedNeeds.hunger = Math.min(100, updatedNeeds.hunger + 50);
      mealsEaten++;
    }

    if (updatedNeeds.energy < 15) {
      updatedNeeds.energy = Math.min(100, updatedNeeds.energy + 60);
      events.push("You slept and recovered your energy.");
    }

    if (updatedNeeds.hygiene < 20) {
      updatedNeeds.hygiene = Math.min(100, updatedNeeds.hygiene + 60);
    }

    if (career && career.isActive) {
      const fakeHour = (new Date().getHours() + h) % 24;
      if (isWorkHours(fakeHour, career.shiftStart, career.shiftEnd)) {
        const wage = Math.round(career.dailyWage / 8);
        echoesEarned += wage;
        if (fakeHour === career.shiftEnd - 1 || (career.shiftEnd < career.shiftStart && fakeHour === career.shiftEnd + 23)) {
          workShiftsDone++;
          events.push(`Completed a shift at ${career.workplace}. Earned ${career.dailyWage} echoes.`);
        }
      }
    }
  }

  updatedNeeds.mood = Math.round((updatedNeeds.hunger + updatedNeeds.energy + updatedNeeds.hygiene + updatedNeeds.social) / 4);

  if (mealsEaten > 0) events.push(`Ate ${mealsEaten} meal${mealsEaten > 1 ? "s" : ""} to keep hunger at bay.`);
  if (hoursOffline > 8) events.push("Life went on while you were away. The town continued its routine.");

  return {
    updatedNeeds,
    echoesEarned,
    mealsEaten,
    workShiftsDone,
    events,
    recap: events.length > 0 ? events.join(" ") : "Things were quiet while you were away. Everything is as you left it.",
  };
}

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
    if (!account) return res.status(401).json({ error: "Invalid session" });
    if (!account.isActive) return res.status(401).json({ error: "Account disabled" });
    req.chroniclesUserId = account.id;
    next();
  } catch (error) {
    res.status(500).json({ error: "Auth error" });
  }
}

export function registerDailyLifeRoutes(app: Express) {

  app.get("/api/chronicles/careers/available", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const era = (req.query.era as string) || "medieval";
      const occupations = ERA_OCCUPATIONS[era] || ERA_OCCUPATIONS.medieval;
      const shifts = Object.entries(SHIFT_SCHEDULES).map(([id, s]) => ({ id, ...s }));
      const ranks = CAREER_RANKS;
      res.json({ occupations, shifts, ranks, era });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/career", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = (req.query.era as string) || undefined;

      let careers;
      if (era) {
        careers = await db.select().from(playerCareers)
          .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));
      } else {
        careers = await db.select().from(playerCareers)
          .where(and(eq(playerCareers.userId, userId), eq(playerCareers.isActive, true)));
      }

      const currentCareer = careers[0] || null;
      const shift = currentCareer ? SHIFT_SCHEDULES[currentCareer.shiftPreference] : null;
      const rankInfo = currentCareer ? CAREER_RANKS.find(r => r.rank === currentCareer.rank) : null;
      const nextRank = currentCareer ? CAREER_RANKS.find(r => r.minDays > (currentCareer.daysWorked || 0)) : null;

      res.json({
        career: currentCareer,
        shift,
        rankInfo,
        nextRank,
        allCareers: careers,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/career/hire", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { era, occupation, shiftPreference } = req.body;

      if (!era || !occupation) return res.status(400).json({ error: "Era and occupation required" });

      const occupations = ERA_OCCUPATIONS[era];
      if (!occupations) return res.status(400).json({ error: "Invalid era" });

      const job = occupations.find(o => o.occupation === occupation);
      if (!job) return res.status(400).json({ error: "Occupation not available in this era" });

      const shift = SHIFT_SCHEDULES[shiftPreference || "morning"] || SHIFT_SCHEDULES.morning;

      await db.update(playerCareers)
        .set({ isActive: false })
        .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));

      const [career] = await db.insert(playerCareers).values({
        userId,
        era,
        occupation: job.occupation,
        workplace: job.workplace,
        shiftPreference: shiftPreference || "morning",
        shiftStart: shift.start,
        shiftEnd: shift.end,
        dailyWage: job.wage,
      }).returning();

      res.json({ career, message: `You've been hired as a ${job.occupation} at ${job.workplace}!` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/career/work", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = req.body.era || "medieval";

      const [career] = await db.select().from(playerCareers)
        .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));

      if (!career) return res.status(400).json({ error: "You don't have a job. Visit career services first!" });

      const now = new Date();
      const hour = now.getHours();
      const atWork = isWorkHours(hour, career.shiftStart, career.shiftEnd);

      if (!atWork) {
        return res.json({ atWork: false, message: `Your shift doesn't start until ${career.shiftStart}:00. Enjoy your time off!`, career });
      }

      const wage = career.dailyWage;
      const newDaysWorked = career.daysWorked + 1;
      const newReputation = Math.min(100, career.reputation + 1);
      const newSkillLevel = Math.min(10, career.skillLevel + (Math.random() < 0.2 ? 1 : 0));

      let newRank = career.rank;
      for (const r of CAREER_RANKS) {
        if (newDaysWorked >= r.minDays) newRank = r.rank;
      }

      const rankMultiplier = CAREER_RANKS.find(r => r.rank === newRank)?.wageMultiplier || 1;
      const totalWage = Math.round(wage * rankMultiplier);

      await db.update(playerCareers).set({
        daysWorked: newDaysWorked,
        reputation: newReputation,
        skillLevel: newSkillLevel,
        rank: newRank,
      }).where(eq(playerCareers.id, career.id));

      await db.update(chroniclesGameState).set({
        echoBalance: sql`echo_balance + ${totalWage}`,
        currentActivity: "working",
      }).where(eq(chroniclesGameState.userId, userId));

      const promoted = newRank !== career.rank;

      res.json({
        atWork: true,
        wage: totalWage,
        daysWorked: newDaysWorked,
        promoted,
        newRank: promoted ? newRank : undefined,
        message: promoted
          ? `Congratulations! You've been promoted to ${CAREER_RANKS.find(r => r.rank === newRank)?.label}! Earned ${totalWage} echoes.`
          : `Good work at ${career.workplace}! Earned ${totalWage} echoes today.`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/career/quit", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = req.body.era || "medieval";

      await db.update(playerCareers).set({ isActive: false })
        .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));

      res.json({ message: "You've quit your job. Time for a new chapter." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/needs", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;

      let [needs] = await db.select().from(playerNeeds).where(eq(playerNeeds.userId, userId));

      if (!needs) {
        [needs] = await db.insert(playerNeeds).values({ userId }).returning();
      }

      const now = new Date();
      const lastDecay = new Date(needs.lastDecayAt);
      const hoursPassed = Math.floor((now.getTime() - lastDecay.getTime()) / (1000 * 60 * 60));

      if (hoursPassed > 0) {
        const newHunger = Math.max(0, needs.hunger - (NEEDS_DECAY_RATES.hunger * hoursPassed));
        const newEnergy = Math.max(0, needs.energy - (NEEDS_DECAY_RATES.energy * hoursPassed));
        const newHygiene = Math.max(0, needs.hygiene - (NEEDS_DECAY_RATES.hygiene * hoursPassed));
        const newSocial = Math.max(0, needs.social - (NEEDS_DECAY_RATES.social * hoursPassed));
        const newMood = Math.round((newHunger + newEnergy + newHygiene + newSocial) / 4);

        [needs] = await db.update(playerNeeds).set({
          hunger: newHunger,
          energy: newEnergy,
          hygiene: newHygiene,
          social: newSocial,
          mood: newMood,
          lastDecayAt: now,
          updatedAt: now,
        }).where(eq(playerNeeds.userId, userId)).returning();
      }

      const warnings: string[] = [];
      if (needs.hunger < 20) warnings.push("You're starving! Find food soon.");
      if (needs.energy < 20) warnings.push("You're exhausted. Get some rest.");
      if (needs.hygiene < 20) warnings.push("You could use a bath.");
      if (needs.social < 20) warnings.push("You're feeling lonely. Talk to someone.");

      res.json({ needs, warnings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chronicles/needs/fulfill", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const { action, era, mealIndex } = req.body;

      const [needs] = await db.select().from(playerNeeds).where(eq(playerNeeds.userId, userId));
      if (!needs) return res.status(400).json({ error: "Needs not initialized" });

      const now = new Date();
      let message = "";
      const updates: any = { updatedAt: now };

      switch (action) {
        case "eat": {
          const meals = MEAL_OPTIONS[era] || MEAL_OPTIONS.medieval;
          const meal = meals[mealIndex ?? 0];
          if (!meal) return res.status(400).json({ error: "Invalid meal" });

          const [state] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
          if (state && state.echoBalance < meal.cost) {
            return res.status(400).json({ error: `Not enough echoes. Need ${meal.cost}, have ${state.echoBalance}.` });
          }

          updates.hunger = Math.min(100, needs.hunger + meal.hungerRestore);
          updates.lastMealAt = now;
          message = `You enjoyed ${meal.emoji} ${meal.name}. Hunger restored by ${meal.hungerRestore}.`;

          await db.update(chroniclesGameState).set({
            echoBalance: sql`echo_balance - ${meal.cost}`,
          }).where(eq(chroniclesGameState.userId, userId));
          break;
        }
        case "sleep": {
          updates.energy = Math.min(100, needs.energy + 70);
          updates.lastSleepAt = now;
          message = "You rested well. Energy restored.";
          break;
        }
        case "bathe": {
          updates.hygiene = Math.min(100, needs.hygiene + 60);
          updates.lastBathAt = now;
          message = "You cleaned up. Hygiene restored.";
          break;
        }
        case "socialize": {
          updates.social = Math.min(100, needs.social + 40);
          updates.lastSocialAt = now;
          message = "You had a great conversation. Social need restored.";
          break;
        }
        default:
          return res.status(400).json({ error: "Invalid action. Use: eat, sleep, bathe, socialize" });
      }

      updates.mood = Math.round(((updates.hunger ?? needs.hunger) + (updates.energy ?? needs.energy) + (updates.hygiene ?? needs.hygiene) + (updates.social ?? needs.social)) / 4);

      const [updated] = await db.update(playerNeeds).set(updates).where(eq(playerNeeds.userId, userId)).returning();

      res.json({ needs: updated, message });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/meals", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const era = (req.query.era as string) || "medieval";
      const meals = MEAL_OPTIONS[era] || MEAL_OPTIONS.medieval;
      res.json({ meals, era });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/session-context", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = (req.query.era as string) || "medieval";

      const [state] = await db.select().from(chroniclesGameState).where(eq(chroniclesGameState.userId, userId));
      const [career] = await db.select().from(playerCareers)
        .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));

      let [needs] = await db.select().from(playerNeeds).where(eq(playerNeeds.userId, userId));
      if (!needs) {
        [needs] = await db.insert(playerNeeds).values({ userId }).returning();
      }

      const now = new Date();
      const hour = now.getHours();
      const context = getSessionContext(hour, career, needs);

      let offlineRecap = null;
      if (state?.lastPlayedAt) {
        const lastPlayed = new Date(state.lastPlayedAt);
        const hoursOffline = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60));

        if (hoursOffline >= 1) {
          const sim = simulateOfflineTime(hoursOffline, needs, career);

          await db.update(playerNeeds).set({
            hunger: sim.updatedNeeds.hunger,
            energy: sim.updatedNeeds.energy,
            hygiene: sim.updatedNeeds.hygiene,
            social: sim.updatedNeeds.social,
            mood: sim.updatedNeeds.mood,
            lastDecayAt: now,
            updatedAt: now,
          }).where(eq(playerNeeds.userId, userId));

          if (sim.echoesEarned > 0) {
            await db.update(chroniclesGameState).set({
              echoBalance: sql`echo_balance + ${sim.echoesEarned}`,
            }).where(eq(chroniclesGameState.userId, userId));
          }

          if (career && sim.workShiftsDone > 0) {
            await db.update(playerCareers).set({
              daysWorked: sql`days_worked + ${sim.workShiftsDone}`,
            }).where(eq(playerCareers.id, career.id));
          }

          offlineRecap = {
            hoursAway: hoursOffline,
            recap: sim.recap,
            events: sim.events,
            echoesEarned: sim.echoesEarned,
            mealsEaten: sim.mealsEaten,
            workShiftsCompleted: sim.workShiftsDone,
          };

          await db.update(chroniclesGameState).set({
            offlineSummary: sim.recap,
            lastOfflineCheck: now,
          }).where(eq(chroniclesGameState.userId, userId));
        }
      }

      res.json({
        context,
        hour,
        career: career ? {
          occupation: career.occupation,
          workplace: career.workplace,
          shift: SHIFT_SCHEDULES[career.shiftPreference],
          rank: career.rank,
          isWorking: context.atWork,
        } : null,
        needs: {
          hunger: needs.hunger,
          energy: needs.energy,
          hygiene: needs.hygiene,
          social: needs.social,
          mood: needs.mood,
        },
        offlineRecap,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chronicles/daily-life/summary", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesUserId;
      const era = (req.query.era as string) || "medieval";

      const [career] = await db.select().from(playerCareers)
        .where(and(eq(playerCareers.userId, userId), eq(playerCareers.era, era), eq(playerCareers.isActive, true)));

      let [needs] = await db.select().from(playerNeeds).where(eq(playerNeeds.userId, userId));
      if (!needs) {
        [needs] = await db.insert(playerNeeds).values({ userId }).returning();
      }

      const recentLogs = await db.select().from(playerDailyLog)
        .where(and(eq(playerDailyLog.userId, userId), eq(playerDailyLog.era, era)))
        .orderBy(desc(playerDailyLog.createdAt))
        .limit(7);

      const hour = new Date().getHours();
      const context = getSessionContext(hour, career, needs);
      const meals = MEAL_OPTIONS[era] || MEAL_OPTIONS.medieval;

      const rankInfo = career ? CAREER_RANKS.find(r => r.rank === career.rank) : null;
      const nextRank = career ? CAREER_RANKS.find(r => r.minDays > (career.daysWorked || 0)) : null;

      res.json({
        career: career ? { ...career, rankInfo, nextRank, occupationEmoji: ERA_OCCUPATIONS[era]?.find(o => o.occupation === career.occupation)?.emoji } : null,
        needs,
        context,
        meals,
        recentLogs,
        hour,
        shifts: Object.entries(SHIFT_SCHEDULES).map(([id, s]) => ({ id, ...s })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
