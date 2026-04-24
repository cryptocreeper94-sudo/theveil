import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { 
  guardianCertifications, 
  guardianMonitoredAssets, 
  guardianIncidents, 
  guardianBlockchainStamps,
  guardianSubscriptions,
  type InsertGuardianCertification,
  type InsertGuardianMonitoredAsset,
  type InsertGuardianIncident,
  type InsertGuardianBlockchainStamp
} from "@shared/schema";

export function generateDataHash(data: object): string {
  const jsonStr = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(jsonStr).digest("hex");
}

export function generateMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return "";
  if (hashes.length === 1) return hashes[0];
  
  const newLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    const combined = crypto.createHash("sha256").update(left + right).digest("hex");
    newLevel.push(combined);
  }
  return generateMerkleRoot(newLevel);
}

export const guardianService = {
  async createCertification(data: InsertGuardianCertification) {
    if (data.stripePaymentId) {
      const existing = await db.select()
        .from(guardianCertifications)
        .where(eq(guardianCertifications.stripePaymentId, data.stripePaymentId))
        .limit(1);
      if (existing.length > 0) {
        return existing[0];
      }
    }
    
    const [certification] = await db.insert(guardianCertifications)
      .values(data)
      .returning();
    
    await this.createBlockchainStamp({
      stampType: "certification",
      referenceId: certification.id,
      referenceType: "certification",
      dataHash: generateDataHash({ 
        projectName: data.projectName, 
        tier: data.tier, 
        contactEmail: data.contactEmail 
      }),
      chainId: "dwsc",
      status: "pending"
    });
    
    return certification;
  },

  async getCertification(id: string) {
    const [cert] = await db.select()
      .from(guardianCertifications)
      .where(eq(guardianCertifications.id, id));
    return cert;
  },

  async getCertificationsByUser(userId: string) {
    return db.select()
      .from(guardianCertifications)
      .where(eq(guardianCertifications.userId, userId))
      .orderBy(desc(guardianCertifications.createdAt));
  },

  async updateCertification(id: string, updates: Partial<InsertGuardianCertification>) {
    const [updated] = await db.update(guardianCertifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guardianCertifications.id, id))
      .returning();
    
    if (updated && updates.status === "completed") {
      await this.createBlockchainStamp({
        stampType: "certification",
        referenceId: id,
        referenceType: "certification",
        dataHash: generateDataHash({ 
          id, 
          status: "completed", 
          score: updates.score,
          completedAt: new Date().toISOString()
        }),
        chainId: "dwsc",
        status: "pending"
      });
    }
    
    return updated;
  },

  async addMonitoredAsset(data: InsertGuardianMonitoredAsset) {
    const [asset] = await db.insert(guardianMonitoredAssets)
      .values(data)
      .returning();
    
    await this.createBlockchainStamp({
      stampType: "asset_registered",
      referenceId: asset.id,
      referenceType: "asset",
      dataHash: generateDataHash({ 
        assetAddress: data.assetAddress, 
        assetType: data.assetType, 
        chainId: data.chainId 
      }),
      chainId: "dwsc",
      status: "pending"
    });
    
    return asset;
  },

  async getMonitoredAssets(userId: string) {
    return db.select()
      .from(guardianMonitoredAssets)
      .where(eq(guardianMonitoredAssets.userId, userId))
      .orderBy(desc(guardianMonitoredAssets.createdAt));
  },

  async updateAssetHealth(assetId: string, healthScore: number) {
    const [updated] = await db.update(guardianMonitoredAssets)
      .set({ healthScore, lastCheckedAt: new Date() })
      .where(eq(guardianMonitoredAssets.id, assetId))
      .returning();
    return updated;
  },

  async createIncident(data: InsertGuardianIncident) {
    const [incident] = await db.insert(guardianIncidents)
      .values(data)
      .returning();
    
    await this.createBlockchainStamp({
      stampType: "incident",
      referenceId: incident.id,
      referenceType: "incident",
      dataHash: generateDataHash({ 
        title: data.title, 
        severity: data.severity, 
        incidentType: data.incidentType,
        assetId: data.assetId 
      }),
      chainId: "dwsc",
      status: "pending"
    });
    
    return incident;
  },

  async getIncidents(userId: string) {
    return db.select()
      .from(guardianIncidents)
      .where(eq(guardianIncidents.userId, userId))
      .orderBy(desc(guardianIncidents.createdAt));
  },

  async resolveIncident(id: string) {
    const [updated] = await db.update(guardianIncidents)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(guardianIncidents.id, id))
      .returning();
    
    if (updated) {
      await this.createBlockchainStamp({
        stampType: "incident_resolved",
        referenceId: id,
        referenceType: "incident",
        dataHash: generateDataHash({ id, status: "resolved", resolvedAt: new Date().toISOString() }),
        chainId: "dwsc",
        status: "pending"
      });
    }
    
    return updated;
  },

  async createBlockchainStamp(data: InsertGuardianBlockchainStamp) {
    const [stamp] = await db.insert(guardianBlockchainStamps)
      .values(data)
      .returning();
    return stamp;
  },

  async getBlockchainStamps(referenceId?: string) {
    if (referenceId) {
      return db.select()
        .from(guardianBlockchainStamps)
        .where(eq(guardianBlockchainStamps.referenceId, referenceId))
        .orderBy(desc(guardianBlockchainStamps.createdAt));
    }
    return db.select()
      .from(guardianBlockchainStamps)
      .orderBy(desc(guardianBlockchainStamps.createdAt))
      .limit(100);
  },

  async confirmStamp(stampId: string, transactionHash: string, blockNumber: number) {
    const [confirmed] = await db.update(guardianBlockchainStamps)
      .set({ 
        status: "confirmed", 
        transactionHash, 
        blockNumber, 
        confirmedAt: new Date() 
      })
      .where(eq(guardianBlockchainStamps.id, stampId))
      .returning();
    
    if (confirmed && confirmed.referenceType === "certification") {
      await db.update(guardianCertifications)
        .set({ blockchainTxHash: transactionHash })
        .where(eq(guardianCertifications.id, confirmed.referenceId));
    }
    
    return confirmed;
  },

  async getPendingStamps() {
    return db.select()
      .from(guardianBlockchainStamps)
      .where(eq(guardianBlockchainStamps.status, "pending"))
      .orderBy(guardianBlockchainStamps.createdAt);
  },

  async batchConfirmStamps(stampIds: string[], merkleRoot: string, transactionHash: string, blockNumber: number) {
    const results = [];
    for (const id of stampIds) {
      const [confirmed] = await db.update(guardianBlockchainStamps)
        .set({ 
          status: "confirmed", 
          merkleRoot,
          transactionHash, 
          blockNumber, 
          confirmedAt: new Date() 
        })
        .where(eq(guardianBlockchainStamps.id, id))
        .returning();
      if (confirmed) results.push(confirmed);
    }
    return results;
  },

  async mintCertificationNFT(certificationId: string) {
    const cert = await this.getCertification(certificationId);
    if (!cert || cert.status !== "completed") {
      throw new Error("Certification must be completed before minting NFT");
    }
    
    const tokenId = `GUARDIAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const nftMetadata = {
      name: `Guardian Certification - ${cert.projectName}`,
      description: `Security certification for ${cert.projectName} with score ${cert.score}/100`,
      tier: cert.tier,
      score: cert.score,
      validFrom: cert.validFrom,
      validUntil: cert.validUntil,
      reportHash: cert.reportHash,
      tokenId
    };
    
    await db.update(guardianCertifications)
      .set({ nftTokenId: tokenId })
      .where(eq(guardianCertifications.id, certificationId));
    
    await this.createBlockchainStamp({
      stampType: "nft_mint",
      referenceId: certificationId,
      referenceType: "certification",
      dataHash: generateDataHash(nftMetadata),
      chainId: "dwsc",
      status: "pending",
      metadata: JSON.stringify(nftMetadata)
    });
    
    return { tokenId, metadata: nftMetadata };
  },

  async getSubscription(userId: string) {
    const [sub] = await db.select()
      .from(guardianSubscriptions)
      .where(and(
        eq(guardianSubscriptions.userId, userId),
        eq(guardianSubscriptions.status, "active")
      ));
    return sub;
  },

  async getPublicRegistry(limit = 20) {
    return db.select({
      id: guardianCertifications.id,
      projectName: guardianCertifications.projectName,
      tier: guardianCertifications.tier,
      score: guardianCertifications.score,
      validUntil: guardianCertifications.validUntil,
      nftTokenId: guardianCertifications.nftTokenId,
      blockchainTxHash: guardianCertifications.blockchainTxHash
    })
      .from(guardianCertifications)
      .where(eq(guardianCertifications.status, "completed"))
      .orderBy(desc(guardianCertifications.createdAt))
      .limit(limit);
  },

  async getAllCertifications() {
    return db.select()
      .from(guardianCertifications)
      .orderBy(desc(guardianCertifications.createdAt));
  },

  async completeCertification(id: string, score: number, findings: string) {
    if (typeof score !== "number" || score < 0 || score > 100) {
      throw new Error("Score must be a number between 0 and 100");
    }
    if (!findings || findings.trim().length < 10) {
      throw new Error("Findings must be at least 10 characters");
    }
    
    const reportHash = generateDataHash({ id, score, findings, completedAt: new Date().toISOString() });
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    
    const [updated] = await db.update(guardianCertifications)
      .set({ 
        status: "completed", 
        score,
        reportHash,
        findings,
        validFrom,
        validUntil,
        updatedAt: new Date()
      })
      .where(eq(guardianCertifications.id, id))
      .returning();
    
    if (updated) {
      await this.createBlockchainStamp({
        stampType: "certification_complete",
        referenceId: id,
        referenceType: "certification",
        dataHash: reportHash,
        chainId: "dwsc",
        status: "pending",
        metadata: JSON.stringify({ score, findings: findings.substring(0, 500) })
      });
    }
    
    return updated;
  }
};
