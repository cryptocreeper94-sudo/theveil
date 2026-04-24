import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import crypto from "crypto";
import { communityHubService } from "./community-hub-service";
import { storage } from "./storage";

interface ChannelClient {
  ws: WebSocket;
  userId: string;
  username: string;
  channelId: string;
  communityId: string;
  tokenExpiry: number; // Unix timestamp when token expires
  expiryTimer?: NodeJS.Timeout;
}

const channelClients = new Map<string, Set<ChannelClient>>();

// Verify signed auth token and return user info with expiry, or null if invalid
async function verifyAuthToken(token: string): Promise<{ userId: string; username: string; exp: number } | null> {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payloadB64, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'darkwave-ws-secret')
      .update(`${header}.${payloadB64}`)
      .digest('base64url');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    // Parse and verify payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    if (!payload.sub) return null;
    
    // Verify user exists in database
    const user = await storage.getUser(payload.sub);
    if (!user) return null;
    
    return {
      userId: user.id,
      username: payload.name || user.firstName || user.email || 'User',
      exp: payload.exp || (now + 3600) // Default 1 hour if no exp
    };
  } catch (err) {
    return null;
  }
}

export function setupCommunityWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/community" });

  wss.on("connection", (ws: WebSocket) => {
    let client: ChannelClient | null = null;
    let authenticated = false;

    ws.on("message", async (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "join": {
            const { channelId, communityId, token } = message;
            if (!channelId) {
              ws.send(JSON.stringify({ type: "error", message: "Channel ID required" }));
              return;
            }
            
            // Require and verify auth token
            if (!token) {
              ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
              ws.close();
              return;
            }
            
            const authResult = await verifyAuthToken(token);
            if (!authResult) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid authentication token" }));
              ws.close();
              return;
            }
            
            authenticated = true;
            const { userId, username, exp } = authResult;

            client = { ws, userId, username, channelId, communityId, tokenExpiry: exp };
            
            // Set up expiry timer to disconnect when token expires
            const msUntilExpiry = (exp * 1000) - Date.now();
            if (msUntilExpiry > 0) {
              client.expiryTimer = setTimeout(() => {
                ws.send(JSON.stringify({ type: "error", message: "Session expired, please reconnect" }));
                ws.close();
              }, msUntilExpiry);
            }

            if (!channelClients.has(channelId)) {
              channelClients.set(channelId, new Set());
            }
            channelClients.get(channelId)!.add(client);

            if (communityId) {
              await communityHubService.updateMemberOnline(communityId, userId, true);
            }

            broadcastToChannel(channelId, {
              type: "user_joined",
              userId,
              username,
              timestamp: new Date().toISOString(),
            });

            const onlineUsers = getOnlineUsers(channelId);
            ws.send(JSON.stringify({ type: "presence", users: onlineUsers }));
            break;
          }

          case "message": {
            if (!authenticated || !client) return;
            const { content, replyToId, attachment } = message;
            if (!content?.trim() && !attachment) return;

            const savedMessage = await communityHubService.sendMessage({
              channelId: client.channelId,
              userId: client.userId,
              username: client.username,
              content: content?.trim() || "",
              replyToId: replyToId || null,
              attachment: attachment || null,
            });

            let replyTo = null;
            if (replyToId) {
              replyTo = await communityHubService.getMessageById(replyToId);
            }

            broadcastToChannel(client.channelId, {
              type: "new_message",
              message: {
                ...savedMessage,
                replyTo,
                reactions: [],
              },
            });
            break;
          }

          case "reaction": {
            if (!authenticated || !client) return;
            const { messageId, emoji, action } = message;
            if (!messageId || !emoji) return;

            if (action === "add") {
              await communityHubService.addReaction(messageId, client.userId, client.username, emoji);
            } else if (action === "remove") {
              await communityHubService.removeReaction(messageId, client.userId, emoji);
            }

            const reactions = await communityHubService.getReactions(messageId);
            broadcastToChannel(client.channelId, {
              type: "reaction_update",
              messageId,
              reactions,
            });
            break;
          }

          case "typing": {
            if (!authenticated || !client) return;
            broadcastToChannel(client.channelId, {
              type: "typing",
              userId: client.userId,
              username: client.username,
            }, client.userId);
            break;
          }

          case "edit_message": {
            if (!authenticated || !client) return;
            const { messageId, content } = message;
            if (!messageId || !content?.trim()) return;

            const updated = await communityHubService.editMessage(messageId, client.userId, content.trim());
            if (updated) {
              broadcastToChannel(client.channelId, {
                type: "message_edited",
                message: updated,
              });
            }
            break;
          }

          case "delete_message": {
            if (!authenticated || !client) return;
            const { messageId } = message;
            if (!messageId) return;

            const deleted = await communityHubService.deleteMessage(messageId, client.userId);
            if (deleted) {
              broadcastToChannel(client.channelId, {
                type: "message_deleted",
                messageId,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error("Community WS error:", err);
      }
    });

    ws.on("close", async () => {
      if (client) {
        // Clear expiry timer on disconnect
        if (client.expiryTimer) {
          clearTimeout(client.expiryTimer);
        }
        
        const clients = channelClients.get(client.channelId);
        if (clients) {
          clients.delete(client);
          if (clients.size === 0) {
            channelClients.delete(client.channelId);
          }
        }

        if (client.communityId) {
          await communityHubService.updateMemberOnline(client.communityId, client.userId, false);
        }

        broadcastToChannel(client.channelId, {
          type: "user_left",
          userId: client.userId,
          username: client.username,
          timestamp: new Date().toISOString(),
        });
      }
    });

    ws.on("error", (err) => {
      console.error("Community WS client error:", err);
    });
  });

  return wss;
}

function broadcastToChannel(channelId: string, message: any, excludeUserId?: string) {
  const clients = channelClients.get(channelId);
  if (!clients) return;

  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (excludeUserId && client.userId === excludeUserId) return;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function getOnlineUsers(channelId: string): { userId: string; username: string }[] {
  const clients = channelClients.get(channelId);
  if (!clients) return [];

  const seen = new Set<string>();
  const users: { userId: string; username: string }[] = [];

  clients.forEach((client) => {
    if (!seen.has(client.userId)) {
      seen.add(client.userId);
      users.push({ userId: client.userId, username: client.username });
    }
  });

  return users;
}

export function broadcastToChannelExternal(channelId: string, message: any) {
  broadcastToChannel(channelId, message);
}
