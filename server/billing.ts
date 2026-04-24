import { db } from "./db";
import { usageLogs, developerBilling, apiKeys } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";

const COST_PER_AI_CALL_CENTS = 3;

export class BillingService {
  async logUsage(apiKeyId: string, endpoint: string, tokensUsed: number = 0, email?: string) {
    const costCents = COST_PER_AI_CALL_CENTS;
    
    await db.insert(usageLogs).values({
      apiKeyId,
      endpoint,
      tokensUsed: tokensUsed.toString(),
      costCents: costCents.toString(),
    });

    const updateResult = await db.execute(sql`
      UPDATE developer_billing 
      SET total_usage_cents = (CAST(total_usage_cents AS INTEGER) + ${costCents})::TEXT
      WHERE api_key_id = ${apiKeyId}
    `);

    if (updateResult.rowCount === 0 && email) {
      await this.createOrGetBillingRecord(apiKeyId, email);
      await db.execute(sql`
        UPDATE developer_billing 
        SET total_usage_cents = ${costCents.toString()}
        WHERE api_key_id = ${apiKeyId}
      `);
    }

    return { costCents };
  }

  async getUsageStats(apiKeyId: string) {
    const logs = await db.select().from(usageLogs)
      .where(eq(usageLogs.apiKeyId, apiKeyId))
      .orderBy(sql`timestamp DESC`)
      .limit(100);

    const billing = await db.select().from(developerBilling)
      .where(eq(developerBilling.apiKeyId, apiKeyId))
      .limit(1);

    const totalCalls = await db.execute(sql`
      SELECT COUNT(*) as count FROM usage_logs WHERE api_key_id = ${apiKeyId}
    `);

    return {
      recentLogs: logs,
      billing: billing[0] || null,
      totalCalls: Number(totalCalls.rows[0]?.count || 0),
    };
  }

  async getOutstandingBalance(apiKeyId: string): Promise<number> {
    const billing = await db.select().from(developerBilling)
      .where(eq(developerBilling.apiKeyId, apiKeyId))
      .limit(1);

    if (!billing[0]) return 0;

    const total = parseInt(billing[0].totalUsageCents || "0");
    const paid = parseInt(billing[0].paidThroughCents || "0");
    return total - paid;
  }

  async createOrGetBillingRecord(apiKeyId: string, email: string) {
    const existing = await db.select().from(developerBilling)
      .where(eq(developerBilling.apiKeyId, apiKeyId))
      .limit(1);

    if (existing[0]) return existing[0];

    const [newRecord] = await db.insert(developerBilling).values({
      apiKeyId,
      email,
      totalUsageCents: "0",
      paidThroughCents: "0",
    }).returning();

    return newRecord;
  }

  async createStripeCheckout(apiKeyId: string, amountCents: number, successUrl: string, cancelUrl: string) {
    const billing = await db.select().from(developerBilling)
      .where(eq(developerBilling.apiKeyId, apiKeyId))
      .limit(1);

    if (!billing[0]) {
      throw new Error("Billing record not found");
    }

    const stripe = await getUncachableStripeClient();

    let customerId = billing[0].stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: billing[0].email,
        metadata: { apiKeyId },
      });
      customerId = customer.id;

      await db.update(developerBilling)
        .set({ stripeCustomerId: customerId })
        .where(eq(developerBilling.apiKeyId, apiKeyId));
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Trust Layer API Usage",
            description: `API usage charges - ${amountCents / 100} USD`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { apiKeyId, amountCents: amountCents.toString() },
    });

    return session;
  }

  async handlePaymentSuccess(apiKeyId: string, amountCents: number) {
    await db.execute(sql`
      UPDATE developer_billing 
      SET paid_through_cents = (CAST(paid_through_cents AS INTEGER) + ${amountCents})::TEXT,
          last_billed_at = NOW()
      WHERE api_key_id = ${apiKeyId}
    `);
  }

  async getAllBillingStats() {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT api_key_id) as total_developers,
        SUM(CAST(total_usage_cents AS INTEGER)) as total_revenue_cents,
        SUM(CAST(total_usage_cents AS INTEGER) - CAST(paid_through_cents AS INTEGER)) as outstanding_cents
      FROM developer_billing
    `);

    const usageCount = await db.execute(sql`
      SELECT COUNT(*) as total_calls FROM usage_logs
    `);

    return {
      totalDevelopers: Number(result.rows[0]?.total_developers || 0),
      totalRevenueCents: Number(result.rows[0]?.total_revenue_cents || 0),
      outstandingCents: Number(result.rows[0]?.outstanding_cents || 0),
      totalApiCalls: Number(usageCount.rows[0]?.total_calls || 0),
    };
  }
}

export const billingService = new BillingService();
