/**
 * =====================================================
 * DARKWAVE CREDITS SERVICE
 * =====================================================
 * 
 * Manages user credits for AI-powered features.
 * Credits are used for:
 * - AI chat interactions
 * - Scenario generation
 * - Voice cloning
 * - Personality training
 */

import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { 
  userCredits, 
  creditTransactions, 
  creditPackages,
  type UserCredits,
  type CreditTransaction,
  type CreditPackage 
} from "@shared/schema";

// Credit costs for various actions
export const CREDIT_COSTS = {
  AI_CHAT_MESSAGE: 10,
  SCENARIO_GENERATION: 20,
  CHOICE_PROCESSING: 5,
  VOICE_CLONE_CREATION: 500,
  VOICE_TTS_PER_100_CHARS: 5,
  VOICE_STT_PER_MINUTE: 10,
  PERSONALITY_SUMMARY: 30,
} as const;

// Default credit packages
export const DEFAULT_PACKAGES: Omit<CreditPackage, "id" | "createdAt">[] = [
  {
    name: "Starter",
    credits: 1000,
    bonusCredits: 0,
    priceUsd: 1000, // $10.00
    stripePriceId: null,
    isActive: true,
    sortOrder: 1,
    description: "Perfect for trying out the AI features",
  },
  {
    name: "Builder",
    credits: 3000,
    bonusCredits: 500,
    priceUsd: 2500, // $25.00
    stripePriceId: null,
    isActive: true,
    sortOrder: 2,
    description: "Great for building your parallel self",
  },
  {
    name: "Architect",
    credits: 7000,
    bonusCredits: 1500,
    priceUsd: 5000, // $50.00
    stripePriceId: null,
    isActive: true,
    sortOrder: 3,
    description: "For serious world-builders",
  },
  {
    name: "Founder",
    credits: 15000,
    bonusCredits: 5000,
    priceUsd: 10000, // $100.00
    stripePriceId: null,
    isActive: true,
    sortOrder: 4,
    description: "Maximum value for founding members",
  },
];

class CreditsService {
  /**
   * Get or create a user's credit account
   */
  async getOrCreateUserCredits(userId: string): Promise<UserCredits> {
    const existing = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      // Check if daily usage needs reset
      const today = new Date().toISOString().split("T")[0];
      if (existing[0].dailyUsageDate !== today) {
        await db
          .update(userCredits)
          .set({ dailyUsageCount: 0, dailyUsageDate: today })
          .where(eq(userCredits.userId, userId));
        return { ...existing[0], dailyUsageCount: 0, dailyUsageDate: today };
      }
      return existing[0];
    }
    
    // Create new credit account with welcome bonus
    const today = new Date().toISOString().split("T")[0];
    const [newCredits] = await db
      .insert(userCredits)
      .values({
        userId,
        creditBalance: 100, // Welcome bonus
        bonusCredits: 100,
        lifetimeCreditsEarned: 100,
        dailyUsageDate: today,
      })
      .returning();
    
    // Record welcome bonus transaction
    await this.recordTransaction(userId, {
      type: "bonus",
      amount: 100,
      balanceAfter: 100,
      description: "Welcome bonus credits",
      category: "bonus",
      stripePaymentId: null,
    });
    
    return newCredits;
  }

  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const credits = await this.getOrCreateUserCredits(userId);
    return credits.creditBalance;
  }

  /**
   * Check if user has enough credits for an action
   */
  async hasCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct credits for an action
   * Returns true if successful, false if insufficient credits
   */
  async deductCredits(
    userId: string, 
    amount: number, 
    description: string,
    category: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const credits = await this.getOrCreateUserCredits(userId);
    
    if (credits.creditBalance < amount) {
      return { 
        success: false, 
        newBalance: credits.creditBalance,
        error: `Insufficient credits. Need ${amount}, have ${credits.creditBalance}`
      };
    }
    
    const newBalance = credits.creditBalance - amount;
    
    await db
      .update(userCredits)
      .set({
        creditBalance: newBalance,
        lifetimeCreditsSpent: credits.lifetimeCreditsSpent + amount,
        dailyUsageCount: credits.dailyUsageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));
    
    await this.recordTransaction(userId, {
      type: "usage",
      amount: -amount,
      balanceAfter: newBalance,
      description,
      category,
      stripePaymentId: null,
    });
    
    return { success: true, newBalance };
  }

  /**
   * Add credits to user account (purchase or bonus)
   */
  async addCredits(
    userId: string,
    amount: number,
    description: string,
    category: string,
    stripePaymentId?: string
  ): Promise<{ success: boolean; newBalance: number }> {
    const credits = await this.getOrCreateUserCredits(userId);
    const newBalance = credits.creditBalance + amount;
    
    await db
      .update(userCredits)
      .set({
        creditBalance: newBalance,
        lifetimeCreditsEarned: credits.lifetimeCreditsEarned + amount,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));
    
    await this.recordTransaction(userId, {
      type: category === "purchase" ? "purchase" : "bonus",
      amount,
      balanceAfter: newBalance,
      description,
      category,
      stripePaymentId: stripePaymentId || null,
    });
    
    return { success: true, newBalance };
  }

  /**
   * Record a credit transaction
   */
  private async recordTransaction(
    userId: string,
    data: Omit<CreditTransaction, "id" | "userId" | "createdAt">
  ): Promise<void> {
    await db.insert(creditTransactions).values({
      userId,
      ...data,
    });
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(sql`${creditTransactions.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Get available credit packages
   */
  async getPackages(): Promise<CreditPackage[]> {
    return db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.sortOrder);
  }

  /**
   * Initialize default credit packages
   */
  async initializePackages(): Promise<void> {
    const existing = await db.select().from(creditPackages).limit(1);
    if (existing.length > 0) return;
    
    for (const pkg of DEFAULT_PACKAGES) {
      await db.insert(creditPackages).values(pkg);
    }
    console.log("[Credits] Initialized default credit packages");
  }

  /**
   * Get a package by ID
   */
  async getPackageById(packageId: string): Promise<CreditPackage | null> {
    const [pkg] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, packageId))
      .limit(1);
    return pkg || null;
  }

  /**
   * Process a credit purchase via Stripe
   */
  async processPurchase(
    userId: string,
    packageId: string,
    stripePaymentId: string
  ): Promise<{ success: boolean; creditsAdded: number; newBalance: number }> {
    const pkg = await this.getPackageById(packageId);
    if (!pkg) {
      throw new Error("Invalid package ID");
    }
    
    const totalCredits = pkg.credits + pkg.bonusCredits;
    const result = await this.addCredits(
      userId,
      totalCredits,
      `Purchased ${pkg.name} package (${pkg.credits} + ${pkg.bonusCredits} bonus)`,
      "purchase",
      stripePaymentId
    );
    
    return {
      success: true,
      creditsAdded: totalCredits,
      newBalance: result.newBalance,
    };
  }

  /**
   * Check and enforce rate limits
   */
  async checkRateLimit(userId: string, maxDailyUsage = 100): Promise<{ allowed: boolean; remaining: number }> {
    const credits = await this.getOrCreateUserCredits(userId);
    const remaining = maxDailyUsage - credits.dailyUsageCount;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
    };
  }
}

export const creditsService = new CreditsService();
