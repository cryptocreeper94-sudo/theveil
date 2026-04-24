import { db } from "./db";
import { 
  users, 
  trustLayerMemberships, 
  membershipReconciliationQueue,
  membershipLinkedAccounts 
} from "@shared/schema";
import { eq, and, or, isNull, sql, desc, ne } from "drizzle-orm";

function generateTrustLayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TL-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const membershipReconciliationService = {
  async getOrCreateMembership(userId: string, entryPoint?: string): Promise<string> {
    const existing = await db.select()
      .from(trustLayerMemberships)
      .where(eq(trustLayerMemberships.primaryUserId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0].trustLayerId;
    }

    let trustLayerId = generateTrustLayerId();
    let attempts = 0;
    while (attempts < 10) {
      const [existingId] = await db.select()
        .from(trustLayerMemberships)
        .where(eq(trustLayerMemberships.trustLayerId, trustLayerId))
        .limit(1);
      
      if (!existingId) break;
      trustLayerId = generateTrustLayerId();
      attempts++;
    }

    const [membership] = await db.insert(trustLayerMemberships)
      .values({
        primaryUserId: userId,
        trustLayerId,
        membershipStatus: 'pending',
        membershipType: 'individual',
        entryPoint: entryPoint || 'unknown',
        reconciliationStatus: 'pending',
      })
      .returning();

    await db.insert(membershipLinkedAccounts)
      .values({
        membershipId: membership.id,
        userId,
        authProvider: 'primary',
      });

    return trustLayerId;
  },

  async findDuplicates(userId: string): Promise<Array<{ userId: string; matchType: string; confidence: string }>> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return [];

    const duplicates: Array<{ userId: string; matchType: string; confidence: string; score: number }> = [];
    const addDuplicate = (matchId: string, matchType: string, confidence: string, score: number) => {
      const existing = duplicates.find(d => d.userId === matchId);
      if (existing) {
        existing.score += score;
        if (existing.score >= 3) existing.confidence = 'high';
        else if (existing.score >= 2) existing.confidence = 'medium';
        existing.matchType = `${existing.matchType},${matchType}`;
      } else {
        duplicates.push({ userId: matchId, matchType, confidence, score });
      }
    };

    if (user.email) {
      const emailMatches = await db.select()
        .from(users)
        .where(and(
          eq(users.email, user.email),
          ne(users.id, userId)
        ));
      
      for (const match of emailMatches) {
        addDuplicate(match.id, 'email', 'high', 3);
      }
    }

    if (user.phoneNumber) {
      const phoneMatches = await db.select()
        .from(users)
        .where(and(
          eq(users.phoneNumber, user.phoneNumber),
          ne(users.id, userId)
        ));
      
      for (const match of phoneMatches) {
        addDuplicate(match.id, 'phone', 'high', 3);
      }
    }

    if (user.username && user.username.length >= 4) {
      const usernameMatches = await db.select()
        .from(users)
        .where(and(
          eq(users.username, user.username),
          ne(users.id, userId)
        ));
      
      for (const match of usernameMatches) {
        addDuplicate(match.id, 'username', 'medium', 2);
      }
    }

    if (user.displayName && user.displayName.length >= 5) {
      const nameMatches = await db.select()
        .from(users)
        .where(and(
          eq(users.displayName, user.displayName),
          ne(users.id, userId)
        ));
      
      for (const match of nameMatches) {
        addDuplicate(match.id, 'display_name', 'low', 1);
      }
    }

    return duplicates.map(d => ({ userId: d.userId, matchType: d.matchType, confidence: d.confidence }));
  },

  async queueForReconciliation(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    const duplicates = await this.findDuplicates(userId);

    for (const dup of duplicates) {
      const [existing] = await db.select()
        .from(membershipReconciliationQueue)
        .where(and(
          eq(membershipReconciliationQueue.userId, userId),
          eq(membershipReconciliationQueue.potentialDuplicateOf, dup.userId),
          eq(membershipReconciliationQueue.status, 'pending')
        ))
        .limit(1);

      if (!existing) {
        await db.insert(membershipReconciliationQueue)
          .values({
            userId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            potentialDuplicateOf: dup.userId,
            matchType: dup.matchType,
            matchConfidence: dup.confidence,
            status: 'pending',
          });
      }
    }
  },

  async runReconciliation(): Promise<{ processed: number; merged: number; activated: number }> {
    let processed = 0;
    let merged = 0;
    let activated = 0;

    const pendingItems = await db.select()
      .from(membershipReconciliationQueue)
      .where(eq(membershipReconciliationQueue.status, 'pending'))
      .orderBy(membershipReconciliationQueue.createdAt)
      .limit(100);

    for (const item of pendingItems) {
      processed++;

      if (item.matchConfidence === 'high' && item.potentialDuplicateOf) {
        try {
          const [existingMembership] = await db.select()
            .from(trustLayerMemberships)
            .where(eq(trustLayerMemberships.primaryUserId, item.potentialDuplicateOf))
            .limit(1);

          if (existingMembership) {
            await db.insert(membershipLinkedAccounts)
              .values({
                membershipId: existingMembership.id,
                userId: item.userId,
                authProvider: 'merged',
              })
              .onConflictDoNothing();

            const currentMerged = (existingMembership.mergedUserIds as string[]) || [];
            if (!currentMerged.includes(item.userId)) {
              await db.update(trustLayerMemberships)
                .set({
                  mergedUserIds: [...currentMerged, item.userId],
                  updatedAt: new Date(),
                })
                .where(eq(trustLayerMemberships.id, existingMembership.id));
            }

            const [newUserMembership] = await db.select()
              .from(trustLayerMemberships)
              .where(eq(trustLayerMemberships.primaryUserId, item.userId))
              .limit(1);

            if (newUserMembership) {
              await db.delete(trustLayerMemberships)
                .where(eq(trustLayerMemberships.id, newUserMembership.id));
            }

            merged++;
          }
        } catch (mergeError) {
          console.error(`[Membership Reconciliation] Merge failed for user ${item.userId}:`, mergeError);
          continue;
        }

        await db.update(membershipReconciliationQueue)
          .set({
            status: 'merged',
            resolvedAt: new Date(),
            resolvedBy: 'system',
          })
          .where(eq(membershipReconciliationQueue.id, item.id));
      } else {
        await db.update(membershipReconciliationQueue)
          .set({
            status: 'auto_resolved',
            resolvedAt: new Date(),
            resolvedBy: 'system',
          })
          .where(eq(membershipReconciliationQueue.id, item.id));
      }
    }

    const pendingMemberships = await db.select()
      .from(trustLayerMemberships)
      .where(and(
        eq(trustLayerMemberships.reconciliationStatus, 'pending'),
        eq(trustLayerMemberships.membershipStatus, 'pending')
      ));

    for (const membership of pendingMemberships) {
      const hasPendingReconciliation = await db.select()
        .from(membershipReconciliationQueue)
        .where(and(
          or(
            eq(membershipReconciliationQueue.userId, membership.primaryUserId),
            eq(membershipReconciliationQueue.potentialDuplicateOf, membership.primaryUserId)
          ),
          eq(membershipReconciliationQueue.status, 'pending')
        ))
        .limit(1);

      if (hasPendingReconciliation.length === 0) {
        await db.update(trustLayerMemberships)
          .set({
            reconciliationStatus: 'completed',
            membershipStatus: 'active',
            activatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(trustLayerMemberships.id, membership.id));

        activated++;
      }
    }

    console.log(`[Membership Reconciliation] Processed: ${processed}, Merged: ${merged}, Activated: ${activated}`);
    return { processed, merged, activated };
  },

  async getMembershipByUserId(userId: string): Promise<{ trustLayerId: string; status: string } | null> {
    const [membership] = await db.select()
      .from(trustLayerMemberships)
      .where(eq(trustLayerMemberships.primaryUserId, userId))
      .limit(1);

    if (membership) {
      return { trustLayerId: membership.trustLayerId, status: membership.membershipStatus || 'pending' };
    }

    const [linkedAccount] = await db.select()
      .from(membershipLinkedAccounts)
      .where(eq(membershipLinkedAccounts.userId, userId))
      .limit(1);

    if (linkedAccount) {
      const [linkedMembership] = await db.select()
        .from(trustLayerMemberships)
        .where(eq(trustLayerMemberships.id, linkedAccount.membershipId))
        .limit(1);

      if (linkedMembership) {
        return { trustLayerId: linkedMembership.trustLayerId, status: linkedMembership.membershipStatus || 'pending' };
      }
    }

    return null;
  },

  async getPendingNotifications(): Promise<Array<{ userId: string; trustLayerId: string; email: string | null }>> {
    const readyToNotify = await db.select({
      userId: trustLayerMemberships.primaryUserId,
      trustLayerId: trustLayerMemberships.trustLayerId,
      email: users.email,
    })
      .from(trustLayerMemberships)
      .innerJoin(users, eq(users.id, trustLayerMemberships.primaryUserId))
      .where(and(
        eq(trustLayerMemberships.membershipStatus, 'active'),
        eq(trustLayerMemberships.reconciliationStatus, 'completed'),
        eq(trustLayerMemberships.notificationSent, false)
      ));

    return readyToNotify;
  },

  async markNotificationSent(userId: string): Promise<void> {
    await db.update(trustLayerMemberships)
      .set({
        notificationSent: true,
        notificationSentAt: new Date(),
      })
      .where(eq(trustLayerMemberships.primaryUserId, userId));
  },
};
