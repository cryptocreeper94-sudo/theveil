import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  chronicleNpcs,
  chronicleNpcInteractions,
  chronicleRelationships,
  type ChronicleNpc,
  type ChronicleRelationship,
} from "@shared/schema";

interface NpcPersonality {
  traits: string[];
  interests: string[];
  speechStyle: string;
  greetings: string[];
  topics: string[];
}

const MODERN_ERA_NPCS: Array<{
  name: string;
  title: string;
  era: string;
  location: string;
  personality: NpcPersonality;
  backstory: string;
  disposition: number;
}> = [
  {
    name: "Maya Chen",
    title: "Barista",
    era: "modern",
    location: "cafe",
    personality: {
      traits: ["friendly", "curious", "creative"],
      interests: ["art", "coffee", "travel"],
      speechStyle: "warm and casual",
      greetings: ["Hey there!", "Welcome back!", "The usual?"],
      topics: ["coffee origins", "local events", "creative projects"],
    },
    backstory: "A former art student who found her calling in crafting the perfect espresso. She dreams of opening her own gallery-cafe someday.",
    disposition: 65,
  },
  {
    name: "Marcus Torres",
    title: "Personal Trainer",
    era: "modern",
    location: "gym",
    personality: {
      traits: ["motivating", "disciplined", "supportive"],
      interests: ["fitness", "nutrition", "sports"],
      speechStyle: "energetic and encouraging",
      greetings: ["Ready to push your limits?", "Great to see you!", "Let's get after it!"],
      topics: ["workout routines", "healthy eating", "mindset"],
    },
    backstory: "Former college athlete who discovered his passion for helping others achieve their fitness goals after a career-ending injury.",
    disposition: 70,
  },
  {
    name: "Dr. Sarah Mitchell",
    title: "Librarian",
    era: "modern",
    location: "library",
    personality: {
      traits: ["intellectual", "patient", "helpful"],
      interests: ["literature", "history", "puzzles"],
      speechStyle: "thoughtful and articulate",
      greetings: ["Looking for something specific?", "Always a pleasure.", "The knowledge awaits."],
      topics: ["book recommendations", "research help", "local history"],
    },
    backstory: "A PhD in literature who chose the library over academia, believing in making knowledge accessible to everyone.",
    disposition: 55,
  },
  {
    name: "Jake Williams",
    title: "Park Ranger",
    era: "modern",
    location: "park",
    personality: {
      traits: ["outdoorsy", "knowledgeable", "calm"],
      interests: ["nature", "wildlife", "conservation"],
      speechStyle: "relaxed and informative",
      greetings: ["Beautiful day, isn't it?", "Nature calls!", "Good to see you out here."],
      topics: ["local wildlife", "hiking trails", "environmental tips"],
    },
    backstory: "Grew up in the city but fell in love with nature during a camping trip. Now dedicated to preserving urban green spaces.",
    disposition: 60,
  },
  {
    name: "Linda Park",
    title: "Restaurant Owner",
    era: "modern",
    location: "restaurant",
    personality: {
      traits: ["hospitable", "business-minded", "warm"],
      interests: ["cooking", "family", "community"],
      speechStyle: "welcoming and maternal",
      greetings: ["Have you eaten?", "Your table is ready!", "Let me take care of you."],
      topics: ["daily specials", "family recipes", "neighborhood gossip"],
    },
    backstory: "Third-generation restaurant owner who inherited her grandmother's recipes and her father's work ethic.",
    disposition: 75,
  },
  {
    name: "Alex Rivera",
    title: "Coworker",
    era: "modern",
    location: "office",
    personality: {
      traits: ["ambitious", "collaborative", "witty"],
      interests: ["technology", "career growth", "gaming"],
      speechStyle: "professional yet friendly",
      greetings: ["Coffee run?", "Did you see that email?", "How's your project going?"],
      topics: ["work projects", "office dynamics", "career advice"],
    },
    backstory: "Started as an intern and worked their way up. Known for both hard work and organizing the best team outings.",
    disposition: 60,
  },
  {
    name: "Emma Watson",
    title: "Shop Assistant",
    era: "modern",
    location: "mall",
    personality: {
      traits: ["fashionable", "friendly", "observant"],
      interests: ["fashion", "trends", "social media"],
      speechStyle: "enthusiastic and trendy",
      greetings: ["I love that look!", "Find anything good?", "Just in today!"],
      topics: ["style advice", "sales", "local fashion scene"],
    },
    backstory: "A fashion design student working part-time who has an eye for putting together the perfect outfit.",
    disposition: 65,
  },
  {
    name: "Sam Peterson",
    title: "Neighbor",
    era: "modern",
    location: "home",
    personality: {
      traits: ["neighborly", "helpful", "chatty"],
      interests: ["gardening", "local news", "cooking"],
      speechStyle: "friendly and casual",
      greetings: ["Hey neighbor!", "Nice day!", "Got a minute?"],
      topics: ["neighborhood events", "home tips", "local gossip"],
    },
    backstory: "Retired teacher who knows everyone on the block and always has fresh cookies ready for visitors.",
    disposition: 70,
  },
];

class NpcService {
  async seedModernNpcs() {
    const existingNpcs = await db.select().from(chronicleNpcs).where(eq(chronicleNpcs.era, "modern"));
    
    if (existingNpcs.length > 0) {
      return { seeded: false, count: existingNpcs.length, message: "NPCs already exist" };
    }
    
    const seededNpcs = [];
    for (const npcData of MODERN_ERA_NPCS) {
      const [npc] = await db.insert(chronicleNpcs).values({
        name: npcData.name,
        title: npcData.title,
        era: npcData.era,
        personality: JSON.stringify(npcData.personality),
        backstory: npcData.backstory,
        location: npcData.location,
        disposition: npcData.disposition,
        currentMood: "neutral",
        isAlive: true,
      }).returning();
      seededNpcs.push(npc);
    }
    
    return { seeded: true, count: seededNpcs.length, npcs: seededNpcs };
  }
  
  async getNpcsByLocation(location: string, era: string = "modern"): Promise<ChronicleNpc[]> {
    return db.select().from(chronicleNpcs)
      .where(and(
        eq(chronicleNpcs.location, location),
        eq(chronicleNpcs.era, era),
        eq(chronicleNpcs.isAlive, true)
      ));
  }
  
  async getNpc(npcId: string): Promise<ChronicleNpc | null> {
    const [npc] = await db.select().from(chronicleNpcs).where(eq(chronicleNpcs.id, npcId)).limit(1);
    return npc || null;
  }
  
  async getRelationship(characterId: string, npcId: string): Promise<ChronicleRelationship | null> {
    const [rel] = await db.select().from(chronicleRelationships)
      .where(and(
        eq(chronicleRelationships.characterId, characterId),
        eq(chronicleRelationships.npcId, npcId)
      ))
      .limit(1);
    return rel || null;
  }
  
  async getCharacterRelationships(characterId: string) {
    const relationships = await db.select().from(chronicleRelationships)
      .where(eq(chronicleRelationships.characterId, characterId));
    
    const enriched = [];
    for (const rel of relationships) {
      const npc = await this.getNpc(rel.npcId);
      if (npc) {
        enriched.push({
          ...rel,
          npc: {
            id: npc.id,
            name: npc.name,
            title: npc.title,
            location: npc.location,
          },
        });
      }
    }
    return enriched;
  }
  
  async interact(characterId: string, npcId: string, interactionType: string = "dialogue") {
    const npc = await this.getNpc(npcId);
    if (!npc) {
      return { success: false, error: "NPC not found" };
    }
    
    let relationship = await this.getRelationship(characterId, npcId);
    
    if (!relationship) {
      const [newRel] = await db.insert(chronicleRelationships).values({
        characterId,
        npcId,
        relationshipType: "acquaintance",
        affection: 0,
        trust: 0,
        timesInteracted: 0,
        lastInteraction: new Date(),
      }).returning();
      relationship = newRel;
    }
    
    const personality: NpcPersonality = JSON.parse(npc.personality || "{}");
    const randomGreeting = personality.greetings?.[Math.floor(Math.random() * personality.greetings.length)] || "Hello!";
    const randomTopic = personality.topics?.[Math.floor(Math.random() * personality.topics.length)] || "the weather";
    
    let dispositionChange = 0;
    let affinityChange = 0;
    let outcome: "positive" | "negative" | "neutral" = "neutral";
    
    if (interactionType === "dialogue") {
      dispositionChange = Math.floor(Math.random() * 3) + 1;
      affinityChange = Math.floor(Math.random() * 5) + 1;
      outcome = "positive";
    } else if (interactionType === "gift") {
      dispositionChange = Math.floor(Math.random() * 5) + 3;
      affinityChange = Math.floor(Math.random() * 10) + 5;
      outcome = "positive";
    }
    
    await db.insert(chronicleNpcInteractions).values({
      characterId,
      npcId,
      interactionType,
      outcome,
      dispositionChange,
      dialogueSummary: `${npc.name} says: "${randomGreeting}" They seem interested in discussing ${randomTopic}.`,
    });
    
    const newAffection = Math.min(100, Math.max(-100, (relationship.affection || 0) + affinityChange));
    const newInteractionCount = (relationship.timesInteracted || 0) + 1;
    
    let newRelType = relationship.relationshipType;
    if (newAffection >= 50 && relationship.relationshipType === "acquaintance") {
      newRelType = "friend";
    } else if (newAffection >= 80 && relationship.relationshipType === "friend") {
      newRelType = "close_friend";
    }
    
    await db.update(chronicleRelationships)
      .set({
        affection: newAffection,
        timesInteracted: newInteractionCount,
        relationshipType: newRelType,
        lastInteraction: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(chronicleRelationships.characterId, characterId),
        eq(chronicleRelationships.npcId, npcId)
      ));
    
    await db.update(chronicleNpcs)
      .set({
        disposition: Math.min(100, Math.max(0, npc.disposition + dispositionChange)),
        updatedAt: new Date(),
      })
      .where(eq(chronicleNpcs.id, npcId));
    
    return {
      success: true,
      npc: {
        id: npc.id,
        name: npc.name,
        title: npc.title,
        greeting: randomGreeting,
        topic: randomTopic,
        personality: personality.traits,
      },
      interaction: {
        type: interactionType,
        outcome,
        affectionChange: affinityChange,
      },
      relationship: {
        type: newRelType,
        affection: newAffection,
        timesInteracted: newInteractionCount,
        upgraded: newRelType !== relationship.relationshipType,
      },
    };
  }
}

export const npcService = new NpcService();
