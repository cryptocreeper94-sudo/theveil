import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  chronicleInteriors,
  chronicleRooms,
  chronicleObjectCatalogs,
  chronicleRoomObjects,
  chronicleActivitySessions,
  ChronicleInterior,
  ChronicleRoom,
  ChronicleObjectCatalog,
  ChronicleRoomObject,
  ChronicleActivitySession,
} from "@shared/schema";
import { shellsService } from "./shells-service";
import { questsService } from "./quests-service";

const ERA_OBJECT_CATALOGS = [
  // Stone Age
  { code: "stone_firepit", name: "Fire Pit", description: "A crackling fire for warmth and cooking", era: "stone_age", category: "utility", iconEmoji: "🔥", colorClass: "bg-orange-600", interactionVerbs: '["tend", "cook"]', activityCategory: "food", comfortBonus: 10, shellsPerUse: 2, useCooldownMinutes: 30 },
  { code: "stone_pelts", name: "Animal Pelts", description: "Warm furs for resting", era: "stone_age", category: "furniture", iconEmoji: "🦣", colorClass: "bg-amber-700", interactionVerbs: '["rest", "sleep"]', activityCategory: "comfort", comfortBonus: 20, shellsPerUse: 1, useCooldownMinutes: 60 },
  { code: "stone_cave_painting", name: "Cave Painting", description: "Express yourself through ancient art", era: "stone_age", category: "decoration", iconEmoji: "🎨", colorClass: "bg-red-800", interactionVerbs: '["paint", "admire"]', activityCategory: "creation", productivityBonus: 5, shellsPerUse: 3, useCooldownMinutes: 120 },
  { code: "stone_grinding", name: "Grinding Stone", description: "Grind grains and herbs", era: "stone_age", category: "utility", iconEmoji: "🪨", colorClass: "bg-stone-600", interactionVerbs: '["grind", "prepare"]', activityCategory: "food", productivityBonus: 5, shellsPerUse: 2, useCooldownMinutes: 45 },
  
  // Medieval
  { code: "medieval_hearth", name: "Stone Hearth", description: "A grand fireplace for cooking and warmth", era: "medieval", category: "utility", iconEmoji: "🏠", colorClass: "bg-amber-800", interactionVerbs: '["tend", "cook", "warm"]', activityCategory: "food", comfortBonus: 15, shellsPerUse: 3, useCooldownMinutes: 30 },
  { code: "medieval_tapestry", name: "Woven Tapestry", description: "A beautiful wall hanging depicting heroic scenes", era: "medieval", category: "decoration", iconEmoji: "🧵", colorClass: "bg-purple-700", interactionVerbs: '["admire", "study"]', activityCategory: "intellect", entertainmentBonus: 10, shellsPerUse: 1, useCooldownMinutes: 60 },
  { code: "medieval_table", name: "Oak Table", description: "A sturdy table for dining and work", era: "medieval", category: "furniture", iconEmoji: "🪑", colorClass: "bg-amber-600", interactionVerbs: '["sit", "eat", "work"]', activityCategory: "comfort", comfortBonus: 5, shellsPerUse: 1, useCooldownMinutes: 30 },
  { code: "medieval_loom", name: "Weaving Loom", description: "Create beautiful fabrics and clothing", era: "medieval", category: "utility", iconEmoji: "🧶", colorClass: "bg-rose-600", interactionVerbs: '["weave", "create"]', activityCategory: "creation", productivityBonus: 15, shellsPerUse: 5, useCooldownMinutes: 90 },
  { code: "medieval_scroll_shelf", name: "Scroll Shelf", description: "Store and read ancient scrolls", era: "medieval", category: "furniture", iconEmoji: "📜", colorClass: "bg-yellow-700", interactionVerbs: '["read", "study"]', activityCategory: "intellect", productivityBonus: 10, shellsPerUse: 2, useCooldownMinutes: 45 },
  { code: "medieval_bed", name: "Straw Bed", description: "A simple but warm place to rest", era: "medieval", category: "furniture", iconEmoji: "🛏️", colorClass: "bg-yellow-600", interactionVerbs: '["sleep", "rest", "nap"]', activityCategory: "comfort", comfortBonus: 25, shellsPerUse: 2, useCooldownMinutes: 120 },
  
  // Renaissance
  { code: "renaissance_desk", name: "Writing Desk", description: "An elegant desk for letters and art", era: "renaissance", category: "furniture", iconEmoji: "✒️", colorClass: "bg-amber-700", interactionVerbs: '["write", "draw", "study"]', activityCategory: "intellect", productivityBonus: 20, shellsPerUse: 4, useCooldownMinutes: 60 },
  { code: "renaissance_harpsichord", name: "Harpsichord", description: "A magnificent keyboard instrument", era: "renaissance", category: "recreation", iconEmoji: "🎹", colorClass: "bg-yellow-800", interactionVerbs: '["play", "practice", "perform"]', activityCategory: "creation", entertainmentBonus: 25, shellsPerUse: 5, useCooldownMinutes: 45 },
  { code: "renaissance_painting", name: "Oil Painting", description: "A masterwork of classical art", era: "renaissance", category: "decoration", iconEmoji: "🖼️", colorClass: "bg-amber-600", interactionVerbs: '["admire", "study"]', activityCategory: "intellect", entertainmentBonus: 15, shellsPerUse: 1, useCooldownMinutes: 60 },
  { code: "renaissance_canopy_bed", name: "Canopy Bed", description: "A luxurious draped sleeping quarters", era: "renaissance", category: "furniture", iconEmoji: "🛌", colorClass: "bg-red-800", interactionVerbs: '["sleep", "rest", "dream"]', activityCategory: "comfort", comfortBonus: 30, shellsPerUse: 3, useCooldownMinutes: 120 },
  
  // Victorian
  { code: "victorian_phonograph", name: "Phonograph", description: "Listen to the latest musical recordings", era: "victorian", category: "recreation", iconEmoji: "📻", colorClass: "bg-amber-800", interactionVerbs: '["play", "listen", "wind"]', activityCategory: "comfort", entertainmentBonus: 20, shellsPerUse: 3, useCooldownMinutes: 30 },
  { code: "victorian_library", name: "Library Shelf", description: "Rows of leather-bound books", era: "victorian", category: "furniture", iconEmoji: "📚", colorClass: "bg-amber-900", interactionVerbs: '["read", "browse", "study"]', activityCategory: "intellect", productivityBonus: 20, shellsPerUse: 4, useCooldownMinutes: 45 },
  { code: "victorian_tea_set", name: "Tea Service", description: "An elegant porcelain tea set", era: "victorian", category: "utility", iconEmoji: "🫖", colorClass: "bg-blue-300", interactionVerbs: '["brew", "serve", "sip"]', activityCategory: "social", comfortBonus: 15, shellsPerUse: 2, useCooldownMinutes: 30 },
  { code: "victorian_gaslamp", name: "Gas Lamp", description: "Soft flickering illumination", era: "victorian", category: "decoration", iconEmoji: "💡", colorClass: "bg-yellow-500", interactionVerbs: '["light", "dim"]', activityCategory: "comfort", comfortBonus: 5, shellsPerUse: 1, useCooldownMinutes: 60 },
  
  // Present Day
  { code: "present_tv", name: "Flat Screen TV", description: "Watch shows, movies, and news", era: "present", category: "recreation", iconEmoji: "📺", colorClass: "bg-slate-700", interactionVerbs: '["watch", "channel_surf", "stream"]', activityCategory: "comfort", entertainmentBonus: 25, shellsPerUse: 3, useCooldownMinutes: 30 },
  { code: "present_computer", name: "Computer Desk", description: "Work, browse, and connect online", era: "present", category: "furniture", iconEmoji: "💻", colorClass: "bg-blue-600", interactionVerbs: '["work", "browse", "code", "game"]', activityCategory: "intellect", productivityBonus: 25, shellsPerUse: 5, useCooldownMinutes: 45 },
  { code: "present_sofa", name: "Modern Sofa", description: "A comfortable place to relax", era: "present", category: "furniture", iconEmoji: "🛋️", colorClass: "bg-gray-600", interactionVerbs: '["sit", "relax", "nap"]', activityCategory: "comfort", comfortBonus: 20, shellsPerUse: 2, useCooldownMinutes: 30 },
  { code: "present_bookshelf", name: "Bookshelf", description: "Display and read your book collection", era: "present", category: "furniture", iconEmoji: "📖", colorClass: "bg-amber-700", interactionVerbs: '["read", "organize", "browse"]', activityCategory: "intellect", productivityBonus: 15, shellsPerUse: 3, useCooldownMinutes: 45 },
  { code: "present_kitchen", name: "Modern Kitchen", description: "A fully equipped kitchen for cooking", era: "present", category: "utility", iconEmoji: "🍳", colorClass: "bg-slate-500", gridWidth: 2, interactionVerbs: '["cook", "bake", "prepare"]', activityCategory: "food", productivityBonus: 10, shellsPerUse: 4, useCooldownMinutes: 60 },
  { code: "present_bed", name: "King Bed", description: "A luxurious modern bed", era: "present", category: "furniture", iconEmoji: "🛏️", colorClass: "bg-indigo-600", gridWidth: 2, interactionVerbs: '["sleep", "rest", "dream"]', activityCategory: "comfort", comfortBonus: 30, shellsPerUse: 3, useCooldownMinutes: 120 },
  
  // Cyberpunk / Near Future
  { code: "cyberpunk_holodisplay", name: "Holo-Display", description: "A floating holographic entertainment system", era: "cyberpunk", category: "recreation", iconEmoji: "📡", colorClass: "bg-cyan-500", interactionVerbs: '["watch", "interact", "browse"]', activityCategory: "comfort", entertainmentBonus: 35, shellsPerUse: 5, useCooldownMinutes: 30 },
  { code: "cyberpunk_neural_chair", name: "Neural Interface Chair", description: "Connect directly to the net", era: "cyberpunk", category: "furniture", iconEmoji: "🧠", colorClass: "bg-purple-500", interactionVerbs: '["connect", "dive", "jack_in"]', activityCategory: "intellect", productivityBonus: 40, shellsPerUse: 8, useCooldownMinutes: 60 },
  { code: "cyberpunk_synthesizer", name: "Food Synthesizer", description: "Create any meal from base matter", era: "cyberpunk", category: "utility", iconEmoji: "🧪", colorClass: "bg-green-500", interactionVerbs: '["synthesize", "print", "customize"]', activityCategory: "food", comfortBonus: 10, shellsPerUse: 3, useCooldownMinutes: 15 },
  { code: "cyberpunk_pod", name: "Sleep Pod", description: "Optimized rest with dream enhancement", era: "cyberpunk", category: "furniture", iconEmoji: "💊", colorClass: "bg-blue-500", interactionVerbs: '["sleep", "dream", "recover"]', activityCategory: "comfort", comfortBonus: 40, shellsPerUse: 5, useCooldownMinutes: 90 },
  { code: "cyberpunk_neon", name: "Neon Art Installation", description: "Customizable neon lighting display", era: "cyberpunk", category: "decoration", iconEmoji: "🌈", colorClass: "bg-pink-500", interactionVerbs: '["customize", "admire"]', activityCategory: "comfort", entertainmentBonus: 15, shellsPerUse: 2, useCooldownMinutes: 60 },
  
  // Spacefaring / Far Future
  { code: "space_viewscreen", name: "Stellar Viewscreen", description: "Window to the cosmos", era: "spacefaring", category: "decoration", iconEmoji: "🌌", colorClass: "bg-indigo-700", interactionVerbs: '["gaze", "scan", "navigate"]', activityCategory: "intellect", entertainmentBonus: 30, shellsPerUse: 4, useCooldownMinutes: 30 },
  { code: "space_replicator", name: "Matter Replicator", description: "Create anything from pure energy", era: "spacefaring", category: "utility", iconEmoji: "⚡", colorClass: "bg-yellow-400", interactionVerbs: '["replicate", "create", "recycle"]', activityCategory: "creation", productivityBonus: 50, shellsPerUse: 10, useCooldownMinutes: 60 },
  { code: "space_meditation", name: "Zero-G Meditation Chamber", description: "Float in peaceful contemplation", era: "spacefaring", category: "furniture", iconEmoji: "🧘", colorClass: "bg-purple-400", interactionVerbs: '["meditate", "float", "reflect"]', activityCategory: "comfort", comfortBonus: 50, shellsPerUse: 6, useCooldownMinutes: 90 },
  { code: "space_cryo_bed", name: "Cryo-Sleep Bay", description: "Rest for centuries in suspended animation", era: "spacefaring", category: "furniture", iconEmoji: "❄️", colorClass: "bg-cyan-400", interactionVerbs: '["hibernate", "suspend", "dream"]', activityCategory: "comfort", comfortBonus: 60, shellsPerUse: 8, useCooldownMinutes: 180 },
  
  // Post-Singularity / Mythic
  { code: "singularity_thought_sphere", name: "Thought Projection Sphere", description: "Manifest your thoughts into reality", era: "post_singularity", category: "utility", iconEmoji: "🔮", colorClass: "bg-violet-500", interactionVerbs: '["project", "create", "manifest"]', activityCategory: "creation", productivityBonus: 100, shellsPerUse: 20, useCooldownMinutes: 120 },
  { code: "singularity_reality_mod", name: "Reality Modulator", description: "Adjust the fabric of local spacetime", era: "post_singularity", category: "decoration", iconEmoji: "🌀", colorClass: "bg-fuchsia-500", interactionVerbs: '["modulate", "reshape", "bend"]', activityCategory: "creation", entertainmentBonus: 50, shellsPerUse: 15, useCooldownMinutes: 90 },
  { code: "singularity_consciousness", name: "Collective Consciousness Node", description: "Connect to all beings across dimensions", era: "post_singularity", category: "furniture", iconEmoji: "🌐", colorClass: "bg-blue-400", interactionVerbs: '["connect", "share", "experience"]', activityCategory: "social", comfortBonus: 75, shellsPerUse: 25, useCooldownMinutes: 180 },
];

export const interiorsService = {
  async seedObjectCatalogs(): Promise<void> {
    const existing = await db.select().from(chronicleObjectCatalogs).limit(1);
    if (existing.length > 0) {
      console.log("[Interiors] Object catalogs already seeded");
      return;
    }
    
    for (const item of ERA_OBJECT_CATALOGS) {
      await db.insert(chronicleObjectCatalogs).values({
        code: item.code,
        name: item.name,
        description: item.description,
        era: item.era,
        category: item.category,
        iconEmoji: item.iconEmoji,
        colorClass: item.colorClass,
        gridWidth: item.gridWidth || 1,
        interactionVerbs: item.interactionVerbs,
        activityCategory: item.activityCategory,
        comfortBonus: item.comfortBonus || 0,
        entertainmentBonus: item.entertainmentBonus || 0,
        productivityBonus: item.productivityBonus || 0,
        shellsPerUse: item.shellsPerUse || 0,
        useCooldownMinutes: item.useCooldownMinutes || 60,
      });
    }
    console.log(`[Interiors] Seeded ${ERA_OBJECT_CATALOGS.length} object catalogs across eras`);
  },

  async getOrCreateInterior(userId: string): Promise<ChronicleInterior> {
    const existing = await db.select().from(chronicleInteriors).where(eq(chronicleInteriors.userId, userId)).limit(1);
    if (existing.length > 0) return existing[0];
    
    const [interior] = await db.insert(chronicleInteriors).values({ userId }).returning();
    
    const [livingRoom] = await db.insert(chronicleRooms).values({
      interiorId: interior.id,
      userId,
      name: "Living Room",
      roomType: "living",
      era: "present",
      sortOrder: 0,
    }).returning();
    
    await db.update(chronicleInteriors).set({ currentRoomId: livingRoom.id }).where(eq(chronicleInteriors.id, interior.id));
    
    return { ...interior, currentRoomId: livingRoom.id };
  },

  async getRooms(userId: string): Promise<ChronicleRoom[]> {
    return db.select().from(chronicleRooms).where(eq(chronicleRooms.userId, userId)).orderBy(chronicleRooms.sortOrder);
  },

  async getRoom(roomId: string): Promise<ChronicleRoom | null> {
    const rooms = await db.select().from(chronicleRooms).where(eq(chronicleRooms.id, roomId)).limit(1);
    return rooms[0] || null;
  },

  async getObjectCatalog(era: string): Promise<ChronicleObjectCatalog[]> {
    return db.select().from(chronicleObjectCatalogs)
      .where(and(eq(chronicleObjectCatalogs.era, era), eq(chronicleObjectCatalogs.isActive, true)))
      .orderBy(chronicleObjectCatalogs.sortOrder);
  },

  async getRoomObjects(roomId: string): Promise<(ChronicleRoomObject & { catalog: ChronicleObjectCatalog })[]> {
    const objects = await db.select().from(chronicleRoomObjects).where(eq(chronicleRoomObjects.roomId, roomId));
    
    const result: (ChronicleRoomObject & { catalog: ChronicleObjectCatalog })[] = [];
    for (const obj of objects) {
      const catalogItems = await db.select().from(chronicleObjectCatalogs).where(eq(chronicleObjectCatalogs.id, obj.catalogId)).limit(1);
      if (catalogItems.length > 0) {
        result.push({ ...obj, catalog: catalogItems[0] });
      }
    }
    return result;
  },

  async placeObject(userId: string, roomId: string, catalogId: string, gridX: number, gridY: number): Promise<ChronicleRoomObject> {
    const [obj] = await db.insert(chronicleRoomObjects).values({
      roomId,
      userId,
      catalogId,
      gridX,
      gridY,
    }).returning();
    return obj;
  },

  async removeObject(userId: string, objectId: string): Promise<boolean> {
    const result = await db.delete(chronicleRoomObjects)
      .where(and(eq(chronicleRoomObjects.id, objectId), eq(chronicleRoomObjects.userId, userId)));
    return true;
  },

  async interactWithObject(userId: string, username: string, objectId: string, verb: string): Promise<{ success: boolean; message: string; shellsEarned?: number; questsUpdated?: string[] }> {
    const objects = await db.select().from(chronicleRoomObjects).where(eq(chronicleRoomObjects.id, objectId)).limit(1);
    if (objects.length === 0) return { success: false, message: "Object not found" };
    
    const obj = objects[0];
    const catalogs = await db.select().from(chronicleObjectCatalogs).where(eq(chronicleObjectCatalogs.id, obj.catalogId)).limit(1);
    if (catalogs.length === 0) return { success: false, message: "Catalog not found" };
    
    const catalog = catalogs[0];
    
    const verbs: string[] = JSON.parse(catalog.interactionVerbs || "[]");
    if (!verbs.includes(verb)) return { success: false, message: `Cannot ${verb} this object` };
    
    if (obj.lastUsedAt) {
      const cooldownMs = (catalog.useCooldownMinutes || 60) * 60 * 1000;
      const nextUseTime = new Date(obj.lastUsedAt.getTime() + cooldownMs);
      if (new Date() < nextUseTime) {
        const minutesLeft = Math.ceil((nextUseTime.getTime() - Date.now()) / 60000);
        return { success: false, message: `This object is cooling down. Available in ${minutesLeft} minutes.` };
      }
    }
    
    await db.update(chronicleRoomObjects).set({
      lastUsedAt: new Date(),
      totalUses: sql`${chronicleRoomObjects.totalUses} + 1`,
      updatedAt: new Date(),
    }).where(eq(chronicleRoomObjects.id, objectId));
    
    const baseShells = catalog.shellsPerUse || 0;
    let shellsEarned = 0;
    let capMessage = "";
    
    // Credit shells to user's wallet (respects earning caps)
    if (baseShells > 0) {
      const tx = await shellsService.addShells(
        userId,
        username,
        baseShells,
        "earn",
        `Used ${catalog.name}: ${verb}`,
        `interior_${objectId}_${Date.now()}`,
        "interior_interaction"
      );
      
      if (tx) {
        shellsEarned = tx.amount;
        if (tx.amount < baseShells) {
          capMessage = " (daily limit reached)";
        }
      } else {
        capMessage = " (earning limit reached - resets tomorrow)";
      }
    }
    
    // Track quest progress
    const questResult = await questsService.trackProgress(userId, "interior_interaction", 1);
    
    return {
      success: true,
      message: `You ${verb} the ${catalog.name}${capMessage}`,
      shellsEarned,
      questsUpdated: questResult.questsUpdated,
    };
  },

  async getActiveSession(userId: string): Promise<ChronicleActivitySession | null> {
    const sessions = await db.select().from(chronicleActivitySessions)
      .where(and(eq(chronicleActivitySessions.userId, userId), eq(chronicleActivitySessions.status, "active")))
      .orderBy(desc(chronicleActivitySessions.startedAt))
      .limit(1);
    return sessions[0] || null;
  },
};

// Auto-seed object catalogs on startup
(async () => {
  try {
    await interiorsService.seedObjectCatalogs();
  } catch (err) {
    console.warn("[Interiors] Failed to seed object catalogs:", err);
  }
})();
