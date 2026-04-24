/**
 * Shells Airdrop Scheduler
 * Automatically distributes shells to eligible users twice daily
 * Runs at 1 AM and 1 PM CST (7 AM and 7 PM UTC)
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { shellsService } from "./shells-service";

// Configuration
const AIRDROP_TIMES_UTC = [7, 19]; // 7 AM UTC (1 AM CST) and 7 PM UTC (1 PM CST)
const SHELLS_PER_AIRDROP = 25; // Each eligible user gets 25 shells per airdrop
const CHECK_INTERVAL_MS = 60_000; // Check every minute

interface AirdropSchedulerState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  lastCheck: Date | null;
  lastAirdropHour: number | null;
  todayAirdropsRun: number[];
}

const schedulerState: AirdropSchedulerState = {
  isRunning: false,
  intervalId: null,
  lastCheck: null,
  lastAirdropHour: null,
  todayAirdropsRun: [],
};

/**
 * Get eligible users for airdrop
 * - Users who have logged in within the last 24 hours
 * - Or users who have shell wallets (active participants)
 */
async function getEligibleUsers(): Promise<Array<{ userId: string; username: string }>> {
  try {
    // Get users with shell wallets who have been active
    const result = await db.execute(sql`
      SELECT DISTINCT user_id, username, MAX(updated_at) as last_active
      FROM orb_wallets 
      WHERE updated_at > NOW() - INTERVAL '7 days'
      GROUP BY user_id, username
      ORDER BY last_active DESC
    `);
    
    return result.rows.map((row: any) => ({
      userId: row.user_id,
      username: row.username || 'User',
    }));
  } catch (error) {
    console.error("[Shells Airdrop] Error getting eligible users:", error);
    return [];
  }
}

/**
 * Execute the airdrop - distribute shells to all eligible users
 */
async function executeAirdrop(): Promise<{ success: boolean; usersRewarded: number; totalShells: number }> {
  const airdropTime = new Date();
  console.log(`[Shells Airdrop] Executing airdrop at ${airdropTime.toISOString()}`);
  
  try {
    const eligibleUsers = await getEligibleUsers();
    
    if (eligibleUsers.length === 0) {
      console.log("[Shells Airdrop] No eligible users found");
      return { success: true, usersRewarded: 0, totalShells: 0 };
    }
    
    let successCount = 0;
    let totalShellsDistributed = 0;
    
    for (const user of eligibleUsers) {
      try {
        // Credit shells to the user's wallet (bypass caps for bonus type)
        await shellsService.addShells(
          user.userId,
          user.username,
          SHELLS_PER_AIRDROP,
          "bonus",
          `Daily airdrop - ${airdropTime.toDateString()}`,
          `airdrop_${airdropTime.getTime()}_${user.userId}`,
          "daily_airdrop",
          true // bypass earning caps for airdrops
        );
        
        successCount++;
        totalShellsDistributed += SHELLS_PER_AIRDROP;
      } catch (error: any) {
        // Skip if already credited (duplicate reference)
        if (!error.message?.includes("duplicate") && !error.message?.includes("already")) {
          console.error(`[Shells Airdrop] Failed to credit user ${user.userId}:`, error.message);
        }
      }
    }
    
    console.log(`[Shells Airdrop] Completed: ${successCount}/${eligibleUsers.length} users received ${totalShellsDistributed} shells total`);
    
    // Log the airdrop execution
    await db.execute(sql`
      INSERT INTO audit_logs (event_type, event_data, created_at)
      VALUES ('shells_airdrop_executed', ${JSON.stringify({
        executedAt: airdropTime.toISOString(),
        eligibleUsers: eligibleUsers.length,
        usersRewarded: successCount,
        totalShellsDistributed,
        shellsPerUser: SHELLS_PER_AIRDROP,
      })}, NOW())
    `).catch(() => {});
    
    return { success: true, usersRewarded: successCount, totalShells: totalShellsDistributed };
  } catch (error: any) {
    console.error("[Shells Airdrop] Execution error:", error);
    return { success: false, usersRewarded: 0, totalShells: 0 };
  }
}

/**
 * Check if it's time for an airdrop and execute if needed
 */
async function checkAndExecute(): Promise<void> {
  schedulerState.lastCheck = new Date();
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDate = now.toDateString();
  
  // Reset daily tracking at midnight UTC
  if (schedulerState.todayAirdropsRun.length > 0) {
    const lastRunDate = new Date(schedulerState.lastCheck || now).toDateString();
    if (lastRunDate !== currentDate) {
      schedulerState.todayAirdropsRun = [];
    }
  }
  
  // Check if current hour is an airdrop time and we haven't run it today
  if (AIRDROP_TIMES_UTC.includes(currentHour) && !schedulerState.todayAirdropsRun.includes(currentHour)) {
    console.log(`[Shells Airdrop] Airdrop time detected (${currentHour}:00 UTC)`);
    
    const result = await executeAirdrop();
    
    if (result.success) {
      schedulerState.todayAirdropsRun.push(currentHour);
      schedulerState.lastAirdropHour = currentHour;
    }
  }
}

/**
 * Start the shells airdrop scheduler
 */
export function startShellsAirdropScheduler(): void {
  if (schedulerState.isRunning) {
    console.log("[Shells Airdrop] Scheduler already running");
    return;
  }
  
  console.log("[Shells Airdrop] Starting automatic airdrop scheduler");
  console.log(`[Shells Airdrop] Airdrops scheduled at ${AIRDROP_TIMES_UTC.map(h => `${h}:00 UTC`).join(" and ")}`);
  console.log(`[Shells Airdrop] Each user receives ${SHELLS_PER_AIRDROP} shells per airdrop`);
  
  schedulerState.isRunning = true;
  
  // Set up interval to check every minute
  schedulerState.intervalId = setInterval(checkAndExecute, CHECK_INTERVAL_MS);
  
  // Run initial check
  checkAndExecute();
}

/**
 * Stop the scheduler
 */
export function stopShellsAirdropScheduler(): void {
  if (!schedulerState.isRunning) return;
  
  if (schedulerState.intervalId) {
    clearInterval(schedulerState.intervalId);
    schedulerState.intervalId = null;
  }
  
  schedulerState.isRunning = false;
  console.log("[Shells Airdrop] Scheduler stopped");
}

/**
 * Get scheduler status
 */
export function getShellsAirdropStatus() {
  return {
    isRunning: schedulerState.isRunning,
    lastCheck: schedulerState.lastCheck,
    lastAirdropHour: schedulerState.lastAirdropHour,
    todayAirdropsRun: schedulerState.todayAirdropsRun,
    nextAirdropTimes: AIRDROP_TIMES_UTC.map(h => `${h}:00 UTC`),
    shellsPerAirdrop: SHELLS_PER_AIRDROP,
  };
}

/**
 * Manually trigger an airdrop (for admin use)
 */
export async function manualAirdropTrigger() {
  console.log("[Shells Airdrop] Manual trigger activated");
  return executeAirdrop();
}
