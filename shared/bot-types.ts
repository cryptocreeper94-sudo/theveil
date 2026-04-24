export type CommandHandler = (args: string[], ctx: { send: (channelId: string, content: string) => Promise<void> }) => Promise<void> | void;

export interface BotConfig {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  enabled?: boolean;
  permissions?: string[];
}

export interface BotCommand {
  name: string;
  description?: string;
  usage?: string;
  handler?: string;
}
