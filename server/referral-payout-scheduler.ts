/**
 * Referral Payout Scheduler
 * Runs twice daily at 8:00 AM and 8:00 PM Central (2:00 PM and 2:00 AM UTC)
 * Checks for pending referrals and processes Shell rewards
 * 
 * MULTIPLIER-BASED Reward Structure:
 * - Base signup reward: 1,000 Shells per referral
 * - Purchase multipliers (applied to base):
 *   - No purchase: 1x (1,000 Shells)
 *   - $5-$24: 3x (3,000 Shells)
 *   - $25-$49: 5x (5,000 Shells)
 *   - $50-$99: 7x (7,000 Shells)
 *   - $100+: 10x (10,000 Shells)
 * 
 * 90-day sprint target: 270 referrals = ~880,000 Shells = ~$880 at TGE
 */

import { db } from "./db";
import { sql, eq, and, isNull, lt } from "drizzle-orm";
import { shellsService } from "./shells-service";
import { referrals, commissionPayouts, affiliateProfiles } from "@shared/schema";

const PAYOUT_TIMES_UTC = [14, 2]; // 2 PM UTC (8 AM CST) and 2 AM UTC (8 PM CST)
const CHECK_INTERVAL_MS = 60_000; // Check every minute

const BASE_REWARD = 1000; // Base shells per signup

const PURCHASE_MULTIPLIERS = {
  none: 1,      // No purchase: 1,000 Shells
  tier_5: 3,    // $5-$24: 3,000 Shells  
  tier_25: 5,   // $25-$49: 5,000 Shells
  tier_50: 7,   // $50-$99: 7,000 Shells
  tier_100: 10, // $100+: 10,000 Shells
};

interface SchedulerState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  lastCheck: Date | null;
  lastPayoutHour: number | null;
  todayPayoutsRun: number[];
  stats: {
    totalProcessed: number;
    totalShellsAwarded: number;
    lastRunAt: Date | null;
  };
}

const schedulerState: SchedulerState = {
  isRunning: false,
  intervalId: null,
  lastCheck: null,
  lastPayoutHour: null,
  todayPayoutsRun: [],
  stats: {
    totalProcessed: 0,
    totalShellsAwarded: 0,
    lastRunAt: null,
  },
};

interface PendingReferral {
  id: number;
  referrerId: string;
  refereeId: string;
  status: string;
  referrerReward: number | null;
  shellsPaid: boolean;
  conversionValue: number | null;
  createdAt: Date;
}

async function getPendingReferrals(): Promise<PendingReferral[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        id, 
        referrer_id as "referrerId", 
        referee_id as "refereeId",
        status,
        referrer_reward as "referrerReward",
        COALESCE(shells_paid, false) as "shellsPaid",
        conversion_value as "conversionValue",
        created_at as "createdAt"
      FROM referrals 
      WHERE (shells_paid IS NULL OR shells_paid = false)
        AND status IN ('pending', 'qualified', 'converted')
      ORDER BY created_at ASC
      LIMIT 100
    `);
    
    return result.rows as unknown as PendingReferral[];
  } catch (error) {
    console.error("[Referral Payout] Error fetching pending referrals:", error);
    return [];
  }
}

function getMultiplier(amountCents: number): { multiplier: number; tierName: string } {
  const amountDollars = amountCents / 100;
  
  if (amountDollars >= 100) return { multiplier: PURCHASE_MULTIPLIERS.tier_100, tierName: "10x ($100+)" };
  if (amountDollars >= 50) return { multiplier: PURCHASE_MULTIPLIERS.tier_50, tierName: "7x ($50-99)" };
  if (amountDollars >= 25) return { multiplier: PURCHASE_MULTIPLIERS.tier_25, tierName: "5x ($25-49)" };
  if (amountDollars >= 5) return { multiplier: PURCHASE_MULTIPLIERS.tier_5, tierName: "3x ($5-24)" };
  return { multiplier: PURCHASE_MULTIPLIERS.none, tierName: "1x (no purchase)" };
}

async function processReferralPayout(referral: PendingReferral): Promise<{ success: boolean; shellsAwarded: number }> {
  try {
    let multiplierInfo = { multiplier: 1, tierName: "1x (signup only)" };
    
    if (referral.conversionValue && referral.conversionValue >= 500) {
      multiplierInfo = getMultiplier(referral.conversionValue);
    }
    
    const totalShells = BASE_REWARD * multiplierInfo.multiplier;
    const description = multiplierInfo.multiplier > 1
      ? `Referral ${multiplierInfo.tierName} - $${(referral.conversionValue! / 100).toFixed(2)} purchase - User ${referral.refereeId.substring(0, 8)}`
      : `Referral signup (1x) - User ${referral.refereeId.substring(0, 8)}`;
    
    const referenceId = `referral_payout_${referral.id}_${Date.now()}`;
    
    await shellsService.addShells(
      referral.referrerId,
      "Referrer",
      totalShells,
      "bonus",
      description,
      referenceId,
      "referral_reward",
      true
    );
    
    await db.execute(sql`
      UPDATE referrals 
      SET shells_paid = true, 
          shells_paid_at = NOW(),
          shells_amount = ${totalShells}
      WHERE id = ${referral.id}
    `);
    
    console.log(`[Referral Payout] Awarded ${totalShells} shells to ${referral.referrerId} for referral ${referral.id}`);
    
    return { success: true, shellsAwarded: totalShells };
  } catch (error: any) {
    if (error.message?.includes("duplicate")) {
      await db.execute(sql`UPDATE referrals SET shells_paid = true WHERE id = ${referral.id}`);
      return { success: true, shellsAwarded: 0 };
    }
    console.error(`[Referral Payout] Error processing referral ${referral.id}:`, error);
    return { success: false, shellsAwarded: 0 };
  }
}

async function executePayoutRun(): Promise<{ success: boolean; processed: number; totalShells: number }> {
  const runTime = new Date();
  console.log(`[Referral Payout] Executing payout run at ${runTime.toISOString()}`);
  
  try {
    const pendingReferrals = await getPendingReferrals();
    
    if (pendingReferrals.length === 0) {
      console.log("[Referral Payout] No pending referrals to process");
      return { success: true, processed: 0, totalShells: 0 };
    }
    
    console.log(`[Referral Payout] Found ${pendingReferrals.length} pending referrals`);
    
    let processedCount = 0;
    let totalShellsAwarded = 0;
    
    for (const referral of pendingReferrals) {
      const result = await processReferralPayout(referral);
      if (result.success) {
        processedCount++;
        totalShellsAwarded += result.shellsAwarded;
      }
    }
    
    schedulerState.stats.totalProcessed += processedCount;
    schedulerState.stats.totalShellsAwarded += totalShellsAwarded;
    schedulerState.stats.lastRunAt = runTime;
    
    console.log(`[Referral Payout] Completed: ${processedCount} referrals processed, ${totalShellsAwarded} shells awarded`);
    
    await db.execute(sql`
      INSERT INTO audit_logs (event_type, event_data, created_at)
      VALUES ('referral_payout_run', ${JSON.stringify({
        executedAt: runTime.toISOString(),
        pendingReferrals: pendingReferrals.length,
        processedCount,
        totalShellsAwarded,
      })}, NOW())
    `).catch(() => {});
    
    return { success: true, processed: processedCount, totalShells: totalShellsAwarded };
  } catch (error: any) {
    console.error("[Referral Payout] Execution error:", error);
    return { success: false, processed: 0, totalShells: 0 };
  }
}

async function checkAndExecute(): Promise<void> {
  schedulerState.lastCheck = new Date();
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDate = now.toDateString();
  
  if (schedulerState.todayPayoutsRun.length > 0) {
    const lastRunDate = new Date(schedulerState.lastCheck || now).toDateString();
    if (lastRunDate !== currentDate) {
      schedulerState.todayPayoutsRun = [];
    }
  }
  
  if (PAYOUT_TIMES_UTC.includes(currentHour) && !schedulerState.todayPayoutsRun.includes(currentHour)) {
    console.log(`[Referral Payout] Payout time detected (${currentHour}:00 UTC / ${currentHour === 14 ? '8 AM' : '8 PM'} CST)`);
    
    const result = await executePayoutRun();
    
    if (result.success) {
      schedulerState.todayPayoutsRun.push(currentHour);
      schedulerState.lastPayoutHour = currentHour;
    }
  }
}

export function startReferralPayoutScheduler(): void {
  if (schedulerState.isRunning) {
    console.log("[Referral Payout] Scheduler already running");
    return;
  }
  
  console.log("[Referral Payout] Starting automatic referral payout scheduler");
  console.log(`[Referral Payout] Payouts scheduled at 8:00 AM and 8:00 PM Central`);
  console.log(`[Referral Payout] Base reward: ${BASE_REWARD} Shells per signup (multiplier system active)`);
  
  schedulerState.isRunning = true;
  schedulerState.intervalId = setInterval(checkAndExecute, CHECK_INTERVAL_MS);
  
  checkAndExecute();
}

export function stopReferralPayoutScheduler(): void {
  if (!schedulerState.isRunning) return;
  
  if (schedulerState.intervalId) {
    clearInterval(schedulerState.intervalId);
    schedulerState.intervalId = null;
  }
  
  schedulerState.isRunning = false;
  console.log("[Referral Payout] Scheduler stopped");
}

export function getReferralPayoutStatus() {
  return {
    isRunning: schedulerState.isRunning,
    lastCheck: schedulerState.lastCheck,
    lastPayoutHour: schedulerState.lastPayoutHour,
    todayPayoutsRun: schedulerState.todayPayoutsRun,
    payoutSchedule: ["8:00 AM CST (2:00 PM UTC)", "8:00 PM CST (2:00 AM UTC)"],
    rewardSystem: {
      type: "multiplier",
      baseReward: BASE_REWARD,
      multipliers: PURCHASE_MULTIPLIERS,
    },
    stats: schedulerState.stats,
  };
}

export async function manualReferralPayoutTrigger() {
  console.log("[Referral Payout] Manual trigger activated");
  return executePayoutRun();
}
