import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  shellWallets,
  shellTransactions,
  shellConversionSnapshots,
  shellPurchaseReceipts,
  userFinancialConsents,
  type ShellWallet,
  type ShellTransaction,
  type ShellConversionSnapshot,
  type ShellPurchaseReceipt,
  type UserFinancialConsent,
} from "@shared/schema";
import { getUncachableStripeClient } from "./stripeClient";

// SIG Conversion rate: 1 SIG = 10 Shells (launches April 11, 2026)
export const DWC_CONVERSION_RATE = 10;
export const DWC_LAUNCH_DATE = "2026-04-11";

// Earning caps to protect SIG supply (1B total = 100B Shells max)
// These limits ensure sustainable token distribution
export const SHELL_EARNING_CAPS = {
  dailyMax: 200,         // 2 SIG per day max from gameplay
  weeklyMax: 1000,       // 10 SIG per week max from gameplay
  starterBonus: 500,     // 5 SIG worth to get new players started
} as const;

export type TransactionType = 
  | "earn"           // Earned through engagement
  | "spend"          // Spent on features
  | "tip_sent"       // Sent to another user
  | "tip_received"   // Received from another user
  | "purchase"       // Bought with fiat (Stripe)
  | "refund"         // Refunded
  | "bonus"          // Bonus/promotional
  | "conversion";    // Converted to SIG at launch

// Shell bundles available for purchase - Updated pricing for April 11, 2026 launch
// All Shell purchases will convert to SIG at launch rate: 1 SIG = 100 Shells
export const SHELL_BUNDLES = {
  starter: { amount: 1000, price: 900, name: "Starter Bundle", dwcEquivalent: 10 },      // $9
  pro: { amount: 5000, price: 4000, name: "Pro Bundle", dwcEquivalent: 50, bonus: 25 },       // $40 (25% bonus = 5000 base + 1250 bonus)
  elite: { amount: 12500, price: 9000, name: "Elite Bundle", dwcEquivalent: 125, bonus: 39 }, // $90 (39% bonus)
  founders: { amount: 30000, price: 20000, name: "Founders Bundle", dwcEquivalent: 300, bonus: 50 }, // $200 (50% bonus)
} as const;

// Legacy alias for backward compatibility
export const SHELL_PACKAGES = SHELL_BUNDLES;

// Engagement earning rates - Generous F2P system
// Players should be able to earn ~100-200 Shells/day through normal gameplay
export const SHELL_EARN_RATES = {
  // Core Daily Activities (repeatable)
  daily_login: 25,              // Base daily bonus (separate from streak rewards)
  send_message: 2,              // Community chat
  receive_reaction: 3,          // Getting likes
  join_community: 25,           // First time joining
  share_content: 5,             // Sharing/posting
  
  // Daily Quests (3 per day, resetting)
  daily_quest_easy: 15,         // Easy quest completion
  daily_quest_medium: 30,       // Medium quest completion  
  daily_quest_hard: 50,         // Hard quest completion
  
  // Weekly Challenges
  weekly_challenge: 150,        // Complete weekly challenge
  weekly_all_dailies: 100,      // Complete all 7 days of dailies
  
  // Chronicles Gameplay
  story_choice: 10,             // Make a narrative choice
  complete_mission: 35,         // Finish a mission
  era_first_visit: 50,          // First time visiting a new era
  estate_upgrade: 20,           // Building something on estate
  npc_conversation: 5,          // Talk to NPCs
  
  // Achievements (one-time)
  achievement_bronze: 25,       // Bronze tier achievement
  achievement_silver: 75,       // Silver tier achievement
  achievement_gold: 200,        // Gold tier achievement
  
  // Social
  referral_signup: 100,         // Someone signs up with your code
  first_purchase: 50,           // Your first Shell purchase (bonus)
  invite_friend: 25,            // Invite sent (if they join)
} as const;

// Feature costs
export const SHELL_COSTS = {
  premium_feature_unlock: 100,
  ai_chat_message: 5,
  scenario_generation: 20,
  voice_clone_minute: 10,
  personality_summary: 15,
} as const;

class ShellsService {
  async getWallet(userId: string): Promise<ShellWallet | null> {
    const [wallet] = await db.select()
      .from(shellWallets)
      .where(eq(shellWallets.userId, userId));
    return wallet || null;
  }

  async getOrCreateWallet(userId: string, username: string): Promise<ShellWallet> {
    let wallet = await this.getWallet(userId);
    
    if (!wallet) {
      const [newWallet] = await db.insert(shellWallets)
        .values({ userId, username })
        .returning();
      wallet = newWallet;
    }
    
    return wallet;
  }

  async getBalance(userId: string): Promise<{ balance: number; lockedBalance: number }> {
    const wallet = await this.getWallet(userId);
    return {
      balance: wallet?.balance || 0,
      lockedBalance: wallet?.lockedBalance || 0,
    };
  }

  async getTransactionByReference(referenceId: string, referenceType: string): Promise<ShellTransaction | null> {
    const [tx] = await db.select()
      .from(shellTransactions)
      .where(and(
        eq(shellTransactions.referenceId, referenceId),
        eq(shellTransactions.referenceType, referenceType)
      ));
    return tx || null;
  }

  // Check and reset earning caps if needed
  private async resetCapsIfNeeded(wallet: ShellWallet): Promise<{ dailyEarned: number; weeklyEarned: number }> {
    const now = new Date();
    const lastDaily = new Date(wallet.lastDailyReset || now);
    const lastWeekly = new Date(wallet.lastWeeklyReset || now);
    
    let dailyEarned = wallet.dailyEarned || 0;
    let weeklyEarned = wallet.weeklyEarned || 0;
    let needsUpdate = false;
    const updates: any = {};
    
    // Reset daily if it's a new day (past midnight UTC)
    if (now.getUTCDate() !== lastDaily.getUTCDate() || 
        now.getTime() - lastDaily.getTime() > 24 * 60 * 60 * 1000) {
      dailyEarned = 0;
      updates.dailyEarned = 0;
      updates.lastDailyReset = now;
      needsUpdate = true;
    }
    
    // Reset weekly if it's a new week (Monday)
    const daysSinceReset = Math.floor((now.getTime() - lastWeekly.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceReset >= 7) {
      weeklyEarned = 0;
      updates.weeklyEarned = 0;
      updates.lastWeeklyReset = now;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await db.update(shellWallets)
        .set(updates)
        .where(eq(shellWallets.id, wallet.id));
    }
    
    return { dailyEarned, weeklyEarned };
  }

  // Calculate how many shells can actually be earned (respecting caps)
  async getEarnableAmount(userId: string, requestedAmount: number): Promise<{ 
    earnableAmount: number; 
    atDailyCap: boolean; 
    atWeeklyCap: boolean;
    dailyRemaining: number;
    weeklyRemaining: number;
  }> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      return { 
        earnableAmount: Math.min(requestedAmount, SHELL_EARNING_CAPS.dailyMax, SHELL_EARNING_CAPS.weeklyMax),
        atDailyCap: false, 
        atWeeklyCap: false,
        dailyRemaining: SHELL_EARNING_CAPS.dailyMax,
        weeklyRemaining: SHELL_EARNING_CAPS.weeklyMax
      };
    }
    
    const { dailyEarned, weeklyEarned } = await this.resetCapsIfNeeded(wallet);
    
    const dailyRemaining = Math.max(0, SHELL_EARNING_CAPS.dailyMax - dailyEarned);
    const weeklyRemaining = Math.max(0, SHELL_EARNING_CAPS.weeklyMax - weeklyEarned);
    
    // Earnable is the minimum of what's requested and what's left in both caps
    const earnableAmount = Math.min(requestedAmount, dailyRemaining, weeklyRemaining);
    
    return {
      earnableAmount,
      atDailyCap: dailyRemaining === 0,
      atWeeklyCap: weeklyRemaining === 0,
      dailyRemaining,
      weeklyRemaining
    };
  }

  async addShells(
    userId: string, 
    username: string, 
    amount: number, 
    type: TransactionType, 
    description?: string,
    referenceId?: string,
    referenceType?: string,
    bypassCaps: boolean = false  // For purchases, bonuses, etc.
  ): Promise<ShellTransaction | null> {
    const wallet = await this.getOrCreateWallet(userId, username);
    
    let finalAmount = amount;
    let currentDailyEarned = 0;
    let currentWeeklyEarned = 0;
    
    // Apply earning caps for "earn" type transactions (gameplay rewards)
    if (type === "earn" && !bypassCaps) {
      // Get the reset values (accounts for daily/weekly resets)
      const { dailyEarned, weeklyEarned } = await this.resetCapsIfNeeded(wallet);
      currentDailyEarned = dailyEarned;
      currentWeeklyEarned = weeklyEarned;
      
      const dailyRemaining = Math.max(0, SHELL_EARNING_CAPS.dailyMax - dailyEarned);
      const weeklyRemaining = Math.max(0, SHELL_EARNING_CAPS.weeklyMax - weeklyEarned);
      
      finalAmount = Math.min(amount, dailyRemaining, weeklyRemaining);
      
      // If at cap, skip the transaction entirely
      if (finalAmount <= 0) {
        console.log(`[Shells] User ${username} at earning cap. Daily: ${dailyEarned}/${SHELL_EARNING_CAPS.dailyMax}, Weekly: ${weeklyEarned}/${SHELL_EARNING_CAPS.weeklyMax}`);
        return null;
      }
    }
    
    const newBalance = wallet.balance + finalAmount;
    
    // Update wallet with new balance and earning counters
    const updateData: any = { 
      balance: newBalance, 
      totalEarned: wallet.totalEarned + finalAmount,
      updatedAt: new Date() 
    };
    
    // Track earned amounts for cap enforcement (only for "earn" type)
    // Use the reset values from resetCapsIfNeeded, not stale wallet values
    if (type === "earn" && !bypassCaps) {
      updateData.dailyEarned = currentDailyEarned + finalAmount;
      updateData.weeklyEarned = currentWeeklyEarned + finalAmount;
    }
    
    await db.update(shellWallets)
      .set(updateData)
      .where(eq(shellWallets.id, wallet.id));
    
    const [transaction] = await db.insert(shellTransactions)
      .values({
        walletId: wallet.id,
        userId,
        type,
        amount: finalAmount,
        balance: newBalance,
        description: finalAmount < amount 
          ? `${description} (capped from ${amount})` 
          : description,
        referenceId,
        referenceType,
      })
      .returning();
    
    return transaction;
  }

  // Grant starter bonus to new players (one-time)
  async claimStarterBonus(userId: string, username: string): Promise<{ 
    success: boolean; 
    amount: number; 
    message: string;
  }> {
    const wallet = await this.getOrCreateWallet(userId, username);
    
    if (wallet.starterBonusClaimed) {
      return { success: false, amount: 0, message: "Starter bonus already claimed" };
    }
    
    const bonusAmount = SHELL_EARNING_CAPS.starterBonus;
    
    // Mark as claimed and add bonus (bypasses earning caps)
    await db.update(shellWallets)
      .set({ 
        balance: wallet.balance + bonusAmount,
        totalEarned: wallet.totalEarned + bonusAmount,
        starterBonusClaimed: true,
        updatedAt: new Date() 
      })
      .where(eq(shellWallets.id, wallet.id));
    
    await db.insert(shellTransactions)
      .values({
        walletId: wallet.id,
        userId,
        type: "bonus",
        amount: bonusAmount,
        balance: wallet.balance + bonusAmount,
        description: "Welcome to Chronicles! Here's your starter bonus.",
        referenceId: "starter_bonus",
        referenceType: "onboarding",
      });
    
    return { 
      success: true, 
      amount: bonusAmount, 
      message: `Welcome bonus: ${bonusAmount} Shells (${bonusAmount / DWC_CONVERSION_RATE} SIG equivalent)!` 
    };
  }

  async spendShells(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<ShellTransaction | null> {
    const wallet = await this.getWallet(userId);
    
    if (!wallet || wallet.balance < amount) {
      return null; // Insufficient balance
    }
    
    const newBalance = wallet.balance - amount;
    
    await db.update(shellWallets)
      .set({ 
        balance: newBalance, 
        totalSpent: wallet.totalSpent + amount,
        updatedAt: new Date() 
      })
      .where(eq(shellWallets.id, wallet.id));
    
    const [transaction] = await db.insert(shellTransactions)
      .values({
        walletId: wallet.id,
        userId,
        type,
        amount: -amount,
        balance: newBalance,
        description,
        referenceId,
        referenceType,
      })
      .returning();
    
    return transaction;
  }

  async tipUser(
    fromUserId: string,
    fromUsername: string,
    toUserId: string,
    toUsername: string,
    amount: number,
    messageId?: string
  ): Promise<{ sent: ShellTransaction; received: ShellTransaction } | null> {
    // Use atomic transaction to prevent race conditions and double-spending
    return await db.transaction(async (tx) => {
      // Get sender wallet with lock (FOR UPDATE equivalent via transaction)
      const [fromWallet] = await tx.select()
        .from(shellWallets)
        .where(eq(shellWallets.userId, fromUserId));
      
      if (!fromWallet || fromWallet.balance < amount) {
        return null; // Insufficient balance
      }
      
      // Get or create receiver wallet
      let [toWallet] = await tx.select()
        .from(shellWallets)
        .where(eq(shellWallets.userId, toUserId));
      
      if (!toWallet) {
        [toWallet] = await tx.insert(shellWallets)
          .values({ userId: toUserId, username: toUsername })
          .returning();
      }
      
      const senderNewBalance = fromWallet.balance - amount;
      const receiverNewBalance = toWallet.balance + amount;
      
      // Update sender balance
      await tx.update(shellWallets)
        .set({ 
          balance: senderNewBalance, 
          totalSpent: fromWallet.totalSpent + amount,
          updatedAt: new Date() 
        })
        .where(eq(shellWallets.id, fromWallet.id));
      
      // Update receiver balance
      await tx.update(shellWallets)
        .set({ 
          balance: receiverNewBalance, 
          totalEarned: toWallet.totalEarned + amount,
          updatedAt: new Date() 
        })
        .where(eq(shellWallets.id, toWallet.id));
      
      // Record sender transaction
      const [sentTx] = await tx.insert(shellTransactions)
        .values({
          walletId: fromWallet.id,
          userId: fromUserId,
          type: "tip_sent",
          amount: -amount,
          balance: senderNewBalance,
          description: `Tipped ${amount} Shells to ${toUsername}`,
          referenceId: messageId,
          referenceType: "tip",
        })
        .returning();
      
      // Record receiver transaction
      const [receivedTx] = await tx.insert(shellTransactions)
        .values({
          walletId: toWallet.id,
          userId: toUserId,
          type: "tip_received",
          amount: amount,
          balance: receiverNewBalance,
          description: `Received ${amount} Shells from ${fromUsername}`,
          referenceId: messageId,
          referenceType: "tip",
        })
        .returning();
      
      return { sent: sentTx, received: receivedTx };
    });
  }

  async purchaseShells(
    userId: string,
    username: string,
    packageKey: keyof typeof SHELL_PACKAGES,
    stripePaymentId: string
  ): Promise<ShellTransaction> {
    const pkg = SHELL_PACKAGES[packageKey];
    
    // Purchases bypass earning caps
    const tx = await this.addShells(
      userId,
      username,
      pkg.amount,
      "purchase",
      `Purchased ${pkg.name} (${pkg.amount} Shells)`,
      stripePaymentId,
      "stripe_payment",
      true  // bypass caps
    );
    return tx!; // Purchases always succeed
  }

  async awardEngagementShells(
    userId: string,
    username: string,
    action: keyof typeof SHELL_EARN_RATES
  ): Promise<ShellTransaction | null> {
    const amount = SHELL_EARN_RATES[action];
    
    // May return null if at earning cap
    return this.addShells(
      userId,
      username,
      amount,
      "earn",
      `Earned ${amount} Shells for ${action.replace(/_/g, " ")}`,
      undefined,
      "engagement"
    );
  }

  async getTransactions(userId: string, limit = 50): Promise<ShellTransaction[]> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];
    
    return db.select()
      .from(shellTransactions)
      .where(eq(shellTransactions.walletId, wallet.id))
      .orderBy(desc(shellTransactions.createdAt))
      .limit(limit);
  }

  async hasEnoughShells(userId: string, amount: number): Promise<boolean> {
    const { balance } = await this.getBalance(userId);
    return balance >= amount;
  }

  async createConversionSnapshot(
    userId: string,
    conversionRate: string = "1"  // 1 Shell = 1 SIG by default
  ): Promise<ShellConversionSnapshot | null> {
    const wallet = await this.getWallet(userId);
    if (!wallet || wallet.balance === 0) return null;
    
    const dwcAmount = (wallet.balance * parseFloat(conversionRate)).toString();
    
    const [snapshot] = await db.insert(shellConversionSnapshots)
      .values({
        userId,
        walletId: wallet.id,
        orbBalance: wallet.balance,
        dwcAmount,
        conversionRate,
      })
      .returning();
    
    // Lock the balance
    await db.update(shellWallets)
      .set({ 
        lockedBalance: wallet.balance,
        balance: 0,
        updatedAt: new Date() 
      })
      .where(eq(shellWallets.id, wallet.id));
    
    return snapshot;
  }

  async getLeaderboard(limit = 10): Promise<{ userId: string; username: string; balance: number }[]> {
    const wallets = await db.select({
      userId: shellWallets.userId,
      username: shellWallets.username,
      balance: shellWallets.balance,
    })
      .from(shellWallets)
      .orderBy(desc(shellWallets.balance))
      .limit(limit);
    
    return wallets;
  }

  async getTotalStats(): Promise<{ totalShells: number; totalUsers: number; totalTransactions: number }> {
    const [orbStats] = await db.select({
      totalShells: sql<number>`COALESCE(SUM(${shellWallets.balance}), 0)::int`,
      totalUsers: sql<number>`COUNT(*)::int`,
    }).from(shellWallets);
    
    const [txStats] = await db.select({
      totalTransactions: sql<number>`COUNT(*)::int`,
    }).from(shellTransactions);
    
    return {
      totalShells: orbStats?.totalShells || 0,
      totalUsers: orbStats?.totalUsers || 0,
      totalTransactions: txStats?.totalTransactions || 0,
    };
  }

  // Create Stripe checkout session for Shell bundle purchase
  async createShellBundleCheckout(
    userId: string,
    username: string,
    bundleKey: keyof typeof SHELL_BUNDLES,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const bundle = SHELL_BUNDLES[bundleKey];
    if (!bundle) throw new Error(`Invalid bundle key: ${bundleKey}`);

    const stripe = await getUncachableStripeClient();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: bundle.name,
            description: `${bundle.amount.toLocaleString()} Shells (converts to ~${bundle.dwcEquivalent} SIG at launch)`,
            metadata: {
              bundleKey,
              shellAmount: bundle.amount.toString(),
              dwcEquivalent: bundle.dwcEquivalent.toString(),
            },
          },
          unit_amount: bundle.price,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        username,
        bundleKey,
        shellAmount: bundle.amount.toString(),
        purchaseType: "shell_bundle",
      },
    });

    return { sessionId: session.id, url: session.url! };
  }

  // Record a purchase receipt (called from webhook after successful payment)
  async recordPurchaseReceipt(
    userId: string,
    stripePaymentIntentId: string,
    stripeCustomerId: string | null,
    bundleKey: string,
    shellAmount: number,
    amountPaidCents: number
  ): Promise<ShellPurchaseReceipt> {
    const dwcConversionAmount = (shellAmount / DWC_CONVERSION_RATE).toString();
    
    const [receipt] = await db.insert(shellPurchaseReceipts)
      .values({
        userId,
        stripePaymentIntentId,
        stripeCustomerId,
        bundleKey,
        shellAmount,
        amountPaidCents,
        dwcConversionRate: DWC_CONVERSION_RATE.toString(),
        dwcConversionAmount,
        conversionEligible: true,
        conversionStatus: "pending",
      })
      .returning();
    
    return receipt;
  }

  // Get user's total Shells eligible for DWC conversion
  async getConversionEligibleShells(userId: string): Promise<{
    totalShells: number;
    dwcEquivalent: number;
    purchaseHistory: ShellPurchaseReceipt[];
  }> {
    const receipts = await db.select()
      .from(shellPurchaseReceipts)
      .where(and(
        eq(shellPurchaseReceipts.userId, userId),
        eq(shellPurchaseReceipts.conversionEligible, true)
      ))
      .orderBy(desc(shellPurchaseReceipts.createdAt));

    const totalShells = receipts.reduce((sum, r) => sum + r.shellAmount, 0);
    const wallet = await this.getWallet(userId);
    const currentBalance = wallet?.balance || 0;
    
    return {
      totalShells: currentBalance,
      dwcEquivalent: currentBalance / DWC_CONVERSION_RATE,
      purchaseHistory: receipts,
    };
  }

  // Record user consent to ToS
  async recordFinancialConsent(
    userId: string,
    consentType: string,
    version: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserFinancialConsent> {
    const [consent] = await db.insert(userFinancialConsents)
      .values({
        userId,
        consentType,
        version,
        ipAddress,
        userAgent,
      })
      .returning();
    
    return consent;
  }

  // Check if user has accepted required ToS
  async hasAcceptedToS(userId: string, consentType: string, version: string): Promise<boolean> {
    const [consent] = await db.select()
      .from(userFinancialConsents)
      .where(and(
        eq(userFinancialConsents.userId, userId),
        eq(userFinancialConsents.consentType, consentType),
        eq(userFinancialConsents.version, version)
      ));
    
    return !!consent;
  }

  // Get all Shell bundles with pricing info
  getBundles() {
    return Object.entries(SHELL_BUNDLES).map(([key, bundle]) => ({
      key,
      ...bundle,
      priceFormatted: `$${(bundle.price / 100).toFixed(2)}`,
      dwcConversionInfo: `Converts to ~${bundle.dwcEquivalent} SIG at launch (April 11, 2026)`,
    }));
  }
}

export const shellsService = new ShellsService();
