import type { Server as HttpServer } from 'http';
import type { WSMessage } from '../shared/chat-events';
import type { Message } from '../shared/chat-types';

export type BotHandlerContext = {
  sendMessage: (channelId: string, content: string) => Promise<void>;
  replyTo: (channelId: string, messageId: string, content: string) => Promise<void>;
};

export type Bot = {
  id: string;
  name: string;
  description?: string;
  onMessage?: (msg: Message, ctx: BotHandlerContext) => Promise<void> | void;
  onJoin?: (userId: string, communityId: string, ctx: BotHandlerContext) => Promise<void> | void;
  onReaction?: (messageId: string, userId: string, emoji: string, ctx: BotHandlerContext) => Promise<void> | void;
  commands?: { [cmd: string]: (args: string[], ctx: BotHandlerContext) => Promise<void> | void };
};

const bots: Map<string, Bot> = new Map();

export function registerBot(bot: Bot) {
  bots.set(bot.id, bot);
}

export function unregisterBot(botId: string) {
  bots.delete(botId);
}

export async function dispatchMessage(msg: Message, ctx: BotHandlerContext) {
  for (const b of bots.values()) {
    try {
      if (b.onMessage) await b.onMessage(msg, ctx);
      if (msg.content?.startsWith('!')) {
        const parts = msg.content.slice(1).split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);
        const handler = b.commands?.[cmd];
        if (handler) await handler(args, ctx);
      }
    } catch (e) {
      console.error('Bot handler error', e);
    }
  }
}

export function registerPingBot() {
  registerBot({
    id: 'builtin-ping',
    name: 'PingBot',
    description: 'Responds to !ping',
    commands: {
      ping: async (_args, ctx) => {
        await ctx.sendMessage('general', 'PONG');
      }
    }
  });
}
