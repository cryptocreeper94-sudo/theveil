import { db } from "./db";
import { users, legacyFounders } from "@shared/schema";
import { sendWalletCreationReminder, sendSignupWelcomeEmail } from "./email";
import { isNull, isNotNull, sql } from "drizzle-orm";

const WEEKLY_INTERVAL = 7 * 24 * 60 * 60 * 1000;

let lastEmailRun: Date | null = null;

async function sendWeeklyUpdates() {
  console.log("[Email Updates] Starting weekly email update run...");
  
  try {
    const foundersWithoutWallet = await db
      .select()
      .from(legacyFounders)
      .where(isNull(legacyFounders.walletAddress));
    
    console.log(`[Email Updates] Found ${foundersWithoutWallet.length} founders without wallets`);
    
    let emailsSent = 0;
    let errors = 0;
    
    for (const founder of foundersWithoutWallet) {
      try {
        await sendWalletCreationReminder(
          founder.email,
          founder.email.split('@')[0],
          Number(founder.airdropAmount) || 35000
        );
        emailsSent++;
        console.log(`[Email Updates] Sent wallet reminder to ${founder.email}`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        errors++;
        console.error(`[Email Updates] Failed to send to ${founder.email}:`, err);
      }
    }
    
    console.log(`[Email Updates] Weekly run complete: ${emailsSent} emails sent, ${errors} errors`);
    lastEmailRun = new Date();
    
  } catch (error) {
    console.error("[Email Updates] Error running weekly updates:", error);
  }
}

export function startEmailUpdateScheduler() {
  console.log("[Email Updates] Scheduler initialized - runs every Sunday at 10:00 AM UTC");
  
  const checkAndRun = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();
    
    if (dayOfWeek === 0 && hour === 10) {
      if (!lastEmailRun || (now.getTime() - lastEmailRun.getTime()) > 23 * 60 * 60 * 1000) {
        sendWeeklyUpdates();
      }
    }
  };
  
  setInterval(checkAndRun, 60 * 60 * 1000);
  
  console.log("[Email Updates] Next run: Sunday 10:00 AM UTC");
}

export async function triggerManualEmailRun() {
  console.log("[Email Updates] Manual trigger requested");
  await sendWeeklyUpdates();
  return { success: true, timestamp: new Date() };
}

export function getEmailSchedulerStatus() {
  return {
    lastRun: lastEmailRun,
    nextScheduledRun: "Sunday 10:00 AM UTC",
    interval: "Weekly"
  };
}
