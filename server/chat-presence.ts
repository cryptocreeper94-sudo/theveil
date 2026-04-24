import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';

type PresenceEntry = {
  userId: string;
  communityId: string;
  channelId?: string;
  ws: WebSocket;
  lastSeen: number;
  typing?: boolean;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
};

const PRESENCE_TTL = 60_000;

let presencesRef: Map<string, Set<PresenceEntry>> | null = null;

export function broadcastToChannel(channelId: string, payload: any) {
  if (!presencesRef) return;
  for (const [, set] of Array.from(presencesRef.entries())) {
    for (const p of Array.from(set)) {
      if (p.channelId === channelId && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify(payload));
      }
    }
  }
}

export function setupPresence(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const presences = new Map<string, Set<PresenceEntry>>();
  presencesRef = presences;

  server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname || '';
    if (pathname === '/chat') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  function broadcastToCommunity(communityId: string, payload: any) {
    const set = presences.get(communityId);
    if (!set) return;
    for (const p of Array.from(set)) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify(payload));
      }
    }
  }

  wss.on('connection', (ws: WebSocket, req) => {
    const query = url.parse(req.url || '', true).query;
    const communityId = (query.community as string) || 'general';
    const channelId = (query.channel as string) || undefined;
    const userId = (query.user as string) || `anon-${Date.now()}`;

    const entry: PresenceEntry = { userId, communityId, channelId, ws, lastSeen: Date.now(), status: 'online' };
    if (!presences.has(communityId)) presences.set(communityId, new Set());
    presences.get(communityId)!.add(entry);

    broadcastToCommunity(communityId, { type: 'PRESENCE_UPDATE', payload: { userId, status: 'online' } });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'TYPING_START') {
          entry.typing = true;
          broadcastToCommunity(communityId, { type: 'TYPING_START', payload: { userId } });
        } else if (msg.type === 'TYPING_STOP') {
          entry.typing = false;
          broadcastToCommunity(communityId, { type: 'TYPING_STOP', payload: { userId } });
        } else if (msg.type === 'HEARTBEAT') {
          entry.lastSeen = Date.now();
        } else if (msg.type === 'SUBSCRIBE_CHANNEL') {
          entry.channelId = msg.payload?.channelId;
        }
      } catch (e) {
        // ignore
      }
    });

    ws.on('close', () => {
      presences.get(communityId)?.delete(entry);
      broadcastToCommunity(communityId, { type: 'PRESENCE_UPDATE', payload: { userId, status: 'offline' } });
    });

    const interval = setInterval(() => {
      const now = Date.now();
      for (const [cid, set] of Array.from(presences.entries())) {
        for (const entry of Array.from(set)) {
          if (now - entry.lastSeen > PRESENCE_TTL * 3) {
            try { entry.ws.terminate(); } catch (err) { /* ignore */ }
            set.delete(entry);
            broadcastToCommunity(cid, { type: 'PRESENCE_UPDATE', payload: { userId: entry.userId, status: 'offline' } });
          }
        }
      }
    }, PRESENCE_TTL);

    ws.on('close', () => clearInterval(interval));
  });

  console.log('Chat presence handlers mounted at /chat (presence + typing)');
}
