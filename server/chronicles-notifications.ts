import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { chronicleNotifications, chronicleAccounts } from "@shared/schema";
import type { Express, Request, Response, NextFunction } from "express";

type NotificationType = 'situation' | 'npc_message' | 'marketplace' | 'achievement' | 'system' | 'quest' | 'reward';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  iconEmoji?: string,
  linkTo?: string
) {
  const [notification] = await db.insert(chronicleNotifications).values({
    userId,
    type,
    title,
    message,
    iconEmoji: iconEmoji || getDefaultIcon(type),
    linkTo: linkTo || null,
  }).returning();
  return notification;
}

function getDefaultIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    situation: '📍',
    npc_message: '💬',
    marketplace: '🏪',
    achievement: '🏆',
    system: '⚙️',
    quest: '📜',
    reward: '🎁',
  };
  return icons[type] || '🔔';
}

export async function getNotifications(userId: string, limit = 50, unreadOnly = false) {
  const conditions = [eq(chronicleNotifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(chronicleNotifications.isRead, false));
  }

  const notifications = await db.select()
    .from(chronicleNotifications)
    .where(and(...conditions))
    .orderBy(desc(chronicleNotifications.createdAt))
    .limit(limit);

  return notifications;
}

export async function markAsRead(notificationId: string) {
  const [updated] = await db.update(chronicleNotifications)
    .set({ isRead: true })
    .where(eq(chronicleNotifications.id, notificationId))
    .returning();
  return updated;
}

export async function markAllAsRead(userId: string) {
  await db.update(chronicleNotifications)
    .set({ isRead: true })
    .where(and(
      eq(chronicleNotifications.userId, userId),
      eq(chronicleNotifications.isRead, false)
    ));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(chronicleNotifications)
    .where(and(
      eq(chronicleNotifications.userId, userId),
      eq(chronicleNotifications.isRead, false)
    ));
  return result[0]?.count || 0;
}

async function isChroniclesAuthenticated(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const sessionToken = authHeader.substring(7);

    const [account] = await db.select().from(chronicleAccounts)
      .where(eq(chronicleAccounts.sessionToken, sessionToken))
      .limit(1);

    if (!account) {
      return res.status(401).json({ error: "Invalid session" });
    }

    if (!account.isActive) {
      return res.status(401).json({ error: "Account disabled" });
    }

    if (account.sessionExpiresAt && new Date(account.sessionExpiresAt) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.chroniclesAccount = account;
    return next();
  } catch (error: any) {
    console.error("Chronicles notification auth error:", error.message || error);
    return res.status(401).json({ error: "Authentication required" });
  }
}

export function registerNotificationRoutes(app: Express) {
  app.get("/api/chronicles/notifications", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const limit = parseInt(req.query.limit as string) || 50;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await getNotifications(userId, limit, unreadOnly);
      res.json({ notifications });
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: error.message || "Failed to get notifications" });
    }
  });

  app.get("/api/chronicles/notifications/unread-count", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const count = await getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  });

  app.post("/api/chronicles/notifications/:id/read", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const notificationId = req.params.id;
      const updated = await markAsRead(notificationId);
      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ notification: updated });
    } catch (error: any) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: error.message || "Failed to mark notification as read" });
    }
  });

  app.post("/api/chronicles/notifications/read-all", isChroniclesAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.chroniclesAccount?.id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      await markAllAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: error.message || "Failed to mark all notifications as read" });
    }
  });
}
