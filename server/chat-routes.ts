import { Router, Request, Response } from 'express';
import { z } from 'zod';
import chatStorage from './chat-storage';

const router = Router();

const CreateCommunitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  privacy: z.enum(['public', 'private', 'invite-only']).optional().default('public'),
});

const UpdateCommunitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  privacy: z.enum(['public', 'private', 'invite-only']).optional(),
});

const CreateChannelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  type: z.enum(['text', 'voice', 'announcement']).optional().default('text'),
});

const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  type: z.enum(['text', 'voice', 'announcement']).optional(),
});

const SendMessageSchema = z.object({
  content: z.string().min(0).optional(),
  replyToId: z.string().optional().nullable(),
});

const EditMessageSchema = z.object({
  content: z.string().min(1),
});

const AddReactionSchema = z.object({
  emoji: z.string().min(1)
});

const CreateRoleSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
});

const CreateInviteSchema = z.object({
  expiresAt: z.string().optional().nullable(),
  maxUses: z.number().optional().nullable(),
});

function getUserIdFromReq(req: Request): string | null {
  return (req as any).user?.id ?? null;
}

router.post('/communities', async (req: Request, res: Response) => {
  try {
    const body = CreateCommunitySchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const community = await chatStorage.createCommunity({
      name: body.name,
      description: body.description ?? null,
      ownerId: userId,
      privacy: body.privacy
    });

    await chatStorage.addMember(community.id, userId, undefined);
    res.json({ success: true, community });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/communities', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const list = await chatStorage.getUserCommunities(userId);
    res.json({ success: true, communities: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/communities/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const community = await chatStorage.getCommunity(id);
    if (!community) return res.status(404).json({ error: 'not_found' });
    res.json({ success: true, community });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/communities/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = UpdateCommunitySchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const community = await chatStorage.getCommunity(id);
    if (!community) return res.status(404).json({ error: 'not_found' });
    if (community.ownerId !== userId) return res.status(403).json({ error: 'forbidden' });

    const updated = await chatStorage.updateCommunity(id, body as any);
    res.json({ success: true, community: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/communities/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const community = await chatStorage.getCommunity(id);
    if (!community) return res.status(404).json({ error: 'not_found' });
    if (community.ownerId !== userId) return res.status(403).json({ error: 'forbidden' });

    await chatStorage.deleteCommunity(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/communities/:communityId/channels', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const body = CreateChannelSchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const ch = await chatStorage.createChannel({
      communityId,
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? null,
      type: body.type ?? 'text'
    });
    res.json({ success: true, channel: ch });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/communities/:communityId/channels', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const list = await chatStorage.getChannelsByCommunity(communityId);
    res.json({ success: true, channels: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/channels/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = UpdateChannelSchema.parse(req.body);
    const updated = await chatStorage.updateChannel(id, body as any);
    res.json({ success: true, channel: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/channels/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await chatStorage.deleteChannel(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.channelId;
    const body = SendMessageSchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const msg = await chatStorage.createMessage({
      channelId,
      authorId: userId,
      content: body.content ?? '',
      replyToId: body.replyToId ?? null
    });
    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.channelId;
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const before = req.query.before as string | undefined;
    const msgs = await chatStorage.getMessagesByChannel(channelId, limit, before);
    res.json({ success: true, messages: msgs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/messages/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = EditMessageSchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const updated = await chatStorage.updateMessage(id, body.content);
    res.json({ success: true, message: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await chatStorage.deleteMessage(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages/:messageId/reactions', async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId;
    const body = AddReactionSchema.parse(req.body);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const reaction = await chatStorage.addReaction(messageId, userId, body.emoji);
    res.json({ success: true, reaction });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/messages/:messageId/reactions/:emoji', async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId;
    const emoji = decodeURIComponent(req.params.emoji);
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    await chatStorage.removeReaction(messageId, userId, emoji);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/communities/:communityId/members', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const list = await chatStorage.getMembersByCommunity(communityId);
    res.json({ success: true, members: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/communities/:communityId/members', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const { userId, roleId } = req.body;
    const member = await chatStorage.addMember(communityId, userId, roleId);
    res.json({ success: true, member });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/communities/:communityId/members/:userId', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    await chatStorage.removeMember(communityId, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/communities/:communityId/members/:userId', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const userId = req.params.userId;
    const { roleId } = req.body;
    const updated = await chatStorage.updateMemberRole(communityId, userId, roleId);
    res.json({ success: true, member: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/communities/:communityId/roles', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const body = CreateRoleSchema.parse(req.body);
    const role = await chatStorage.createRole({
      communityId,
      name: body.name,
      color: body.color,
      permissions: body.permissions
    });
    res.json({ success: true, role });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/communities/:communityId/roles', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const list = await chatStorage.getRolesByCommunity(communityId);
    res.json({ success: true, roles: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/roles/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const updated = await chatStorage.updateRole(id, body);
    res.json({ success: true, role: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await chatStorage.deleteRole(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/communities/:communityId/invites', async (req: Request, res: Response) => {
  try {
    const communityId = req.params.communityId;
    const body = CreateInviteSchema.parse(req.body);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const invite = await chatStorage.createInvite(communityId, expiresAt, body.maxUses);
    res.json({ success: true, invite });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/invites/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const invite = await chatStorage.getInviteByCode(code);
    if (!invite) return res.status(404).json({ error: 'not_found' });
    const community = await chatStorage.getCommunity(invite.communityId);
    res.json({ success: true, invite, community });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invites/:code/join', async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const invite = await chatStorage.getInviteByCode(code);
    if (!invite) return res.status(404).json({ error: 'not_found' });

    await chatStorage.useInvite(code);
    await chatStorage.addMember(invite.communityId, userId, undefined);
    res.json({ success: true, communityId: invite.communityId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/invites/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await chatStorage.revokeInvite(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
