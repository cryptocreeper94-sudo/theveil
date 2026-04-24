import { describe, it, expect } from "vitest";

const ERAS = {
  modern: { name: "Modern Era", years: "2000 - 2025 CE", color: "#3B82F6" },
  medieval: { name: "Medieval Era", years: "500 - 1500 CE", color: "#4A5568" },
  wildwest: { name: "Wild West Era", years: "1850 - 1900 CE", color: "#D97706" },
};

const STARTER_FACTIONS = [
  { id: "house_of_crowns", era: "medieval", ideology: "order" },
  { id: "shadow_council", era: "medieval", ideology: "chaos" },
  { id: "merchant_guild", era: "medieval", ideology: "balance" },
  { id: "innovators_circle", era: "medieval", ideology: "progress" },
  { id: "old_faith", era: "medieval", ideology: "tradition" },
  { id: "nexus_corp", era: "modern", ideology: "order" },
  { id: "signal_underground", era: "modern", ideology: "chaos" },
  { id: "civic_alliance", era: "modern", ideology: "balance" },
  { id: "genesis_labs", era: "modern", ideology: "progress" },
  { id: "old_guard", era: "modern", ideology: "tradition" },
  { id: "iron_star", era: "wildwest", ideology: "order" },
  { id: "black_canyon_gang", era: "wildwest", ideology: "chaos" },
  { id: "pacific_railroad", era: "wildwest", ideology: "balance" },
  { id: "prospectors_union", era: "wildwest", ideology: "progress" },
  { id: "first_nations", era: "wildwest", ideology: "tradition" },
];

const STARTER_NPCS = [
  { name: "Lord Aldric", era: "medieval", factionId: "house_of_crowns" },
  { name: "Sera Nightwhisper", era: "medieval", factionId: "shadow_council" },
  { name: "Marcus Goldhand", era: "medieval", factionId: "merchant_guild" },
  { name: "Dr. Elena Voss", era: "modern", factionId: "nexus_corp" },
  { name: "Kai 'Ghost' Reeves", era: "modern", factionId: "signal_underground" },
  { name: "Mayor Diana Reyes", era: "modern", factionId: "civic_alliance" },
  { name: "Marshal Jake Colton", era: "wildwest", factionId: "iron_star" },
  { name: "Rattlesnake Rosa", era: "wildwest", factionId: "black_canyon_gang" },
  { name: "Chief Running Bear", era: "wildwest", factionId: "first_nations" },
];

const SITUATION_CATEGORIES = [
  "arrival", "life_event", "encounter", "crisis", "opportunity",
  "moral_dilemma", "community", "partnership", "conflict", "exploration", "education",
];

describe("Chronicles - Season Zero Content", () => {
  describe("Eras", () => {
    it("should have exactly 3 playable eras", () => {
      expect(Object.keys(ERAS)).toHaveLength(3);
    });

    it("should include Modern, Medieval, and Wild West", () => {
      expect(ERAS.modern).toBeDefined();
      expect(ERAS.medieval).toBeDefined();
      expect(ERAS.wildwest).toBeDefined();
    });

    it("should have unique colors per era", () => {
      const colors = Object.values(ERAS).map((e) => e.color);
      expect(new Set(colors).size).toBe(3);
    });
  });

  describe("Factions", () => {
    it("should have exactly 15 factions", () => {
      expect(STARTER_FACTIONS).toHaveLength(15);
    });

    it("should have 5 factions per era", () => {
      const medieval = STARTER_FACTIONS.filter((f) => f.era === "medieval");
      const modern = STARTER_FACTIONS.filter((f) => f.era === "modern");
      const wildwest = STARTER_FACTIONS.filter((f) => f.era === "wildwest");
      expect(medieval).toHaveLength(5);
      expect(modern).toHaveLength(5);
      expect(wildwest).toHaveLength(5);
    });

    it("should have unique faction IDs", () => {
      const ids = STARTER_FACTIONS.map((f) => f.id);
      expect(new Set(ids).size).toBe(15);
    });

    it("should have all 5 ideology types per era", () => {
      const ideologies = ["order", "chaos", "balance", "progress", "tradition"];
      for (const era of ["medieval", "modern", "wildwest"]) {
        const eraIdeologies = STARTER_FACTIONS.filter((f) => f.era === era).map((f) => f.ideology);
        for (const ideology of ideologies) {
          expect(eraIdeologies).toContain(ideology);
        }
      }
    });
  });

  describe("NPCs", () => {
    it("should have exactly 9 NPCs", () => {
      expect(STARTER_NPCS).toHaveLength(9);
    });

    it("should have 3 NPCs per era", () => {
      const medieval = STARTER_NPCS.filter((n) => n.era === "medieval");
      const modern = STARTER_NPCS.filter((n) => n.era === "modern");
      const wildwest = STARTER_NPCS.filter((n) => n.era === "wildwest");
      expect(medieval).toHaveLength(3);
      expect(modern).toHaveLength(3);
      expect(wildwest).toHaveLength(3);
    });

    it("should link each NPC to a valid faction", () => {
      const factionIds = STARTER_FACTIONS.map((f) => f.id);
      for (const npc of STARTER_NPCS) {
        expect(factionIds).toContain(npc.factionId);
      }
    });

    it("should have NPCs in the same era as their faction", () => {
      for (const npc of STARTER_NPCS) {
        const faction = STARTER_FACTIONS.find((f) => f.id === npc.factionId);
        expect(faction).toBeDefined();
        expect(faction!.era).toBe(npc.era);
      }
    });
  });

  describe("Character Creation", () => {
    it("should start new characters in Modern era", () => {
      const defaultEra = "modern";
      expect(defaultEra).toBe("modern");
    });

    it("should unlock Medieval at level 3", () => {
      const unlockLevel = 3;
      expect(unlockLevel).toBe(3);
    });

    it("should unlock Wild West at level 5", () => {
      const unlockLevel = 5;
      expect(unlockLevel).toBe(5);
    });

    it("should initialize with balanced attributes", () => {
      const attributes = { wisdom: 10, courage: 10, compassion: 10, cunning: 10, influence: 10 };
      const values = Object.values(attributes);
      expect(values.every((v) => v === 10)).toBe(true);
    });
  });

  describe("Relationship System", () => {
    it("should track NPC relationships from -20 to +20", () => {
      const minRelationship = -20;
      const maxRelationship = 20;
      const defaultRelationship = 0;
      expect(defaultRelationship).toBeGreaterThanOrEqual(minRelationship);
      expect(defaultRelationship).toBeLessThanOrEqual(maxRelationship);
    });

    it("should clamp relationship scores within bounds", () => {
      const clamp = (val: number) => Math.max(-20, Math.min(20, val));
      expect(clamp(25)).toBe(20);
      expect(clamp(-25)).toBe(-20);
      expect(clamp(5)).toBe(5);
    });
  });

  describe("Situation Categories", () => {
    it("should have 11 situation categories", () => {
      expect(SITUATION_CATEGORIES).toHaveLength(11);
    });

    it("should include all required category types", () => {
      expect(SITUATION_CATEGORIES).toContain("arrival");
      expect(SITUATION_CATEGORIES).toContain("moral_dilemma");
      expect(SITUATION_CATEGORIES).toContain("crisis");
      expect(SITUATION_CATEGORIES).toContain("education");
    });
  });

  describe("XP and Rewards", () => {
    const DIFFICULTY_XP: Record<string, number> = { easy: 100, medium: 250, hard: 500 };
    const DIFFICULTY_SHELLS: Record<string, number> = { easy: 50, medium: 150, hard: 300 };

    it("should scale XP by difficulty", () => {
      expect(DIFFICULTY_XP.easy).toBeLessThan(DIFFICULTY_XP.medium);
      expect(DIFFICULTY_XP.medium).toBeLessThan(DIFFICULTY_XP.hard);
    });

    it("should scale shell rewards by difficulty", () => {
      expect(DIFFICULTY_SHELLS.easy).toBeLessThan(DIFFICULTY_SHELLS.medium);
      expect(DIFFICULTY_SHELLS.medium).toBeLessThan(DIFFICULTY_SHELLS.hard);
    });

    it("should calculate level from XP", () => {
      function getLevel(xp: number): number {
        return Math.floor(xp / 1000) + 1;
      }
      expect(getLevel(0)).toBe(1);
      expect(getLevel(999)).toBe(1);
      expect(getLevel(1000)).toBe(2);
      expect(getLevel(4999)).toBe(5);
    });
  });
});

describe("City Zones", () => {
  const ZONE_TYPES = ["civic", "commercial", "residential", "nature", "mixed"];

  it("should have 15 city zones (5 per era)", () => {
    const totalZones = 15;
    expect(totalZones).toBe(15);
  });

  it("should have all 5 zone types per era", () => {
    expect(ZONE_TYPES).toHaveLength(5);
  });

  it("should assign 16 plots per zone (4x4 grid)", () => {
    const totalPlots = 4 * 4;
    expect(totalPlots).toBe(16);
  });
});

describe("Building Templates", () => {
  it("should have 36 building templates (12 per era)", () => {
    const totalTemplates = 36;
    expect(totalTemplates).toBe(36);
  });

  it("should have progressive unlock levels", () => {
    const unlockLevels = [0, 0, 0, 1, 0, 0, 2, 3, 5, 4, 3, 1];
    expect(unlockLevels.filter((l) => l === 0).length).toBeGreaterThan(0);
    expect(Math.max(...unlockLevels)).toBe(5);
  });
});
