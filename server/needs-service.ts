import { db } from "./db";
import { chronicleCharacters, chronicleCheckIns, chronicleActivities, chronicleLocations } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { shellsService } from "./shells-service";

const NEEDS_DECAY_RATE = {
  energy: -2,     // Lose 2 energy per hour
  mood: -1,       // Lose 1 mood per hour  
  health: 0,      // Health only changes from activities
  social: -1,     // Lose 1 social per hour
  hunger: 3,      // Gain 3 hunger per hour (0=full, 100=starving)
};

const STREAK_BONUSES = [
  { days: 1, multiplier: 1.0 },
  { days: 3, multiplier: 1.25 },
  { days: 7, multiplier: 1.5 },
  { days: 14, multiplier: 1.75 },
  { days: 30, multiplier: 2.0 },
  { days: 60, multiplier: 2.5 },
  { days: 100, multiplier: 3.0 },
];

class NeedsService {
  async getCharacter(userId: string) {
    const [character] = await db.select().from(chronicleCharacters)
      .where(eq(chronicleCharacters.userId, userId))
      .limit(1);
    return character;
  }

  async createCharacter(userId: string, name: string, traits?: {
    primaryTrait?: string;
    secondaryTrait?: string;
    era?: string;
  }) {
    const attributeBoosts = this.getAttributeBoostsFromTraits(traits?.primaryTrait, traits?.secondaryTrait);
    
    const [character] = await db.insert(chronicleCharacters)
      .values({
        userId,
        name,
        era: traits?.era || "modern",
        wisdom: 10 + (attributeBoosts.wisdom || 0),
        courage: 10 + (attributeBoosts.courage || 0),
        compassion: 10 + (attributeBoosts.compassion || 0),
        cunning: 10 + (attributeBoosts.cunning || 0),
        influence: 10 + (attributeBoosts.influence || 0),
      })
      .returning();
    
    console.log(`[Needs] Created character ${name} for user ${userId}`);
    return character;
  }

  private getAttributeBoostsFromTraits(primary?: string, secondary?: string) {
    const boosts: Record<string, number> = {};
    
    const traitMap: Record<string, string> = {
      leader: "influence",
      builder: "wisdom",
      explorer: "courage",
      diplomat: "compassion",
      scholar: "wisdom",
      protector: "courage",
    };
    
    if (primary && traitMap[primary]) {
      boosts[traitMap[primary]] = 5;
    }
    if (secondary && traitMap[secondary]) {
      boosts[traitMap[secondary]] = (boosts[traitMap[secondary]] || 0) + 3;
    }
    
    return boosts;
  }

  async updateNeeds(characterId: string) {
    const [character] = await db.select().from(chronicleCharacters)
      .where(eq(chronicleCharacters.id, characterId))
      .limit(1);
    
    if (!character) return null;
    
    const lastUpdate = character.lastNeedsUpdate || character.createdAt;
    const now = new Date();
    const hoursPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
    
    if (hoursPassed < 1) return character;
    
    const newEnergy = Math.max(0, Math.min(100, character.energy + (NEEDS_DECAY_RATE.energy * hoursPassed)));
    const newMood = Math.max(0, Math.min(100, character.mood + (NEEDS_DECAY_RATE.mood * hoursPassed)));
    const newSocial = Math.max(0, Math.min(100, character.social + (NEEDS_DECAY_RATE.social * hoursPassed)));
    const newHunger = Math.max(0, Math.min(100, character.hunger + (NEEDS_DECAY_RATE.hunger * hoursPassed)));
    
    const [updated] = await db.update(chronicleCharacters)
      .set({
        energy: newEnergy,
        mood: newMood,
        social: newSocial,
        hunger: newHunger,
        lastNeedsUpdate: now,
        updatedAt: now,
      })
      .where(eq(chronicleCharacters.id, characterId))
      .returning();
    
    return updated;
  }

  async performActivity(characterId: string, activityCode: string, userId: string) {
    const [activity] = await db.select().from(chronicleActivities)
      .where(eq(chronicleActivities.code, activityCode))
      .limit(1);
    
    if (!activity) {
      return { success: false, error: "Activity not found" };
    }
    
    const character = await this.updateNeeds(characterId);
    if (!character) {
      return { success: false, error: "Character not found" };
    }
    
    if (activity.minEnergy && character.energy < activity.minEnergy) {
      return { success: false, error: "Not enough energy" };
    }
    if (activity.minMood && character.mood < activity.minMood) {
      return { success: false, error: "Mood too low" };
    }
    
    const newEnergy = Math.max(0, Math.min(100, character.energy + (activity.energyChange || 0)));
    const newMood = Math.max(0, Math.min(100, character.mood + (activity.moodChange || 0)));
    const newHealth = Math.max(0, Math.min(100, character.health + (activity.healthChange || 0)));
    const newSocial = Math.max(0, Math.min(100, character.social + (activity.socialChange || 0)));
    const newHunger = Math.max(0, Math.min(100, character.hunger + (activity.hungerChange || 0)));
    
    const [updated] = await db.update(chronicleCharacters)
      .set({
        energy: newEnergy,
        mood: newMood,
        health: newHealth,
        social: newSocial,
        hunger: newHunger,
        currentActivity: activityCode,
        experience: character.experience + (activity.xpReward || 0),
        updatedAt: new Date(),
      })
      .where(eq(chronicleCharacters.id, characterId))
      .returning();
    
    if (activity.shellReward && activity.shellReward > 0) {
      await shellsService.addShells(userId, character.name, activity.shellReward, "earn", `Completed ${activity.name}`);
    }
    
    return {
      success: true,
      character: updated,
      activity,
      changes: {
        energy: activity.energyChange || 0,
        mood: activity.moodChange || 0,
        health: activity.healthChange || 0,
        social: activity.socialChange || 0,
        hunger: activity.hungerChange || 0,
        shells: activity.shellReward || 0,
        xp: activity.xpReward || 0,
      },
    };
  }

  async dailyCheckIn(characterId: string, userId: string) {
    const character = await this.updateNeeds(characterId);
    if (!character) {
      return { success: false, error: "Character not found" };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existingCheckIn] = await db.select().from(chronicleCheckIns)
      .where(and(
        eq(chronicleCheckIns.characterId, characterId),
        sql`DATE(${chronicleCheckIns.createdAt}) = DATE(${today})`
      ))
      .limit(1);
    
    if (existingCheckIn) {
      return { success: false, error: "Already checked in today", alreadyCheckedIn: true };
    }
    
    let newStreak = 1;
    if (character.lastCheckIn) {
      const lastCheckIn = new Date(character.lastCheckIn);
      lastCheckIn.setHours(0, 0, 0, 0);
      const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastCheckIn === 1) {
        newStreak = character.checkInStreak + 1;
      } else if (daysSinceLastCheckIn > 1) {
        newStreak = 1;
      } else {
        newStreak = character.checkInStreak;
      }
    }
    
    const streakBonus = STREAK_BONUSES.reduce((best, tier) => 
      newStreak >= tier.days ? tier : best, STREAK_BONUSES[0]);
    
    const baseShells = 20;
    const shellsEarned = Math.floor(baseShells * streakBonus.multiplier);
    const xpEarned = Math.floor(15 * streakBonus.multiplier);
    
    const energyBoost = Math.min(20, 100 - character.energy);
    const moodBoost = Math.min(15, 100 - character.mood);
    
    await db.insert(chronicleCheckIns).values({
      characterId,
      userId,
      checkInType: "daily",
      moodBefore: character.mood,
      moodAfter: character.mood + moodBoost,
      energyBefore: character.energy,
      energyAfter: character.energy + energyBoost,
      shellsEarned,
      xpEarned,
      streakDay: newStreak,
      bonusMultiplier: streakBonus.multiplier,
    });
    
    const [updated] = await db.update(chronicleCharacters)
      .set({
        energy: character.energy + energyBoost,
        mood: character.mood + moodBoost,
        lastCheckIn: new Date(),
        checkInStreak: newStreak,
        totalCheckIns: character.totalCheckIns + 1,
        experience: character.experience + xpEarned,
        updatedAt: new Date(),
      })
      .where(eq(chronicleCharacters.id, characterId))
      .returning();
    
    await shellsService.addShells(userId, character.name, shellsEarned, "bonus", `Day ${newStreak} check-in bonus`);
    
    return {
      success: true,
      character: updated,
      streak: newStreak,
      multiplier: streakBonus.multiplier,
      rewards: {
        shells: shellsEarned,
        xp: xpEarned,
        energyBoost,
        moodBoost,
      },
    };
  }

  async getActivities(era: string = "modern") {
    return db.select().from(chronicleActivities)
      .where(and(
        eq(chronicleActivities.isActive, true),
        sql`${chronicleActivities.era} IN ('all', ${era})`
      ));
  }

  async getLocations(era: string = "modern") {
    return db.select().from(chronicleLocations)
      .where(and(
        eq(chronicleLocations.isActive, true),
        eq(chronicleLocations.era, era)
      ));
  }

  async travelTo(characterId: string, locationCode: string) {
    const [location] = await db.select().from(chronicleLocations)
      .where(eq(chronicleLocations.code, locationCode))
      .limit(1);
    
    if (!location) {
      return { success: false, error: "Location not found" };
    }
    
    const [updated] = await db.update(chronicleCharacters)
      .set({
        currentLocation: locationCode,
        currentActivity: null,
        updatedAt: new Date(),
      })
      .where(eq(chronicleCharacters.id, characterId))
      .returning();
    
    return {
      success: true,
      character: updated,
      location,
    };
  }

  async getCharacterStatus(userId: string) {
    let character = await this.getCharacter(userId);
    if (!character) {
      return null;
    }
    
    character = await this.updateNeeds(character.id) || character;
    
    const [currentLocation] = await db.select().from(chronicleLocations)
      .where(eq(chronicleLocations.code, character.currentLocation || "home"))
      .limit(1);
    
    const needsWarnings = [];
    if (character.energy < 20) needsWarnings.push("Low energy - consider resting");
    if (character.mood < 20) needsWarnings.push("Low mood - do something fun");
    if (character.hunger > 80) needsWarnings.push("Very hungry - eat something");
    if (character.social < 20) needsWarnings.push("Feeling lonely - socialize");
    
    return {
      character,
      location: currentLocation,
      needsWarnings,
      overallWellbeing: Math.floor((character.energy + character.mood + character.health + (100 - character.hunger) + character.social) / 5),
    };
  }
}

export const needsService = new NeedsService();
