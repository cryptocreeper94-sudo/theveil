import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';
import { db } from './db';
import { chatUsers, chatMessages, chatChannels } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyToken } from './trustlayer-sso';

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 50;

type AuthenticatedClient = {
  ws: WebSocket;
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  role: string;
  channelId: string;
  trustLayerId: string;
};

const clients = new Map<WebSocket, AuthenticatedClient>();
const channelClients = new Map<string, Set<WebSocket>>();

function broadcastToChannel(channelId: string, payload: any, excludeWs?: WebSocket) {
  const wsSet = channelClients.get(channelId);
  if (!wsSet) return;
  const data = JSON.stringify(payload);
  for (const ws of Array.from(wsSet)) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function getChannelUsernames(channelId: string): string[] {
  const wsSet = channelClients.get(channelId);
  if (!wsSet) return [];
  const usernames: string[] = [];
  for (const ws of Array.from(wsSet)) {
    const client = clients.get(ws);
    if (client) usernames.push(client.username);
  }
  return usernames;
}

function getOnlineCount(): number {
  return clients.size;
}

function getChannelPresence(): Record<string, string[]> {
  const presence: Record<string, string[]> = {};
  for (const [channelId, wsSet] of Array.from(channelClients.entries())) {
    presence[channelId] = [];
    for (const ws of Array.from(wsSet)) {
      const client = clients.get(ws);
      if (client) presence[channelId].push(client.username);
    }
  }
  return presence;
}

async function sendHistory(ws: WebSocket, channelId: string) {
  const msgs = await db.select({
    id: chatMessages.id,
    channelId: chatMessages.channelId,
    userId: chatMessages.userId,
    content: chatMessages.content,
    replyToId: chatMessages.replyToId,
    createdAt: chatMessages.createdAt,
    username: chatUsers.username,
    avatarColor: chatUsers.avatarColor,
    role: chatUsers.role,
  })
    .from(chatMessages)
    .innerJoin(chatUsers, eq(chatMessages.userId, chatUsers.id))
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(HISTORY_LIMIT);

  msgs.reverse();

  ws.send(JSON.stringify({ type: 'history', messages: msgs }));
}

function removeClientFromChannel(ws: WebSocket) {
  const client = clients.get(ws);
  if (!client) return;

  const wsSet = channelClients.get(client.channelId);
  if (wsSet) {
    wsSet.delete(ws);
    if (wsSet.size === 0) channelClients.delete(client.channelId);
  }

  broadcastToChannel(client.channelId, {
    type: 'user_left',
    userId: client.userId,
    username: client.username,
  });

  broadcastToChannel(client.channelId, {
    type: 'presence',
    onlineCount: getOnlineCount() - 1,
    channelUsers: getChannelPresence(),
  });
}

export function setupSignalChatWS(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname || '';
    if (pathname === '/ws/chat') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let authenticated = false;

    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication timeout' }));
        ws.close();
      }
    }, 10000);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          if (!msg.token) {
            ws.send(JSON.stringify({ type: 'error', message: 'Token required' }));
            return;
          }

          const decoded = verifyToken(msg.token);
          if (!decoded) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
            ws.close();
            return;
          }

          const [user] = await db.select().from(chatUsers)
            .where(eq(chatUsers.id, decoded.userId))
            .limit(1);

          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            ws.close();
            return;
          }

          const channelId = msg.channelId || 'general';

          const [channel] = await db.select().from(chatChannels)
            .where(eq(chatChannels.name, channelId))
            .limit(1);

          const resolvedChannelId = channel ? channel.id : channelId;

          authenticated = true;
          clearTimeout(authTimeout);

          const clientData: AuthenticatedClient = {
            ws,
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarColor: user.avatarColor,
            role: user.role,
            channelId: resolvedChannelId,
            trustLayerId: user.trustLayerId || '',
          };

          clients.set(ws, clientData);

          if (!channelClients.has(resolvedChannelId)) {
            channelClients.set(resolvedChannelId, new Set());
          }
          channelClients.get(resolvedChannelId)!.add(ws);

          await db.update(chatUsers)
            .set({ isOnline: true, lastSeen: new Date() })
            .where(eq(chatUsers.id, user.id));

          await sendHistory(ws, resolvedChannelId);

          broadcastToChannel(resolvedChannelId, {
            type: 'user_joined',
            userId: user.id,
            username: user.username,
          }, ws);

          broadcastToChannel(resolvedChannelId, {
            type: 'presence',
            onlineCount: getOnlineCount(),
            channelUsers: getChannelPresence(),
          });

          return;
        }

        if (!authenticated) {
          ws.send(JSON.stringify({ type: 'error', message: 'Must join first with a valid token' }));
          return;
        }

        const client = clients.get(ws);
        if (!client) return;

        if (msg.type === 'message') {
          let content = (msg.content || '').trim();
          if (!content || content.length === 0) return;
          if (content.length > MAX_MESSAGE_LENGTH) {
            content = content.slice(0, MAX_MESSAGE_LENGTH);
          }

          const [saved] = await db.insert(chatMessages).values({
            channelId: client.channelId,
            userId: client.userId,
            content,
            replyToId: msg.replyToId || null,
          }).returning();

          const outgoing = {
            type: 'message',
            id: saved.id,
            channelId: saved.channelId,
            userId: client.userId,
            username: client.username,
            avatarColor: client.avatarColor,
            role: client.role,
            content: saved.content,
            replyToId: saved.replyToId,
            createdAt: saved.createdAt,
          };

          broadcastToChannel(client.channelId, outgoing);

        } else if (msg.type === 'typing') {
          broadcastToChannel(client.channelId, {
            type: 'typing',
            userId: client.userId,
            username: client.username,
          }, ws);

        } else if (msg.type === 'switch_channel') {
          const newChannelName = msg.channelId;
          if (!newChannelName) return;

          const [channel] = await db.select().from(chatChannels)
            .where(eq(chatChannels.name, newChannelName))
            .limit(1);

          if (!channel) {
            const [channelById] = await db.select().from(chatChannels)
              .where(eq(chatChannels.id, newChannelName))
              .limit(1);
            if (!channelById) {
              ws.send(JSON.stringify({ type: 'error', message: 'Channel not found' }));
              return;
            }
          }

          const newChannelId = channel ? channel.id : newChannelName;

          removeClientFromChannel(ws);

          client.channelId = newChannelId;

          if (!channelClients.has(newChannelId)) {
            channelClients.set(newChannelId, new Set());
          }
          channelClients.get(newChannelId)!.add(ws);

          await sendHistory(ws, newChannelId);

          broadcastToChannel(newChannelId, {
            type: 'user_joined',
            userId: client.userId,
            username: client.username,
          }, ws);

          broadcastToChannel(newChannelId, {
            type: 'presence',
            onlineCount: getOnlineCount(),
            channelUsers: getChannelPresence(),
          });
        }
      } catch (e) {
        console.error('[Signal Chat WS] Message parse error:', e);
      }
    });

    ws.on('close', async () => {
      clearTimeout(authTimeout);
      const client = clients.get(ws);
      if (client) {
        removeClientFromChannel(ws);
        clients.delete(ws);

        try {
          await db.update(chatUsers)
            .set({ isOnline: false, lastSeen: new Date() })
            .where(eq(chatUsers.id, client.userId));
        } catch (e) {
          // ignore cleanup errors
        }
      }
    });

    ws.on('error', () => {
      clearTimeout(authTimeout);
      const client = clients.get(ws);
      if (client) {
        removeClientFromChannel(ws);
        clients.delete(ws);
      }
    });
  });

  console.log('[Signal Chat] WebSocket server initialized on /ws/chat');
}
