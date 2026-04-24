import { db } from './db';
import { chatChannels } from '@shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'General discussion for the Trust Layer ecosystem', category: 'ecosystem', isDefault: true },
  { name: 'announcements', description: 'Official announcements and updates', category: 'ecosystem', isDefault: true },
  { name: 'darkwavestudios-support', description: 'Support for DarkWave Studios', category: 'app-support', isDefault: false },
  { name: 'garagebot-support', description: 'Support for GarageBot', category: 'app-support', isDefault: false },
  { name: 'trustgen-support', description: 'Support for TrustGen 3D — AI-powered 3D creation & code studio (trustgen.tlid.io)', category: 'app-support', isDefault: false },
  { name: 'tlid-marketing', description: 'TLID domain service marketing and discussion', category: 'app-support', isDefault: false },
  { name: 'guardian-ai', description: 'Guardian AI certification discussion', category: 'app-support', isDefault: false },
];

const CHRONICLES_CHANNELS = [
  { name: 'chronicles-modern', description: 'Modern Era — city streets, tech startups, and neon-lit conversations', category: 'chronicles', isDefault: false },
  { name: 'chronicles-medieval', description: 'Medieval Era — tavern chatter, market gossip, and castle whispers', category: 'chronicles', isDefault: false },
  { name: 'chronicles-wildwest', description: 'Wild West — saloon talk, frontier news, and campfire stories', category: 'chronicles', isDefault: false },
  { name: 'chronicles-general', description: 'Cross-era discussion for all Chronicles travelers', category: 'chronicles', isDefault: false },
  { name: 'chronicles-voice', description: 'Voice messages — speak as your parallel self', category: 'chronicles', isDefault: false },
];

export async function seedChatChannels() {
  const existing = await db.select().from(chatChannels);
  const existingNames = new Set(existing.map(c => c.name));

  if (existing.length === 0) {
    for (const channel of DEFAULT_CHANNELS) {
      await db.insert(chatChannels).values(channel).onConflictDoNothing();
    }
    for (const channel of CHRONICLES_CHANNELS) {
      await db.insert(chatChannels).values(channel).onConflictDoNothing();
    }
    console.log(`[Signal Chat] Seeded ${DEFAULT_CHANNELS.length + CHRONICLES_CHANNELS.length} channels (including Chronicles era channels)`);
    return;
  }

  const allChannels = [...DEFAULT_CHANNELS, ...CHRONICLES_CHANNELS];
  let added = 0;
  for (const channel of allChannels) {
    if (!existingNames.has(channel.name)) {
      await db.insert(chatChannels).values(channel).onConflictDoNothing();
      added++;
    }
  }
  if (added > 0) {
    console.log(`[Signal Chat] Added ${added} new channels`);
  } else {
    console.log(`[Signal Chat] ${existing.length} channels already exist, all up to date`);
  }
}
