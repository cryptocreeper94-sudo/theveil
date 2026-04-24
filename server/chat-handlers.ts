import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';
import type { Message } from '@shared/chat-types';

export function setupChatHandlers(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const channels = new Map<string, Set<WebSocket>>();

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

  wss.on('connection', (ws: WebSocket, req) => {
    const query = url.parse(req.url || '', true).query;
    const channelId = (query.channel as string) || 'general';
    if (!channels.has(channelId)) channels.set(channelId, new Set());
    channels.get(channelId)!.add(ws);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; payload?: any };
        if (msg.type === 'join') {
        } else if (msg.type === 'leave') {
        } else if (msg.type === 'message') {
          const message: Message = msg.payload;
          const clients = channels.get(channelId);
          if (clients) {
            for (const c of clients) {
              if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify({ type: 'message', payload: message }));
            }
          }
        }
      } catch (e) {
        console.error('chat msg parse error', e);
      }
    });

    ws.on('close', () => {
      const clients = channels.get(channelId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) channels.delete(channelId);
      }
    });
  });

  console.log('Chat WebSocket handlers mounted at /chat');
}
