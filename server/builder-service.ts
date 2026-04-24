import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import {
  communityBuilders,
  contributionTypes,
  builderContributions,
  contributionVotes,
  contributionReviews,
  builderBadges,
  builderTiers,
  type CommunityBuilder,
  type ContributionType,
  type BuilderContribution,
  type ContributionVote,
  type ContributionReview,
  type BuilderBadge,
  type BuilderTier,
} from "@shared/schema";
import { shellsService } from "./shells-service";

// XP requirements per level (exponential curve)
const XP_PER_LEVEL = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100,    // Levels 1-10
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100,  // Levels 11-20
  20050, 22100, 24250, 26500, 28850, 31300, 33850, 36500, 39250, 42100,  // Levels 21-30
];

class BuilderService {
  // Get or create a builder profile
  async getOrCreateBuilder(userId: string, username: string): Promise<CommunityBuilder> {
    const existing = await db.select().from(communityBuilders)
      .where(eq(communityBuilders.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newBuilder] = await db.insert(communityBuilders)
      .values({
        userId,
        username,
        displayName: username,
      })
      .returning();
    
    console.log(`[Builder] Created new builder profile for ${username}`);
    return newBuilder;
  }

  async getBuilder(userId: string): Promise<CommunityBuilder | null> {
    const [builder] = await db.select().from(communityBuilders)
      .where(eq(communityBuilders.userId, userId))
      .limit(1);
    return builder || null;
  }

  async getBuilderById(builderId: string): Promise<CommunityBuilder | null> {
    const [builder] = await db.select().from(communityBuilders)
      .where(eq(communityBuilders.id, builderId))
      .limit(1);
    return builder || null;
  }

  // Get all tiers
  async getTiers(): Promise<BuilderTier[]> {
    return db.select().from(builderTiers).orderBy(builderTiers.tier);
  }

  // Get contribution types available for a tier
  async getContributionTypes(tier: number = 1): Promise<ContributionType[]> {
    return db.select().from(contributionTypes)
      .where(and(
        eq(contributionTypes.isActive, true),
        lte(contributionTypes.minTier, tier)
      ));
  }

  // Get all badges
  async getBadges(): Promise<BuilderBadge[]> {
    return db.select().from(builderBadges)
      .where(eq(builderBadges.isActive, true));
  }

  // Add XP and handle level ups
  async addXp(builderId: string, xpAmount: number): Promise<{ newLevel: number; leveledUp: boolean }> {
    const builder = await this.getBuilderById(builderId);
    if (!builder) return { newLevel: 1, leveledUp: false };
    
    const newTotalXp = builder.totalXp + xpAmount;
    let newLevel = builder.level;
    let leveledUp = false;
    
    // Check for level ups
    while (newLevel < XP_PER_LEVEL.length && newTotalXp >= XP_PER_LEVEL[newLevel]) {
      newLevel++;
      leveledUp = true;
    }
    
    await db.update(communityBuilders)
      .set({
        totalXp: newTotalXp,
        level: newLevel,
        currentLevelXp: newTotalXp - (XP_PER_LEVEL[newLevel - 1] || 0),
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, builderId));
    
    if (leveledUp) {
      console.log(`[Builder] ${builder.username} leveled up to ${newLevel}!`);
      await this.checkTierEligibility(builderId);
    }
    
    return { newLevel, leveledUp };
  }

  // Check if builder is eligible for tier upgrade
  async checkTierEligibility(builderId: string): Promise<{ eligible: boolean; nextTier: BuilderTier | null }> {
    const builder = await this.getBuilderById(builderId);
    if (!builder) return { eligible: false, nextTier: null };
    
    const tiers = await this.getTiers();
    const currentTierIndex = tiers.findIndex(t => t.tier === builder.tier);
    const nextTier = tiers[currentTierIndex + 1];
    
    if (!nextTier) return { eligible: false, nextTier: null };
    
    const meetsLevel = builder.level >= nextTier.minLevel;
    const meetsContributions = builder.approvedContributions >= nextTier.minApprovedContributions;
    const meetsReputation = builder.reputationScore >= nextTier.minReputationScore;
    
    const eligible = meetsLevel && meetsContributions && meetsReputation;
    
    // Auto-upgrade for tiers that don't require application
    if (eligible && !nextTier.requiresApplication) {
      await this.upgradeTier(builderId, nextTier.tier);
    }
    
    return { eligible, nextTier };
  }

  // Upgrade builder tier
  async upgradeTier(builderId: string, newTier: number): Promise<boolean> {
    const tiers = await this.getTiers();
    const tier = tiers.find(t => t.tier === newTier);
    if (!tier) return false;
    
    await db.update(communityBuilders)
      .set({
        tier: newTier,
        tierName: tier.name,
        canSubmitObjects: tier.canSubmitObjects,
        canSubmitQuests: tier.canSubmitQuests,
        canSubmitEras: tier.canSubmitEras,
        canReviewContent: tier.canReviewContent,
        tierUpgradeStatus: "none",
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, builderId));
    
    console.log(`[Builder] Upgraded to tier ${newTier}: ${tier.name}`);
    return true;
  }

  // Create a new contribution
  async createContribution(
    builderId: string,
    userId: string,
    typeCode: string,
    title: string,
    description: string,
    contentData: object,
    targetEra?: string,
    category?: string
  ): Promise<BuilderContribution> {
    const [contribution] = await db.insert(builderContributions)
      .values({
        builderId,
        userId,
        contributionTypeCode: typeCode,
        title,
        description,
        contentData: JSON.stringify(contentData),
        targetEra,
        category,
        status: "draft",
      })
      .returning();
    
    // Update builder stats
    await db.update(communityBuilders)
      .set({
        totalContributions: sql`${communityBuilders.totalContributions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, builderId));
    
    return contribution;
  }

  // Submit contribution for review
  async submitContribution(contributionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const [contribution] = await db.select().from(builderContributions)
      .where(and(
        eq(builderContributions.id, contributionId),
        eq(builderContributions.userId, userId)
      ))
      .limit(1);
    
    if (!contribution) {
      return { success: false, message: "Contribution not found" };
    }
    
    if (contribution.status !== "draft") {
      return { success: false, message: "Only drafts can be submitted" };
    }
    
    await db.update(builderContributions)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(builderContributions.id, contributionId));
    
    await db.update(communityBuilders)
      .set({
        pendingContributions: sql`${communityBuilders.pendingContributions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, contribution.builderId));
    
    return { success: true, message: "Contribution submitted for review" };
  }

  // Vote on a contribution
  async voteOnContribution(
    contributionId: string,
    voterId: string,
    voterUserId: string,
    voteType: "up" | "down",
    comment?: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if already voted
    const existingVote = await db.select().from(contributionVotes)
      .where(and(
        eq(contributionVotes.contributionId, contributionId),
        eq(contributionVotes.voterUserId, voterUserId)
      ))
      .limit(1);
    
    if (existingVote.length > 0) {
      return { success: false, message: "You have already voted on this contribution" };
    }
    
    // Add vote
    await db.insert(contributionVotes)
      .values({
        contributionId,
        voterId,
        voterUserId,
        voteType,
        comment,
      });
    
    // Update contribution vote counts
    const voteChange = voteType === "up" ? 1 : -1;
    await db.update(builderContributions)
      .set({
        upvotes: voteType === "up" ? sql`${builderContributions.upvotes} + 1` : builderContributions.upvotes,
        downvotes: voteType === "down" ? sql`${builderContributions.downvotes} + 1` : builderContributions.downvotes,
        voteScore: sql`${builderContributions.voteScore} + ${voteChange}`,
        updatedAt: new Date(),
      })
      .where(eq(builderContributions.id, contributionId));
    
    // Update contribution author's reputation
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, contributionId))
      .limit(1);
    
    if (contribution) {
      const repChange = voteType === "up" ? 2 : -1;
      await db.update(communityBuilders)
        .set({
          reputationScore: sql`GREATEST(0, ${communityBuilders.reputationScore} + ${repChange})`,
          upvotesReceived: voteType === "up" ? sql`${communityBuilders.upvotesReceived} + 1` : communityBuilders.upvotesReceived,
          downvotesReceived: voteType === "down" ? sql`${communityBuilders.downvotesReceived} + 1` : communityBuilders.downvotesReceived,
          updatedAt: new Date(),
        })
        .where(eq(communityBuilders.id, contribution.builderId));
    }
    
    // Check if voting threshold reached
    await this.checkVotingThreshold(contributionId);
    
    return { success: true, message: `Vote recorded` };
  }

  // Check if voting threshold is met for auto-approval
  async checkVotingThreshold(contributionId: string): Promise<void> {
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, contributionId))
      .limit(1);
    
    if (!contribution || contribution.status !== "submitted") return;
    
    const [typeInfo] = await db.select().from(contributionTypes)
      .where(eq(contributionTypes.code, contribution.contributionTypeCode))
      .limit(1);
    
    if (!typeInfo) return;
    
    const votesRequired = typeInfo.votesRequiredForApproval ?? 5;
    const approvalThreshold = typeInfo.approvalPercentRequired ?? 60;
    
    const totalVotes = contribution.upvotes + contribution.downvotes;
    if (totalVotes < votesRequired) return;
    
    const approvalPercent = (contribution.upvotes / totalVotes) * 100;
    
    if (approvalPercent >= approvalThreshold) {
      // Auto-approve based on community votes
      await this.approveContribution(contributionId, null, "Community vote threshold reached", "standard");
    }
  }

  // Approve a contribution (by reviewer or system)
  async approveContribution(
    contributionId: string,
    reviewerId: string | null,
    feedback: string,
    qualityRating: string = "standard"
  ): Promise<{ success: boolean; message: string }> {
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, contributionId))
      .limit(1);
    
    if (!contribution) {
      return { success: false, message: "Contribution not found" };
    }
    
    const [typeInfo] = await db.select().from(contributionTypes)
      .where(eq(contributionTypes.code, contribution.contributionTypeCode))
      .limit(1);
    
    if (!typeInfo) {
      return { success: false, message: "Invalid contribution type" };
    }
    
    // Calculate rewards
    const qualityMultipliers: Record<string, number> = JSON.parse(typeInfo.qualityMultipliers || '{}');
    const multiplier = qualityMultipliers[qualityRating] || 1.0;
    
    const shellReward = Math.floor(typeInfo.baseShellReward * multiplier);
    const xpReward = Math.floor(typeInfo.xpReward * multiplier);
    
    // Update contribution
    await db.update(builderContributions)
      .set({
        status: "approved",
        qualityRating,
        reviewCompletedAt: new Date(),
        reviewNotes: feedback,
        shellRewardAmount: shellReward,
        xpRewardAmount: xpReward,
        updatedAt: new Date(),
      })
      .where(eq(builderContributions.id, contributionId));
    
    // Insert review record for audit trail
    if (reviewerId) {
      const reviewer = await this.getBuilderById(reviewerId);
      if (reviewer) {
        await db.insert(contributionReviews).values({
          contributionId,
          reviewerId,
          reviewerUserId: reviewer.userId,
          decision: "approve",
          qualityRating,
          feedback,
          shellsAwarded: shellReward,
          xpAwarded: xpReward,
        });
      }
    }
    
    // Update builder stats
    await db.update(communityBuilders)
      .set({
        approvedContributions: sql`${communityBuilders.approvedContributions} + 1`,
        pendingContributions: sql`GREATEST(0, ${communityBuilders.pendingContributions} - 1)`,
        totalShellsEarned: sql`${communityBuilders.totalShellsEarned} + ${shellReward}`,
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, contribution.builderId));
    
    // Award XP
    await this.addXp(contribution.builderId, xpReward);
    
    // Award shells to user's wallet
    const builder = await this.getBuilderById(contribution.builderId);
    if (builder) {
      await shellsService.addShells(
        builder.userId,
        builder.displayName,
        shellReward,
        "bonus",
        `Builder reward: ${contribution.title} (${qualityRating})`,
        contributionId,
        "builder_contribution",
        true // bypass earning caps
      );
    }
    
    // Check for badge unlocks
    await this.checkBadges(contribution.builderId);
    
    console.log(`[Builder] Approved contribution: ${contribution.title}, awarded ${shellReward} Shells and ${xpReward} XP`);
    
    return { success: true, message: `Approved! Earned ${shellReward} Shells and ${xpReward} XP` };
  }

  // Check and award badges
  async checkBadges(builderId: string): Promise<string[]> {
    const builder = await this.getBuilderById(builderId);
    if (!builder) return [];
    
    const allBadges = await this.getBadges();
    const currentBadges: string[] = JSON.parse(builder.badges || "[]");
    const newBadges: string[] = [];
    
    for (const badge of allBadges) {
      if (currentBadges.includes(badge.code)) continue;
      
      const requirements = JSON.parse(badge.requirements || "{}");
      let earned = true;
      
      for (const [key, value] of Object.entries(requirements)) {
        if (key === "total_contributions" && builder.totalContributions < (value as number)) earned = false;
        if (key === "approved_contributions" && builder.approvedContributions < (value as number)) earned = false;
        if (key === "upvotes_received" && builder.upvotesReceived < (value as number)) earned = false;
      }
      
      if (earned) {
        newBadges.push(badge.code);
        console.log(`[Builder] ${builder.username} earned badge: ${badge.name}`);
        
        // Award badge rewards
        if (badge.shellReward && badge.shellReward > 0) {
          await shellsService.addShells(
            builder.userId,
            builder.username,
            badge.shellReward,
            "bonus",
            `Badge earned: ${badge.name}`,
            badge.code,
            "badge_reward",
            true
          );
        }
        
        if (badge.xpReward && badge.xpReward > 0) {
          await this.addXp(builderId, badge.xpReward);
        }
      }
    }
    
    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      await db.update(communityBuilders)
        .set({
          badges: JSON.stringify(updatedBadges),
          updatedAt: new Date(),
        })
        .where(eq(communityBuilders.id, builderId));
    }
    
    return newBadges;
  }

  // Get builder's contributions
  async getContributions(userId: string, status?: string): Promise<BuilderContribution[]> {
    if (status) {
      return db.select().from(builderContributions)
        .where(and(
          eq(builderContributions.userId, userId),
          eq(builderContributions.status, status)
        ))
        .orderBy(desc(builderContributions.createdAt));
    }
    
    return db.select().from(builderContributions)
      .where(eq(builderContributions.userId, userId))
      .orderBy(desc(builderContributions.createdAt));
  }

  // Get contributions pending review
  async getPendingReviews(reviewerTier: number): Promise<BuilderContribution[]> {
    // Get contribution types this reviewer can review
    const types = await db.select().from(contributionTypes)
      .where(lte(contributionTypes.reviewerMinTier, reviewerTier));
    
    const typeCodes = types.map(t => t.code);
    
    return db.select().from(builderContributions)
      .where(eq(builderContributions.status, "submitted"))
      .orderBy(builderContributions.submittedAt);
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 20): Promise<CommunityBuilder[]> {
    return db.select().from(communityBuilders)
      .where(eq(communityBuilders.isActive, true))
      .orderBy(desc(communityBuilders.totalXp))
      .limit(limit);
  }

  // Reject a contribution
  async rejectContribution(
    contributionId: string,
    reviewerId: string,
    feedback: string
  ): Promise<{ success: boolean; message: string }> {
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, contributionId))
      .limit(1);
    
    if (!contribution) {
      return { success: false, message: "Contribution not found" };
    }
    
    if (contribution.status !== "submitted") {
      return { success: false, message: "Contribution is not in submitted status" };
    }
    
    // Update contribution
    await db.update(builderContributions)
      .set({
        status: "rejected",
        reviewCompletedAt: new Date(),
        reviewNotes: feedback,
        updatedAt: new Date(),
      })
      .where(eq(builderContributions.id, contributionId));
    
    // Insert review record for audit trail
    const reviewer = await this.getBuilderById(reviewerId);
    if (reviewer) {
      await db.insert(contributionReviews).values({
        contributionId,
        reviewerId,
        reviewerUserId: reviewer.userId,
        decision: "reject",
        feedback,
        shellsAwarded: 0,
        xpAwarded: 0,
      });
    }
    
    // Update builder stats
    await db.update(communityBuilders)
      .set({
        pendingContributions: sql`GREATEST(0, ${communityBuilders.pendingContributions} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(communityBuilders.id, contribution.builderId));
    
    console.log(`[Builder] Rejected contribution: ${contribution.title}`);
    
    return { success: true, message: "Contribution rejected" };
  }

  // Make contribution live (after approval)
  async makeContributionLive(contributionId: string): Promise<{ success: boolean; message: string }> {
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, contributionId))
      .limit(1);
    
    if (!contribution) {
      return { success: false, message: "Contribution not found" };
    }
    
    if (contribution.status !== "approved") {
      return { success: false, message: "Contribution must be approved before going live" };
    }
    
    await db.update(builderContributions)
      .set({
        status: "live",
        updatedAt: new Date(),
      })
      .where(eq(builderContributions.id, contributionId));
    
    // Award bonus XP for going live
    const builder = await this.getBuilderById(contribution.builderId);
    if (builder) {
      await this.addXp(contribution.builderId, 25); // Bonus XP for live content
    }
    
    console.log(`[Builder] Contribution now live: ${contribution.title}`);
    
    return { success: true, message: "Contribution is now live!" };
  }

  // Get a single contribution by ID
  async getContributionById(id: string): Promise<BuilderContribution | null> {
    const [contribution] = await db.select().from(builderContributions)
      .where(eq(builderContributions.id, id))
      .limit(1);
    return contribution || null;
  }
}

export const builderService = new BuilderService();
