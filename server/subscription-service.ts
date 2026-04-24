import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  subscriptions,
  whitelistedUsers,
  type Subscription,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from "@shared/schema";

export const SUBSCRIPTION_PLANS = {
  pulse_pro: {
    name: "Pulse Pro",
    monthlyPrice: 1499,
    annualPrice: 14999,
    trialDays: 2,
    features: [
      "Unlimited AI searches",
      "Advanced AI predictions",
      "Full technical analysis",
      "Real-time price alerts",
      "Fear & Greed analytics",
      "Knowledge Base access",
    ],
  },
  strike_agent: {
    name: "StrikeAgent Elite",
    monthlyPrice: 3000,
    annualPrice: 30000,
    trialDays: 2,
    features: [
      "AI-powered sniper bot",
      "Honeypot detection",
      "Anti-MEV protection",
      "Multi-chain support (23 chains)",
      "Built-in wallet",
      "Trade history & analytics",
    ],
  },
  complete_bundle: {
    name: "Trust Layer Complete",
    monthlyPrice: 3999,
    annualPrice: 39999,
    trialDays: 2,
    features: [
      "Everything in Pulse Pro",
      "Everything in StrikeAgent Elite",
      "Priority support",
      "Early feature access",
      "Guardian Bot access",
    ],
  },
  founder: {
    name: "Legacy Founder",
    oneTimePrice: 2400,
    durationMonths: 6,
    dwcTokens: 35000,
    features: [
      "Full access for 6 months",
      "35,000 SIG tokens (Apr 11, 2026)",
      "StrikeAgent access",
      "Founding member badge",
    ],
  },
  rm_monthly: {
    name: "RM+ Monthly",
    monthlyPrice: 800,
    trialDays: 3,
    features: [
      "Real trading enabled",
      "Unlimited AI discoveries",
      "Advanced safety (anti-MEV, honeypot)",
      "Multi-chain support (23 chains)",
      "Built-in wallet",
    ],
  },
  rm_annual: {
    name: "RM+ Annual",
    annualPrice: 8000,
    trialDays: 3,
    features: [
      "Everything in Monthly",
      "2 months FREE",
      "Priority support",
      "Early feature access",
    ],
  },
} as const;

class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return sub || null;
  }

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let sub = await this.getSubscription(userId);
    
    if (!sub) {
      const [newSub] = await db.insert(subscriptions)
        .values({ userId, plan: "free", status: "inactive" })
        .returning();
      sub = newSub;
    }
    
    return sub;
  }

  async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    status: string;
    isActive: boolean;
    isPremium: boolean;
    isWhitelisted: boolean;
    currentPeriodEnd: Date | null;
    trialEnd: Date | null;
    features: string[];
  }> {
    const [sub, whitelist] = await Promise.all([
      this.getSubscription(userId),
      this.isWhitelisted(userId),
    ]);

    if (whitelist) {
      return {
        plan: "whitelisted",
        status: "active",
        isActive: true,
        isPremium: true,
        isWhitelisted: true,
        currentPeriodEnd: null,
        trialEnd: null,
        features: ["All features unlocked via whitelist"],
      };
    }

    if (!sub) {
      return {
        plan: "free",
        status: "inactive",
        isActive: false,
        isPremium: false,
        isWhitelisted: false,
        currentPeriodEnd: null,
        trialEnd: null,
        features: ["20 searches/day", "3 price alerts/day"],
      };
    }

    const isActive = sub.status === "active" || sub.status === "trialing";
    const isPremium = isActive && sub.plan !== "free" && sub.plan !== "free_demo";

    const planConfig = SUBSCRIPTION_PLANS[sub.plan as keyof typeof SUBSCRIPTION_PLANS];
    const features = planConfig?.features ? [...planConfig.features] : ["Basic features"];

    return {
      plan: sub.plan,
      status: sub.status,
      isActive,
      isPremium,
      isWhitelisted: false,
      currentPeriodEnd: sub.currentPeriodEnd,
      trialEnd: sub.trialEnd,
      features,
    };
  }

  async isWhitelisted(userId: string): Promise<boolean> {
    const [user] = await db.select()
      .from(whitelistedUsers)
      .where(eq(whitelistedUsers.userId, userId));
    return !!user;
  }

  async addToWhitelist(userId: string, reason: string, addedBy: string): Promise<void> {
    await db.insert(whitelistedUsers)
      .values({ userId, reason, addedBy })
      .onConflictDoNothing();
  }

  async removeFromWhitelist(userId: string): Promise<void> {
    await db.delete(whitelistedUsers)
      .where(eq(whitelistedUsers.userId, userId));
  }

  async activateSubscription(
    userId: string,
    plan: SubscriptionPlanId,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    billingCycle: "monthly" | "annual",
    periodStart: Date,
    periodEnd: Date,
    trialEnd?: Date
  ): Promise<Subscription> {
    const status: SubscriptionStatus = trialEnd && trialEnd > new Date() ? "trialing" : "active";
    
    const [sub] = await db.insert(subscriptions)
      .values({
        userId,
        plan,
        status,
        billingCycle,
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart: trialEnd ? new Date() : null,
        trialEnd,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          plan,
          status,
          billingCycle,
          stripeCustomerId,
          stripeSubscriptionId,
          stripePriceId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialStart: trialEnd ? new Date() : undefined,
          trialEnd,
          cancelledAt: null,
          cancelReason: null,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return sub;
  }

  async activateFounder(
    userId: string,
    stripePaymentId: string
  ): Promise<Subscription> {
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    const [sub] = await db.insert(subscriptions)
      .values({
        userId,
        plan: "founder",
        status: "active",
        billingCycle: null,
        stripeCustomerId: stripePaymentId,
        founderPurchaseDate: purchaseDate,
        founderExpiryDate: expiryDate,
        dwcTokensAllocated: 35000,
        currentPeriodStart: purchaseDate,
        currentPeriodEnd: expiryDate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          plan: "founder",
          status: "active",
          billingCycle: null,
          stripeCustomerId: stripePaymentId,
          founderPurchaseDate: purchaseDate,
          founderExpiryDate: expiryDate,
          dwcTokensAllocated: 35000,
          currentPeriodStart: purchaseDate,
          currentPeriodEnd: expiryDate,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return sub;
  }

  async renewSubscription(
    stripeSubscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Subscription | null> {
    const [sub] = await db.update(subscriptions)
      .set({
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    
    return sub || null;
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
    cancelReason?: string
  ): Promise<Subscription | null> {
    const [sub] = await db.update(subscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    
    return sub || null;
  }

  async expireSubscription(stripeSubscriptionId: string): Promise<Subscription | null> {
    const [sub] = await db.update(subscriptions)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    
    return sub || null;
  }

  async markPastDue(stripeSubscriptionId: string): Promise<Subscription | null> {
    const [sub] = await db.update(subscriptions)
      .set({
        status: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    
    return sub || null;
  }

  async getByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return sub || null;
  }

  async getByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
    return sub || null;
  }

  hasFeatureAccess(plan: string, feature: string): boolean {
    const premiumFeatures = ["pulse_pro", "strike_agent", "complete_bundle", "founder", "rm_monthly", "rm_annual"];
    
    if (premiumFeatures.includes(plan)) {
      return true;
    }
    
    return false;
  }
}

export const subscriptionService = new SubscriptionService();
