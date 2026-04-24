import { Request, Response, Express } from "express";
import { db } from "./db";
import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import {
  chronicleWorldRegions, chronicleCountries, chronicleStates, chronicleCities,
  chronicleTransportModes, chronicleTravelRoutes, chronicleTravelSessions,
  chronicleTravelEncounters, chronicleNpcTemplates, chronicleCityNpcs,
  chronicleLegacyScores, chronicleAchievementStamps, chroniclePlayerStamps,
  chronicleCityReputations, chronicleTravelQuests, chronicleTravelQuestSteps,
  chroniclePlayerTravelQuests
} from "@shared/schema";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ENCOUNTER_TEMPLATES = {
  medieval: [
    { type: "stranger", title: "A Weary Traveler", description: "A lone figure sits by the trail, exhausted and hungry. They look up at you with tired eyes.", choices: '["Offer food and water","Walk past","Ask where they came from"]' },
    { type: "danger", title: "Wolf Pack", description: "Howling echoes through the forest. A pack of wolves has picked up your scent and shadows move between the trees.", choices: '["Build a fire to scare them","Climb a tree and wait","Stand your ground and shout"]' },
    { type: "discovery", title: "Ancient Ruins", description: "Crumbling stone walls emerge from the undergrowth. This was once a settlement — pottery shards and carved stones litter the ground.", choices: '["Explore carefully","Make camp here","Mark it and continue"]' },
    { type: "social", title: "Trading Caravan", description: "A caravan of traders approaches, their carts laden with goods from distant lands. The lead merchant waves.", choices: '["Trade with them","Ask for news","Travel together for safety"]' },
    { type: "weather", title: "Sudden Storm", description: "Dark clouds gather without warning. Thunder cracks and rain begins to pour. You need shelter fast.", choices: '["Find a cave or overhang","Press on through the rain","Build a lean-to from branches"]' },
    { type: "moral", title: "Abandoned Child", description: "A child sits alone by the trail, crying. No adults are in sight. The child says their family left without them.", choices: '["Take the child with you","Search for the family","Leave food and continue"]' },
  ],
  wildwest: [
    { type: "stranger", title: "Lone Rider", description: "A rider approaches from the horizon, dust trailing behind. They tip their hat but keep one hand near their holster.", choices: '["Greet them friendly","Keep your distance","Ask where they ride from"]' },
    { type: "danger", title: "Bandits on the Trail", description: "Three men on horseback block the road ahead. One levels a rifle. 'This here is a toll road, friend.'", choices: '["Pay the toll","Talk your way out","Make a run for it"]' },
    { type: "discovery", title: "Ghost Town", description: "A cluster of empty buildings appears — a town that boomed and busted. Signs still hang, doors creak in the wind.", choices: '["Search for supplies","Camp in the saloon","Check for survivors"]' },
    { type: "social", title: "Cattle Drive", description: "A massive herd of longhorns fills the trail. Cowboys whistle and shout, moving a thousand head north.", choices: '["Ride alongside and talk","Wait for them to pass","Ask to join up"]' },
    { type: "weather", title: "Dust Storm", description: "The sky turns brown as a wall of dust rolls across the prairie. Visibility drops to nothing.", choices: '["Hunker down and cover up","Find low ground","Push through slowly"]' },
    { type: "moral", title: "Wounded Outlaw", description: "A man lies bleeding by the trail. He has been shot, and a wanted poster with his face is nailed to a nearby tree.", choices: '["Help him anyway","Turn him in for the bounty","Take his belongings"]' },
  ],
  modern: [
    { type: "stranger", title: "Hitchhiker", description: "A person stands at the roadside with a cardboard sign that reads your destination city. They look harmless enough.", choices: '["Give them a ride","Wave and drive past","Stop and chat but do not offer a ride"]' },
    { type: "danger", title: "Road Closure", description: "Flashing signs ahead: ROAD CLOSED - ACCIDENT. A detour adds hours to your trip through unfamiliar back roads.", choices: '["Take the detour","Wait it out","Find an alternate route on GPS"]' },
    { type: "discovery", title: "Hidden Diner", description: "A neon sign glows off the highway: World Famous Pie. A roadside diner that looks like it has not changed since 1962.", choices: '["Stop for pie","Keep driving","Take a photo and post it"]' },
    { type: "social", title: "Rest Stop Encounter", description: "At a rest stop, you meet another traveler going the same direction. They suggest caravanning together for safety.", choices: '["Travel together","Exchange numbers","Politely decline"]' },
    { type: "weather", title: "Flash Flood Warning", description: "Your phone buzzes with emergency alerts. Flash flood warnings for the area ahead. Water is already rising on the road.", choices: '["Turn around and find high ground","Proceed carefully","Pull over and wait"]' },
    { type: "moral", title: "Stranded Motorist", description: "A car sits on the shoulder, hood up, steam rising. A family with small children stands nearby looking stressed.", choices: '["Stop and help","Call roadside assistance for them","Drive past"]' },
  ],
};

function generateEncounter(era: string, mileMarker: number) {
  const templates = ENCOUNTER_TEMPLATES[era as keyof typeof ENCOUNTER_TEMPLATES] || ENCOUNTER_TEMPLATES.modern;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return {
    ...template,
    mileMarker,
    xpReward: Math.floor(Math.random() * 30) + 20,
    echoReward: Math.floor(Math.random() * 10) + 5,
  };
}

export function registerChronicleTravelRoutes(app: Express) {

  app.get("/api/chronicles/world/regions", async (_req: Request, res: Response) => {
    try {
      const regions = await db.select().from(chronicleWorldRegions).orderBy(asc(chronicleWorldRegions.sortOrder));
      res.json(regions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/countries", async (req: Request, res: Response) => {
    try {
      const { region } = req.query;
      let query = db.select().from(chronicleCountries);
      if (region) {
        query = query.where(eq(chronicleCountries.regionCode, region as string)) as any;
      }
      const countries = await query.orderBy(asc(chronicleCountries.sortOrder));
      res.json(countries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/states", async (req: Request, res: Response) => {
    try {
      const { country } = req.query;
      let query = db.select().from(chronicleStates);
      if (country) {
        query = query.where(eq(chronicleStates.countryCode, country as string)) as any;
      }
      const states = await query.orderBy(asc(chronicleStates.sortOrder));
      res.json(states);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/cities", async (req: Request, res: Response) => {
    try {
      const { state, country } = req.query;
      let conditions: any[] = [];
      if (state) conditions.push(eq(chronicleCities.stateCode, state as string));
      if (country) conditions.push(eq(chronicleCities.countryCode, country as string));

      let query = db.select().from(chronicleCities);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      const cities = await query.orderBy(asc(chronicleCities.sortOrder));
      res.json(cities);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/cities/:code", async (req: Request, res: Response) => {
    try {
      const [city] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, req.params.code));
      if (!city) return res.status(404).json({ error: "City not found" });
      const npcs = await db.select().from(chronicleCityNpcs).where(eq(chronicleCityNpcs.cityCode, req.params.code));
      res.json({ ...city, npcs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel/transport-modes", async (req: Request, res: Response) => {
    try {
      const { era } = req.query;
      let modes = await db.select().from(chronicleTransportModes).orderBy(asc(chronicleTransportModes.sortOrder));
      if (era) {
        modes = modes.filter(m => {
          if (era === "medieval") return m.availableInMedieval;
          if (era === "wildwest") return m.availableInWildwest;
          if (era === "modern") return m.availableInModern;
          return true;
        });
      }
      res.json(modes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel/routes", async (req: Request, res: Response) => {
    try {
      const { from, era } = req.query;
      let routes = await db.select().from(chronicleTravelRoutes);
      if (from) {
        routes = routes.filter(r => r.fromCityCode === from || r.toCityCode === from);
      }
      if (era) {
        routes = routes.filter(r => {
          if (era === "medieval") return r.availableInMedieval;
          if (era === "wildwest") return r.availableInWildwest;
          if (era === "modern") return r.availableInModern;
          return true;
        });
      }
      res.json(routes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chronicles/travel/plan", async (req: Request, res: Response) => {
    try {
      const { fromCityCode, toCityCode, transportModeCode, era } = req.body;
      if (!fromCityCode || !toCityCode || !transportModeCode) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [fromCity] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, fromCityCode));
      const [toCity] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, toCityCode));
      const [mode] = await db.select().from(chronicleTransportModes).where(eq(chronicleTransportModes.code, transportModeCode));

      if (!fromCity || !toCity) return res.status(404).json({ error: "City not found" });
      if (!mode) return res.status(404).json({ error: "Transport mode not found" });

      const routes = await db.select().from(chronicleTravelRoutes).where(
        or(
          and(eq(chronicleTravelRoutes.fromCityCode, fromCityCode), eq(chronicleTravelRoutes.toCityCode, toCityCode)),
          and(eq(chronicleTravelRoutes.fromCityCode, toCityCode), eq(chronicleTravelRoutes.toCityCode, fromCityCode))
        )
      );

      let distanceMiles: number;
      let route = routes[0];
      if (route) {
        distanceMiles = route.distanceMiles;
      } else {
        distanceMiles = Math.round(haversineDistance(fromCity.latitude, fromCity.longitude, toCity.latitude, toCity.longitude));
      }

      const travelTimeHours = distanceMiles / mode.speedMph;
      const echoCostRealtime = Math.round(distanceMiles * mode.costPerMile * 100);
      const echoCostCompressed = Math.round(echoCostRealtime * 2.5);
      const echoCostFastTravel = Math.round(echoCostRealtime * 5);
      const estimatedEncounters = Math.floor(travelTimeHours * mode.encounterFrequency * 0.5);

      res.json({
        from: { code: fromCity.code, name: fromCity.name, lat: fromCity.latitude, lng: fromCity.longitude },
        to: { code: toCity.code, name: toCity.name, lat: toCity.latitude, lng: toCity.longitude },
        distanceMiles: Math.round(distanceMiles),
        transport: { code: mode.code, name: mode.name, speedMph: mode.speedMph, emoji: mode.iconEmoji },
        routeDescription: route ? (era === "medieval" ? route.medievalDescription : era === "wildwest" ? route.wildwestDescription : route.modernDescription) : null,
        options: {
          realtime: {
            type: "realtime",
            label: "Real-Time Adventure",
            description: "Travel in real time. Random encounters along the way. Maximum XP and Echo rewards.",
            travelTimeHours: Math.round(travelTimeHours * 10) / 10,
            travelTimeDisplay: formatTravelTime(travelTimeHours),
            echoCost: echoCostRealtime,
            estimatedEncounters,
            xpMultiplier: 2.0,
          },
          compressed: {
            type: "compressed",
            label: "Time-Compressed",
            description: "Journey compressed 10:1. Some encounters. Moderate rewards.",
            travelTimeHours: Math.round(travelTimeHours / 10 * 10) / 10,
            travelTimeDisplay: formatTravelTime(travelTimeHours / 10),
            echoCost: echoCostCompressed,
            estimatedEncounters: Math.max(1, Math.floor(estimatedEncounters / 3)),
            xpMultiplier: 1.0,
          },
          fastTravel: {
            type: "fast_travel",
            label: "Fast Travel",
            description: "Arrive instantly. No encounters. Highest cost.",
            travelTimeHours: 0,
            travelTimeDisplay: "Instant",
            echoCost: echoCostFastTravel,
            estimatedEncounters: 0,
            xpMultiplier: 0.25,
          },
        },
        sceneryRating: route?.sceneryRating || 3,
        dangerRating: route?.dangerRating || 1,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chronicles/travel/start", async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id || req.body.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { characterId, era, fromCityCode, toCityCode, transportModeCode, travelType } = req.body;
      if (!characterId || !era || !fromCityCode || !toCityCode || !transportModeCode) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existing = await db.select().from(chronicleTravelSessions).where(
        and(eq(chronicleTravelSessions.userId, userId), eq(chronicleTravelSessions.status, "in_progress"))
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "You already have an active journey", activeSession: existing[0] });
      }

      const [mode] = await db.select().from(chronicleTransportModes).where(eq(chronicleTransportModes.code, transportModeCode));
      if (!mode) return res.status(404).json({ error: "Transport mode not found" });

      const routes = await db.select().from(chronicleTravelRoutes).where(
        or(
          and(eq(chronicleTravelRoutes.fromCityCode, fromCityCode), eq(chronicleTravelRoutes.toCityCode, toCityCode)),
          and(eq(chronicleTravelRoutes.fromCityCode, toCityCode), eq(chronicleTravelRoutes.toCityCode, fromCityCode))
        )
      );

      const [fromCity] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, fromCityCode));
      const [toCity] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, toCityCode));
      if (!fromCity || !toCity) return res.status(404).json({ error: "City not found" });

      const distanceMiles = routes[0]?.distanceMiles || Math.round(haversineDistance(fromCity.latitude, fromCity.longitude, toCity.latitude, toCity.longitude));
      const speedMph = mode.speedMph;
      const travelHours = distanceMiles / speedMph;
      const actualType = travelType || "realtime";

      let costMultiplier = 1;
      if (actualType === "compressed") costMultiplier = 2.5;
      if (actualType === "fast_travel") costMultiplier = 5;
      const echoCost = Math.round(distanceMiles * mode.costPerMile * 100 * costMultiplier);

      let estimatedArrival: Date | null = null;
      if (actualType === "realtime") {
        estimatedArrival = new Date(Date.now() + travelHours * 3600000);
      } else if (actualType === "compressed") {
        estimatedArrival = new Date(Date.now() + (travelHours / 10) * 3600000);
      }

      const routeId = routes[0]?.id || "direct";

      if (actualType === "fast_travel") {
        const [session] = await db.insert(chronicleTravelSessions).values({
          userId, characterId, era, routeId, transportModeCode,
          fromCityCode, toCityCode, distanceMiles, speedMph,
          travelType: actualType, status: "completed",
          progressPercent: 100, currentMileMarker: distanceMiles,
          echoCost, xpEarned: Math.round(distanceMiles * 0.025),
          encountersTriggered: 0, completedAt: new Date(),
        }).returning();

        await updateCityReputation(userId, toCityCode, era);
        await updateLegacyScore(userId, distanceMiles, 0);
        await checkAchievements(userId, era, toCityCode, distanceMiles);

        return res.json({
          session,
          message: `You arrived at ${toCity.name} instantly via fast travel.`,
          arrivalCinematic: era === "medieval" ? toCity.arrivalCinematicMedieval :
            era === "wildwest" ? toCity.arrivalCinematicWildwest : toCity.arrivalCinematicModern,
        });
      }

      const [session] = await db.insert(chronicleTravelSessions).values({
        userId, characterId, era, routeId, transportModeCode,
        fromCityCode, toCityCode, distanceMiles, speedMph,
        travelType: actualType, status: "in_progress",
        progressPercent: 0, currentMileMarker: 0,
        echoCost, xpEarned: 0, encountersTriggered: 0,
        estimatedArrival,
      }).returning();

      res.json({
        session,
        message: `Your journey from ${fromCity.name} to ${toCity.name} has begun!`,
        estimatedArrival: estimatedArrival?.toISOString(),
        travelTimeDisplay: formatTravelTime(actualType === "compressed" ? travelHours / 10 : travelHours),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel/status", async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id || req.query.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const [session] = await db.select().from(chronicleTravelSessions).where(
        and(eq(chronicleTravelSessions.userId, userId as string), eq(chronicleTravelSessions.status, "in_progress"))
      );

      if (!session) return res.json({ traveling: false });

      const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 3600000;
      const effectiveSpeed = session.travelType === "compressed" ? session.speedMph * 10 : session.speedMph;
      const milesTraveled = Math.min(elapsed * effectiveSpeed, session.distanceMiles);
      const progress = Math.min((milesTraveled / session.distanceMiles) * 100, 100);

      if (progress >= 100 && session.status === "in_progress") {
        await db.update(chronicleTravelSessions).set({
          status: "completed", progressPercent: 100,
          currentMileMarker: session.distanceMiles,
          completedAt: new Date(),
        }).where(eq(chronicleTravelSessions.id, session.id));

        const [toCity] = await db.select().from(chronicleCities).where(eq(chronicleCities.code, session.toCityCode));
        await updateCityReputation(userId as string, session.toCityCode, session.era);
        await updateLegacyScore(userId as string, session.distanceMiles, session.encountersTriggered);
        await checkAchievements(userId as string, session.era, session.toCityCode, session.distanceMiles);

        return res.json({
          traveling: false,
          completed: true,
          session: { ...session, status: "completed", progressPercent: 100 },
          arrivalCinematic: toCity ? (session.era === "medieval" ? toCity.arrivalCinematicMedieval :
            session.era === "wildwest" ? toCity.arrivalCinematicWildwest : toCity.arrivalCinematicModern) : null,
          message: `You have arrived at ${toCity?.name || session.toCityCode}!`,
        });
      }

      const shouldEncounter = Math.random() < (0.1 * (session.travelType === "compressed" ? 0.3 : 1));
      let encounter = null;
      if (shouldEncounter && progress < 95) {
        const enc = generateEncounter(session.era, milesTraveled);
        const [saved] = await db.insert(chronicleTravelEncounters).values({
          travelSessionId: session.id,
          userId: userId as string,
          era: session.era,
          encounterType: enc.type,
          title: enc.title,
          description: enc.description,
          choices: enc.choices,
          xpReward: enc.xpReward,
          echoReward: enc.echoReward,
          mileMarker: enc.mileMarker,
        }).returning();
        encounter = saved;
      }

      await db.update(chronicleTravelSessions).set({
        progressPercent: Math.round(progress * 10) / 10,
        currentMileMarker: Math.round(milesTraveled),
      }).where(eq(chronicleTravelSessions.id, session.id));

      res.json({
        traveling: true,
        session: {
          ...session,
          progressPercent: Math.round(progress * 10) / 10,
          currentMileMarker: Math.round(milesTraveled),
        },
        milesTraveled: Math.round(milesTraveled),
        milesRemaining: Math.round(session.distanceMiles - milesTraveled),
        encounter,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chronicles/travel/encounter/:id/resolve", async (req: any, res: Response) => {
    try {
      const { choiceIndex } = req.body;
      const [encounter] = await db.select().from(chronicleTravelEncounters).where(eq(chronicleTravelEncounters.id, req.params.id));
      if (!encounter) return res.status(404).json({ error: "Encounter not found" });
      if (encounter.isResolved) return res.status(400).json({ error: "Already resolved" });

      const choices = JSON.parse(encounter.choices || "[]");
      const choiceMade = choices[choiceIndex] || choices[0] || "No choice";

      const outcomes = [
        "Your decision leads to a positive outcome. The situation resolves well.",
        "Things could have gone better, but you manage to move on without too much trouble.",
        "An unexpected twist! Your choice leads somewhere you didn't expect.",
        "Your kindness is rewarded. You gain respect from those around you.",
        "A close call, but you handle it with skill and composure.",
      ];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const repChange = Math.floor(Math.random() * 5) - 1;

      await db.update(chronicleTravelEncounters).set({
        choiceMade, outcome, isResolved: true, reputationChange: repChange,
      }).where(eq(chronicleTravelEncounters.id, req.params.id));

      await db.update(chronicleTravelSessions).set({
        encountersTriggered: sql`encounters_triggered + 1`,
        xpEarned: sql`xp_earned + ${encounter.xpReward}`,
      }).where(eq(chronicleTravelSessions.id, encounter.travelSessionId));

      res.json({
        choiceMade, outcome,
        xpEarned: encounter.xpReward,
        echoEarned: encounter.echoReward,
        reputationChange: repChange,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chronicles/travel/cancel", async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id || req.body.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const [session] = await db.select().from(chronicleTravelSessions).where(
        and(eq(chronicleTravelSessions.userId, userId), eq(chronicleTravelSessions.status, "in_progress"))
      );
      if (!session) return res.status(404).json({ error: "No active journey" });

      await db.update(chronicleTravelSessions).set({
        status: "cancelled", completedAt: new Date(),
      }).where(eq(chronicleTravelSessions.id, session.id));

      res.json({ message: "Journey cancelled. You remain at your departure city.", fromCity: session.fromCityCode });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel/history", async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id || req.query.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const sessions = await db.select().from(chronicleTravelSessions)
        .where(eq(chronicleTravelSessions.userId, userId as string))
        .orderBy(desc(chronicleTravelSessions.createdAt))
        .limit(50);
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/legacy/:userId", async (req: Request, res: Response) => {
    try {
      const [legacy] = await db.select().from(chronicleLegacyScores).where(eq(chronicleLegacyScores.userId, req.params.userId));
      if (!legacy) return res.json({ userId: req.params.userId, totalScore: 0, legacyTitle: "Newcomer", legacyRank: 1 });
      res.json(legacy);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/stamps", async (_req: Request, res: Response) => {
    try {
      const stamps = await db.select().from(chronicleAchievementStamps).orderBy(asc(chronicleAchievementStamps.sortOrder));
      res.json(stamps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/stamps/:userId", async (req: Request, res: Response) => {
    try {
      const playerStamps = await db.select().from(chroniclePlayerStamps)
        .where(eq(chroniclePlayerStamps.userId, req.params.userId));
      res.json(playerStamps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/reputation/:userId", async (req: Request, res: Response) => {
    try {
      const reps = await db.select().from(chronicleCityReputations)
        .where(eq(chronicleCityReputations.userId, req.params.userId));
      res.json(reps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel-quests", async (_req: Request, res: Response) => {
    try {
      const quests = await db.select().from(chronicleTravelQuests)
        .where(eq(chronicleTravelQuests.isActive, true))
        .orderBy(asc(chronicleTravelQuests.sortOrder));
      res.json(quests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/travel-quests/:code/steps", async (req: Request, res: Response) => {
    try {
      const steps = await db.select().from(chronicleTravelQuestSteps)
        .where(eq(chronicleTravelQuestSteps.questCode, req.params.code))
        .orderBy(asc(chronicleTravelQuestSteps.stepNumber));
      res.json(steps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/npcs/:cityCode", async (req: Request, res: Response) => {
    try {
      const { era } = req.query;
      let conditions: any[] = [eq(chronicleCityNpcs.cityCode, req.params.cityCode)];
      if (era) conditions.push(eq(chronicleCityNpcs.era, era as string));

      const npcs = await db.select().from(chronicleCityNpcs).where(and(...conditions));
      res.json(npcs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chronicles/world/npc-templates", async (_req: Request, res: Response) => {
    try {
      const templates = await db.select().from(chronicleNpcTemplates).orderBy(asc(chronicleNpcTemplates.sortOrder));
      res.json(templates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

function formatTravelTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d} day${d > 1 ? "s" : ""}${rh > 0 ? `, ${rh} hr` : ""}`;
  }
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

async function updateCityReputation(userId: string, cityCode: string, era: string) {
  const existing = await db.select().from(chronicleCityReputations).where(
    and(eq(chronicleCityReputations.userId, userId), eq(chronicleCityReputations.cityCode, cityCode), eq(chronicleCityReputations.era, era))
  );
  if (existing.length > 0) {
    await db.update(chronicleCityReputations).set({
      visitCount: sql`visit_count + 1`,
      reputation: sql`LEAST(reputation + 5, 1000)`,
      lastVisitAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(chronicleCityReputations.id, existing[0].id));
  } else {
    await db.insert(chronicleCityReputations).values({
      userId, cityCode, era, reputation: 10, rank: "visitor",
      visitCount: 1, firstVisitAt: new Date(), lastVisitAt: new Date(),
    });
  }
}

async function updateLegacyScore(userId: string, miles: number, encounters: number) {
  const existing = await db.select().from(chronicleLegacyScores).where(eq(chronicleLegacyScores.userId, userId));
  if (existing.length > 0) {
    const newScore = existing[0].totalScore + Math.round(miles * 0.1) + encounters * 10;
    const newTitle = getLegacyTitle(newScore);
    await db.update(chronicleLegacyScores).set({
      totalScore: newScore,
      travelMilesLogged: sql`travel_miles_logged + ${miles}`,
      encountersResolved: sql`encounters_resolved + ${encounters}`,
      citiesVisited: sql`cities_visited + 1`,
      legacyTitle: newTitle,
      legacyRank: getLegacyRank(newScore),
      updatedAt: new Date(),
    }).where(eq(chronicleLegacyScores.id, existing[0].id));
  } else {
    await db.insert(chronicleLegacyScores).values({
      userId, totalScore: Math.round(miles * 0.1) + encounters * 10,
      citiesVisited: 1, travelMilesLogged: miles, encountersResolved: encounters,
      legacyTitle: "Newcomer", legacyRank: 1,
    });
  }
}

function getLegacyTitle(score: number): string {
  if (score >= 10000) return "Living Legend";
  if (score >= 5000) return "Era Shaper";
  if (score >= 2500) return "Legacy Builder";
  if (score >= 1000) return "Seasoned Traveler";
  if (score >= 500) return "Wanderer";
  if (score >= 100) return "Explorer";
  return "Newcomer";
}

function getLegacyRank(score: number): number {
  if (score >= 10000) return 7;
  if (score >= 5000) return 6;
  if (score >= 2500) return 5;
  if (score >= 1000) return 4;
  if (score >= 500) return 3;
  if (score >= 100) return 2;
  return 1;
}

async function checkAchievements(userId: string, era: string, cityCode: string, miles: number) {
  const existingStamps = await db.select().from(chroniclePlayerStamps).where(eq(chroniclePlayerStamps.userId, userId));
  const earnedCodes = new Set(existingStamps.map(s => s.stampCode));

  const stampsToAward: { code: string; cityCode?: string }[] = [];

  if (!earnedCodes.has("first_journey")) {
    stampsToAward.push({ code: "first_journey" });
  }

  if (cityCode === "anderson" && !earnedCodes.has("the_electric_city")) {
    stampsToAward.push({ code: "the_electric_city", cityCode: "anderson" });
  }

  if (cityCode === "st_augustine" && !earnedCodes.has("oldest_city")) {
    stampsToAward.push({ code: "oldest_city", cityCode: "st_augustine" });
  }

  if (cityCode === "charleston" && !earnedCodes.has("fort_sumter")) {
    stampsToAward.push({ code: "fort_sumter", cityCode: "charleston" });
  }

  if (miles >= 500 && !earnedCodes.has("real_time_traveler")) {
    stampsToAward.push({ code: "real_time_traveler" });
  }

  const reps = await db.select().from(chronicleCityReputations).where(
    and(eq(chronicleCityReputations.userId, userId), eq(chronicleCityReputations.era, era))
  );
  if (reps.length >= 5 && !earnedCodes.has("city_discoverer")) {
    stampsToAward.push({ code: "city_discoverer" });
  }

  for (const stamp of stampsToAward) {
    await db.insert(chroniclePlayerStamps).values({
      userId, stampCode: stamp.code, era, cityCode: stamp.cityCode,
    });
  }
}
