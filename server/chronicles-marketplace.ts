import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { chronicleMarketplaceItems, chroniclePlayerInventory, chronicleCraftingRecipes, chroniclesGameState, chronicleAccounts } from "@shared/schema";
import type { Express, Request, Response, NextFunction } from "express";

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
    if (account.sessionExpiresAt && new Date(account.sessionExpiresAt) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }
    req.chroniclesAccount = account;
    return next();
  } catch (error: any) {
    console.error("Marketplace auth error:", error.message || error);
    return res.status(401).json({ error: "Authentication required" });
  }
}

const getPlayUserId = (req: any): string | null => {
  return req.chroniclesAccount?.userId || req.chroniclesAccount?.id || null;
};

const MEDIEVAL_ITEMS = [
  { code: "bread_loaf", name: "Bread Loaf", description: "A hearty loaf of freshly baked bread. Sustenance for a long day.", era: "medieval", category: "food", iconEmoji: "🍞", shellCost: 5, unlockLevel: 0, rarity: "common", sortOrder: 1 },
  { code: "ale_flagon", name: "Ale Flagon", description: "A generous flagon of the tavern's finest ale. Warms the belly and loosens the tongue.", era: "medieval", category: "drink", iconEmoji: "🍺", shellCost: 8, unlockLevel: 0, rarity: "common", sortOrder: 2 },
  { code: "iron_sword", name: "Iron Sword", description: "A sturdy blade forged by the village blacksmith. Not fancy, but it gets the job done.", era: "medieval", category: "weapon", iconEmoji: "⚔️", shellCost: 50, unlockLevel: 2, rarity: "uncommon", statBonus: '{"courage":2}', sortOrder: 3 },
  { code: "leather_armor", name: "Leather Armor", description: "Thick boiled leather shaped into a protective vest. Light enough to move, tough enough to save your life.", era: "medieval", category: "armor", iconEmoji: "🛡️", shellCost: 40, unlockLevel: 2, rarity: "uncommon", statBonus: '{"courage":1,"wisdom":1}', sortOrder: 4 },
  { code: "healing_herbs", name: "Healing Herbs", description: "A bundle of medicinal plants gathered from the forest. The healer swears by them.", era: "medieval", category: "medicine", iconEmoji: "🌿", shellCost: 15, unlockLevel: 0, rarity: "common", sortOrder: 5 },
  { code: "merchants_ledger", name: "Merchant's Ledger", description: "A leather-bound book for tracking trades, debts, and profits. Knowledge is power.", era: "medieval", category: "tool", iconEmoji: "📒", shellCost: 25, unlockLevel: 1, rarity: "common", statBonus: '{"cunning":1}', sortOrder: 6 },
  { code: "royal_seal", name: "Royal Seal", description: "A wax seal bearing the royal crest. Opens doors that gold cannot.", era: "medieval", category: "accessory", iconEmoji: "👑", shellCost: 200, unlockLevel: 5, rarity: "rare", statBonus: '{"influence":3}', sortOrder: 7 },
  { code: "torch", name: "Torch", description: "A simple torch wrapped in oil-soaked cloth. Pierces the darkness of dungeons and forests alike.", era: "medieval", category: "tool", iconEmoji: "🔥", shellCost: 3, unlockLevel: 0, rarity: "common", sortOrder: 8 },
  { code: "horse", name: "Horse", description: "A reliable steed for travel across the realm. Not the fastest, but loyal and strong.", era: "medieval", category: "mount", iconEmoji: "🐴", shellCost: 150, unlockLevel: 3, rarity: "uncommon", statBonus: '{"influence":1}', sortOrder: 9 },
  { code: "enchanted_amulet", name: "Enchanted Amulet", description: "A mysterious amulet that pulses with ancient energy. The Old Faith says it connects the wearer to the land itself.", era: "medieval", category: "accessory", iconEmoji: "🔮", shellCost: 500, unlockLevel: 7, rarity: "epic", statBonus: '{"wisdom":3,"influence":2}', sortOrder: 10 },
  { code: "knight_set", name: "Knight's Set", description: "A complete set of sword and shield, crafted for a true knight. Commands respect on any battlefield.", era: "medieval", category: "weapon", iconEmoji: "🗡️", shellCost: 0, unlockLevel: 3, rarity: "rare", isCraftable: true, statBonus: '{"courage":4,"influence":2}', sortOrder: 11 },
  { code: "healing_potion", name: "Healing Potion", description: "A concentrated elixir brewed from rare herbs. Restores vitality and clears the mind.", era: "medieval", category: "medicine", iconEmoji: "🧪", shellCost: 0, unlockLevel: 2, rarity: "uncommon", isCraftable: true, statBonus: '{"compassion":1}', sortOrder: 12 },
];

const MODERN_ITEMS = [
  { code: "coffee", name: "Coffee", description: "A hot cup of artisan coffee. The fuel of the modern world.", era: "modern", category: "food", iconEmoji: "☕", shellCost: 3, unlockLevel: 0, rarity: "common", sortOrder: 1 },
  { code: "smartphone", name: "Smartphone", description: "The latest model with encrypted messaging and surveillance detection. Essential for any modern operative.", era: "modern", category: "tech", iconEmoji: "📱", shellCost: 80, unlockLevel: 2, rarity: "uncommon", statBonus: '{"cunning":2}', sortOrder: 2 },
  { code: "laptop", name: "Laptop", description: "A high-performance laptop for research, communication, and digital operations.", era: "modern", category: "tech", iconEmoji: "💻", shellCost: 150, unlockLevel: 3, rarity: "uncommon", statBonus: '{"wisdom":2,"cunning":1}', sortOrder: 3 },
  { code: "business_suit", name: "Business Suit", description: "A tailored suit that opens boardroom doors. Look the part, play the part.", era: "modern", category: "clothing", iconEmoji: "👔", shellCost: 60, unlockLevel: 1, rarity: "common", statBonus: '{"influence":1}', sortOrder: 4 },
  { code: "first_aid_kit", name: "First Aid Kit", description: "Professional-grade medical supplies. Be prepared for any situation.", era: "modern", category: "medicine", iconEmoji: "🩹", shellCost: 20, unlockLevel: 0, rarity: "common", sortOrder: 5 },
  { code: "press_badge", name: "Press Badge", description: "Official press credentials. Access all areas. Ask the hard questions.", era: "modern", category: "tool", iconEmoji: "🪪", shellCost: 100, unlockLevel: 4, rarity: "rare", statBonus: '{"influence":2,"cunning":1}', sortOrder: 6 },
  { code: "luxury_watch", name: "Luxury Watch", description: "A Swiss-made timepiece that signals status and sophistication. Time is money.", era: "modern", category: "accessory", iconEmoji: "⌚", shellCost: 300, unlockLevel: 5, rarity: "rare", statBonus: '{"influence":3}', sortOrder: 7 },
  { code: "energy_drink", name: "Energy Drink", description: "Maximum caffeine. Maximum focus. Questionable health benefits.", era: "modern", category: "food", iconEmoji: "🥤", shellCost: 5, unlockLevel: 0, rarity: "common", sortOrder: 8 },
  { code: "vpn_sub", name: "VPN Subscription", description: "Anonymous browsing and encrypted connections. Stay invisible in the digital world.", era: "modern", category: "tech", iconEmoji: "🔒", shellCost: 25, unlockLevel: 1, rarity: "common", statBonus: '{"cunning":1}', sortOrder: 9 },
  { code: "executive_briefcase", name: "Executive Briefcase", description: "A leather briefcase with hidden compartments. For documents that matter.", era: "modern", category: "accessory", iconEmoji: "💼", shellCost: 200, unlockLevel: 3, rarity: "uncommon", statBonus: '{"influence":2,"cunning":1}', sortOrder: 10 },
  { code: "encrypted_drive", name: "Encrypted Drive", description: "A military-grade encrypted storage device. Your secrets, locked away forever.", era: "modern", category: "tech", iconEmoji: "🔐", shellCost: 0, unlockLevel: 4, rarity: "rare", isCraftable: true, statBonus: '{"cunning":3,"wisdom":1}', sortOrder: 11 },
  { code: "investigation_kit", name: "Investigation Kit", description: "A complete journalist's investigation toolkit. Follow the story wherever it leads.", era: "modern", category: "tool", iconEmoji: "🔍", shellCost: 0, unlockLevel: 3, rarity: "rare", isCraftable: true, statBonus: '{"wisdom":2,"influence":2}', sortOrder: 12 },
];

const WILDWEST_ITEMS = [
  { code: "hardtack", name: "Hardtack", description: "Hard as a rock, lasts forever. Trail food for the long ride.", era: "wildwest", category: "food", iconEmoji: "🍪", shellCost: 3, unlockLevel: 0, rarity: "common", sortOrder: 1 },
  { code: "whiskey", name: "Whiskey", description: "Frontier whiskey — strong enough to strip paint, smooth enough to ease the pain.", era: "wildwest", category: "drink", iconEmoji: "🥃", shellCost: 8, unlockLevel: 0, rarity: "common", sortOrder: 2 },
  { code: "revolver", name: "Revolver", description: "A six-shooter that speaks louder than words. The great equalizer of the frontier.", era: "wildwest", category: "weapon", iconEmoji: "🔫", shellCost: 60, unlockLevel: 2, rarity: "uncommon", statBonus: '{"courage":2}', sortOrder: 3 },
  { code: "cowboy_hat", name: "Cowboy Hat", description: "A wide-brimmed hat that shields from sun and rain. The mark of a true frontiersman.", era: "wildwest", category: "clothing", iconEmoji: "🤠", shellCost: 15, unlockLevel: 0, rarity: "common", sortOrder: 4 },
  { code: "lasso", name: "Lasso", description: "A length of sturdy rope for wrangling cattle — or outlaws.", era: "wildwest", category: "tool", iconEmoji: "🪢", shellCost: 20, unlockLevel: 0, rarity: "common", sortOrder: 5 },
  { code: "gold_pan", name: "Gold Pan", description: "A wide metal pan for sifting river sediment. Every prospector's best friend.", era: "wildwest", category: "tool", iconEmoji: "🍳", shellCost: 30, unlockLevel: 1, rarity: "common", statBonus: '{"cunning":1}', sortOrder: 6 },
  { code: "dynamite", name: "Dynamite", description: "Nitroglycerin sticks. Handle with extreme care. Opens mountains and closes arguments.", era: "wildwest", category: "tool", iconEmoji: "🧨", shellCost: 100, unlockLevel: 4, rarity: "rare", statBonus: '{"courage":2}', sortOrder: 7 },
  { code: "sheriffs_badge", name: "Sheriff's Badge", description: "A tin star that carries the weight of the law. Wear it and people listen.", era: "wildwest", category: "accessory", iconEmoji: "⭐", shellCost: 250, unlockLevel: 5, rarity: "rare", statBonus: '{"influence":3,"courage":1}', sortOrder: 8 },
  { code: "mustang_horse", name: "Mustang Horse", description: "A wild mustang, tamed but never broken. The fastest ride on the frontier.", era: "wildwest", category: "mount", iconEmoji: "🐎", shellCost: 180, unlockLevel: 3, rarity: "uncommon", statBonus: '{"courage":1}', sortOrder: 9 },
  { code: "wanted_poster", name: "Wanted Poster", description: "A bounty poster with a familiar face. Worth something to the right people.", era: "wildwest", category: "misc", iconEmoji: "📜", shellCost: 10, unlockLevel: 0, rarity: "common", sortOrder: 10 },
  { code: "prospector_kit", name: "Prospector's Kit", description: "Everything you need to strike it rich — pan, dynamite, and determination.", era: "wildwest", category: "tool", iconEmoji: "⛏️", shellCost: 0, unlockLevel: 4, rarity: "rare", isCraftable: true, statBonus: '{"cunning":3,"courage":1}', sortOrder: 11 },
  { code: "trail_rations", name: "Trail Rations", description: "A prepared pack of hardtack and whiskey. Keeps you going on the long trail.", era: "wildwest", category: "food", iconEmoji: "🎒", shellCost: 0, unlockLevel: 1, rarity: "uncommon", isCraftable: true, statBonus: '{"wisdom":1}', sortOrder: 12 },
];

const CRAFTING_RECIPES = [
  {
    code: "craft_knight_set",
    name: "Sword & Shield Set",
    description: "Combine an iron sword and leather armor into a complete knight's equipment.",
    era: "medieval",
    resultItemCode: "knight_set",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "iron_sword", quantity: 1 }, { itemCode: "leather_armor", quantity: 1 }]),
    craftTimeMinutes: 10,
    requiredLevel: 3,
    shellCost: 20,
    xpReward: 150,
    iconEmoji: "🗡️",
  },
  {
    code: "craft_healing_potion",
    name: "Healing Potion",
    description: "Brew three bundles of healing herbs into a concentrated healing potion.",
    era: "medieval",
    resultItemCode: "healing_potion",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "healing_herbs", quantity: 3 }]),
    craftTimeMinutes: 5,
    requiredLevel: 2,
    shellCost: 10,
    xpReward: 100,
    iconEmoji: "🧪",
  },
  {
    code: "craft_encrypted_drive",
    name: "Encrypted Drive",
    description: "Combine a laptop and VPN subscription to create a military-grade encrypted storage device.",
    era: "modern",
    resultItemCode: "encrypted_drive",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "laptop", quantity: 1 }, { itemCode: "vpn_sub", quantity: 1 }]),
    craftTimeMinutes: 15,
    requiredLevel: 4,
    shellCost: 30,
    xpReward: 200,
    iconEmoji: "🔐",
  },
  {
    code: "craft_investigation_kit",
    name: "Investigation Kit",
    description: "Combine a press badge and smartphone into a complete journalist's investigation toolkit.",
    era: "modern",
    resultItemCode: "investigation_kit",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "press_badge", quantity: 1 }, { itemCode: "smartphone", quantity: 1 }]),
    craftTimeMinutes: 10,
    requiredLevel: 3,
    shellCost: 25,
    xpReward: 150,
    iconEmoji: "🔍",
  },
  {
    code: "craft_prospector_kit",
    name: "Prospector's Kit",
    description: "Combine a gold pan and dynamite into the ultimate prospecting equipment.",
    era: "wildwest",
    resultItemCode: "prospector_kit",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "gold_pan", quantity: 1 }, { itemCode: "dynamite", quantity: 1 }]),
    craftTimeMinutes: 10,
    requiredLevel: 4,
    shellCost: 25,
    xpReward: 200,
    iconEmoji: "⛏️",
  },
  {
    code: "craft_trail_rations",
    name: "Trail Rations",
    description: "Pack three hardtack biscuits and a bottle of whiskey for the long trail ahead.",
    era: "wildwest",
    resultItemCode: "trail_rations",
    resultQuantity: 1,
    ingredients: JSON.stringify([{ itemCode: "hardtack", quantity: 3 }, { itemCode: "whiskey", quantity: 1 }]),
    craftTimeMinutes: 5,
    requiredLevel: 1,
    shellCost: 5,
    xpReward: 50,
    iconEmoji: "🎒",
  },
];

export async function seedMarketplaceItems() {
  try {
    const [existing] = await db.select({ count: sql<number>`count(*)` })
      .from(chronicleMarketplaceItems);

    if (Number(existing.count) > 0) {
      console.log(`Marketplace already seeded (${existing.count} items). Skipping.`);
      return;
    }

    const allItems = [...MEDIEVAL_ITEMS, ...MODERN_ITEMS, ...WILDWEST_ITEMS];
    for (const item of allItems) {
      await db.insert(chronicleMarketplaceItems).values({
        code: item.code,
        name: item.name,
        description: item.description,
        era: item.era,
        category: item.category,
        iconEmoji: item.iconEmoji,
        shellCost: item.shellCost,
        unlockLevel: item.unlockLevel,
        rarity: item.rarity,
        statBonus: (item as any).statBonus || "{}",
        isCraftable: (item as any).isCraftable || false,
        sortOrder: item.sortOrder,
        isActive: true,
      }).onConflictDoNothing();
    }
    console.log(`Seeded ${allItems.length} marketplace items.`);

    const [existingRecipes] = await db.select({ count: sql<number>`count(*)` })
      .from(chronicleCraftingRecipes);

    if (Number(existingRecipes.count) === 0) {
      for (const recipe of CRAFTING_RECIPES) {
        await db.insert(chronicleCraftingRecipes).values(recipe).onConflictDoNothing();
      }
      console.log(`Seeded ${CRAFTING_RECIPES.length} crafting recipes.`);
    }
  } catch (error: any) {
    console.error("Failed to seed marketplace:", error.message || error);
  }
}

export async function getMarketplaceItems(era: string, category?: string, level?: number) {
  const conditions = [
    eq(chronicleMarketplaceItems.era, era),
    eq(chronicleMarketplaceItems.isActive, true),
  ];

  if (category) {
    conditions.push(eq(chronicleMarketplaceItems.category, category));
  }

  let items = await db.select().from(chronicleMarketplaceItems)
    .where(and(...conditions))
    .orderBy(chronicleMarketplaceItems.sortOrder);

  if (level !== undefined && level !== null) {
    items = items.filter(item => item.unlockLevel <= level);
  }

  return items;
}

export async function purchaseItem(userId: string, itemCode: string, quantity: number = 1) {
  const [item] = await db.select().from(chronicleMarketplaceItems)
    .where(and(
      eq(chronicleMarketplaceItems.code, itemCode),
      eq(chronicleMarketplaceItems.isActive, true),
    ))
    .limit(1);

  if (!item) throw new Error("Item not found");
  if (item.isCraftable && item.shellCost === 0) throw new Error("This item can only be crafted");

  const totalCost = item.shellCost * quantity;

  const [state] = await db.select().from(chroniclesGameState)
    .where(eq(chroniclesGameState.userId, userId))
    .limit(1);

  if (!state) throw new Error("Game state not found");
  if (state.level < item.unlockLevel) throw new Error(`Requires level ${item.unlockLevel}. You are level ${state.level}.`);
  if (state.shellsEarned < totalCost) throw new Error(`Not enough shells. Need ${totalCost}, have ${state.shellsEarned}.`);

  if (item.isLimited && item.stockQuantity !== null) {
    if (item.stockQuantity < quantity) throw new Error("Not enough stock available");
    await db.update(chronicleMarketplaceItems)
      .set({ stockQuantity: item.stockQuantity - quantity })
      .where(eq(chronicleMarketplaceItems.id, item.id));
  }

  await db.update(chroniclesGameState)
    .set({ shellsEarned: state.shellsEarned - totalCost })
    .where(eq(chroniclesGameState.userId, userId));

  const [existingInv] = await db.select().from(chroniclePlayerInventory)
    .where(and(
      eq(chroniclePlayerInventory.userId, userId),
      eq(chroniclePlayerInventory.itemCode, itemCode),
      eq(chroniclePlayerInventory.era, item.era),
    ))
    .limit(1);

  if (existingInv) {
    await db.update(chroniclePlayerInventory)
      .set({ quantity: existingInv.quantity + quantity })
      .where(eq(chroniclePlayerInventory.id, existingInv.id));
  } else {
    await db.insert(chroniclePlayerInventory).values({
      userId,
      itemCode,
      quantity,
      era: item.era,
      acquiredVia: "purchase",
    });
  }

  return {
    item,
    quantityPurchased: quantity,
    totalCost,
    remainingShells: state.shellsEarned - totalCost,
  };
}

export async function getPlayerInventory(userId: string, era?: string) {
  const conditions = [eq(chroniclePlayerInventory.userId, userId)];
  if (era) conditions.push(eq(chroniclePlayerInventory.era, era));

  const inventory = await db.select().from(chroniclePlayerInventory)
    .where(and(...conditions))
    .orderBy(chroniclePlayerInventory.createdAt);

  const itemCodes = inventory.map(inv => inv.itemCode);
  const itemDetails = itemCodes.length > 0
    ? await db.select().from(chronicleMarketplaceItems)
        .where(eq(chronicleMarketplaceItems.isActive, true))
    : [];

  const itemMap = new Map(itemDetails.map(i => [i.code, i]));

  return inventory.map(inv => ({
    ...inv,
    itemDetails: itemMap.get(inv.itemCode) || null,
  }));
}

export async function getCraftingRecipes(era: string, level?: number) {
  let recipes = await db.select().from(chronicleCraftingRecipes)
    .where(and(
      eq(chronicleCraftingRecipes.era, era),
      eq(chronicleCraftingRecipes.isActive, true),
    ));

  if (level !== undefined && level !== null) {
    recipes = recipes.filter(r => r.requiredLevel <= level);
  }

  return recipes;
}

export async function craftItem(userId: string, recipeCode: string) {
  const [recipe] = await db.select().from(chronicleCraftingRecipes)
    .where(and(
      eq(chronicleCraftingRecipes.code, recipeCode),
      eq(chronicleCraftingRecipes.isActive, true),
    ))
    .limit(1);

  if (!recipe) throw new Error("Recipe not found");

  const [state] = await db.select().from(chroniclesGameState)
    .where(eq(chroniclesGameState.userId, userId))
    .limit(1);

  if (!state) throw new Error("Game state not found");
  if (state.level < recipe.requiredLevel) throw new Error(`Requires level ${recipe.requiredLevel}. You are level ${state.level}.`);
  if (recipe.shellCost > 0 && state.shellsEarned < recipe.shellCost) {
    throw new Error(`Not enough shells. Need ${recipe.shellCost}, have ${state.shellsEarned}.`);
  }

  const ingredients: { itemCode: string; quantity: number }[] = JSON.parse(recipe.ingredients);

  const playerInventory = await db.select().from(chroniclePlayerInventory)
    .where(eq(chroniclePlayerInventory.userId, userId));

  const invMap = new Map(playerInventory.map(inv => [inv.itemCode, inv]));

  for (const ingredient of ingredients) {
    const inv = invMap.get(ingredient.itemCode);
    if (!inv || inv.quantity < ingredient.quantity) {
      const needed = ingredient.quantity;
      const have = inv?.quantity || 0;
      throw new Error(`Missing ingredient: ${ingredient.itemCode} (need ${needed}, have ${have})`);
    }
  }

  for (const ingredient of ingredients) {
    const inv = invMap.get(ingredient.itemCode)!;
    const newQty = inv.quantity - ingredient.quantity;
    if (newQty <= 0) {
      await db.delete(chroniclePlayerInventory)
        .where(eq(chroniclePlayerInventory.id, inv.id));
    } else {
      await db.update(chroniclePlayerInventory)
        .set({ quantity: newQty })
        .where(eq(chroniclePlayerInventory.id, inv.id));
    }
  }

  if (recipe.shellCost > 0) {
    await db.update(chroniclesGameState)
      .set({ shellsEarned: state.shellsEarned - recipe.shellCost })
      .where(eq(chroniclesGameState.userId, userId));
  }

  const newXp = state.experience + recipe.xpReward;
  let newLevel = state.level;
  while (newXp >= newLevel * 1000) {
    newLevel++;
  }
  await db.update(chroniclesGameState)
    .set({
      experience: newXp,
      level: newLevel,
    })
    .where(eq(chroniclesGameState.userId, userId));

  const [existingResult] = await db.select().from(chroniclePlayerInventory)
    .where(and(
      eq(chroniclePlayerInventory.userId, userId),
      eq(chroniclePlayerInventory.itemCode, recipe.resultItemCode),
      eq(chroniclePlayerInventory.era, recipe.era),
    ))
    .limit(1);

  if (existingResult) {
    await db.update(chroniclePlayerInventory)
      .set({ quantity: existingResult.quantity + recipe.resultQuantity })
      .where(eq(chroniclePlayerInventory.id, existingResult.id));
  } else {
    await db.insert(chroniclePlayerInventory).values({
      userId,
      itemCode: recipe.resultItemCode,
      quantity: recipe.resultQuantity,
      era: recipe.era,
      acquiredVia: "craft",
    });
  }

  const [resultItem] = await db.select().from(chronicleMarketplaceItems)
    .where(eq(chronicleMarketplaceItems.code, recipe.resultItemCode))
    .limit(1);

  return {
    recipe,
    resultItem: resultItem || null,
    xpEarned: recipe.xpReward,
    shellsCost: recipe.shellCost,
    remainingShells: state.shellsEarned - recipe.shellCost,
    newLevel,
    leveledUp: newLevel > state.level,
  };
}

export function registerMarketplaceRoutes(app: Express) {
  app.get("/api/chronicles/marketplace/:era", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const { era } = req.params;
      if (!["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }
      const category = req.query.category as string | undefined;
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;

      const userId = getPlayUserId(req);
      let playerLevel = level;
      if (playerLevel === undefined && userId) {
        const [state] = await db.select().from(chroniclesGameState)
          .where(eq(chroniclesGameState.userId, userId))
          .limit(1);
        if (state) playerLevel = state.level;
      }

      const items = await getMarketplaceItems(era, category, playerLevel);
      res.json({ items, era });
    } catch (error: any) {
      console.error("Get marketplace items error:", error);
      res.status(500).json({ error: error.message || "Failed to get marketplace items" });
    }
  });

  app.post("/api/chronicles/marketplace/buy", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { itemCode, quantity } = req.body;
      if (!itemCode) return res.status(400).json({ error: "itemCode is required" });

      const result = await purchaseItem(userId, itemCode, quantity || 1);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Purchase item error:", error);
      res.status(400).json({ error: error.message || "Failed to purchase item" });
    }
  });

  app.get("/api/chronicles/inventory", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const inventory = await getPlayerInventory(userId);
      res.json({ inventory });
    } catch (error: any) {
      console.error("Get inventory error:", error);
      res.status(500).json({ error: error.message || "Failed to get inventory" });
    }
  });

  app.get("/api/chronicles/inventory/:era", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { era } = req.params;
      if (!["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const inventory = await getPlayerInventory(userId, era);
      res.json({ inventory, era });
    } catch (error: any) {
      console.error("Get era inventory error:", error);
      res.status(500).json({ error: error.message || "Failed to get inventory" });
    }
  });

  app.get("/api/chronicles/crafting/:era", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const { era } = req.params;
      if (!["modern", "medieval", "wildwest"].includes(era)) {
        return res.status(400).json({ error: "Invalid era" });
      }

      const userId = getPlayUserId(req);
      let playerLevel: number | undefined;
      if (userId) {
        const [state] = await db.select().from(chroniclesGameState)
          .where(eq(chroniclesGameState.userId, userId))
          .limit(1);
        if (state) playerLevel = state.level;
      }

      const recipes = await getCraftingRecipes(era, playerLevel);
      res.json({ recipes, era });
    } catch (error: any) {
      console.error("Get crafting recipes error:", error);
      res.status(500).json({ error: error.message || "Failed to get crafting recipes" });
    }
  });

  app.post("/api/chronicles/crafting/craft", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getPlayUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { recipeCode } = req.body;
      if (!recipeCode) return res.status(400).json({ error: "recipeCode is required" });

      const result = await craftItem(userId, recipeCode);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Craft item error:", error);
      res.status(400).json({ error: error.message || "Failed to craft item" });
    }
  });

  seedMarketplaceItems();
}
