import { membershipReconciliationService } from "./membership-reconciliation-service";

let reconciliationInterval: NodeJS.Timeout | null = null;
let notificationInterval: NodeJS.Timeout | null = null;

export function startMembershipReconciliationScheduler() {
  console.log("[Membership Reconciliation Scheduler] Starting...");

  runReconciliation();

  reconciliationInterval = setInterval(async () => {
    await runReconciliation();
  }, 12 * 60 * 60 * 1000);

  notificationInterval = setInterval(async () => {
    await sendPendingNotifications();
  }, 60 * 60 * 1000);

  console.log("[Membership Reconciliation Scheduler] Running every 12 hours");
  console.log("[Membership Notification Scheduler] Running every hour");
}

async function runReconciliation() {
  try {
    console.log("[Membership Reconciliation] Starting reconciliation run...");
    const result = await membershipReconciliationService.runReconciliation();
    console.log(`[Membership Reconciliation] Complete: ${result.processed} processed, ${result.merged} merged, ${result.activated} activated`);
  } catch (error) {
    console.error("[Membership Reconciliation] Error during reconciliation:", error);
  }
}

async function sendPendingNotifications() {
  try {
    const pending = await membershipReconciliationService.getPendingNotifications();
    
    if (pending.length === 0) return;

    console.log(`[Membership Notifications] ${pending.length} members ready for notification`);

    for (const member of pending) {
      try {
        console.log(`[Membership Notifications] Member ${member.trustLayerId} activated - notification ready`);
        
        await membershipReconciliationService.markNotificationSent(member.userId);
      } catch (error) {
        console.error(`[Membership Notifications] Failed to notify ${member.trustLayerId}:`, error);
      }
    }
  } catch (error) {
    console.error("[Membership Notifications] Error sending notifications:", error);
  }
}

export function stopMembershipReconciliationScheduler() {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  console.log("[Membership Reconciliation Scheduler] Stopped");
}
