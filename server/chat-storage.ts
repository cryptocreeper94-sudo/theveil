import { db } from './db';
import { communities, channels, messages, reactions, members, roles, invites } from '../shared/chat-schema';
import { eq, and, lt } from 'drizzle-orm';
import type { Community, Channel, Message, Reaction, Member, Role, Invite } from '../shared/chat-types';
import crypto from 'crypto';

export type InsertCommunity = {
  id?: string;
  name: string;
  description?: string | null;
  ownerId: string;
  privacy?: 'public' | 'private' | 'invite-only';
};

export type InsertChannel = {
  id?: string;
  communityId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  type?: string;
  position?: number;
};

export type InsertMessage = {
  id?: string;
  channelId: string;
  authorId: string;
  content?: string | null;
  replyToId?: string | null;
};

export type InsertRole = {
  id?: string;
  communityId: string;
  name: string;
  color?: string;
  permissions?: any;
};

export interface IChatStorage {
  createCommunity(data: InsertCommunity): Promise<Community>;
  getCommunity(id: string): Promise<Community | null>;
  getUserCommunities(userId: string): Promise<Community[]>;
  updateCommunity(id: string, data: Partial<Community>): Promise<Community>;
  deleteCommunity(id: string): Promise<void>;

  createChannel(data: InsertChannel): Promise<Channel>;
  getChannelsByCommunity(communityId: string): Promise<Channel[]>;
  updateChannel(id: string, data: Partial<Channel>): Promise<Channel>;
  deleteChannel(id: string): Promise<void>;

  createMessage(data: InsertMessage): Promise<Message>;
  getMessagesByChannel(channelId: string, limit?: number, before?: string): Promise<Message[]>;
  updateMessage(id: string, content: string): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getReactionsByMessage(messageId: string): Promise<Reaction[]>;

  addMember(communityId: string, userId: string, roleId?: string): Promise<Member>;
  removeMember(communityId: string, userId: string): Promise<void>;
  getMembersByCommunity(communityId: string): Promise<Member[]>;
  updateMemberRole(communityId: string, userId: string, roleId: string): Promise<Member>;

  createRole(data: InsertRole): Promise<Role>;
  getRolesByCommunity(communityId: string): Promise<Role[]>;
  updateRole(id: string, data: Partial<Role>): Promise<Role>;
  deleteRole(id: string): Promise<void>;

  createInvite(communityId: string, expiresAt?: Date | null, maxUses?: number | null): Promise<Invite>;
  getInviteByCode(code: string): Promise<Invite | null>;
  useInvite(code: string): Promise<void>;
  revokeInvite(id: string): Promise<void>;
}

export class ChatStorage implements IChatStorage {
  async createCommunity(data: InsertCommunity) {
    const id = data.id ?? `com-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(communities).values({
      id,
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
      privacy: data.privacy ?? 'public'
    }).returning();
    return created as unknown as Community;
  }

  async getCommunity(id: string) {
    const [c] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
    return (c ?? null) as Community | null;
  }

  async getUserCommunities(userId: string) {
    const owned = await db.select().from(communities).where(eq(communities.ownerId, userId));
    return owned as Community[];
  }

  async updateCommunity(id: string, data: Partial<Community>) {
    await db.update(communities).set({
      name: data.name as any,
      description: (data as any).description as any,
      privacy: (data as any).privacy as any
    }).where(eq(communities.id, id));
    const updated = await this.getCommunity(id);
    if (!updated) throw new Error('Community not found');
    return updated;
  }

  async deleteCommunity(id: string) {
    await db.delete(communities).where(eq(communities.id, id));
  }

  async createChannel(data: InsertChannel) {
    const id = data.id ?? `ch-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(channels).values({
      id,
      communityId: data.communityId,
      name: data.name,
      description: data.description ?? null,
      category: data.category ?? null,
      type: data.type ?? 'text',
      position: data.position ?? 0
    }).returning();
    return created as unknown as Channel;
  }

  async getChannelsByCommunity(communityId: string) {
    const list = await db.select().from(channels).where(eq(channels.communityId, communityId)).orderBy(channels.position);
    return list as Channel[];
  }

  async updateChannel(id: string, data: Partial<Channel>) {
    await db.update(channels).set({
      name: (data as any).name,
      description: (data as any).description,
      category: (data as any).category,
      type: (data as any).type,
      position: (data as any).position
    }).where(eq(channels.id, id));
    const [c] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    if (!c) throw new Error('Channel not found');
    return c as Channel;
  }

  async deleteChannel(id: string) {
    await db.delete(channels).where(eq(channels.id, id));
  }

  async createMessage(data: InsertMessage) {
    const id = data.id ?? `msg-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(messages).values({
      id,
      channelId: data.channelId,
      authorId: data.authorId,
      content: data.content ?? null,
      replyToId: data.replyToId ?? null
    }).returning();
    return created as unknown as Message;
  }

  async getMessagesByChannel(channelId: string, limit = 50, before?: string) {
    if (before) {
      return (await db.select().from(messages)
        .where(and(eq(messages.channelId, channelId), lt(messages.createdAt, new Date(before))))
        .orderBy(messages.createdAt)
        .limit(limit)) as Message[];
    }
    return (await db.select().from(messages)
      .where(eq(messages.channelId, channelId))
      .orderBy(messages.createdAt)
      .limit(limit)) as Message[];
  }

  async updateMessage(id: string, content: string) {
    await db.update(messages).set({ content, editedAt: new Date() }).where(eq(messages.id, id));
    const [m] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    if (!m) throw new Error('Message not found');
    return m as Message;
  }

  async deleteMessage(id: string) {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const id = `react-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(reactions).values({ id, messageId, userId, emoji }).returning();
    return created as unknown as Reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await db.delete(reactions).where(and(
      eq(reactions.messageId, messageId),
      eq(reactions.userId, userId),
      eq(reactions.emoji, emoji)
    ));
  }

  async getReactionsByMessage(messageId: string) {
    const list = await db.select().from(reactions).where(eq(reactions.messageId, messageId));
    return list as Reaction[];
  }

  async addMember(communityId: string, userId: string, roleId?: string) {
    const id = `mem-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(members).values({
      id,
      communityId,
      userId,
      roleId: roleId ?? null
    }).returning();
    return created as unknown as Member;
  }

  async removeMember(communityId: string, userId: string) {
    await db.delete(members).where(and(
      eq(members.communityId, communityId),
      eq(members.userId, userId)
    ));
  }

  async getMembersByCommunity(communityId: string) {
    const list = await db.select().from(members).where(eq(members.communityId, communityId));
    return list as Member[];
  }

  async updateMemberRole(communityId: string, userId: string, roleId: string) {
    await db.update(members).set({ roleId }).where(and(
      eq(members.communityId, communityId),
      eq(members.userId, userId)
    ));
    const [m] = await db.select().from(members).where(and(
      eq(members.communityId, communityId),
      eq(members.userId, userId)
    )).limit(1);
    if (!m) throw new Error('Member not found');
    return m as Member;
  }

  async createRole(data: InsertRole) {
    const id = data.id ?? `role-${crypto.randomBytes(8).toString('hex')}`;
    const [created] = await db.insert(roles).values({
      id,
      communityId: data.communityId,
      name: data.name,
      color: data.color ?? '#7c3aed',
      permissions: (data.permissions ?? {}) as any
    }).returning();
    return created as unknown as Role;
  }

  async getRolesByCommunity(communityId: string) {
    const list = await db.select().from(roles).where(eq(roles.communityId, communityId));
    return list as Role[];
  }

  async updateRole(id: string, data: Partial<Role>) {
    await db.update(roles).set({
      name: (data as any).name,
      color: (data as any).color,
      permissions: (data as any).permissions
    }).where(eq(roles.id, id));
    const [r] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!r) throw new Error('Role not found');
    return r as Role;
  }

  async deleteRole(id: string) {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async createInvite(communityId: string, expiresAt?: Date | null, maxUses?: number | null) {
    const id = `inv-${crypto.randomBytes(8).toString('hex')}`;
    const code = crypto.randomBytes(6).toString('hex');
    const [created] = await db.insert(invites).values({
      id,
      communityId,
      code,
      expiresAt: expiresAt ?? null,
      maxUses: maxUses ?? null,
      uses: 0
    }).returning();
    return created as unknown as Invite;
  }

  async getInviteByCode(code: string) {
    const [inv] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
    return (inv ?? null) as Invite | null;
  }

  async useInvite(code: string) {
    const inv = await this.getInviteByCode(code);
    if (!inv) throw new Error('Invite not found');
    if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) throw new Error('Invite expired');
    if (inv.maxUses !== null && (inv.uses ?? 0) >= inv.maxUses) throw new Error('Invite exhausted');
    await db.update(invites).set({ uses: (inv.uses ?? 0) + 1 }).where(eq(invites.id, inv.id));
  }

  async revokeInvite(id: string) {
    await db.delete(invites).where(eq(invites.id, id));
  }
}

export const chatStorage = new ChatStorage();
export default chatStorage;
