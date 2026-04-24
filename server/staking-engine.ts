import { db } from "./db";
import { stakingPools, userStakes, stakingRewards, stakingQuests, userQuestProgress, stakingLeaderboard, type StakingPool, type UserStake, type StakingReward, type StakingQuest, type UserQuestProgress, type StakingLeaderboard } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

export interface StakingStats {
  totalValueLocked: string;
  totalStakers: number;
  totalRewardsDistributed: string;
  averageApy: string;
}

export interface PoolWithStats extends StakingPool {
  effectiveApy: string;
  userStake?: UserStake;
}

class StakingEngine {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const existingPools = await db.select().from(stakingPools);
    if (existingPools.length === 0) {
      await this.seedDefaultPools();
      await this.seedDefaultQuests();
    }

    this.initialized = true;
    console.log("[Staking Engine] Initialized");
  }

  private async seedDefaultPools(): Promise<void> {
    const defaultPools = [
      {
        name: "Liquid Flex",
        slug: "liquid-flex",
        description: "Maximum flexibility with no lock period. Withdraw your SIG anytime while earning competitive yields.",
        poolType: "liquid",
        apyBase: "10",
        apyBoost: "2",
        lockDays: 0,
        minStake: "100",
        totalStaked: "0",
        totalStakers: 0,
        isActive: true,
      },
      {
        name: "Core Guard 45",
        slug: "core-guard-45",
        description: "Lock your SIG for 45 days to earn enhanced rewards. Perfect for medium-term holders.",
        poolType: "locked",
        apyBase: "14",
        apyBoost: "3",
        lockDays: 45,
        minStake: "500",
        totalStaked: "0",
        totalStakers: 0,
        isActive: true,
      },
      {
        name: "Core Guard 90",
        slug: "core-guard-90",
        description: "Commit for 90 days and unlock premium yields. Ideal for believers in the Trust Layer vision.",
        poolType: "locked",
        apyBase: "18",
        apyBoost: "4",
        lockDays: 90,
        minStake: "1000",
        totalStaked: "0",
        totalStakers: 0,
        isActive: true,
      },
      {
        name: "Core Guard 180",
        slug: "core-guard-180",
        description: "The ultimate commitment. Lock for 180 days and receive our highest standard APY plus exclusive perks.",
        poolType: "locked",
        apyBase: "24",
        apyBoost: "5",
        lockDays: 180,
        minStake: "2500",
        totalStaked: "0",
        totalStakers: 0,
        isActive: true,
      },
      {
        name: "Founders Forge",
        slug: "founders-forge",
        description: "Exclusive pre-launch pool for Genesis supporters. Limited availability with maximum rewards and lifetime perks.",
        poolType: "founders",
        apyBase: "30",
        apyBoost: "8",
        lockDays: 365,
        minStake: "5000",
        totalStaked: "0",
        totalStakers: 0,
        isActive: true,
        endsAt: new Date("2026-04-11"),
      },
    ];

    for (const pool of defaultPools) {
      await db.insert(stakingPools).values(pool);
    }

    console.log("[Staking Engine] Seeded default pools");
  }

  private async seedDefaultQuests(): Promise<void> {
    const defaultQuests = [
      {
        title: "First Steps",
        description: "Stake at least 100 SIG in any pool",
        questType: "stake_amount",
        requirement: JSON.stringify({ minAmount: "100" }),
        rewardDwt: "50",
        apyBoost: "0.5",
        isActive: true,
      },
      {
        title: "Diamond Hands",
        description: "Maintain a stake for 7 consecutive days",
        questType: "stake_duration",
        requirement: JSON.stringify({ minDays: 7 }),
        rewardDwt: "100",
        rewardBadge: "diamond-hands",
        apyBoost: "0.5",
        isActive: true,
      },
      {
        title: "Whale Watcher",
        description: "Stake 10,000 SIG or more",
        questType: "stake_amount",
        requirement: JSON.stringify({ minAmount: "10000" }),
        rewardDwt: "500",
        rewardBadge: "whale",
        apyBoost: "1",
        isActive: true,
      },
      {
        title: "Loyalty Legend",
        description: "Maintain a stake for 30 consecutive days",
        questType: "stake_duration",
        requirement: JSON.stringify({ minDays: 30 }),
        rewardDwt: "300",
        rewardBadge: "loyalty-legend",
        apyBoost: "1",
        isActive: true,
      },
      {
        title: "Bridge Pioneer",
        description: "Complete at least one bridge transaction",
        questType: "bridge",
        requirement: JSON.stringify({ minBridges: 1 }),
        rewardDwt: "200",
        rewardBadge: "bridge-pioneer",
        apyBoost: "0.5",
        isActive: true,
      },
    ];

    for (const quest of defaultQuests) {
      await db.insert(stakingQuests).values(quest);
    }

    console.log("[Staking Engine] Seeded default quests");
  }

  async getPools(): Promise<StakingPool[]> {
    await this.initialize();
    return db.select().from(stakingPools).where(eq(stakingPools.isActive, true));
  }

  async getPool(poolId: string): Promise<StakingPool | undefined> {
    const [pool] = await db.select().from(stakingPools).where(eq(stakingPools.id, poolId));
    return pool;
  }

  async getPoolBySlug(slug: string): Promise<StakingPool | undefined> {
    const [pool] = await db.select().from(stakingPools).where(eq(stakingPools.slug, slug));
    return pool;
  }

  async getStakingStats(): Promise<StakingStats> {
    await this.initialize();
    
    const pools = await db.select().from(stakingPools);
    const allStakes = await db.select().from(userStakes).where(eq(userStakes.status, "active"));
    const allRewards = await db.select().from(stakingRewards).where(eq(stakingRewards.status, "claimed"));

    const totalValueLocked = pools.reduce((sum, pool) => sum + parseFloat(pool.totalStaked || "0"), 0);
    const totalStakers = new Set(allStakes.map(s => s.userId)).size;
    const totalRewardsDistributed = allRewards.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    const averageApy = pools.length > 0
      ? pools.reduce((sum, p) => sum + parseFloat(p.apyBase || "0"), 0) / pools.length
      : 0;

    return {
      totalValueLocked: totalValueLocked.toFixed(2),
      totalStakers,
      totalRewardsDistributed: totalRewardsDistributed.toFixed(2),
      averageApy: averageApy.toFixed(1),
    };
  }

  async getUserStakes(userId: string): Promise<UserStake[]> {
    return db.select().from(userStakes)
      .where(and(eq(userStakes.userId, userId), eq(userStakes.status, "active")));
  }

  async getUserStake(userId: string, poolId: string): Promise<UserStake | undefined> {
    const [stake] = await db.select().from(userStakes)
      .where(and(
        eq(userStakes.userId, userId),
        eq(userStakes.poolId, poolId),
        eq(userStakes.status, "active")
      ));
    return stake;
  }

  async stake(userId: string, poolId: string, amount: string): Promise<UserStake> {
    const pool = await this.getPool(poolId);
    if (!pool) throw new Error("Pool not found");
    if (!pool.isActive) throw new Error("Pool is not active");

    const amountNum = parseFloat(amount);
    const minStake = parseFloat(pool.minStake || "0");
    if (amountNum < minStake) {
      throw new Error(`Minimum stake is ${minStake} SIG`);
    }

    if (pool.maxStake) {
      const maxStake = parseFloat(pool.maxStake);
      const existingStake = await this.getUserStake(userId, poolId);
      const existingAmount = existingStake ? parseFloat(existingStake.amount) : 0;
      if (existingAmount + amountNum > maxStake) {
        throw new Error(`Maximum stake is ${maxStake} SIG`);
      }
    }

    const lockedUntil = pool.lockDays > 0
      ? new Date(Date.now() + pool.lockDays * SECONDS_PER_DAY * 1000)
      : null;

    const existingStake = await this.getUserStake(userId, poolId);

    if (existingStake) {
      const newAmount = (parseFloat(existingStake.amount) + amountNum).toString();
      const [updatedStake] = await db.update(userStakes)
        .set({
          amount: newAmount,
          lockedUntil: lockedUntil || existingStake.lockedUntil,
        })
        .where(eq(userStakes.id, existingStake.id))
        .returning();

      await this.updatePoolStats(poolId);
      await this.updateLeaderboard(userId);
      return updatedStake;
    }

    const [newStake] = await db.insert(userStakes).values({
      userId,
      poolId,
      amount,
      lockedUntil,
      status: "active",
    }).returning();

    await this.updatePoolStats(poolId);
    await this.updateLeaderboard(userId);

    return newStake;
  }

  async unstake(userId: string, stakeId: string, amount?: string): Promise<UserStake> {
    const [stake] = await db.select().from(userStakes).where(eq(userStakes.id, stakeId));
    if (!stake) throw new Error("Stake not found");
    if (stake.userId !== userId) throw new Error("Unauthorized");
    if (stake.status !== "active") throw new Error("Stake is not active");

    if (stake.lockedUntil && new Date(stake.lockedUntil) > new Date()) {
      const daysRemaining = Math.ceil((new Date(stake.lockedUntil).getTime() - Date.now()) / (SECONDS_PER_DAY * 1000));
      throw new Error(`Stake is locked for ${daysRemaining} more days`);
    }

    const unstakeAmount = amount ? parseFloat(amount) : parseFloat(stake.amount);
    const currentAmount = parseFloat(stake.amount);

    if (unstakeAmount > currentAmount) {
      throw new Error("Insufficient staked amount");
    }

    if (unstakeAmount === currentAmount) {
      const [updatedStake] = await db.update(userStakes)
        .set({
          status: "completed",
          unstakedAt: new Date(),
        })
        .where(eq(userStakes.id, stakeId))
        .returning();

      await this.updatePoolStats(stake.poolId);
      await this.updateLeaderboard(userId);
      return updatedStake;
    }

    const newAmount = (currentAmount - unstakeAmount).toString();
    const [updatedStake] = await db.update(userStakes)
      .set({ amount: newAmount })
      .where(eq(userStakes.id, stakeId))
      .returning();

    await this.updatePoolStats(stake.poolId);
    await this.updateLeaderboard(userId);
    return updatedStake;
  }

  async calculatePendingRewards(stake: UserStake): Promise<string> {
    const pool = await this.getPool(stake.poolId);
    if (!pool) return "0";

    const stakedAmount = parseFloat(stake.amount);
    const apy = parseFloat(pool.apyBase) + parseFloat(pool.apyBoost || "0");
    const lastRewardTime = new Date(stake.lastRewardAt).getTime();
    const now = Date.now();
    const secondsElapsed = (now - lastRewardTime) / 1000;

    const annualReward = stakedAmount * (apy / 100);
    const rewardPerSecond = annualReward / SECONDS_PER_YEAR;
    const pendingReward = rewardPerSecond * secondsElapsed;

    return (parseFloat(stake.pendingRewards || "0") + pendingReward).toFixed(6);
  }

  async claimRewards(userId: string, stakeId: string): Promise<StakingReward> {
    const [stake] = await db.select().from(userStakes).where(eq(userStakes.id, stakeId));
    if (!stake) throw new Error("Stake not found");
    if (stake.userId !== userId) throw new Error("Unauthorized");

    const pendingRewards = await this.calculatePendingRewards(stake);
    if (parseFloat(pendingRewards) <= 0) {
      throw new Error("No rewards to claim");
    }

    const [reward] = await db.insert(stakingRewards).values({
      userId,
      stakeId,
      amount: pendingRewards,
      rewardType: "staking",
      status: "claimed",
      claimedAt: new Date(),
    }).returning();

    const newClaimedTotal = (parseFloat(stake.claimedRewards || "0") + parseFloat(pendingRewards)).toString();
    await db.update(userStakes)
      .set({
        pendingRewards: "0",
        claimedRewards: newClaimedTotal,
        lastRewardAt: new Date(),
      })
      .where(eq(userStakes.id, stakeId));

    await this.updateLeaderboard(userId);
    return reward;
  }

  async getQuests(): Promise<StakingQuest[]> {
    await this.initialize();
    return db.select().from(stakingQuests).where(eq(stakingQuests.isActive, true));
  }

  async getUserQuestProgress(userId: string): Promise<UserQuestProgress[]> {
    return db.select().from(userQuestProgress).where(eq(userQuestProgress.userId, userId));
  }

  async getLeaderboard(limit: number = 10): Promise<StakingLeaderboard[]> {
    return db.select().from(stakingLeaderboard)
      .orderBy(desc(stakingLeaderboard.totalStaked))
      .limit(limit);
  }

  async getUserLeaderboardPosition(userId: string): Promise<StakingLeaderboard | undefined> {
    const [entry] = await db.select().from(stakingLeaderboard).where(eq(stakingLeaderboard.userId, userId));
    return entry;
  }

  private async updatePoolStats(poolId: string): Promise<void> {
    const stakes = await db.select().from(userStakes)
      .where(and(eq(userStakes.poolId, poolId), eq(userStakes.status, "active")));

    const totalStaked = stakes.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);
    const totalStakers = stakes.length;

    await db.update(stakingPools)
      .set({
        totalStaked: totalStaked.toString(),
        totalStakers,
      })
      .where(eq(stakingPools.id, poolId));
  }

  private async updateLeaderboard(userId: string): Promise<void> {
    const userStakesData = await this.getUserStakes(userId);
    const totalStaked = userStakesData.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);
    
    const rewards = await db.select().from(stakingRewards)
      .where(and(eq(stakingRewards.userId, userId), eq(stakingRewards.status, "claimed")));
    const totalRewards = rewards.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

    const longestStreak = Math.max(...userStakesData.map(s => s.streakDays || 0), 0);

    const questProgress = await this.getUserQuestProgress(userId);
    const questsCompleted = questProgress.filter(q => q.status === "claimed").length;

    const existingEntry = await this.getUserLeaderboardPosition(userId);

    if (existingEntry) {
      await db.update(stakingLeaderboard)
        .set({
          totalStaked: totalStaked.toString(),
          totalRewards: totalRewards.toString(),
          longestStreak,
          questsCompleted,
          updatedAt: new Date(),
        })
        .where(eq(stakingLeaderboard.userId, userId));
    } else if (totalStaked > 0) {
      await db.insert(stakingLeaderboard).values({
        userId,
        totalStaked: totalStaked.toString(),
        totalRewards: totalRewards.toString(),
        longestStreak,
        questsCompleted,
      });
    }
  }

  async getPoolsWithUserStakes(userId?: string): Promise<PoolWithStats[]> {
    const pools = await this.getPools();
    const poolsWithStats: PoolWithStats[] = [];

    for (const pool of pools) {
      const effectiveApy = (parseFloat(pool.apyBase) + parseFloat(pool.apyBoost || "0")).toFixed(1);
      let userStake: UserStake | undefined;

      if (userId) {
        userStake = await this.getUserStake(userId, pool.id);
      }

      poolsWithStats.push({
        ...pool,
        effectiveApy,
        userStake,
      });
    }

    return poolsWithStats;
  }
}

export const stakingEngine = new StakingEngine();
