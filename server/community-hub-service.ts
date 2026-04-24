import { db } from "./db";
import { eq, desc, and, sql, like, or, asc } from "drizzle-orm";
import {
  communities,
  communityChannels,
  communityMembers,
  communityMessages,
  communityBots,
  messageReactions,
  messageAttachments,
  pinnedMessages,
  communityPolls,
  pollVotes,
  scheduledMessages,
  communityRoles,
  customEmojis,
  memberNotificationSettings,
  dmConversations,
  directMessages,
  messageThreads,
  type Community,
  type CommunityChannel,
  type CommunityMember,
  type CommunityMessage,
  type MessageReaction,
  type InsertCommunity,
  type InsertChannel,
  type InsertCommunityMessage,
  type PinnedMessage,
  type CommunityPoll,
  type CommunityRole,
  type CustomEmoji,
  type DmConversation,
  type DirectMessage,
  type ScheduledMessage,
} from "@shared/schema";
import crypto from "crypto";

interface AttachmentData {
  url: string;
  name: string;
  type: string;
}

interface SendMessageData extends InsertCommunityMessage {
  attachment?: AttachmentData | null;
}

export class CommunityHubService {
  async createCommunity(data: InsertCommunity): Promise<Community> {
    const [community] = await db.insert(communities).values(data).returning();
    
    await db.insert(communityChannels).values({
      communityId: community.id,
      name: "general",
      description: "General discussion",
      type: "chat",
      position: 0,
    });
    
    await db.insert(communityChannels).values({
      communityId: community.id,
      name: "announcements",
      description: "Official announcements",
      type: "announcement",
      position: 1,
      isLocked: true,
    });
    
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: data.ownerId,
      username: "Owner",
      role: "owner",
    });
    
    await db.update(communities)
      .set({ memberCount: 1 })
      .where(eq(communities.id, community.id));
    
    return community;
  }
  
  async getCommunities(): Promise<Community[]> {
    return db.select()
      .from(communities)
      .where(eq(communities.isPublic, true))
      .orderBy(desc(communities.memberCount));
  }
  
  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.id, id));
    return community;
  }
  
  async getUserCommunities(userId: string): Promise<Community[]> {
    const memberships = await db.select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    
    if (memberships.length === 0) return [];
    
    return db.select()
      .from(communities)
      .where(sql`${communities.id} IN (${sql.join(memberships.map(m => sql`${m.communityId}`), sql`, `)})`);
  }
  
  async getChannels(communityId: string): Promise<CommunityChannel[]> {
    return db.select()
      .from(communityChannels)
      .where(eq(communityChannels.communityId, communityId))
      .orderBy(communityChannels.position);
  }
  
  async createChannel(data: InsertChannel): Promise<CommunityChannel> {
    const [channel] = await db.insert(communityChannels).values(data).returning();
    return channel;
  }
  
  async joinCommunity(communityId: string, userId: string, username: string): Promise<CommunityMember> {
    const existing = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
    
    if (existing.length > 0) return existing[0];
    
    const [member] = await db.insert(communityMembers).values({
      communityId,
      userId,
      username,
      role: "member",
    }).returning();
    
    await db.update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
    
    return member;
  }
  
  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
    
    await db.update(communities)
      .set({ memberCount: sql`${communities.memberCount} - 1` })
      .where(eq(communities.id, communityId));
  }
  
  async getMembers(communityId: string): Promise<CommunityMember[]> {
    return db.select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.isOnline));
  }
  
  async getMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
    return member;
  }
  
  async updateMemberOnline(communityId: string, userId: string, isOnline: boolean): Promise<void> {
    await db.update(communityMembers)
      .set({ isOnline, lastSeenAt: new Date() })
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
  }
  
  async sendMessage(data: SendMessageData): Promise<CommunityMessage & { attachment?: AttachmentData | null }> {
    const { attachment, ...messageData } = data;
    const [message] = await db.insert(communityMessages).values(messageData).returning();
    
    if (attachment) {
      await db.insert(messageAttachments).values({
        messageId: message.id,
        type: attachment.type,
        url: attachment.url,
        filename: attachment.name,
      });
    }
    
    return { ...message, attachment: attachment || null };
  }
  
  async getMessages(channelId: string, limit = 50): Promise<(CommunityMessage & { attachment?: AttachmentData | null })[]> {
    const messages = await db.select()
      .from(communityMessages)
      .where(eq(communityMessages.channelId, channelId))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit);
    
    const messagesWithAttachments = await Promise.all(
      messages.map(async (msg) => {
        const [att] = await db.select()
          .from(messageAttachments)
          .where(eq(messageAttachments.messageId, msg.id));
        return {
          ...msg,
          attachment: att ? { url: att.url, name: att.filename || "", type: att.type } : null,
        };
      })
    );
    
    return messagesWithAttachments;
  }
  
  async getMessageById(messageId: string): Promise<CommunityMessage | null> {
    const [message] = await db.select()
      .from(communityMessages)
      .where(eq(communityMessages.id, messageId));
    return message || null;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const [message] = await db.select()
      .from(communityMessages)
      .where(eq(communityMessages.id, messageId));
    
    if (!message || message.userId !== userId) return false;
    
    await db.delete(communityMessages).where(eq(communityMessages.id, messageId));
    return true;
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<CommunityMessage | null> {
    const [message] = await db.select()
      .from(communityMessages)
      .where(eq(communityMessages.id, messageId));
    
    if (!message || message.userId !== userId) return null;
    
    const [updated] = await db.update(communityMessages)
      .set({ content, editedAt: new Date() })
      .where(eq(communityMessages.id, messageId))
      .returning();
    
    return updated;
  }

  async addReaction(messageId: string, userId: string, username: string, emoji: string): Promise<MessageReaction> {
    const existing = await db.select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
    
    if (existing.length > 0) return existing[0];
    
    const [reaction] = await db.insert(messageReactions).values({
      messageId,
      userId,
      username,
      emoji,
    }).returning();
    
    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
  }

  async getReactions(messageId: string): Promise<{ emoji: string; count: number; users: { userId: string; username: string }[] }[]> {
    const reactions = await db.select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
    
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      acc[r.emoji].count++;
      acc[r.emoji].users.push({ userId: r.userId, username: r.username });
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: { userId: string; username: string }[] }>);
    
    return Object.values(grouped);
  }

  async getMessagesWithReactions(channelId: string, limit = 50): Promise<(CommunityMessage & { reactions: any[]; replyTo: CommunityMessage | null })[]> {
    const messages = await db.select()
      .from(communityMessages)
      .where(eq(communityMessages.channelId, channelId))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit);
    
    const enriched = await Promise.all(messages.map(async (msg) => {
      const reactions = await this.getReactions(msg.id);
      let replyTo = null;
      if (msg.replyToId) {
        replyTo = await this.getMessageById(msg.replyToId);
      }
      return { ...msg, reactions, replyTo };
    }));
    
    return enriched;
  }
  
  async createBot(communityId: string, name: string, description: string): Promise<{ id: string; apiKey: string }> {
    const apiKey = `dwc_bot_${crypto.randomBytes(32).toString("hex")}`;
    
    const [bot] = await db.insert(communityBots).values({
      communityId,
      name,
      description,
      apiKey,
    }).returning();
    
    return { id: bot.id, apiKey };
  }
  
  async getBots(communityId: string) {
    return db.select({
      id: communityBots.id,
      name: communityBots.name,
      description: communityBots.description,
      icon: communityBots.icon,
      isActive: communityBots.isActive,
      createdAt: communityBots.createdAt,
    })
      .from(communityBots)
      .where(eq(communityBots.communityId, communityId));
  }
  
  async sendBotMessage(apiKey: string, channelId: string, content: string): Promise<CommunityMessage | null> {
    const [bot] = await db.select()
      .from(communityBots)
      .where(eq(communityBots.apiKey, apiKey));
    
    if (!bot || !bot.isActive) return null;
    
    const [message] = await db.insert(communityMessages).values({
      channelId,
      userId: `bot_${bot.id}`,
      username: bot.name,
      content,
      isBot: true,
    }).returning();
    
    return message;
  }

  // =====================================================
  // PINNED MESSAGES
  // =====================================================

  async pinMessage(messageId: string, channelId: string, userId: string): Promise<PinnedMessage> {
    const [existing] = await db.select().from(pinnedMessages).where(eq(pinnedMessages.messageId, messageId));
    if (existing) return existing;
    
    const [pinned] = await db.insert(pinnedMessages).values({
      messageId,
      channelId,
      pinnedById: userId,
    }).returning();
    return pinned;
  }

  async unpinMessage(messageId: string): Promise<void> {
    await db.delete(pinnedMessages).where(eq(pinnedMessages.messageId, messageId));
  }

  async getPinnedMessages(channelId: string): Promise<(CommunityMessage & { pinnedAt: Date })[]> {
    const pins = await db.select().from(pinnedMessages).where(eq(pinnedMessages.channelId, channelId)).orderBy(desc(pinnedMessages.pinnedAt));
    
    const messages = await Promise.all(pins.map(async (pin) => {
      const [msg] = await db.select().from(communityMessages).where(eq(communityMessages.id, pin.messageId));
      return msg ? { ...msg, pinnedAt: pin.pinnedAt } : null;
    }));
    
    return messages.filter(Boolean) as (CommunityMessage & { pinnedAt: Date })[];
  }

  // =====================================================
  // MESSAGE SEARCH
  // =====================================================

  async searchMessages(channelId: string, query: string, limit = 50): Promise<CommunityMessage[]> {
    return db.select()
      .from(communityMessages)
      .where(and(
        eq(communityMessages.channelId, channelId),
        like(communityMessages.content, `%${query}%`)
      ))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit);
  }

  async searchMessagesGlobal(communityId: string, query: string, limit = 50): Promise<(CommunityMessage & { channelName: string })[]> {
    const channels = await this.getChannels(communityId);
    const channelIds = channels.map(c => c.id);
    if (channelIds.length === 0) return [];
    
    const messages = await db.select()
      .from(communityMessages)
      .where(and(
        sql`${communityMessages.channelId} IN (${sql.join(channelIds.map(id => sql`${id}`), sql`, `)})`,
        like(communityMessages.content, `%${query}%`)
      ))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit);
    
    return messages.map(msg => {
      const channel = channels.find(c => c.id === msg.channelId);
      return { ...msg, channelName: channel?.name || "unknown" };
    });
  }

  // =====================================================
  // POLLS
  // =====================================================

  async createPoll(channelId: string, creatorId: string, creatorName: string, question: string, options: string[], allowMultiple = false, endsAt?: Date): Promise<CommunityPoll> {
    const [poll] = await db.insert(communityPolls).values({
      channelId,
      creatorId,
      creatorName,
      question,
      options: JSON.stringify(options),
      allowMultiple,
      endsAt: endsAt || null,
    }).returning();
    return poll;
  }

  async votePoll(pollId: string, userId: string, optionIndex: number): Promise<void> {
    const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.id, pollId));
    if (!poll) return;
    
    if (!poll.allowMultiple) {
      await db.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
    }
    
    const [existing] = await db.select().from(pollVotes).where(and(
      eq(pollVotes.pollId, pollId),
      eq(pollVotes.userId, userId),
      eq(pollVotes.optionIndex, optionIndex)
    ));
    
    if (!existing) {
      await db.insert(pollVotes).values({ pollId, userId, optionIndex });
    }
  }

  async getPollResults(pollId: string): Promise<{ poll: CommunityPoll; votes: { optionIndex: number; count: number }[]; userVotes: number[] } | null> {
    const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.id, pollId));
    if (!poll) return null;
    
    const allVotes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
    const options = JSON.parse(poll.options) as string[];
    
    const voteCounts = options.map((_, i) => ({
      optionIndex: i,
      count: allVotes.filter(v => v.optionIndex === i).length,
    }));
    
    return { poll, votes: voteCounts, userVotes: [] };
  }

  async getChannelPolls(channelId: string): Promise<CommunityPoll[]> {
    return db.select().from(communityPolls).where(eq(communityPolls.channelId, channelId)).orderBy(desc(communityPolls.createdAt));
  }

  // =====================================================
  // SCHEDULED MESSAGES
  // =====================================================

  async scheduleMessage(channelId: string, userId: string, username: string, content: string, scheduledFor: Date): Promise<ScheduledMessage> {
    const [msg] = await db.insert(scheduledMessages).values({
      channelId,
      userId,
      username,
      content,
      scheduledFor,
    }).returning();
    return msg;
  }

  async getScheduledMessages(channelId: string, userId: string): Promise<ScheduledMessage[]> {
    return db.select().from(scheduledMessages).where(and(
      eq(scheduledMessages.channelId, channelId),
      eq(scheduledMessages.userId, userId),
      eq(scheduledMessages.status, "pending")
    )).orderBy(asc(scheduledMessages.scheduledFor));
  }

  async cancelScheduledMessage(messageId: string, userId: string): Promise<void> {
    await db.update(scheduledMessages).set({ status: "cancelled" }).where(and(
      eq(scheduledMessages.id, messageId),
      eq(scheduledMessages.userId, userId)
    ));
  }

  async processScheduledMessages(): Promise<number> {
    const now = new Date();
    const pending = await db.select().from(scheduledMessages).where(and(
      eq(scheduledMessages.status, "pending"),
      sql`${scheduledMessages.scheduledFor} <= ${now}`
    ));
    
    for (const msg of pending) {
      await this.sendMessage({
        channelId: msg.channelId,
        userId: msg.userId,
        username: msg.username,
        content: msg.content,
        isBot: false,
      });
      await db.update(scheduledMessages).set({ status: "sent" }).where(eq(scheduledMessages.id, msg.id));
    }
    
    return pending.length;
  }

  // =====================================================
  // DIRECT MESSAGES
  // =====================================================

  async getOrCreateDmConversation(user1Id: string, user1Name: string, user2Id: string, user2Name: string): Promise<DmConversation> {
    const [existing] = await db.select().from(dmConversations).where(or(
      and(eq(dmConversations.participant1Id, user1Id), eq(dmConversations.participant2Id, user2Id)),
      and(eq(dmConversations.participant1Id, user2Id), eq(dmConversations.participant2Id, user1Id))
    ));
    
    if (existing) return existing;
    
    const [conv] = await db.insert(dmConversations).values({
      participant1Id: user1Id,
      participant1Name: user1Name,
      participant2Id: user2Id,
      participant2Name: user2Name,
    }).returning();
    return conv;
  }

  async getUserConversations(userId: string): Promise<(DmConversation & { unreadCount: number })[]> {
    const convs = await db.select().from(dmConversations).where(or(
      eq(dmConversations.participant1Id, userId),
      eq(dmConversations.participant2Id, userId)
    )).orderBy(desc(dmConversations.lastMessageAt));
    
    const withUnread = await Promise.all(convs.map(async (conv) => {
      const unread = await db.select({ count: sql<number>`count(*)` }).from(directMessages).where(and(
        eq(directMessages.conversationId, conv.id),
        eq(directMessages.isRead, false),
        sql`${directMessages.senderId} != ${userId}`
      ));
      return { ...conv, unreadCount: Number(unread[0]?.count || 0) };
    }));
    
    return withUnread;
  }

  async sendDirectMessage(conversationId: string, senderId: string, senderName: string, content: string, attachment?: AttachmentData): Promise<DirectMessage> {
    const [msg] = await db.insert(directMessages).values({
      conversationId,
      senderId,
      senderName,
      content,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    }).returning();
    
    await db.update(dmConversations).set({ lastMessageAt: new Date() }).where(eq(dmConversations.id, conversationId));
    return msg;
  }

  async getDirectMessages(conversationId: string, limit = 50): Promise<DirectMessage[]> {
    return db.select().from(directMessages).where(eq(directMessages.conversationId, conversationId)).orderBy(desc(directMessages.createdAt)).limit(limit);
  }

  async markDmAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(directMessages).set({ isRead: true }).where(and(
      eq(directMessages.conversationId, conversationId),
      sql`${directMessages.senderId} != ${userId}`
    ));
  }

  // =====================================================
  // USER ROLES & PERMISSIONS
  // =====================================================

  async createRole(communityId: string, name: string, permissions: string, color = "#6366f1"): Promise<CommunityRole> {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(communityRoles).where(eq(communityRoles.communityId, communityId));
    const [role] = await db.insert(communityRoles).values({
      communityId,
      name,
      permissions,
      color,
      position: (maxPos?.max || 0) + 1,
    }).returning();
    return role;
  }

  async getRoles(communityId: string): Promise<CommunityRole[]> {
    return db.select().from(communityRoles).where(eq(communityRoles.communityId, communityId)).orderBy(desc(communityRoles.position));
  }

  async assignRole(communityId: string, userId: string, roleName: string): Promise<void> {
    await db.update(communityMembers).set({ role: roleName }).where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, userId)
    ));
  }

  async getMemberPermissions(communityId: string, userId: string): Promise<string[]> {
    const [member] = await db.select().from(communityMembers).where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, userId)
    ));
    
    if (!member) return [];
    if (member.role === "owner") return ["admin", "manage_roles", "manage_channels", "kick", "ban", "pin", "delete", "write", "read"];
    
    const [role] = await db.select().from(communityRoles).where(and(
      eq(communityRoles.communityId, communityId),
      eq(communityRoles.name, member.role)
    ));
    
    return role?.permissions?.split(",") || ["read", "write"];
  }

  async hasPermission(communityId: string, userId: string, permission: string): Promise<boolean> {
    const perms = await this.getMemberPermissions(communityId, userId);
    return perms.includes("admin") || perms.includes(permission);
  }

  // =====================================================
  // CUSTOM EMOJIS
  // =====================================================

  async addCustomEmoji(communityId: string, name: string, imageUrl: string, uploaderId: string): Promise<CustomEmoji> {
    const [emoji] = await db.insert(customEmojis).values({
      communityId,
      name,
      imageUrl,
      uploaderId,
    }).returning();
    return emoji;
  }

  async getCustomEmojis(communityId: string): Promise<CustomEmoji[]> {
    return db.select().from(customEmojis).where(eq(customEmojis.communityId, communityId));
  }

  async deleteCustomEmoji(emojiId: string): Promise<void> {
    await db.delete(customEmojis).where(eq(customEmojis.id, emojiId));
  }

  // =====================================================
  // NOTIFICATION SETTINGS
  // =====================================================

  async setNotificationLevel(userId: string, communityId: string, level: string, channelId?: string): Promise<void> {
    const condition = channelId 
      ? and(eq(memberNotificationSettings.userId, userId), eq(memberNotificationSettings.communityId, communityId), eq(memberNotificationSettings.channelId, channelId))
      : and(eq(memberNotificationSettings.userId, userId), eq(memberNotificationSettings.communityId, communityId), sql`${memberNotificationSettings.channelId} IS NULL`);
    
    const [existing] = await db.select().from(memberNotificationSettings).where(condition);
    
    if (existing) {
      await db.update(memberNotificationSettings).set({ level, updatedAt: new Date() }).where(eq(memberNotificationSettings.id, existing.id));
    } else {
      await db.insert(memberNotificationSettings).values({ userId, communityId, channelId: channelId || null, level });
    }
  }

  async getNotificationLevel(userId: string, communityId: string, channelId?: string): Promise<string> {
    if (channelId) {
      const [channelSetting] = await db.select().from(memberNotificationSettings).where(and(
        eq(memberNotificationSettings.userId, userId),
        eq(memberNotificationSettings.communityId, communityId),
        eq(memberNotificationSettings.channelId, channelId)
      ));
      if (channelSetting) return channelSetting.level;
    }
    
    const [communitySetting] = await db.select().from(memberNotificationSettings).where(and(
      eq(memberNotificationSettings.userId, userId),
      eq(memberNotificationSettings.communityId, communityId),
      sql`${memberNotificationSettings.channelId} IS NULL`
    ));
    
    return communitySetting?.level || "all";
  }

  // =====================================================
  // THREAD REPLIES
  // =====================================================

  async createThread(parentMessageId: string, channelId: string): Promise<{ id: string }> {
    const [existing] = await db.select().from(messageThreads).where(eq(messageThreads.parentMessageId, parentMessageId));
    if (existing) return existing;
    
    const [thread] = await db.insert(messageThreads).values({ parentMessageId, channelId }).returning();
    return thread;
  }

  async getThreadReplies(parentMessageId: string): Promise<CommunityMessage[]> {
    return db.select().from(communityMessages).where(sql`thread_parent_id = ${parentMessageId}`).orderBy(asc(communityMessages.createdAt));
  }

  async addThreadReply(parentMessageId: string, channelId: string, userId: string, username: string, content: string): Promise<CommunityMessage> {
    await this.createThread(parentMessageId, channelId);
    
    const [msg] = await db.insert(communityMessages).values({
      channelId,
      userId,
      username,
      content,
      isBot: false,
    }).returning();
    
    await db.execute(sql`UPDATE community_messages SET thread_parent_id = ${parentMessageId} WHERE id = ${msg.id}`);
    await db.update(messageThreads).set({ 
      replyCount: sql`${messageThreads.replyCount} + 1`,
      lastReplyAt: new Date() 
    }).where(eq(messageThreads.parentMessageId, parentMessageId));
    
    return msg;
  }

  async getMessagesWithThreadInfo(channelId: string, limit = 50): Promise<(CommunityMessage & { threadReplyCount?: number })[]> {
    const messages = await db.select().from(communityMessages).where(and(
      eq(communityMessages.channelId, channelId),
      sql`thread_parent_id IS NULL`
    )).orderBy(desc(communityMessages.createdAt)).limit(limit);
    
    const withThreads = await Promise.all(messages.map(async (msg) => {
      const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.parentMessageId, msg.id));
      return { ...msg, threadReplyCount: thread?.replyCount || 0 };
    }));
    
    return withThreads;
  }

  // =====================================================
  // MESSAGE FORWARDING
  // =====================================================

  async forwardMessage(messageId: string, toChannelId: string, userId: string, username: string): Promise<CommunityMessage> {
    const original = await this.getMessageById(messageId);
    if (!original) throw new Error("Message not found");
    
    const [forwarded] = await db.insert(communityMessages).values({
      channelId: toChannelId,
      userId,
      username,
      content: `[Forwarded from ${original.username}]\n${original.content}`,
      isBot: false,
    }).returning();
    
    return forwarded;
  }
}

export const communityHubService = new CommunityHubService();
