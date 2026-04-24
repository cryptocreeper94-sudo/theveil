import { db } from "./db";
import { 
  commissionPayouts, 
  affiliateProfiles, 
  fraudFlags,
  chainAccounts
} from "@shared/schema";
import { eq, and, sql, lte, desc, gte } from "drizzle-orm";
import crypto from "crypto";
import { blockchain } from "./blockchain-engine";

const ORBIT_HUB_URL = "https://orbitstaffing.io";
const MIN_PAYOUT_THRESHOLD_CENTS = 5000;
const DWC_EXCHANGE_RATE = 0.001; // $0.001 per DWC (1B supply)
const PAYOUT_BATCH_SIZE = 50;
const SETTLEMENT_WAIT_DAYS = 7;

const DWC_LAUNCH_DATE = new Date("2026-04-11T00:00:00Z");

function isPreLaunch(): boolean {
  return new Date() < DWC_LAUNCH_DATE;
}

interface PayoutBatch {
  id: string;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  totalAffiliates: number;
  totalAmountUsd: number;
  totalAmountDwc: string;
  processedCount: number;
  failedCount: number;
}

interface PayoutResult {
  success: boolean;
  payoutId: string;
  txHash?: string;
  error?: string;
}

function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function getOrbitHubHeaders(payload: object) {
  const apiKey = process.env.ORBIT_HUB_API_KEY;
  const apiSecret = process.env.ORBIT_HUB_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    console.warn("[Payout] Orbit Hub API credentials not configured");
    return null;
  }

  const timestamp = Date.now().toString();
  const body = JSON.stringify(payload);
  const signature = generateHmacSignature(`${timestamp}${body}`, apiSecret);

  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
}

export class PayoutService {
  async getEligibleAffiliates() {
    const now = new Date();

    const affiliates = await db
      .select({
        profile: affiliateProfiles,
        pendingAmount: sql<number>`COALESCE(SUM(${commissionPayouts.amount}), 0)`.as("pending_amount"),
      })
      .from(affiliateProfiles)
      .leftJoin(
        commissionPayouts,
        and(
          eq(commissionPayouts.userId, affiliateProfiles.userId),
          eq(commissionPayouts.payoutStatus, "eligible"),
          lte(commissionPayouts.eligibleForPayoutAt, now)
        )
      )
      .where(
        and(
          eq(affiliateProfiles.walletVerified, true),
          sql`${affiliateProfiles.dwcWalletAddress} IS NOT NULL`,
          gte(affiliateProfiles.pendingCommission, MIN_PAYOUT_THRESHOLD_CENTS)
        )
      )
      .groupBy(affiliateProfiles.id)
      .having(sql`SUM(${commissionPayouts.amount}) >= ${MIN_PAYOUT_THRESHOLD_CENTS}`);

    const unresolvedFraudFlags = await db
      .select({ userId: fraudFlags.userId })
      .from(fraudFlags)
      .where(eq(fraudFlags.isResolved, false));

    const flaggedUserIds = new Set(unresolvedFraudFlags.map(f => f.userId));
    
    return affiliates.filter(a => !flaggedUserIds.has(a.profile.userId));
  }

  async createPayoutBatch(): Promise<PayoutBatch> {
    const batchId = `batch_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const eligibleAffiliates = await this.getEligibleAffiliates();

    const batch: PayoutBatch = {
      id: batchId,
      createdAt: new Date(),
      status: "pending",
      totalAffiliates: eligibleAffiliates.length,
      totalAmountUsd: eligibleAffiliates.reduce((sum, a) => sum + a.pendingAmount, 0),
      totalAmountDwc: (eligibleAffiliates.reduce((sum, a) => sum + a.pendingAmount, 0) / 100 / DWC_EXCHANGE_RATE).toFixed(2),
      processedCount: 0,
      failedCount: 0,
    };

    console.log(`[Payout] Created batch ${batchId} with ${batch.totalAffiliates} affiliates, $${(batch.totalAmountUsd / 100).toFixed(2)} total`);
    return batch;
  }

  async processAffiliatePayout(userId: string, walletAddress: string, _amountCents: number): Promise<PayoutResult & { settledAmount?: number; settledDwc?: string }> {
    const payoutId = `payout_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date();

    // First, select the specific commission IDs for this payout batch with maturity filter
    const eligibleCommissions = await db.query.commissionPayouts.findMany({
      where: and(
        eq(commissionPayouts.userId, userId),
        eq(commissionPayouts.payoutStatus, "eligible"),
        lte(commissionPayouts.eligibleForPayoutAt, now)
      ),
    });

    if (eligibleCommissions.length === 0) {
      return { success: false, payoutId, error: "No eligible commissions found" };
    }

    const commissionIds = eligibleCommissions.map(c => c.id);
    const actualAmount = eligibleCommissions.reduce((sum, c) => sum + c.amount, 0);
    const amountDwc = (actualAmount / 100 / DWC_EXCHANGE_RATE).toFixed(2);
    const amountWei = BigInt(Math.floor(parseFloat(amountDwc) * 1e18));

    // Mark only these specific commissions as processing
    await db
      .update(commissionPayouts)
      .set({
        payoutStatus: "processing",
        payoutBatchId: payoutId,
        updatedAt: new Date(),
      })
      .where(sql`${commissionPayouts.id} = ANY(${commissionIds})`);

    try {
      const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        throw new Error("Treasury private key not configured");
      }

      const recipientAccount = await db.query.chainAccounts.findFirst({
        where: eq(chainAccounts.address, walletAddress),
      });

      if (!recipientAccount) {
        throw new Error("Recipient wallet not found on Trust Layer chain");
      }

      const signedTx = blockchain.createSignedTransaction(
        treasuryPrivateKey,
        walletAddress,
        amountWei,
        `affiliate_payout:${payoutId}:${userId}`
      );

      const result = blockchain.submitSignedTransaction(signedTx);
      
      if (!result.success) {
        throw new Error(result.error || "Transaction failed");
      }

      // Transaction succeeded - mark only the batched commissions as paid
      await db
        .update(commissionPayouts)
        .set({
          payoutStatus: "paid",
          amountDwc,
          exchangeRate: DWC_EXCHANGE_RATE.toString(),
          exchangeRateSource: "fixed",
          treasuryTxHash: signedTx.hash,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(sql`${commissionPayouts.id} = ANY(${commissionIds})`);

      await db
        .update(affiliateProfiles)
        .set({
          pendingCommission: sql`${affiliateProfiles.pendingCommission} - ${actualAmount}`,
          paidCommission: sql`${affiliateProfiles.paidCommission} + ${actualAmount}`,
          lastPayoutAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(affiliateProfiles.userId, userId));

      console.log(`[Payout] Sent ${amountDwc} SIG to ${walletAddress} for user ${userId}, tx: ${signedTx.hash}, commissions: ${commissionIds.length}`);

      return { success: true, payoutId, txHash: signedTx.hash, settledAmount: actualAmount, settledDwc: amountDwc };
    } catch (error) {
      console.error(`[Payout] Failed for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Restore only these specific commissions to eligible for retry
      await db
        .update(commissionPayouts)
        .set({
          payoutStatus: "eligible",
          failureReason: errorMessage,
          retryCount: sql`${commissionPayouts.retryCount} + 1`,
          payoutBatchId: null,
          updatedAt: new Date(),
        })
        .where(sql`${commissionPayouts.id} = ANY(${commissionIds})`);

      return { success: false, payoutId, error: errorMessage };
    }
  }

  async syncPayoutToOrbit(payoutResult: PayoutResult, affiliate: {
    userId: string;
    host: string;
    amountUsd: number;
    amountDwc: string;
  }): Promise<boolean> {
    const payload = {
      event: "affiliate_payout",
      timestamp: new Date().toISOString(),
      data: {
        payoutId: payoutResult.payoutId,
        txHash: payoutResult.txHash,
        affiliateUserId: affiliate.userId,
        host: affiliate.host,
        amountUsd: affiliate.amountUsd / 100,
        amountDwc: affiliate.amountDwc,
        currency: "SIG",
        status: payoutResult.success ? "completed" : "failed",
        error: payoutResult.error,
      },
    };

    const headers = await getOrbitHubHeaders(payload);
    if (!headers) {
      console.log("[Payout] Orbit Hub sync skipped - credentials not configured");
      return false;
    }

    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${ORBIT_HUB_URL}/api/v1/webhooks/payout`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await db
            .update(commissionPayouts)
            .set({
              orbitSyncStatus: "synced",
              orbitSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(commissionPayouts.treasuryTxHash, payoutResult.txHash || ""));

          console.log(`[Payout] Synced to Orbit Hub: ${payoutResult.payoutId}`);
          return true;
        }

        if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[Payout] Orbit Hub sync failed (${response.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        console.error(`[Payout] Orbit Hub sync failed: ${response.status}`);
        break;
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[Payout] Orbit Hub sync error, retrying in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error("[Payout] Orbit Hub sync error after all retries:", error);
        break;
      }
    }

    await db
      .update(commissionPayouts)
      .set({
        orbitSyncStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(commissionPayouts.treasuryTxHash, payoutResult.txHash || ""));

    return false;
  }

  async getAirdropSummary() {
    const affiliates = await db
      .select({
        userId: affiliateProfiles.userId,
        airdropBalance: affiliateProfiles.airdropBalance,
        airdropBalanceDwc: affiliateProfiles.airdropBalanceDwc,
        airdropStatus: affiliateProfiles.airdropStatus,
        dwcWalletAddress: affiliateProfiles.dwcWalletAddress,
        walletVerified: affiliateProfiles.walletVerified,
      })
      .from(affiliateProfiles)
      .where(gte(affiliateProfiles.airdropBalance, 1));

    const totalAirdropUsd = affiliates.reduce((sum, a) => sum + (a.airdropBalance || 0), 0);
    const totalAirdropDwc = (totalAirdropUsd / 100 / DWC_EXCHANGE_RATE).toFixed(2);
    const readyForAirdrop = affiliates.filter(a => a.walletVerified && a.dwcWalletAddress);

    return {
      isPreLaunch: isPreLaunch(),
      launchDate: DWC_LAUNCH_DATE.toISOString(),
      totalAffiliates: affiliates.length,
      readyForAirdrop: readyForAirdrop.length,
      totalAirdropUsd: totalAirdropUsd / 100,
      totalAirdropDwc,
      affiliates: affiliates.map(a => ({
        userId: a.userId,
        balanceUsd: (a.airdropBalance || 0) / 100,
        balanceDwc: a.airdropBalanceDwc || "0",
        status: a.airdropStatus,
        walletReady: !!(a.walletVerified && a.dwcWalletAddress),
      })),
    };
  }

  async runPayoutCycle(): Promise<{
    batchId: string;
    processed: number;
    failed: number;
    totalDwc: string;
    errors: string[];
    mode: string;
  }> {
    if (isPreLaunch()) {
      console.log("[Payout] Pre-launch mode - commissions are being accumulated for airdrop at launch");
      const summary = await this.getAirdropSummary();
      return {
        batchId: "pre-launch",
        processed: 0,
        failed: 0,
        totalDwc: summary.totalAirdropDwc,
        errors: [],
        mode: "accumulating",
      };
    }

    console.log("[Payout] Starting automated payout cycle...");
    
    const eligibleAffiliates = await this.getEligibleAffiliates();
    
    if (eligibleAffiliates.length === 0) {
      console.log("[Payout] No eligible affiliates for payout");
      return { batchId: "", processed: 0, failed: 0, totalDwc: "0", errors: [], mode: "live" };
    }

    const batch = await this.createPayoutBatch();
    const errors: string[] = [];
    let processedCount = 0;
    let failedCount = 0;
    let totalDwc = 0;

    for (const affiliate of eligibleAffiliates.slice(0, PAYOUT_BATCH_SIZE)) {
      const result = await this.processAffiliatePayout(
        affiliate.profile.userId,
        affiliate.profile.dwcWalletAddress!,
        affiliate.pendingAmount
      );

      if (result.success && result.settledAmount && result.settledDwc) {
        processedCount++;
        totalDwc += parseFloat(result.settledDwc);

        await this.syncPayoutToOrbit(result, {
          userId: affiliate.profile.userId,
          host: affiliate.profile.preferredHost || "dwsc.io",
          amountUsd: result.settledAmount,
          amountDwc: result.settledDwc,
        });
      } else if (!result.success) {
        failedCount++;
        errors.push(`${affiliate.profile.userId}: ${result.error}`);
      }
    }

    console.log(`[Payout] Cycle complete: ${processedCount} processed, ${failedCount} failed, ${totalDwc.toFixed(2)} SIG distributed`);

    return {
      batchId: batch.id,
      processed: processedCount,
      failed: failedCount,
      totalDwc: totalDwc.toFixed(2),
      errors,
      mode: "live",
    };
  }

  async executeAirdrop(): Promise<{
    batchId: string;
    processed: number;
    failed: number;
    totalDwc: string;
    errors: string[];
  }> {
    if (isPreLaunch()) {
      console.log("[Airdrop] Cannot execute airdrop before launch date");
      return { batchId: "", processed: 0, failed: 0, totalDwc: "0", errors: ["DWC has not launched yet"] };
    }

    console.log("[Airdrop] Executing post-launch airdrop...");

    const affiliates = await db
      .select()
      .from(affiliateProfiles)
      .where(
        and(
          gte(affiliateProfiles.airdropBalance, 1),
          eq(affiliateProfiles.walletVerified, true),
          sql`${affiliateProfiles.dwcWalletAddress} IS NOT NULL`,
          eq(affiliateProfiles.airdropStatus, "accumulating")
        )
      );

    const batchId = `airdrop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const errors: string[] = [];
    let processedCount = 0;
    let failedCount = 0;
    let totalDwc = 0;

    for (const affiliate of affiliates) {
      const amountDwc = affiliate.airdropBalanceDwc || (affiliate.airdropBalance / 100 / DWC_EXCHANGE_RATE).toFixed(2);
      
      try {
        const txHash = await blockchain.processDwcTransfer(
          affiliate.dwcWalletAddress!,
          amountDwc,
          `Airdrop distribution for accumulated affiliate commissions (${batchId})`
        );

        if (txHash) {
          await db
            .update(affiliateProfiles)
            .set({
              airdropStatus: "distributed",
              airdropBalance: 0,
              airdropBalanceDwc: "0",
              paidCommission: sql`${affiliateProfiles.paidCommission} + ${affiliate.airdropBalance}`,
              updatedAt: new Date(),
            })
            .where(eq(affiliateProfiles.userId, affiliate.userId));

          await db
            .update(commissionPayouts)
            .set({
              payoutStatus: "paid",
              payoutTransactionHash: txHash,
              payoutMethod: "airdrop",
              payoutBatchId: batchId,
              paidAt: new Date(),
              processedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(commissionPayouts.affiliateUserId, affiliate.userId),
                eq(commissionPayouts.distributionMode, "airdrop"),
                eq(commissionPayouts.payoutStatus, "accruing")
              )
            );

          processedCount++;
          totalDwc += parseFloat(amountDwc);
          console.log(`[Airdrop] Sent ${amountDwc} SIG to ${affiliate.dwcWalletAddress} (tx: ${txHash})`);
        } else {
          failedCount++;
          errors.push(`${affiliate.userId}: Blockchain transfer failed`);
        }
      } catch (error) {
        failedCount++;
        errors.push(`${affiliate.userId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    console.log(`[Airdrop] Complete: ${processedCount} distributed, ${failedCount} failed, ${totalDwc.toFixed(2)} SIG total`);

    return {
      batchId,
      processed: processedCount,
      failed: failedCount,
      totalDwc: totalDwc.toFixed(2),
      errors,
    };
  }

  async markCommissionEligible(stripePaymentIntent: string, amountCents: number) {
    const eligibleDate = new Date();
    eligibleDate.setDate(eligibleDate.getDate() + SETTLEMENT_WAIT_DAYS);

    await db
      .update(commissionPayouts)
      .set({
        payoutStatus: "eligible",
        stripeSettlementStatus: "settled",
        settledAt: new Date(),
        eligibleForPayoutAt: eligibleDate,
        updatedAt: new Date(),
      })
      .where(eq(commissionPayouts.stripePaymentIntent, stripePaymentIntent));

    console.log(`[Payout] Marked ${stripePaymentIntent} eligible for payout after ${eligibleDate.toISOString()}`);
  }

  async getPayoutStats() {
    const [stats] = await db
      .select({
        totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${commissionPayouts.payoutStatus} = 'accruing' THEN ${commissionPayouts.amount} ELSE 0 END), 0)`,
        totalEligible: sql<number>`COALESCE(SUM(CASE WHEN ${commissionPayouts.payoutStatus} = 'eligible' THEN ${commissionPayouts.amount} ELSE 0 END), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${commissionPayouts.payoutStatus} = 'paid' THEN ${commissionPayouts.amount} ELSE 0 END), 0)`,
        totalFailed: sql<number>`COALESCE(SUM(CASE WHEN ${commissionPayouts.payoutStatus} = 'failed' THEN ${commissionPayouts.amount} ELSE 0 END), 0)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${commissionPayouts.payoutStatus} = 'accruing' THEN 1 END)`,
        eligibleCount: sql<number>`COUNT(CASE WHEN ${commissionPayouts.payoutStatus} = 'eligible' THEN 1 END)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${commissionPayouts.payoutStatus} = 'paid' THEN 1 END)`,
      })
      .from(commissionPayouts);

    const recentPayouts = await db
      .select()
      .from(commissionPayouts)
      .where(eq(commissionPayouts.payoutStatus, "paid"))
      .orderBy(desc(commissionPayouts.processedAt))
      .limit(10);

    return { ...stats, recentPayouts };
  }

  async verifyAffiliateWallet(userId: string, walletAddress: string): Promise<boolean> {
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      console.warn(`[Payout] Invalid wallet address format: ${walletAddress}`);
      return false;
    }

    const chainAccount = await db.query.chainAccounts.findFirst({
      where: eq(chainAccounts.address, walletAddress),
    });

    if (!chainAccount) {
      console.log(`[Payout] Creating new chain account for ${walletAddress}`);
      await db.insert(chainAccounts).values({
        address: walletAddress,
        balance: "0",
        nonce: "0",
      }).onConflictDoNothing();
    }

    await db
      .update(affiliateProfiles)
      .set({
        dwcWalletAddress: walletAddress,
        walletVerified: true,
        walletVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(affiliateProfiles.userId, userId));

    console.log(`[Payout] Verified wallet ${walletAddress} for user ${userId}`);
    return true;
  }
}

export const payoutService = new PayoutService();

let payoutInterval: NodeJS.Timeout | null = null;

export function startPayoutScheduler(intervalHours: number = 24) {
  if (payoutInterval) {
    clearInterval(payoutInterval);
  }

  console.log(`[Payout] Scheduler started - running every ${intervalHours} hours`);

  payoutInterval = setInterval(async () => {
    try {
      const result = await payoutService.runPayoutCycle();
      console.log(`[Payout] Scheduled run complete:`, result);
    } catch (error) {
      console.error("[Payout] Scheduled run failed:", error);
    }
  }, intervalHours * 60 * 60 * 1000);

  return payoutInterval;
}

export function stopPayoutScheduler() {
  if (payoutInterval) {
    clearInterval(payoutInterval);
    payoutInterval = null;
    console.log("[Payout] Scheduler stopped");
  }
}
