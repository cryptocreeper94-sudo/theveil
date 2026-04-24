# GitHub Copilot Handoff - DarkWave Smart Chain

**Date:** December 31, 2024  
**Project:** DarkWave Smart Chain (DWSC)  
**Purpose:** Scaffold generation for Replit agent integration

---

## Project Context

- **Stack:** React 18, TypeScript, Vite, Express.js, Drizzle ORM, PostgreSQL, TanStack Query
- **Styling:** Tailwind CSS v4, Framer Motion, dark theme (slate-950/900/800)
- **Auth:** Replit Auth (OAuth 2.0), WebAuthn/Passkeys
- **Routing:** Wouter (frontend), Express (backend)

### Design System
- Glassmorphism, holographic borders with glow
- Mobile-first (min touch targets 48px)
- Color palette: Cyan (#00FFFF), Purple (#a855f7), Pink (#ec4899)
- All interactive elements need `data-testid` attributes

---

## Scaffold Request #1: ChronoChat REST API Routes

**File:** `server/chat-routes.ts`

Create Express routes for ChronoChat. Import from existing files:
- Schema: `shared/chat-schema.ts` (communities, channels, messages, reactions, members, roles, invites)
- Types: `shared/chat-types.ts`
- Storage pattern: Follow `server/storage.ts` interface pattern

### Required Endpoints

```typescript
// Communities
POST   /api/chat/communities           - Create community
GET    /api/chat/communities           - List user's communities
GET    /api/chat/communities/:id       - Get community details
PATCH  /api/chat/communities/:id       - Update community
DELETE /api/chat/communities/:id       - Delete community

// Channels
POST   /api/chat/communities/:communityId/channels     - Create channel
GET    /api/chat/communities/:communityId/channels     - List channels
PATCH  /api/chat/channels/:id                          - Update channel
DELETE /api/chat/channels/:id                          - Delete channel

// Messages
POST   /api/chat/channels/:channelId/messages          - Send message
GET    /api/chat/channels/:channelId/messages          - Get messages (paginated)
PATCH  /api/chat/messages/:id                          - Edit message
DELETE /api/chat/messages/:id                          - Delete message

// Reactions
POST   /api/chat/messages/:messageId/reactions         - Add reaction
DELETE /api/chat/messages/:messageId/reactions/:emoji  - Remove reaction

// Members
GET    /api/chat/communities/:communityId/members      - List members
POST   /api/chat/communities/:communityId/members      - Add member
DELETE /api/chat/communities/:communityId/members/:userId - Remove member
PATCH  /api/chat/communities/:communityId/members/:userId - Update member role

// Roles
POST   /api/chat/communities/:communityId/roles        - Create role
GET    /api/chat/communities/:communityId/roles        - List roles
PATCH  /api/chat/roles/:id                             - Update role
DELETE /api/chat/roles/:id                             - Delete role

// Invites
POST   /api/chat/communities/:communityId/invites      - Generate invite
GET    /api/chat/invites/:code                         - Get invite info (public)
POST   /api/chat/invites/:code/join                    - Join via invite
DELETE /api/chat/invites/:id                           - Revoke invite
```

### Template Structure

```typescript
// server/chat-routes.ts
import { Router, Request, Response } from 'express';
import { db } from './db';
import { z } from 'zod';
import { communities, channels, messages, reactions, members, roles, invites } from '../shared/chat-schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const CreateCommunitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  privacy: z.enum(['public', 'private', 'invite-only']).default('public'),
});

// TODO: Replit agent - add isAuthenticated middleware import

// Communities CRUD
router.post('/communities', async (req: Request, res: Response) => {
  try {
    const body = CreateCommunitySchema.parse(req.body);
    const userId = (req as any).user?.id; // TODO: Replit agent - wire auth
    
    const id = `com-${crypto.randomBytes(8).toString('hex')}`;
    const [community] = await db.insert(communities).values({
      id,
      name: body.name,
      description: body.description,
      ownerId: userId,
      privacy: body.privacy,
    }).returning();
    
    res.json({ success: true, community });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ... continue for all endpoints

export default router;
```

---

## Scaffold Request #2: Chat Storage Interface

**File:** Add to `server/storage.ts`

```typescript
// Add these methods to IStorage interface and DatabaseStorage class

// Communities
createCommunity(data: InsertCommunity): Promise<Community>;
getCommunity(id: string): Promise<Community | null>;
getUserCommunities(userId: string): Promise<Community[]>;
updateCommunity(id: string, data: Partial<Community>): Promise<Community>;
deleteCommunity(id: string): Promise<void>;

// Channels
createChannel(data: InsertChannel): Promise<Channel>;
getChannelsByCommunity(communityId: string): Promise<Channel[]>;
updateChannel(id: string, data: Partial<Channel>): Promise<Channel>;
deleteChannel(id: string): Promise<void>;

// Messages
createMessage(data: InsertMessage): Promise<Message>;
getMessagesByChannel(channelId: string, limit?: number, before?: string): Promise<Message[]>;
updateMessage(id: string, content: string): Promise<Message>;
deleteMessage(id: string): Promise<void>;

// Reactions
addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction>;
removeReaction(messageId: string, userId: string, emoji: string): Promise<void>;
getReactionsByMessage(messageId: string): Promise<Reaction[]>;

// Members
addMember(communityId: string, userId: string, roleId?: string): Promise<Member>;
removeMember(communityId: string, userId: string): Promise<void>;
getMembersByCommunity(communityId: string): Promise<Member[]>;
updateMemberRole(communityId: string, userId: string, roleId: string): Promise<Member>;

// Roles
createRole(data: InsertRole): Promise<Role>;
getRolesByCommunity(communityId: string): Promise<Role[]>;
updateRole(id: string, data: Partial<Role>): Promise<Role>;
deleteRole(id: string): Promise<void>;

// Invites
createInvite(communityId: string, expiresAt?: Date, maxUses?: number): Promise<Invite>;
getInviteByCode(code: string): Promise<Invite | null>;
useInvite(code: string): Promise<void>;
revokeInvite(id: string): Promise<void>;
```

---

## Scaffold Request #3: Chronicles Game Components

**Directory:** `client/src/components/chronicles/`

### 3a. CharacterCreator.tsx
Multi-step wizard for creating a "Parallel Self":
- Step 1: Choose era (Ancient, Medieval, Renaissance, Industrial, Modern, Future)
- Step 2: Set core beliefs (5-axis emotion system sliders)
- Step 3: Appearance customization
- Step 4: Name and backstory

```typescript
// client/src/components/chronicles/CharacterCreator.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ERAS = [
  { id: 'ancient', name: 'Ancient Era', years: '3000 BCE - 500 CE', icon: '🏛️' },
  { id: 'medieval', name: 'Medieval Era', years: '500 - 1500', icon: '⚔️' },
  { id: 'renaissance', name: 'Renaissance', years: '1400 - 1600', icon: '🎨' },
  { id: 'industrial', name: 'Industrial Age', years: '1760 - 1840', icon: '⚙️' },
  { id: 'modern', name: 'Modern Era', years: '1900 - 2000', icon: '🏙️' },
  { id: 'future', name: 'Future', years: '2100+', icon: '🚀' },
];

const EMOTION_AXES = [
  { id: 'courage', positive: 'Courage', negative: 'Fear' },
  { id: 'hope', positive: 'Hope', negative: 'Despair' },
  { id: 'trust', positive: 'Trust', negative: 'Suspicion' },
  { id: 'passion', positive: 'Passion', negative: 'Apathy' },
  { id: 'wisdom', positive: 'Wisdom', negative: 'Recklessness' },
];

interface CharacterCreatorProps {
  onComplete: (character: any) => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [era, setEra] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<Record<string, number>>({
    courage: 50, hope: 50, trust: 50, passion: 50, wisdom: 50
  });
  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');

  // TODO: Implement step navigation and form submission
  // TODO: Replit agent - connect to backend API

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4" data-testid="character-creator">
      {/* Step indicator */}
      {/* Step content with AnimatePresence */}
      {/* Navigation buttons */}
    </div>
  );
};
```

### 3b. EraSelector.tsx
Visual era selection with cards:

```typescript
// client/src/components/chronicles/EraSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface Era {
  id: string;
  name: string;
  years: string;
  icon: string;
  description: string;
  imageUrl?: string;
}

interface EraSelectorProps {
  eras: Era[];
  selected: string | null;
  onSelect: (eraId: string) => void;
}

export const EraSelector: React.FC<EraSelectorProps> = ({ eras, selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="era-selector">
      {eras.map((era) => (
        <motion.button
          key={era.id}
          onClick={() => onSelect(era.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl ${selected === era.id ? 'ring-2 ring-cyan-400 bg-slate-900/60' : 'bg-slate-950/40 hover:bg-slate-900/30'}`}
          data-testid={`era-${era.id}`}
        >
          <div className="text-4xl mb-2">{era.icon}</div>
          <div className="text-white font-semibold">{era.name}</div>
          <div className="text-xs text-slate-400">{era.years}</div>
        </motion.button>
      ))}
    </div>
  );
};
```

### 3c. DialogueInterface.tsx
NPC/AI conversation UI with choice system:

```typescript
// client/src/components/chronicles/DialogueInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogueMessage {
  id: string;
  speaker: 'player' | 'npc' | 'narrator';
  speakerName?: string;
  content: string;
  choices?: { id: string; text: string; consequence?: string }[];
}

interface DialogueInterfaceProps {
  messages: DialogueMessage[];
  onChoice: (messageId: string, choiceId: string) => void;
  isTyping?: boolean;
  npcAvatar?: string;
  playerAvatar?: string;
}

export const DialogueInterface: React.FC<DialogueInterfaceProps> = ({
  messages,
  onChoice,
  isTyping,
  npcAvatar,
  playerAvatar
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-slate-950/40 rounded-xl" data-testid="dialogue-interface">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.speaker === 'player' ? 'flex-row-reverse' : ''}`}
              data-testid={`dialogue-${msg.id}`}
            >
              {/* Avatar */}
              {/* Message bubble */}
              {/* Choices if present */}
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && <div className="text-slate-400 italic">...</div>}
      </div>
    </div>
  );
};
```

### 3d. EmotionAxes.tsx
5-axis emotion system sliders:

```typescript
// client/src/components/chronicles/EmotionAxes.tsx
import React from 'react';

interface EmotionAxis {
  id: string;
  positive: string;
  negative: string;
}

interface EmotionAxesProps {
  axes: EmotionAxis[];
  values: Record<string, number>;
  onChange: (axisId: string, value: number) => void;
  readonly?: boolean;
}

export const EmotionAxes: React.FC<EmotionAxesProps> = ({ axes, values, onChange, readonly }) => {
  return (
    <div className="space-y-4" data-testid="emotion-axes">
      {axes.map((axis) => (
        <div key={axis.id} className="flex items-center gap-4">
          <div className="w-24 text-right text-sm text-red-400">{axis.negative}</div>
          <input
            type="range"
            min="0"
            max="100"
            value={values[axis.id] ?? 50}
            onChange={(e) => onChange(axis.id, parseInt(e.target.value))}
            disabled={readonly}
            className="flex-1 accent-cyan-400"
            data-testid={`axis-${axis.id}`}
          />
          <div className="w-24 text-sm text-green-400">{axis.positive}</div>
        </div>
      ))}
    </div>
  );
};
```

---

## Scaffold Request #4: DAO Governance Backend (if needed)

Check `server/routes.ts` for existing governance endpoints. If not present:

**File:** `server/dao-service.ts`

```typescript
// server/dao-service.ts
import { db } from './db';
import { eq, and, desc, sql } from 'drizzle-orm';

// Types
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  startTime: Date;
  endTime: Date;
  executionData?: string;
}

interface Vote {
  id: string;
  proposalId: string;
  voterId: string;
  support: boolean;
  votingPower: number;
  timestamp: Date;
}

export const daoService = {
  async createProposal(data: Omit<Proposal, 'id' | 'status' | 'votesFor' | 'votesAgainst'>): Promise<Proposal> {
    // TODO: Replit agent - implement with Drizzle
  },

  async getProposals(status?: string): Promise<Proposal[]> {
    // TODO: Replit agent - implement
  },

  async vote(proposalId: string, voterId: string, support: boolean, votingPower: number): Promise<Vote> {
    // TODO: Replit agent - implement with duplicate vote check
  },

  async tallyVotes(proposalId: string): Promise<{ for: number; against: number; quorumReached: boolean }> {
    // TODO: Replit agent - implement
  },

  async executeProposal(proposalId: string): Promise<void> {
    // TODO: Replit agent - implement
  },
};
```

---

## Important Notes for Replit Agent Integration

1. **All TODO comments** marked with `// TODO: Replit agent -` indicate integration points
2. **Authentication**: Use existing `isAuthenticated` middleware from `server/routes.ts`
3. **Database**: Use existing `db` from `server/db.ts` with Drizzle ORM
4. **Validation**: Use Zod schemas matching the pattern in `server/routes.ts`
5. **Error handling**: Follow existing pattern with try/catch and res.status().json()
6. **IDs**: Generate with `crypto.randomBytes(8).toString('hex')` prefixed with entity type

---

## File Delivery Format

Please provide each file as:
```
// [full-file-path]
[complete file contents]
```

Example:
```
// server/chat-routes.ts
import { Router } from 'express';
// ... rest of file
```

This allows quick paste-and-drop into the Replit conversation.
