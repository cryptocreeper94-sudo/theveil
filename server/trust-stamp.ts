import { submitHashToDarkWave, generateDataHash } from "./darkwave";
import { db } from "./db";
import { trustStamps } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface TrustStampResult {
  success: boolean;
  txHash?: string;
  blockHeight?: number;
  dataHash: string;
  category: string;
  timestamp: string;
}

export async function trustStamp(
  category: string,
  data: Record<string, any>
): Promise<TrustStampResult> {
  const timestamp = new Date().toISOString();
  const userId = data.userId || data.email || data.owner || null;
  const payload = { ...data, category, stampedAt: timestamp };
  const dataHash = generateDataHash(payload);

  try {
    const result = await submitHashToDarkWave({
      dataHash,
      appId: "trust-layer-core",
      category,
      metadata: payload,
    });

    await db.insert(trustStamps).values({
      userId,
      category,
      dataHash,
      txHash: result.txHash || null,
      blockHeight: result.blockHeight || null,
      metadata: JSON.stringify(data),
      status: result.success ? "confirmed" : "pending",
    });

    if (result.success) {
      console.log(`[TrustStamp] ${category} stamped: tx=${result.txHash}, block=${result.blockHeight}`);
    }

    return {
      success: result.success,
      txHash: result.txHash,
      blockHeight: result.blockHeight,
      dataHash,
      category,
      timestamp,
    };
  } catch (err) {
    console.error(`[TrustStamp] ${category} stamp failed:`, err);
    try {
      await db.insert(trustStamps).values({
        userId,
        category,
        dataHash,
        metadata: JSON.stringify(data),
        status: "failed",
      });
    } catch {}
    return { success: false, dataHash, category, timestamp };
  }
}

export async function getUserTrustStamps(userId: string) {
  return db.select().from(trustStamps)
    .where(eq(trustStamps.userId, userId))
    .orderBy(desc(trustStamps.createdAt))
    .limit(100);
}
