import { db } from "./db";
import { authorProfiles, authorEarnings, publishedBooks } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const PLATFORM_FEE_PERCENT = 30;
const AUTHOR_ROYALTY_PERCENT = 70;
const SETTLEMENT_DAYS = 7;

export async function getOrCreateAuthorProfile(userId: string, displayName: string) {
  const existing = await db.select().from(authorProfiles).where(eq(authorProfiles.userId, userId));
  if (existing.length > 0) return existing[0];

  const [profile] = await db.insert(authorProfiles).values({
    userId,
    displayName,
  }).returning();
  return profile;
}

export async function getAuthorProfile(userId: string) {
  const results = await db.select().from(authorProfiles).where(eq(authorProfiles.userId, userId));
  return results[0] || null;
}

export async function updateStripeConnectId(userId: string, stripeConnectId: string) {
  await db.update(authorProfiles)
    .set({ stripeConnectId, updatedAt: new Date() })
    .where(eq(authorProfiles.userId, userId));
}

export async function markOnboardingComplete(userId: string, payoutsEnabled: boolean) {
  await db.update(authorProfiles)
    .set({
      stripeOnboardingComplete: true,
      payoutEnabled: payoutsEnabled,
      updatedAt: new Date(),
    })
    .where(eq(authorProfiles.userId, userId));
}

export async function recordAuthorEarning(
  authorId: string,
  bookId: string,
  purchaseId: string,
  grossAmountCents: number
) {
  const platformFeeCents = Math.round(grossAmountCents * PLATFORM_FEE_PERCENT / 100);
  const authorEarningsCents = grossAmountCents - platformFeeCents;
  const eligibleAt = new Date(Date.now() + SETTLEMENT_DAYS * 24 * 60 * 60 * 1000);

  const [earning] = await db.insert(authorEarnings).values({
    authorId,
    bookId,
    purchaseId: String(purchaseId),
    grossAmountCents,
    platformFeeCents,
    authorEarningsCents,
    status: "pending",
    eligibleAt,
  }).returning();

  await db.update(authorProfiles)
    .set({
      totalEarningsCents: sql`${authorProfiles.totalEarningsCents} + ${authorEarningsCents}`,
      pendingBalanceCents: sql`${authorProfiles.pendingBalanceCents} + ${authorEarningsCents}`,
      updatedAt: new Date(),
    })
    .where(eq(authorProfiles.userId, authorId));

  return earning;
}

export async function getAuthorEarnings(authorId: string) {
  return db.select().from(authorEarnings)
    .where(eq(authorEarnings.authorId, authorId))
    .orderBy(desc(authorEarnings.createdAt));
}

export async function getEligiblePayouts(authorId: string) {
  return db.select().from(authorEarnings)
    .where(and(
      eq(authorEarnings.authorId, authorId),
      eq(authorEarnings.status, "pending"),
      sql`${authorEarnings.eligibleAt} <= NOW()`
    ));
}

export async function processAuthorPayout(authorId: string, stripe: any) {
  const profile = await getAuthorProfile(authorId);
  if (!profile || !profile.stripeConnectId || !profile.payoutEnabled) {
    return { success: false, message: "Payouts are not configured yet. Please complete Stripe Connect onboarding first." };
  }

  const lockResult = await db.update(authorEarnings)
    .set({ status: "processing" })
    .where(and(
      eq(authorEarnings.authorId, authorId),
      eq(authorEarnings.status, "pending"),
      sql`${authorEarnings.eligibleAt} <= NOW()`
    ))
    .returning();

  if (lockResult.length === 0) {
    return { success: false, message: "No eligible earnings to pay out. Earnings require a 7-day settlement period." };
  }

  const totalAmount = lockResult.reduce((sum, e) => sum + e.authorEarningsCents, 0);

  try {
    const transfer = await stripe.transfers.create({
      amount: totalAmount,
      currency: "usd",
      destination: profile.stripeConnectId,
      description: `Trust Book royalty payout - ${lockResult.length} sale(s)`,
      metadata: {
        authorId,
        earningIds: lockResult.map(e => e.id).join(","),
        platform: "trust_book",
      },
    });

    for (const earning of lockResult) {
      await db.update(authorEarnings)
        .set({
          status: "paid",
          stripeTransferId: transfer.id,
          paidAt: new Date(),
        })
        .where(eq(authorEarnings.id, earning.id));
    }

    await db.update(authorProfiles)
      .set({
        totalPaidOutCents: sql`${authorProfiles.totalPaidOutCents} + ${totalAmount}`,
        pendingBalanceCents: sql`${authorProfiles.pendingBalanceCents} - ${totalAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(authorProfiles.userId, authorId));

    console.log(`[Author Payout] Success: $${(totalAmount / 100).toFixed(2)} to ${profile.stripeConnectId} (${lockResult.length} sales)`);
    return { success: true, amount: totalAmount, transferId: transfer.id, salesCount: lockResult.length };
  } catch (error: any) {
    console.error("[Author Payout] Transfer failed, rolling back:", error.message);
    for (const earning of lockResult) {
      await db.update(authorEarnings)
        .set({ status: "pending" })
        .where(eq(authorEarnings.id, earning.id));
    }
    return { success: false, message: `Payout failed: ${error.message}. Your earnings are safe and you can try again.` };
  }
}

export async function getAuthorDashboardStats(authorId: string) {
  const profile = await getAuthorProfile(authorId);
  const earnings = await getAuthorEarnings(authorId);
  const books = await db.select().from(publishedBooks)
    .where(eq(publishedBooks.authorId, authorId));

  const totalSales = earnings.length;
  const totalRevenue = earnings.reduce((sum, e) => sum + e.grossAmountCents, 0);
  const totalRoyalties = earnings.reduce((sum, e) => sum + e.authorEarningsCents, 0);
  const pendingPayout = earnings
    .filter(e => e.status === "pending" || e.status === "processing")
    .reduce((sum, e) => sum + e.authorEarningsCents, 0);
  const eligibleNow = earnings
    .filter(e => e.status === "pending" && e.eligibleAt && new Date(e.eligibleAt) <= new Date())
    .reduce((sum, e) => sum + e.authorEarningsCents, 0);
  const paidOut = earnings
    .filter(e => e.status === "paid")
    .reduce((sum, e) => sum + e.authorEarningsCents, 0);

  return {
    profile: profile ? {
      displayName: profile.displayName,
      stripeConnected: !!profile.stripeConnectId && profile.stripeOnboardingComplete,
      payoutEnabled: profile.payoutEnabled,
    } : null,
    stats: {
      totalBooks: books.length,
      publishedBooks: books.filter(b => b.status === "published").length,
      totalSales,
      totalRevenue,
      totalRoyalties,
      pendingPayout,
      eligibleNow,
      paidOut,
    },
    recentEarnings: earnings.slice(0, 20),
  };
}
