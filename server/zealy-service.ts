import crypto from "crypto";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  zealyQuestMappings,
  zealyQuestEvents,
  shellRewardProfiles,
  type ZealyQuestMapping,
  type ZealyQuestEvent,
  type ShellRewardProfile,
} from "@shared/schema";
import { shellsService } from "./shells-service";
import { storage } from "./storage";

// Zealy API configuration
const ZEALY_API_BASE = "https://api-v2.zealy.io/public/communities";
const ZEALY_SUBDOMAIN = "darkwave";

// Tier multipliers for 90-day campaign
const TIER_CONFIG = {
  founders: { multiplier: 2.0, minQuests: 50, minDays: 30 },
  core: { multiplier: 1.5, minQuests: 20, minDays: 14 },
  active: { multiplier: 1.2, minQuests: 5, minDays: 7 },
  participant: { multiplier: 1.0, minQuests: 0, minDays: 0 },
};

// Cap on Founders tier (first 10 only)
const FOUNDERS_TIER_CAP = 10;

// Base reward per quest for 90-day campaign
// At 1,000 Shells per quest:
// - Founders (2x): 50 quests × 1,000 × 2 = 100,000 Shells = $100 at launch
// - Core (1.5x): 50 quests × 1,000 × 1.5 = 75,000 Shells = $75 at launch
// - Active (1.2x): 50 quests × 1,000 × 1.2 = 60,000 Shells = $60 at launch
// - Participant (1x): 50 quests × 1,000 × 1 = 50,000 Shells = $50 at launch
export const RECOMMENDED_QUEST_REWARD = 1000;

export interface ZealyWebhookPayload {
  userId: string;
  communityId: string;
  subdomain: string;
  questId: string;
  requestId: string;
  accounts: {
    email?: string;
    wallet?: string;
    discord?: { id: string; handle: string };
    twitter?: { id: string; username: string };
  };
}

export interface ZealyWebhookResult {
  success: boolean;
  message?: string;
  error?: string;
  shellsAwarded?: number;
}

class ZealyService {
  verifyWebhookSignature(
    payload: string,
    signature: string | undefined,
    secret: string | undefined
  ): boolean {
    // Require webhook secret for security
    if (!secret) {
      console.warn("[Zealy] ZEALY_WEBHOOK_SECRET not configured - rejecting request");
      return false;
    }
    
    if (!signature) {
      console.warn("[Zealy] No signature provided in request");
      return false;
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  async processWebhook(
    payload: ZealyWebhookPayload
  ): Promise<ZealyWebhookResult> {
    const { userId: zealyUserId, questId, requestId, accounts, communityId } = payload;

    const existingEvent = await db
      .select()
      .from(zealyQuestEvents)
      .where(eq(zealyQuestEvents.zealyRequestId, requestId))
      .limit(1);

    if (existingEvent.length > 0) {
      return {
        success: true,
        message: "Request already processed",
        shellsAwarded: existingEvent[0].shellsGranted || 0,
      };
    }

    let [questMapping] = await db
      .select()
      .from(zealyQuestMappings)
      .where(
        and(
          eq(zealyQuestMappings.zealyQuestId, questId),
          eq(zealyQuestMappings.isActive, true)
        )
      );

    // AUTO-CREATE mapping if it doesn't exist - use default reward
    if (!questMapping) {
      console.log(`[Zealy] Auto-creating quest mapping for ${questId} with default ${RECOMMENDED_QUEST_REWARD} shells`);
      const [newMapping] = await db.insert(zealyQuestMappings).values({
        zealyQuestId: questId,
        zealyQuestName: `Zealy Quest ${questId}`,
        shellsReward: RECOMMENDED_QUEST_REWARD,
        dwcReward: "0",
        reputationReward: 0,
        maxRewardsPerUser: 1,
        totalRewardsCap: null,
        currentRewards: 0,
        isActive: true,
      }).returning();
      questMapping = newMapping;
    }

    if (
      questMapping.totalRewardsCap &&
      questMapping.currentRewards >= questMapping.totalRewardsCap
    ) {
      await this.logEvent({
        zealyUserId,
        zealyQuestId: questId,
        zealyRequestId: requestId,
        zealyCommunityId: communityId || null,
        userId: null,
        walletAddress: null,
        email: null,
        discordId: null,
        twitterHandle: null,
        status: "rejected",
        errorMessage: "Total rewards cap reached",
        shellsGranted: 0,
        dwcGranted: "0",
        rawPayload: JSON.stringify(payload),
      });

      return {
        success: false,
        error: "Quest rewards have been fully distributed",
      };
    }

    const userRewardCount = await this.getUserRewardCount(
      zealyUserId,
      questId
    );
    if (
      questMapping.maxRewardsPerUser &&
      userRewardCount >= questMapping.maxRewardsPerUser
    ) {
      await this.logEvent({
        zealyUserId,
        zealyQuestId: questId,
        zealyRequestId: requestId,
        zealyCommunityId: communityId || null,
        userId: null,
        walletAddress: null,
        email: null,
        discordId: null,
        twitterHandle: null,
        status: "rejected",
        errorMessage: "User max rewards reached",
        shellsGranted: 0,
        dwcGranted: "0",
        rawPayload: JSON.stringify(payload),
      });

      return {
        success: false,
        error: "You have already claimed the maximum rewards for this quest",
      };
    }

    try {
      let shellsAwarded = 0;
      const internalUserId = await this.findInternalUser(accounts);

      if (internalUserId && questMapping.shellsReward > 0) {
        const username = accounts.twitter?.username || accounts.discord?.handle || accounts.email || `zealy_${zealyUserId}`;
        
        // Get or create reward profile and apply tier multiplier
        const profile = await this.getOrCreateRewardProfile(internalUserId, zealyUserId, username, accounts.wallet);
        const multiplier = parseFloat(profile.multiplier);
        const baseReward = questMapping.shellsReward;
        const multipliedReward = Math.floor(baseReward * multiplier);
        
        await shellsService.addShells(
          internalUserId,
          username,
          multipliedReward,
          "bonus",  // Use "bonus" type to bypass earning caps for campaign rewards
          `Zealy quest: ${questMapping.zealyQuestName}${multiplier > 1 ? ` (${multiplier}x ${profile.tier} bonus)` : ""}`,
          questMapping.zealyQuestId,
          "zealy_quest",
          true  // bypassCaps: Zealy campaign rewards are not subject to daily/weekly limits
        );
        shellsAwarded = multipliedReward;
        
        // Update profile stats
        await this.updateRewardProfileStats(internalUserId);
      }

      await this.logEvent({
        zealyUserId,
        zealyQuestId: questId,
        zealyRequestId: requestId,
        zealyCommunityId: communityId || null,
        userId: internalUserId || null,
        walletAddress: accounts.wallet || null,
        email: accounts.email || null,
        discordId: accounts.discord?.id || null,
        twitterHandle: accounts.twitter?.username || null,
        status: "processed",
        shellsGranted: shellsAwarded,
        dwcGranted: "0",
        rawPayload: JSON.stringify(payload),
        errorMessage: null,
      });

      await db
        .update(zealyQuestMappings)
        .set({
          currentRewards: questMapping.currentRewards + 1,
          updatedAt: new Date(),
        })
        .where(eq(zealyQuestMappings.id, questMapping.id));

      return {
        success: true,
        message: shellsAwarded > 0 
          ? `Awarded ${shellsAwarded} Shells!` 
          : "Quest completed! (Link your Trust Layer account to receive Shells)",
        shellsAwarded,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await this.logEvent({
        zealyUserId,
        zealyQuestId: questId,
        zealyRequestId: requestId,
        zealyCommunityId: communityId || null,
        userId: null,
        walletAddress: null,
        email: null,
        discordId: null,
        twitterHandle: null,
        status: "failed",
        errorMessage,
        shellsGranted: 0,
        dwcGranted: "0",
        rawPayload: JSON.stringify(payload),
      });

      return {
        success: false,
        error: "Failed to process reward",
      };
    }
  }

  private async findInternalUser(accounts: ZealyWebhookPayload["accounts"]): Promise<string | null> {
    if (accounts.email) {
      const user = await storage.getUserByEmail(accounts.email);
      // Only return user if their email is verified - prevents bot/fake accounts
      if (user && (user as any).emailVerified) {
        return user.id;
      }
    }
    return null;
  }

  private async getUserRewardCount(
    zealyUserId: string,
    zealyQuestId: string
  ): Promise<number> {
    const events = await db
      .select()
      .from(zealyQuestEvents)
      .where(
        and(
          eq(zealyQuestEvents.zealyUserId, zealyUserId),
          eq(zealyQuestEvents.zealyQuestId, zealyQuestId),
          eq(zealyQuestEvents.status, "processed")
        )
      );

    return events.length;
  }

  private async logEvent(
    event: {
      zealyUserId: string;
      zealyQuestId: string;
      zealyRequestId: string;
      zealyCommunityId: string | null;
      userId: string | null;
      walletAddress: string | null;
      email: string | null;
      discordId: string | null;
      twitterHandle: string | null;
      status: string;
      errorMessage: string | null;
      shellsGranted: number;
      dwcGranted: string;
      rawPayload: string;
    }
  ): Promise<void> {
    await db.insert(zealyQuestEvents).values({
      ...event,
      processedAt: event.status === "processed" ? new Date() : null,
    });
  }

  // Get or create a reward profile for tier tracking
  async getOrCreateRewardProfile(
    userId: string,
    zealyUserId?: string,
    zealyUsername?: string,
    walletAddress?: string
  ): Promise<ShellRewardProfile> {
    const [existing] = await db
      .select()
      .from(shellRewardProfiles)
      .where(eq(shellRewardProfiles.userId, userId))
      .limit(1);

    if (existing) {
      // Update Zealy/wallet info if provided
      if (zealyUserId || walletAddress) {
        const updates: Partial<ShellRewardProfile> = { updatedAt: new Date() };
        if (zealyUserId && !existing.zealyUserId) updates.zealyUserId = zealyUserId;
        if (zealyUsername && !existing.zealyUsername) updates.zealyUsername = zealyUsername;
        if (walletAddress && !existing.walletAddress) {
          updates.walletAddress = walletAddress;
          updates.hasWallet = true;
          updates.walletVerifiedAt = new Date();
        }
        if (Object.keys(updates).length > 1) {
          await db
            .update(shellRewardProfiles)
            .set(updates)
            .where(eq(shellRewardProfiles.id, existing.id));
        }
      }
      return existing;
    }

    // Create new profile
    const [profile] = await db
      .insert(shellRewardProfiles)
      .values({
        userId,
        zealyUserId: zealyUserId || null,
        zealyUsername: zealyUsername || null,
        walletAddress: walletAddress || null,
        hasWallet: !!walletAddress,
        walletVerifiedAt: walletAddress ? new Date() : null,
        tier: "participant",
        multiplier: "1.0",
      })
      .returning();

    return profile;
  }

  // Update profile stats and recalculate tier
  private async updateRewardProfileStats(userId: string): Promise<void> {
    const [profile] = await db
      .select()
      .from(shellRewardProfiles)
      .where(eq(shellRewardProfiles.userId, userId))
      .limit(1);

    if (!profile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    let consecutiveDays = profile.consecutiveDays;
    
    // Check if this is a new day
    if (!lastActive || lastActive.getTime() < today.getTime()) {
      // Check if consecutive
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        consecutiveDays = consecutiveDays + 1;
      } else if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
        consecutiveDays = 1; // Reset streak
      }
    }

    const totalQuests = profile.totalQuestsCompleted + 1;
    
    // Calculate tier based on activity
    let tier: keyof typeof TIER_CONFIG = "participant";
    let multiplier = "1.0";
    
    // Check if user qualifies for Founders tier
    const qualifiesForFounders = totalQuests >= TIER_CONFIG.founders.minQuests && consecutiveDays >= TIER_CONFIG.founders.minDays;
    
    if (qualifiesForFounders) {
      // Check if user is already a founder (keep their tier)
      if (profile.tier === "founders") {
        tier = "founders";
        multiplier = TIER_CONFIG.founders.multiplier.toString();
      } else {
        // Check if Founders cap has been reached
        const foundersCount = await this.getFoundersTierCount();
        if (foundersCount < FOUNDERS_TIER_CAP) {
          tier = "founders";
          multiplier = TIER_CONFIG.founders.multiplier.toString();
          console.log(`[Zealy] User ${userId} promoted to Founders tier (${foundersCount + 1}/${FOUNDERS_TIER_CAP})`);
        } else {
          // Cap reached, assign Core tier instead
          tier = "core";
          multiplier = TIER_CONFIG.core.multiplier.toString();
          console.log(`[Zealy] User ${userId} qualifies for Founders but cap reached (${foundersCount}/${FOUNDERS_TIER_CAP}), assigned Core`);
        }
      }
    } else if (totalQuests >= TIER_CONFIG.core.minQuests && consecutiveDays >= TIER_CONFIG.core.minDays) {
      tier = "core";
      multiplier = TIER_CONFIG.core.multiplier.toString();
    } else if (totalQuests >= TIER_CONFIG.active.minQuests && consecutiveDays >= TIER_CONFIG.active.minDays) {
      tier = "active";
      multiplier = TIER_CONFIG.active.multiplier.toString();
    }

    await db
      .update(shellRewardProfiles)
      .set({
        totalQuestsCompleted: totalQuests,
        consecutiveDays,
        lastActiveDate: new Date(),
        tier,
        multiplier,
        updatedAt: new Date(),
      })
      .where(eq(shellRewardProfiles.userId, userId));
  }

  // Get user's reward profile
  async getRewardProfile(userId: string): Promise<ShellRewardProfile | null> {
    const [profile] = await db
      .select()
      .from(shellRewardProfiles)
      .where(eq(shellRewardProfiles.userId, userId))
      .limit(1);
    return profile || null;
  }

  // Check if user can withdraw/redeem (requires wallet)
  async canWithdraw(userId: string): Promise<{ canWithdraw: boolean; reason?: string }> {
    const profile = await this.getRewardProfile(userId);
    if (!profile) {
      return { canWithdraw: false, reason: "No reward profile found" };
    }
    if (!profile.hasWallet || !profile.walletAddress) {
      return { canWithdraw: false, reason: "Wallet required for withdrawals. Connect your Trust Layer wallet to redeem Shells." };
    }
    return { canWithdraw: true };
  }

  // Link wallet to profile
  async linkWallet(userId: string, walletAddress: string): Promise<ShellRewardProfile | null> {
    const [updated] = await db
      .update(shellRewardProfiles)
      .set({
        walletAddress,
        hasWallet: true,
        walletVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shellRewardProfiles.userId, userId))
      .returning();
    return updated || null;
  }

  // Get count of users in Founders tier
  async getFoundersTierCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(shellRewardProfiles)
      .where(eq(shellRewardProfiles.tier, "founders"));
    return Number(result[0]?.count || 0);
  }

  async getQuestMappings(): Promise<ZealyQuestMapping[]> {
    return db.select().from(zealyQuestMappings).orderBy(zealyQuestMappings.createdAt);
  }

  async createQuestMapping(data: {
    zealyQuestId: string;
    zealyQuestName: string;
    shellsReward: number;
    dwcReward?: string;
    reputationReward?: number;
    maxRewardsPerUser?: number;
    totalRewardsCap?: number;
  }): Promise<ZealyQuestMapping> {
    const [mapping] = await db
      .insert(zealyQuestMappings)
      .values(data)
      .returning();
    return mapping;
  }

  async updateQuestMapping(
    id: string,
    data: Partial<{
      zealyQuestName: string;
      shellsReward: number;
      dwcReward: string;
      reputationReward: number;
      maxRewardsPerUser: number;
      totalRewardsCap: number;
      isActive: boolean;
    }>
  ): Promise<ZealyQuestMapping | null> {
    const [mapping] = await db
      .update(zealyQuestMappings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(zealyQuestMappings.id, id))
      .returning();
    return mapping || null;
  }

  async getRecentEvents(limit: number = 50): Promise<ZealyQuestEvent[]> {
    return db
      .select()
      .from(zealyQuestEvents)
      .orderBy(zealyQuestEvents.createdAt)
      .limit(limit);
  }

  // ============================================
  // ZEALY API SYNC - Pulls quest completions directly
  // ============================================

  async syncFromApi(): Promise<{ processed: number; awarded: number; errors: string[] }> {
    const apiKey = process.env.ZEALY_API_KEY;
    if (!apiKey) {
      console.error("[Zealy API] ZEALY_API_KEY not configured");
      return { processed: 0, awarded: 0, errors: ["ZEALY_API_KEY not configured"] };
    }

    const results = { processed: 0, awarded: 0, errors: [] as string[] };
    let cursor: string | null = null;
    let hasMore = true;

    try {
      while (hasMore) {
        const url = cursor 
          ? `${ZEALY_API_BASE}/${ZEALY_SUBDOMAIN}/reviews?cursor=${encodeURIComponent(cursor)}`
          : `${ZEALY_API_BASE}/${ZEALY_SUBDOMAIN}/reviews`;

        console.log(`[Zealy API] Fetching: ${url}`);

        const response = await fetch(url, {
          headers: {
            "x-api-key": apiKey,
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Zealy API] Error ${response.status}: ${errorText}`);
          results.errors.push(`API error ${response.status}: ${errorText}`);
          break;
        }

        const data = await response.json() as {
          items: Array<{
            id: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
              verifiedAddresses?: {
                email?: string;
                wallet?: string;
              };
            };
            quest: {
              id: string;
              name: string;
            };
            status: string;
            createdAt: string;
          }>;
          nextCursor?: string;
        };

        console.log(`[Zealy API] Got ${data.items?.length || 0} reviews`);

        if (!data.items || data.items.length === 0) {
          hasMore = false;
          break;
        }

        for (const review of data.items) {
          // Only process approved quests
          if (review.status !== "success" && review.status !== "approved") {
            continue;
          }

          results.processed++;

          try {
            await this.processApiReview(review);
            results.awarded++;
          } catch (error: any) {
            const errMsg = `Failed to process review ${review.id}: ${error.message}`;
            console.error(`[Zealy API] ${errMsg}`);
            results.errors.push(errMsg);
          }
        }

        cursor = data.nextCursor || null;
        hasMore = !!cursor;

        // Rate limit protection - 50 req/sec max
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error: any) {
      console.error(`[Zealy API] Sync failed:`, error);
      results.errors.push(`Sync failed: ${error.message}`);
    }

    console.log(`[Zealy API] Sync complete: ${results.processed} processed, ${results.awarded} awarded, ${results.errors.length} errors`);
    return results;
  }

  private async processApiReview(review: {
    id: string;
    user: {
      id: string;
      name: string;
      verifiedAddresses?: {
        email?: string;
        wallet?: string;
      };
    };
    quest: {
      id: string;
      name: string;
    };
    createdAt: string;
  }): Promise<void> {
    const zealyUserId = review.user.id;
    const questId = review.quest.id;
    const requestId = review.id; // Use review ID as unique request ID

    // Check if already processed
    const existingEvent = await db
      .select()
      .from(zealyQuestEvents)
      .where(eq(zealyQuestEvents.zealyRequestId, requestId))
      .limit(1);

    if (existingEvent.length > 0) {
      return; // Already processed
    }

    // Get or create quest mapping
    let mapping = await db
      .select()
      .from(zealyQuestMappings)
      .where(
        and(
          eq(zealyQuestMappings.zealyQuestId, questId),
          eq(zealyQuestMappings.isActive, true)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!mapping) {
      console.log(`[Zealy API] Auto-creating quest mapping for ${questId}: ${review.quest.name}`);
      const [newMapping] = await db.insert(zealyQuestMappings).values({
        zealyQuestId: questId,
        zealyQuestName: review.quest.name || `Zealy Quest ${questId}`,
        shellsReward: RECOMMENDED_QUEST_REWARD,
        isActive: true,
      }).returning();
      mapping = newMapping;
    }

    // Extract email and wallet from Zealy data
    const verifiedAddresses = (review.user.verifiedAddresses || {}) as Record<string, string>;
    const email = verifiedAddresses.email || null;
    
    // Get first wallet address (prefer eth-mainnet, then any *-mainnet)
    const walletKeys = Object.keys(verifiedAddresses).filter(k => k.includes('mainnet'));
    const primaryWallet = verifiedAddresses['eth-mainnet'] || 
                          verifiedAddresses['sol-mainnet'] || 
                          (walletKeys.length > 0 ? verifiedAddresses[walletKeys[0]] : null);
    
    let userId: string | null = null;

    // Try to find DarkWave user by email first
    if (email) {
      const user = await storage.getUserByEmail(email);
      if (user) {
        userId = user.id;
      }
    }

    // If no email match, try wallet match via affiliate profiles
    if (!userId && primaryWallet) {
      try {
        const result = await db.execute(sql`
          SELECT user_id FROM user_affiliate_profiles 
          WHERE LOWER(dwc_wallet_address) = ${primaryWallet.toLowerCase()}
          LIMIT 1
        `);
        const rows = result.rows as Array<{ user_id: string }>;
        if (rows.length > 0 && rows[0].user_id) {
          userId = rows[0].user_id;
        }
      } catch (e) {
        // Table might not exist or no match, continue
      }
    }

    // Record the event with all available data
    await db.insert(zealyQuestEvents).values({
      zealyUserId,
      zealyQuestId: questId,
      zealyRequestId: requestId,
      zealyCommunityId: ZEALY_SUBDOMAIN,
      userId: userId || null,
      walletAddress: primaryWallet || null,
      email: email || null,
      status: userId ? "processed" : "pending_user_match",
      shellsGranted: userId ? mapping.shellsReward : 0,
      rawPayload: JSON.stringify(review),
      processedAt: userId ? new Date() : null,
    });

    // Award shells if user found
    if (userId && mapping.shellsReward > 0) {
      await shellsService.addShells(
        userId,
        review.user.name || "Zealy User",
        mapping.shellsReward,
        "bonus",
        `Zealy Quest: ${review.quest.name || questId}`,
        requestId,
        "zealy_quest",
        true // bypass caps for Zealy rewards
      );
      console.log(`[Zealy API] Awarded ${mapping.shellsReward} shells to user ${userId} for quest ${review.quest.name}`);
    }
  }

  // Get pending events that need user matching
  async getPendingUserMatches(): Promise<ZealyQuestEvent[]> {
    return db
      .select()
      .from(zealyQuestEvents)
      .where(eq(zealyQuestEvents.status, "pending_user_match"));
  }

  // Retry matching pending events to users
  async retryPendingMatches(): Promise<{ matched: number; stillPending: number }> {
    const pending = await this.getPendingUserMatches();
    let matched = 0;

    for (const event of pending) {
      if (!event.email) continue;

      const user = await storage.getUserByEmail(event.email);
      if (user) {
        // Get the quest mapping for shell reward
        const mapping = await db
          .select()
          .from(zealyQuestMappings)
          .where(eq(zealyQuestMappings.zealyQuestId, event.zealyQuestId))
          .limit(1)
          .then((r) => r[0]);

        const shellReward = mapping?.shellsReward || RECOMMENDED_QUEST_REWARD;

        // Update event with user match
        await db
          .update(zealyQuestEvents)
          .set({
            userId: user.id,
            status: "processed",
            shellsGranted: shellReward,
            processedAt: new Date(),
          })
          .where(eq(zealyQuestEvents.id, event.id));

        // Award shells
        await shellsService.addShells(
          user.id,
          user.username || "Zealy User",
          shellReward,
          "bonus",
          `Zealy Quest: ${mapping?.zealyQuestName || event.zealyQuestId}`,
          event.zealyRequestId,
          "zealy_quest",
          true
        );

        matched++;
        console.log(`[Zealy API] Matched pending event to user ${user.id}, awarded ${shellReward} shells`);
      }
    }

    return { matched, stillPending: pending.length - matched };
  }
}

export const zealyService = new ZealyService();
