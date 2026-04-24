/**
 * =====================================================
 * DARKWAVE REFERRAL & AFFILIATE SERVICE
 * =====================================================
 * 
 * Multi-host referral program for dwsc.io and yourlegacy.io.
 * Features tiered rewards, commission tracking, and fraud detection.
 */

import { storage } from "./storage";
import { creditsService } from "./credits-service";
import crypto from "crypto";
import type { 
  ReferralCode, 
  Referral, 
  AffiliateProfile, 
  AffiliateTierRecord,
  ReferralEvent,
  FraudFlag 
} from "@shared/schema";

export const REFERRAL_HOSTS = ["dwsc.io", "yourlegacy.io"] as const;
export type ReferralHost = typeof REFERRAL_HOSTS[number];

interface ProcessReferralResult {
  success: boolean;
  referral?: Referral;
  referrerReward?: number;
  refereeReward?: number;
  error?: string;
}

interface ConversionResult {
  success: boolean;
  referral?: Referral;
  commissionAmount?: number;
  error?: string;
}

class ReferralService {
  private generateUniqueCode(userId: string): string {
    const hash = crypto.createHash("sha256").update(userId + Date.now().toString()).digest("hex");
    return hash.substring(0, 8).toUpperCase();
  }

  async getOrCreateReferralCode(userId: string, host: ReferralHost = "dwsc.io"): Promise<ReferralCode> {
    let code = await storage.getReferralCode(userId, host);
    
    if (!code) {
      let uniqueCode = this.generateUniqueCode(userId);
      let attempts = 0;
      
      while (await storage.getReferralCodeByCode(uniqueCode) && attempts < 10) {
        uniqueCode = this.generateUniqueCode(userId + attempts);
        attempts++;
      }
      
      code = await storage.createReferralCode({
        userId,
        code: uniqueCode,
        host,
        isActive: true,
      });
      
      await this.getOrCreateAffiliateProfile(userId);
    }
    
    return code;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    return storage.getReferralCodeByCode(code);
  }

  async trackReferralClick(code: string): Promise<void> {
    await storage.incrementReferralCodeClicks(code);
  }

  async getOrCreateAffiliateProfile(userId: string): Promise<AffiliateProfile> {
    let profile = await storage.getAffiliateProfile(userId);
    
    if (!profile) {
      profile = await storage.createAffiliateProfile({
        userId,
        currentTier: "explorer",
        preferredHost: "dwsc.io",
        isAffiliate: false,
      });
    }
    
    return profile;
  }

  async getAffiliateTier(userId: string, host: ReferralHost = "dwsc.io"): Promise<AffiliateTierRecord | undefined> {
    const profile = await storage.getAffiliateProfile(userId);
    if (!profile) return undefined;
    
    const tierSlug = host === "yourlegacy.io" ? `${profile.currentTier}-legacy` : profile.currentTier;
    return storage.getAffiliateTier(tierSlug);
  }

  async processNewSignup(
    refereeId: string, 
    referralCode: string, 
    host: ReferralHost = "dwsc.io",
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<ProcessReferralResult> {
    try {
      const existing = await storage.getReferralByReferee(refereeId);
      if (existing) {
        return { success: false, error: "User already has a referral record" };
      }
      
      const codeRecord = await storage.getReferralCodeByCode(referralCode);
      if (!codeRecord || !codeRecord.isActive) {
        return { success: false, error: "Invalid or inactive referral code" };
      }
      
      if (codeRecord.userId === refereeId) {
        return { success: false, error: "Cannot refer yourself" };
      }
      
      const tier = await this.getAffiliateTier(codeRecord.userId, host);
      const referrerReward = tier?.referrerRewardCredits || 250;
      const refereeReward = tier?.refereeRewardCredits || 100;
      
      const referral = await storage.createReferral({
        referrerId: codeRecord.userId,
        refereeId,
        referralCodeId: codeRecord.id,
        host,
        status: "pending",
        referrerReward,
        refereeReward,
      });
      
      await storage.incrementReferralCodeSignups(referralCode);
      
      await storage.createReferralEvent({
        referralId: referral.id,
        eventType: "signup",
        eventData: JSON.stringify({ referralCode, host }),
        creditsAwarded: 0,
        commissionAwarded: 0,
      });
      
      const profile = await storage.getAffiliateProfile(codeRecord.userId);
      if (profile) {
        await storage.updateAffiliateProfile(codeRecord.userId, {
          totalReferrals: (profile.totalReferrals || 0) + 1,
        });
      }
      
      if (metadata?.ipAddress) {
        const recentReferrals = await storage.getReferralsByReferrer(codeRecord.userId);
        const sameIpCount = recentReferrals.filter(r => {
          const createdAt = new Date(r.createdAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdAt > oneDayAgo;
        }).length;
        
        if (sameIpCount > 5) {
          await storage.createFraudFlag({
            referralId: referral.id,
            userId: refereeId,
            flagType: "suspicious_ip",
            reason: `Multiple signups from same referrer in 24h (${sameIpCount} total)`,
            severity: sameIpCount > 10 ? "high" : "medium",
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          });
        }
      }
      
      return { success: true, referral, referrerReward, refereeReward };
    } catch (error) {
      console.error("Error processing referral signup:", error);
      return { success: false, error: "Failed to process referral" };
    }
  }

  async qualifyReferral(referralId: string): Promise<Referral | undefined> {
    const referral = await storage.updateReferralStatus(referralId, "qualified");
    
    if (referral) {
      await creditsService.addCredits(referral.referrerId, referral.referrerReward, "bonus", "Referral signup bonus");
      await creditsService.addCredits(referral.refereeId, referral.refereeReward, "bonus", "Welcome bonus from referral");
      
      await storage.createReferralEvent({
        referralId: referral.id,
        eventType: "qualified",
        eventData: JSON.stringify({ referrerReward: referral.referrerReward, refereeReward: referral.refereeReward }),
        creditsAwarded: referral.referrerReward + referral.refereeReward,
        commissionAwarded: 0,
      });
      
      const profile = await storage.getAffiliateProfile(referral.referrerId);
      if (profile) {
        await storage.updateAffiliateProfile(referral.referrerId, {
          qualifiedReferrals: (profile.qualifiedReferrals || 0) + 1,
          lifetimeCreditsEarned: (profile.lifetimeCreditsEarned || 0) + referral.referrerReward,
        });
        
        await this.checkTierUpgrade(referral.referrerId, referral.host as ReferralHost);
      }
    }
    
    return referral;
  }

  async processConversion(
    refereeId: string, 
    conversionValueCents: number
  ): Promise<ConversionResult> {
    try {
      const referral = await storage.getReferralByReferee(refereeId);
      if (!referral) {
        return { success: false, error: "No referral found for this user" };
      }
      
      if (referral.status === "converted") {
        return { success: false, error: "Referral already converted" };
      }
      
      const tier = await this.getAffiliateTier(referral.referrerId, referral.host as ReferralHost);
      const commissionPercent = tier?.commissionPercent || 10;
      const commissionAmount = Math.floor(conversionValueCents * (commissionPercent / 100));
      
      const SIG_LAUNCH_DATE = new Date("2026-04-11T00:00:00Z");
      const isPreLaunch = new Date() < SIG_LAUNCH_DATE;
      const distributionMode = isPreLaunch ? "airdrop" : "cash";
      
      const updatedReferral = await storage.updateReferralStatus(referral.id, "converted", {
        conversionValue: conversionValueCents,
        commissionAmount,
      });
      
      if (updatedReferral) {
        await storage.incrementReferralCodeConversions(
          (await storage.getReferralCode(referral.referrerId, referral.host))?.code || ""
        );
        
        await storage.createReferralEvent({
          referralId: referral.id,
          eventType: "converted",
          eventData: JSON.stringify({ conversionValueCents, commissionAmount, commissionPercent, distributionMode }),
          creditsAwarded: 0,
          commissionAwarded: commissionAmount,
        });
        
        const profile = await storage.getAffiliateProfile(referral.referrerId);
        if (profile) {
          const dwcExchangeRate = 0.001; // $0.001 per SIG (1B supply)
          
          if (isPreLaunch) {
            const newAirdropBalance = (profile.airdropBalance || 0) + commissionAmount;
            const airdropDwc = (newAirdropBalance / 100 / dwcExchangeRate).toFixed(2);
            
            await storage.updateAffiliateProfile(referral.referrerId, {
              lifetimeConversions: (profile.lifetimeConversions || 0) + 1,
              lifetimeCommissionEarned: (profile.lifetimeCommissionEarned || 0) + commissionAmount,
              airdropBalance: newAirdropBalance,
              airdropBalanceDwc: airdropDwc,
              airdropStatus: "accumulating",
            });
          } else {
            await storage.updateAffiliateProfile(referral.referrerId, {
              lifetimeConversions: (profile.lifetimeConversions || 0) + 1,
              lifetimeCommissionEarned: (profile.lifetimeCommissionEarned || 0) + commissionAmount,
              pendingCommission: (profile.pendingCommission || 0) + commissionAmount,
            });
          }
          
          await this.checkTierUpgrade(referral.referrerId, referral.host as ReferralHost);
        }
        
        await storage.createCommissionPayout({
          userId: referral.referrerId,
          affiliateUserId: referral.referrerId,
          host: referral.host,
          amount: commissionAmount,
          currency: "USD",
          status: "pending",
          payoutStatus: isPreLaunch ? "accruing" : "accruing",
          distributionMode,
          notes: `Commission from referral ${referral.id} (${distributionMode} mode)`,
        });
      }
      
      return { success: true, referral: updatedReferral, commissionAmount };
    } catch (error) {
      console.error("Error processing conversion:", error);
      return { success: false, error: "Failed to process conversion" };
    }
  }

  private async checkTierUpgrade(userId: string, host: ReferralHost): Promise<void> {
    const profile = await storage.getAffiliateProfile(userId);
    if (!profile) return;
    
    const tiers = await storage.getAffiliateTiers(host);
    const conversions = profile.lifetimeConversions || 0;
    
    let newTier = "explorer";
    for (const tier of tiers.reverse()) {
      if (conversions >= tier.minConversions) {
        newTier = tier.slug.replace("-legacy", "");
        break;
      }
    }
    
    if (newTier !== profile.currentTier) {
      await storage.updateAffiliateProfile(userId, { currentTier: newTier });
    }
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return storage.getReferralsByReferrer(userId);
  }

  async getUserStats(userId: string): Promise<{
    profile: AffiliateProfile | undefined;
    referralCode: ReferralCode | undefined;
    tier: AffiliateTierRecord | undefined;
    referrals: Referral[];
    totalClicks: number;
    totalSignups: number;
    totalConversions: number;
    pendingCommission: number;
    lifetimeEarnings: number;
  }> {
    const profile = await storage.getAffiliateProfile(userId);
    const referralCode = await storage.getReferralCode(userId);
    const tier = profile ? await storage.getAffiliateTier(profile.currentTier) : undefined;
    const referrals = await storage.getReferralsByReferrer(userId);
    
    return {
      profile,
      referralCode,
      tier,
      referrals,
      totalClicks: referralCode?.clickCount || 0,
      totalSignups: referralCode?.signupCount || 0,
      totalConversions: referralCode?.conversionCount || 0,
      pendingCommission: profile?.pendingCommission || 0,
      lifetimeEarnings: (profile?.lifetimeCreditsEarned || 0) + (profile?.lifetimeCommissionEarned || 0),
    };
  }

  async getAdminStats(host?: ReferralHost): Promise<{
    stats: { totalReferrals: number; totalConversions: number; totalCreditsRewarded: number; totalCommissionPaid: number };
    topAffiliates: AffiliateProfile[];
    recentReferrals: Referral[];
    pendingFraudFlags: FraudFlag[];
  }> {
    const stats = await storage.getReferralStats(host);
    const topAffiliates = await storage.getAllAffiliateProfiles(10);
    const recentReferrals = await storage.getAllReferrals(host, undefined, 20);
    const pendingFraudFlags = (await storage.getFraudFlags()).filter(f => !f.isResolved);
    
    return { stats, topAffiliates, recentReferrals, pendingFraudFlags };
  }

  async getAffiliateTiers(host: ReferralHost = "dwsc.io"): Promise<AffiliateTierRecord[]> {
    return storage.getAffiliateTiers(host);
  }
}

export const referralService = new ReferralService();
