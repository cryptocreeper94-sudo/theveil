import crypto from "crypto";
import { db } from "./db";
import { affiliateReferralsV2, affiliateCommissionsV2, HALLMARK_AFFILIATE_TIERS, ECOSYSTEM_APP_REGISTRY } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { createTrustStamp } from "./hallmark";

const BASE_URL = process.env.BASE_URL || "https://dwtl.io";

type TierName = keyof typeof HALLMARK_AFFILIATE_TIERS;

function getUserHash(userId: string | number): string {
  return crypto.createHash("sha256").update(String(userId)).digest("hex").slice(0, 12);
}

export async function trackReferral(referralHash: string, platform: string = "trustlayer") {
  const [referral] = await db.insert(affiliateReferralsV2).values({
    referrerId: 0,
    referralHash,
    platform,
    status: "pending",
  }).returning();
  return referral;
}

export async function convertReferral(referralId: number, referredUserId: number) {
  const [updated] = await db.update(affiliateReferralsV2)
    .set({
      status: "converted",
      referredUserId,
      convertedAt: new Date(),
    })
    .where(eq(affiliateReferralsV2.id, referralId))
    .returning();
  return updated;
}

export async function calculateTier(userId: number): Promise<TierName> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(affiliateReferralsV2)
    .where(and(
      eq(affiliateReferralsV2.referrerId, userId),
      eq(affiliateReferralsV2.status, "converted")
    ));

  const conversions = Number(result[0]?.count || 0);

  const tiers: [TierName, number][] = [
    ["diamond", 50],
    ["platinum", 30],
    ["gold", 15],
    ["silver", 5],
    ["base", 0],
  ];

  for (const [name, threshold] of tiers) {
    if (conversions >= threshold) return name;
  }
  return "base";
}

export async function getDashboard(userId: number) {
  const tier = await calculateTier(userId);

  const referrals = await db.select().from(affiliateReferralsV2)
    .where(eq(affiliateReferralsV2.referrerId, userId))
    .orderBy(desc(affiliateReferralsV2.createdAt));

  const totalReferrals = referrals.length;
  const converted = referrals.filter(r => r.status === "converted").length;

  const commissions = await db.select().from(affiliateCommissionsV2)
    .where(eq(affiliateCommissionsV2.referrerId, userId))
    .orderBy(desc(affiliateCommissionsV2.createdAt));

  let pendingEarnings = 0;
  let paidEarnings = 0;
  for (const c of commissions) {
    const amt = parseFloat(c.amount) || 0;
    if (c.status === "paid") {
      paidEarnings += amt;
    } else {
      pendingEarnings += amt;
    }
  }

  return {
    tier,
    tierInfo: HALLMARK_AFFILIATE_TIERS[tier],
    totalReferrals,
    converted,
    pendingEarnings: pendingEarnings.toFixed(2),
    paidEarnings: paidEarnings.toFixed(2),
    recentReferrals: referrals.slice(0, 20),
    recentCommissions: commissions.slice(0, 20),
  };
}

export function getUserReferralLink(userId: number | string): { link: string; hash: string; crossPlatformLinks: { name: string; prefix: string; domain: string; link: string }[] } {
  const hash = getUserHash(userId);
  const link = `${BASE_URL}/ref/${hash}`;
  const crossPlatformLinks = ECOSYSTEM_APP_REGISTRY.map(app => ({
    name: app.name,
    prefix: app.prefix,
    domain: app.domain,
    link: `https://${app.domain}/ref/${hash}`,
  }));
  return { link, hash, crossPlatformLinks };
}

export async function requestPayout(userId: number) {
  const commissions = await db.select().from(affiliateCommissionsV2)
    .where(and(
      eq(affiliateCommissionsV2.referrerId, userId),
      eq(affiliateCommissionsV2.status, "pending")
    ));

  let total = 0;
  for (const c of commissions) {
    total += parseFloat(c.amount) || 0;
  }

  if (total < 10) {
    return { success: false, error: "Minimum payout is 10 SIG" };
  }

  for (const c of commissions) {
    await db.update(affiliateCommissionsV2)
      .set({ status: "processing" })
      .where(eq(affiliateCommissionsV2.id, c.id));
  }

  await createTrustStamp("affiliate-payout-request", {
    userId: String(userId),
    amount: total.toFixed(2),
    currency: "SIG",
    commissionIds: commissions.map(c => c.id),
  });

  return { success: true, amount: total.toFixed(2), commissionsProcessing: commissions.length };
}

export async function createCommission(
  referrerId: number,
  referralId: number | null,
  amount: string,
  tier: string = "base"
) {
  const [commission] = await db.insert(affiliateCommissionsV2).values({
    referrerId,
    referralId,
    amount,
    currency: "SIG",
    tier,
    status: "pending",
  }).returning();
  return commission;
}
