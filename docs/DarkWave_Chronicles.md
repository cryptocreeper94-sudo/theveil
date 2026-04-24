# DarkWave Chronicles — Full Replicable Handoff

> **Target**: Migrate Chronicles to a standalone Vercel-hosted app, connected to Trust Layer (dwtl.io) via APIs.
> **Source**: Trust Layer Portal (dwtl.io) — 43 frontend pages, 11 backend services, 7 component files, 6 3D engine files.
> **Stack**: React 18 + TypeScript + Vite (frontend), Node.js + Express + PostgreSQL + Drizzle ORM (backend).
> **LOC**: ~41,600 lines across ~63 dedicated files.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema (35+ Tables)](#2-database-schema-35-tables)
3. [Authentication System](#3-authentication-system)
4. [3D Engine (React Three Fiber)](#4-3d-engine-react-three-fiber)
5. [Core Game Service — chronicles-service.ts](#5-core-game-service)
6. [Play Routes — chronicles-play-routes.ts (3,796 lines)](#6-play-routes)
7. [AI & Narrative — chronicles-ai.ts + scenario-generator.ts](#7-ai--narrative)
8. [NPC Chat System — chronicles-npc-chat.ts](#8-npc-chat-system)
9. [Travel System — chronicles-travel-routes.ts](#9-travel-system)
10. [Daily Life — chronicles-daily-life-routes.ts](#10-daily-life)
11. [Marketplace & Crafting — chronicles-marketplace.ts](#11-marketplace--crafting)
12. [World Clock — chronicles-world-clock.ts](#12-world-clock)
13. [Shells Economy — shells-service.ts](#13-shells-economy)
14. [Voice Service — voice-service.ts](#14-voice-service)
15. [Notifications — chronicles-notifications.ts](#15-notifications)
16. [Frontend Pages — Complete Map (43 Pages)](#16-frontend-pages)
17. [Components & UI Library](#17-components--ui-library)
18. [Chrono Marketing Pages (11 Pages)](#18-chrono-marketing-pages)
19. [Routes in App.tsx](#19-routes-in-apptsx)
20. [External Service Dependencies](#20-external-service-dependencies)
21. [Environment Variables](#21-environment-variables)
22. [API Endpoint Master List](#22-api-endpoint-master-list)
23. [Vercel Migration Strategy](#23-vercel-migration-strategy)
24. [Implementation Checklist](#24-implementation-checklist)
25. [CRITICAL: Visual Assets & Design Rules](#critical-visual-assets--design-rules)

---

## 1. Architecture Overview

Chronicles is a life simulation game set across three historical eras with AI-driven narrative, persistent NPCs, blockchain-verified decision trails, and a dual-currency economy. The game philosophy centers on "Parallel Self" — choices reveal character rather than enforce morality.

### Core Systems

| System | Description |
|--------|-------------|
| **3D Engine** | React Three Fiber with 3 eras, 19 location configs, procedural geometry |
| **Narrative AI** | OpenAI GPT-4o for scenarios, NPC dialogue, personality profiling |
| **Economy** | Shells (play currency, $0.001 each) + Echoes (in-game, $0.0001) |
| **Decision Trail** | SHA-256 hashed blockchain record of every player choice |
| **Estate Builder** | Grid-based construction with era-specific buildings |
| **Travel System** | Haversine-based world map with real-time/fast travel modes |
| **Faith System** | Scriptural study, prayer mechanics, spiritual progression |
| **Pet System** | Era-specific companions with bond levels and abilities |
| **Legacy System** | Multi-generational progression (death → reincarnation) |
| **Voice Clone** | ElevenLabs voice cloning for AI narration in player's voice |
| **Marketplace** | Era-locked items, crafting recipes, stat bonuses |
| **Seasons** | Meta-progression with community voting on future content |

### File Map

```
client/src/pages/
├── chronicles.tsx                 # Marketing/entry (1,519 lines)
├── chronicles-hub.tsx             # Central dashboard (1,715 lines)
├── chronicles-play.tsx            # Core gameplay loop (938 lines)
├── chronicles-onboarding.tsx      # Parallel-Self quiz (1,188 lines)
├── chronicles-login.tsx           # Auth (453 lines)
├── chronicles-estate.tsx          # Estate builder + 3D (1,870 lines)
├── chronicles-city.tsx            # City building (784 lines)
├── chronicles-world.tsx           # Zone exploration (660 lines)
├── chronicles-travel.tsx          # World map travel (673 lines)
├── chronicles-daily-life.tsx      # Careers & needs (662 lines)
├── chronicles-faith.tsx           # Spiritual system (927 lines)
├── chronicles-pets.tsx            # Pet management (604 lines)
├── chronicles-marketplace.tsx     # Shop & crafting (549 lines)
├── chronicles-interior.tsx        # Home decoration (574 lines)
├── chronicles-npc-chat.tsx        # NPC messaging (535 lines)
├── chronicles-ai-demo.tsx         # Personality AI (603 lines)
├── chronicles-voice.tsx           # Voice cloning (461 lines)
├── chronicles-time-portal.tsx     # Era switching (542 lines)
├── chronicles-season-hub.tsx      # Seasonal meta-progression (1,442 lines)
├── chronicles-portal-entry.tsx    # Session entry/offline summary (885 lines)
├── chronicles-demo.tsx            # Sandbox preview (777 lines)
├── chronicles-builder.tsx         # Community builder portal (651 lines)
├── chronicles-tutorial.tsx        # Tutorial guide (444 lines)
├── chronicles-life.tsx            # Character simulation (570 lines)
├── chronicles-admin.tsx           # Admin dashboard (869 lines)
├── chronicles-dashboard.tsx       # Player status hub (315 lines)
├── chronicles-locked.tsx          # Coming soon screen (49 lines)
├── chronicles-executive-summary.tsx # Business pitch (686 lines)
├── chronicles-world.tsx           # Zone navigation (660 lines)
├── scenario-generator.tsx         # Scenario UI (549 lines)
├── era-codex.tsx                  # Era encyclopedia (537 lines)
├── build-your-legacy.tsx          # Legacy marketing (614 lines)
├── roadmap-chronicles.tsx         # Dev roadmap (421 lines)
├── chrono-home.tsx                # Landing page (569 lines)
├── chrono-creators.tsx            # Creator tools (549 lines)
├── chrono-team.tsx                # Team page (428 lines)
├── chrono-eras.tsx                # Era explorer (425 lines)
├── chrono-community.tsx           # Community hub (355 lines)
├── chrono-roadmap.tsx             # Roadmap (340 lines)
├── chrono-dashboard.tsx           # Stats preview (339 lines)
├── chrono-gameplay.tsx            # Mechanics guide (333 lines)
├── chrono-economy.tsx             # Economy explainer (319 lines)
├── chronochat.tsx                 # Chat interface (134 lines)
└── chronochat-invite.tsx          # Invite handler (36 lines)

client/src/components/
├── chronicles-3d/
│   ├── engine.tsx                 # R3F canvas + scene manager (233 lines)
│   ├── scenes.tsx                 # 19 location configs + geometry (1,000 lines)
│   ├── camera.tsx                 # Camera controller + OrbitControls (128 lines)
│   ├── overlay.tsx                # 2D HUD overlay (164 lines)
│   ├── assets.tsx                 # GLB loader + placeholders (181 lines)
│   ├── types.ts                   # TypeScript interfaces (102 lines)
│   └── index.ts                   # Public exports (6 lines)
├── chronicles-chat-panel.tsx      # Signal Chat overlay (504 lines)
├── chronicles-npc.tsx             # NPC chat component (252 lines)
└── chrono-ui.tsx                  # UI library (573 lines)

server/
├── chronicles-play-routes.ts      # Main game API (3,796 lines)
├── chronicles-service.ts          # Core game logic (1,882 lines)
├── chronicles-travel-routes.ts    # Travel API (690 lines)
├── chronicles-daily-life-routes.ts # Daily life API (634 lines)
├── chronicles-ai.ts              # AI personality engine (556 lines)
├── chronicles-marketplace.ts     # Shop + crafting API (547 lines)
├── voice-service.ts              # Voice cloning (402 lines)
├── chronicles-npc-chat.ts        # NPC conversation API (354 lines)
├── chronicles-world-clock.ts     # Time system (344 lines)
├── chronicles-notifications.ts   # Push notifications (171 lines)
├── scenario-generator.ts         # Scenario AI (165 lines)
└── shells-service.ts             # Economy service (712 lines)
```

---

## 2. Database Schema (35+ Tables)

### Game Characters & Player State

#### chronicle_characters
```typescript
{
  id: varchar PK (UUID),
  userId: text NOT NULL,
  name: text NOT NULL,
  title: text,
  era: text,
  faction: text,
  level: integer (default 1),
  experience: integer (default 0),
  wisdom: integer, courage: integer, compassion: integer, cunning: integer, influence: integer,
  shellsEarned: text,
  questsCompleted: integer,
  decisionsRecorded: integer,
  energy: integer, mood: integer, health: integer, social: integer, hunger: integer,
  lastCheckIn: timestamp,
  currentLocation: text,
  currentActivity: text,
  avatarUrl: text,
  isActive: boolean
}
```

#### chronicles_game_state
```typescript
{
  id: varchar PK (UUID),
  userId: text NOT NULL,
  currentEra: text,
  level: integer, experience: integer,
  wisdom: integer, courage: integer, compassion: integer, cunning: integer, influence: integer,
  completedSituations: text[] (array),
  inventory: json,
  faithLevel: integer,
  spiritualPath: text,
  sacredTextsRead: json,
  prayerStreak: integer,
  servicesAttended: integer,
  currentZone: text,
  createdAt: timestamp, updatedAt: timestamp
}
```

#### player_legacy
```typescript
{
  id: varchar PK (UUID),
  userId: text NOT NULL,
  characterName: text,
  era: text,
  generation: integer,
  parentLegacyId: varchar (FK → self),
  birthYear: integer, deathYear: integer,
  profession: text,
  inheritanceTraits: json,
  legacyScore: integer,
  epitaph: text,
  createdAt: timestamp
}
```

### NPCs & Relationships

#### chronicle_npcs
```typescript
{
  id: varchar PK (UUID),
  name: text NOT NULL, title: text,
  era: text NOT NULL,
  factionId: text,
  personality: json,
  backstory: text,
  currentMood: text,
  disposition: integer,
  location: text,
  isAlive: boolean,
  lastAiDecisionHash: text,
  createdAt: timestamp
}
```

#### npc_relationships
```typescript
{
  id: varchar PK (UUID),
  userId: text NOT NULL, npcId: text NOT NULL,
  era: text,
  relationshipType: text,
  affinity: integer, trust: integer, fear: integer, romance: integer, rivalry: integer,
  sharedMemories: json,
  giftsGiven: json,
  createdAt: timestamp, updatedAt: timestamp
}
```

#### chronicle_npc_conversations & chronicle_npc_messages
```typescript
// Conversations
{ id, userId, npcName, era, relationshipScore, lastMessageAt, createdAt }
// Messages
{ id, conversationId, role ("user"|"assistant"), content, createdAt }
```

#### chronicle_npc_templates & chronicle_city_npcs
```typescript
// Templates — archetype definitions for procedural NPC generation
{ id, archetype, medievalRole, wildwestRole, modernRole, personalityTraits, schedule: json }
// City NPCs — instances placed in specific zones
{ id, templateId, era, zoneId, name, currentMood, lastInteraction }
```

### Quests & Scenarios

#### chronicle_quest_instances
```typescript
{
  id: varchar PK, characterId: text, questId: text,
  status: text, progress: integer (0-100),
  choicesMade: json, branchPath: text,
  createdAt: timestamp
}
```

#### chronicle_daily_situations
```typescript
{
  id: varchar PK, userId: text, situationId: text,
  era: text, title: text, description: text,
  isAiGenerated: boolean, assignedDate: text, isCompleted: boolean,
  createdAt: timestamp
}
```

#### chronicle_travel_quests & chronicle_travel_quest_steps
```typescript
// Travel quests — route-specific missions
{ id, questType, era, originCity, destinationCity, reward, status }
// Steps — ordered objectives within a travel quest
{ id, questId, stepOrder, description, requirementValue, isCompleted }
```

### Economy (Shells & Echoes)

#### orb_wallets (aliased: shellWallets)
```typescript
{
  id: serial PK,
  userId: text NOT NULL UNIQUE,
  balance: text (default "0"),
  lockedBalance: text (default "0"),
  totalEarned: text, totalSpent: text,
  dailyEarned: text,
  createdAt: timestamp, updatedAt: timestamp
}
```

#### orb_transactions (aliased: shellTransactions)
```typescript
{
  id: serial PK,
  userId: text NOT NULL,
  type: text (earn/spend/tip/purchase/refund),
  amount: text NOT NULL,
  balance: text (after transaction),
  referenceId: text,
  referenceType: text,
  description: text,
  createdAt: timestamp
}
```

#### shell_purchase_receipts
```typescript
{
  id: serial PK,
  userId: text NOT NULL,
  stripePaymentIntentId: text,
  shellAmount: text,
  amountPaidCents: integer,
  status: text,
  createdAt: timestamp
}
```

#### shell_bundle_products
```typescript
{
  id: serial PK,
  name: text, shellAmount: text, priceCents: integer,
  stripePriceId: text, isActive: boolean
}
```

#### orb_conversion_snapshots
```typescript
{
  id: serial PK, userId: text,
  shellBalance: text, conversionRate: text,
  dwcAmount: text (SIG equivalent),
  createdAt: timestamp
}
```

### Estates & Property

#### player_estates
```typescript
{
  id: varchar PK, userId: text NOT NULL, era: text NOT NULL,
  gridData: json (2D array of building placements),
  totalBuildings: integer, shellsSpent: text,
  createdAt: timestamp, updatedAt: timestamp
}
```

#### land_plots
```typescript
{
  id: varchar PK, era: text,
  plotX: integer, plotY: integer,
  ownerId: text, plotSize: text, listingPrice: text,
  buildingType: text, buildingLevel: integer,
  createdAt: timestamp
}
```

#### city_zones
```typescript
{
  id: varchar PK, era: text,
  zoneType: text, name: text, architectureStyle: text,
  population: integer, prosperity: integer,
  createdAt: timestamp
}
```

### Marketplace & Inventory

#### chronicle_marketplace_items
```typescript
{
  id: varchar PK, code: text UNIQUE, name: text NOT NULL,
  era: text, category: text,
  shellCost: text NOT NULL, unlockLevel: integer,
  description: text, rarity: text,
  stockQuantity: integer, statBonus: json,
  createdAt: timestamp
}
```

#### chronicle_player_inventory
```typescript
{
  id: varchar PK, userId: text NOT NULL,
  itemCode: text NOT NULL, era: text,
  quantity: integer, equippedSlot: text,
  acquiredAt: timestamp
}
```

### Travel & Geography

#### chronicle_world_regions
```typescript
{ id: varchar PK, name: text, medievalName: text, wildwestName: text, modernName: text, continent: text }
```

#### chronicle_countries
```typescript
{ id: varchar PK, regionId: text, name: text, medievalName: text, wildwestName: text, code: text }
```

#### chronicle_states
```typescript
{ id: varchar PK, countryId: text, name: text, code: text }
```

#### chronicle_cities
```typescript
{
  id: varchar PK, stateId: text, name: text,
  medievalName: text, wildwestName: text, modernName: text,
  latitude: text, longitude: text,
  isCapital: boolean, arrivalCinematic: text,
  createdAt: timestamp
}
```

#### chronicle_travel_routes
```typescript
{
  id: varchar PK, originCityId: text, destinationCityId: text,
  distanceMiles: text, baseTravelHours: text,
  dangerLevel: integer, encounterChance: text,
  createdAt: timestamp
}
```

#### chronicle_travel_sessions
```typescript
{
  id: varchar PK, userId: text,
  routeId: text, travelType: text (realtime/compressed/fast),
  speedMph: text, progressPercent: integer,
  startedAt: timestamp, estimatedArrival: timestamp,
  status: text (active/completed/abandoned)
}
```

#### chronicle_travel_encounters
```typescript
{
  id: varchar PK, sessionId: text, userId: text,
  encounterType: text, title: text, description: text,
  choices: json, outcome: text,
  xpReward: integer, echoReward: integer,
  isResolved: boolean, createdAt: timestamp
}
```

### Seasons & Progression

#### chronicle_seasons
```typescript
{
  id: varchar PK, seasonNumber: integer,
  startDate: timestamp, endDate: timestamp,
  totalShellsPool: text, participantCount: integer,
  isActive: boolean, createdAt: timestamp
}
```

#### season_progress
```typescript
{
  id: varchar PK, userId: text, seasonId: text,
  erasExplored: json, medievalProgress: integer, wildwestProgress: integer, modernProgress: integer,
  finaleUnlocked: boolean,
  createdAt: timestamp, updatedAt: timestamp
}
```

### Pets

#### player_pets
```typescript
{
  id: varchar PK, userId: text NOT NULL,
  species: text, breed: text, name: text,
  era: text, rarity: text,
  bondLevel: integer, happiness: integer, health: integer,
  ageMonths: integer,
  primaryAbility: text,
  isCompanion: boolean,
  lastInteraction: timestamp,
  createdAt: timestamp
}
```

### Faith (fields on chronicles_game_state)
```typescript
faithLevel: integer,
spiritualPath: text,
sacredTextsRead: json,
servicesAttended: integer,
prayerStreak: integer
```

### Blockchain Decision Trail

#### chronicle_proofs
```typescript
{
  id: varchar PK, userId: text,
  era: text, decisionType: text,
  situationTitle: text, choiceMade: text, consequences: text,
  blockNumber: integer, blockHash: text,
  previousHash: text, guardianSignature: text,
  verified: boolean,
  createdAt: timestamp
}
```

### Other Game Tables

#### chronicle_factions
```typescript
{ id: varchar PK, era: text, name: text, ideology: text, influence: integer, treasury: text }
```

#### echo_personas
```typescript
{ id: varchar PK, userId: text, name: text, era: text, personality: json, lastActivity: timestamp }
```

#### chronicle_storefronts
```typescript
{ id: varchar PK, businessId: text, plotId: text, era: text, storeName: text, category: text }
```

#### chronicle_artifacts
```typescript
{ id: varchar PK, name: text, era: text, rarity: text, description: text, unlockRequirement: text }
```

#### daily_login_rewards & chronicle_daily_rewards
```typescript
{ id, userId, currentStreak, lastLogin, rewardTier, isClaimed, shellsAwarded }
```

---

## 3. Authentication System

Chronicles uses its own auth system separate from the main Trust Layer auth.

### Tables
- `chronicle_accounts` — email/password accounts with bcrypt hashing
- Session tokens stored as Bearer tokens

### Auth Flow
```
POST /api/chronicles/auth/signup  → Creates account, returns session token
POST /api/chronicles/auth/login   → Validates credentials, returns session token
GET  /api/chronicles/auth/session → Validates Bearer token, returns account info
```

### Middleware
```typescript
function isChroniclesAuthenticated(req, res, next) {
  // Extracts Bearer token from Authorization header
  // Validates against chronicle_accounts table
  // Attaches req.chroniclesAccount and req.user
}
```

### Trust Layer SSO Integration
```
POST /api/chronicles/chat/link → Links Chronicles session to Trust Layer SSO
  - Accepts Bearer JWT from Chronicles auth
  - Returns chatToken + chatUser for Signal Chat access
```

### Client-Side Helper
```typescript
function getChroniclesSession(): { token: string; userId: string } | null
  // Reads from localStorage
```

---

## 4. 3D Engine (React Three Fiber)

### ChroniclesEngine Component

```typescript
interface ChroniclesEngineProps {
  era: "modern" | "medieval" | "wildwest";     // Required
  location?: LocationType;                      // Default: "home"
  level?: number;
  xp?: number;
  shells?: number;
  className?: string;
  height?: string;
  showStats?: boolean;                          // Default: true
  children?: ReactNode;
}
```

### Three Eras with Visual Profiles

| Era | Color Palette | Architecture | Lighting |
|-----|---------------|-------------|----------|
| **Modern** | Neon cyan (#06b6d4), glass, concrete | Glass towers, apartments, tech labs | Bright directional + point lights |
| **Medieval** | Earthy browns (#8B7355), stone, moss | Castle keeps, cottages, taverns, chapels | Warm torches, dim ambient |
| **Wild West** | Dusty tan (#C4A574), weathered wood | Saloons, sheriff offices, general stores | Golden directional, dusty atmosphere |

### 19 Location Configurations

**Modern (8)**: Home (Apartment), Office, Gym, Cafe, Park, Library, Mall, Restaurant

**Medieval (6)**: Town Square, Castle, Tavern, Market Square, Chapel, Blacksmith

**Wild West (5)**: Saloon, Sheriff's Office, General Store, Ranch, Gold Mine

### R3F Dependencies
- `@react-three/fiber` — Canvas, useFrame, useThree
- `@react-three/drei` — Stars, Sky, OrbitControls, Text
- `three` — All geometry/material primitives
- `GLTFLoader` — External model support

### Procedural Geometry
Buildings, trees, cacti, and terrain are generated procedurally using Three.js primitives (Box, Cylinder, Cone, Sphere) rather than imported models, keeping the bundle small.

### Sub-Components
- `CameraController` — Smooth transitions between locations, cinematic intros, OrbitControls
- `StatsOverlay` — 2D HUD showing level, XP, shells on top of canvas
- `SceneTransition` — Fade/wipe effects when changing locations
- `AssetLoader` — GLB loading with fallback placeholders and progress bar

---

## 5. Core Game Service

File: `server/chronicles-service.ts` (1,882 lines)

### Exported Constants

#### ERAS
```typescript
{ modern: { name, description, unlocksAt: 1 }, medieval: { ..., unlocksAt: 3 }, wildwest: { ..., unlocksAt: 5 } }
```

#### ERA_SETTINGS
World descriptions and atmospheric details per era.

#### STARTER_FACTIONS (15 total, 5 per era)
```typescript
{ id, name, era, ideology: "Order"|"Chaos"|"Balance"|"Progress"|"Tradition", description, bonus }
```

#### SEASON_ZERO_QUESTS (75+ Life Situations)
```typescript
{
  id: string,
  type: "arrival"|"moral_dilemma"|"crisis"|"relationship"|"power"|"survival"|"faith"|"legacy",
  title: string,
  description: string,
  era: "modern"|"medieval"|"wildwest"|"any",
  difficulty: 1-5,
  choices: [{ id, text, consequences: { stat: delta } }],
  rewards: { xp, shells, items? }
}
```

#### STARTER_NPCS
Named characters per era including cross-era guide "Ursula".

#### ERA_BUILDING_TEMPLATES
```typescript
{ modern: [{ id, name, cost, level, size }], medieval: [...], wildwest: [...] }
```

#### ERA_CITY_ZONES
Zone definitions with activities for each era.

### Core Methods

| Method | Description |
|--------|-------------|
| `createCharacter(userId, name, era)` | Initializes character with base stats |
| `startQuest(characterId, questId)` | Begins a situation with initial state |
| `makeDecision(characterId, questId, choiceId)` | Processes choice, updates stats, generates proof |
| `talkToNpc(userId, npcId, message, era)` | AI-powered NPC dialogue via GPT-4o |
| `getWorldTimeInfo(era)` | Dynamic day/night + weather state |
| `getZoneAmbientState(era, zoneId)` | Location-specific atmosphere data |
| `getAllZonesForEra(era)` | Lists navigable zones with activities |

### Chronicle Proofs (Decision Trail)
Every player decision generates a SHA-256 hash:
```typescript
{
  blockNumber: incrementing,
  blockHash: sha256(previousHash + decisionData + timestamp),
  previousHash: chain link,
  guardianSignature: sha256(blockHash + "guardian-key"),
  verified: true
}
```

---

## 6. Play Routes

File: `server/chronicles-play-routes.ts` (3,796 lines)

### Endpoint Categories

#### Core Gameplay

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/play/state` | Full game state (stats, XP, level, season progress) |
| `POST` | `/api/chronicles/play/scenario` | AI-generated scenario for current era |
| `POST` | `/api/chronicles/play/decide` | Submit choice → stat changes, XP, shells, level-up |
| `GET` | `/api/chronicles/play/progress` | Chapter-based journey tracker |
| `GET` | `/api/chronicles/play/achievements` | Achievement list with earned status |
| `GET` | `/api/chronicles/play/leaderboard` | Global player rankings (public) |

#### Social & NPC

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chronicles/play/npc-chat` | AI NPC conversation (GPT-4o) |
| `POST` | `/api/chronicles/chat/link` | Link session to Signal Chat SSO |
| `GET` | `/api/chronicles/chat/channels` | Era-specific chat channels |
| `GET` | `/api/chronicles/chat/messages/:channelId` | Channel message history |
| `POST` | `/api/chronicles/chat/messages/:channelId` | Send message to channel |

#### City Building

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/city/plots?era=` | Land plot listing |
| `POST` | `/api/chronicles/city/build` | Build structure on plot |
| `GET` | `/api/chronicles/city/leaderboard` | Builder rankings |
| `POST` | `/api/chronicles/economy/spend` | Virtual currency transactions |

#### Faith & Spiritual Life

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/faith/status` | Spiritual level, prayer streak, path |
| `GET` | `/api/chronicles/faith/sacred-texts?category=` | Scripture library |
| `POST` | `/api/chronicles/faith/read-text` | AI-enhanced scripture study |
| `POST` | `/api/chronicles/faith/attend-service` | Congregation worship |
| `POST` | `/api/chronicles/faith/pray` | Prayer mechanic (daily, era-specific) |
| `POST` | `/api/chronicles/faith/talk-to-ursula` | Spiritual mentor AI conversation |

#### World Exploration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/world/zones/:era` | Zone listing with activities |
| `POST` | `/api/chronicles/world/enter-zone` | Navigate to zone |
| `POST` | `/api/chronicles/world/do-activity` | Perform zone activity (earn rewards) |
| `POST` | `/api/chronicles/world/minigame/submit` | Arcade minigame scoring |
| `POST` | `/api/chronicles/world/heartbeat` | Session keepalive |

#### Legacy (Multi-generational)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/legacy/tree` | Family tree with all generations |
| `POST` | `/api/chronicles/legacy/new-life` | Start new character (inherits traits) |
| `POST` | `/api/chronicles/legacy/end-life` | Character death + legacy scoring |

#### Blockchain Decision Trail

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chronicles/chain/record` | Record decision on simulated chain |
| `GET` | `/api/chronicles/chain/history` | Full chain with validity check |
| `GET` | `/api/chronicles/chain/verify/:blockHash` | Public block verification |

#### Pets

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/pets` | Player's pet inventory |
| `GET` | `/api/chronicles/pets/available` | Pet shop (era-filtered) |
| `POST` | `/api/chronicles/pets/adopt` | Adopt pet (shell cost) |
| `POST` | `/api/chronicles/pets/:petId/interact` | Feed/play/train |
| `POST` | `/api/chronicles/pets/:petId/companion` | Set active companion |

#### Voice & Audio

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chronicles/voice/narrate` | AI TTS narration (returns audio/mpeg) |
| `GET` | `/api/chronicles/voice/available` | Available voice configs |

---

## 7. AI & Narrative

### chronicles-ai.ts (556 lines)

The "Parallel Self" AI engine tracks player identity through choice patterns rather than fixed archetypes.

#### Emotional State Model (5 axes)
```typescript
{
  arousal: number,      // Calm ↔ Excited
  valence: number,      // Negative ↔ Positive
  socialCohesion: number, // Isolated ↔ Connected
  fear: number,         // Brave ↔ Fearful
  ambition: number      // Content ↔ Ambitious
}
```

#### Exported Functions

| Function | Description |
|----------|-------------|
| `getOrCreatePersonality(userId)` | Fetch/init player's personality profile |
| `generateScenario(userId, era, values)` | AI-generated situation adapted to player's observed values |
| `processChoice(userId, choiceData)` | Analyze decision, update emotional state, generate insight |
| `generateParallelSelfResponse(userId, message)` | Conversational AI as the player's parallel self |
| `generateChoiceSignature(userId)` | Human-readable observation of player's behavior patterns |

#### External Service: **OpenAI GPT-4o**

### scenario-generator.ts (165 lines)

Dedicated scenario factory with emotion-model integration.

| Function | Description |
|----------|-------------|
| `generateScenario(emotions, era)` | Structured JSON scenario with characters and cascading consequences |
| `randomizeEmotions()` | Seed NPCs with varied emotional states |
| `describeEmotionalState(emotions)` | Convert numbers to descriptive strings |

#### External Service: **OpenAI GPT-4o-mini / GPT-4.1**

---

## 8. NPC Chat System

File: `server/chronicles-npc-chat.ts` (354 lines)

NPCs maintain persistent relationships (score range: -20 to +20) that affect dialogue tone and options.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/npc/conversations/:era` | List active NPC conversations |
| `GET` | `/api/chronicles/npc/messages/:npcName/:era` | Message history for NPC |
| `POST` | `/api/chronicles/npc/send` | Send message → AI response + relationship delta |
| `GET` | `/api/chronicles/npc/relationships/:era` | All NPC relationship statuses |

### AI Behavior
- Each NPC has era-specific persona, faction alignment, mood state
- GPT-4o-mini generates responses in-character
- Conversation tone analysis adjusts relationship score automatically
- Relationship score affects available dialogue options and quest access

---

## 9. Travel System

File: `server/chronicles-travel-routes.ts` (690 lines)

### World Geography
Full geographic hierarchy: Regions → Countries → States → Cities

### Travel Modes
| Mode | Description |
|------|-------------|
| **Real-Time** | 1:1 time passage, highest encounter chance |
| **Compressed** | Accelerated time, moderate encounters |
| **Fast Travel** | Instant (unlocked at higher levels), no encounters |

### Distance Calculation
Uses Haversine formula between city lat/lon coordinates.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/world/regions` | Region list |
| `GET` | `/api/chronicles/world/countries` | Country list |
| `GET` | `/api/chronicles/world/states` | State list |
| `GET` | `/api/chronicles/world/cities` | City list with era-specific names |
| `POST` | `/api/chronicles/travel/plan` | Calculate time, cost, encounter probability |
| `POST` | `/api/chronicles/travel/start` | Begin travel session |
| `GET` | `/api/chronicles/travel/status` | Progress tracking + random encounters |
| `POST` | `/api/chronicles/travel/encounter/:id/resolve` | Resolve mid-travel event |

---

## 10. Daily Life

File: `server/chronicles-daily-life-routes.ts` (634 lines)

"The Sims"-style needs simulation with era-specific careers.

### Needs System (4 axes, decay over time)
```
Hunger: Restored by eating (era-specific foods)
Energy: Restored by sleeping
Hygiene: Restored by bathing/grooming
Social: Restored by socializing/attending events
```

### Career System
Era-specific jobs with shift-based earnings:
- **Modern**: Software Developer, Barista, Influencer, Teacher
- **Medieval**: Blacksmith, Herbalist, Knight, Scribe
- **Wild West**: Sheriff, Prospector, Saloon Owner, Ranch Hand

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/daily-life/summary?era=` | Current needs + career status |
| `GET` | `/api/chronicles/careers/available?era=` | Job listings for era |
| `POST` | `/api/chronicles/career/hire` | Accept job |
| `POST` | `/api/chronicles/career/work` | Work shift → earn Echoes |
| `POST` | `/api/chronicles/career/quit` | Leave current job |
| `POST` | `/api/chronicles/needs/fulfill` | Eat/sleep/socialize action |

---

## 11. Marketplace & Crafting

File: `server/chronicles-marketplace.ts` (547 lines)

### Item System
- Items are era-locked with rarity tiers
- Stat bonuses: `{ stat: "courage", bonus: 2 }`
- Stock quantities (finite availability)
- Level-gated access

### Crafting
- Recipes combine ingredients into higher-tier items
- Era-specific recipes (Medieval: forge weapons, Modern: build gadgets)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/marketplace/:era` | Shop inventory |
| `POST` | `/api/chronicles/marketplace/purchase` | Buy item (shell cost) |
| `GET` | `/api/chronicles/inventory` | Player's items |
| `GET` | `/api/chronicles/crafting/recipes` | Available recipes |
| `GET` | `/api/chronicles/crafting/:era` | Era-filtered recipes |
| `POST` | `/api/chronicles/crafting/craft` | Combine items |

---

## 12. World Clock

File: `server/chronicles-world-clock.ts` (344 lines)

Maps real-world hours to era-specific time labels and day/night cycles.

### Time Labels
| Hour | Modern | Medieval | Wild West |
|------|--------|----------|-----------|
| 0 | Midnight | Witching Hour | Dead of Night |
| 6 | Dawn | Matins | First Light |
| 12 | Noon | High Sun | High Noon |
| 18 | Evening | Vespers | Sundown |

### Daily Situations
AI-generated unique events assigned to each player daily.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chronicles/world-clock/:era` | Current era time + day/night status |
| `GET` | `/api/chronicles/daily-situations/:era` | Today's assigned events |
| `POST` | `/api/chronicles/daily-situations/assign` | AI-generate daily situation |

---

## 13. Shells Economy

File: `server/shells-service.ts` (712 lines)

### Currency Hierarchy
```
Signal (SIG) — Native asset, 1B supply, launches with mainnet
  └── Shells — Pre-launch currency, 1 Shell = $0.001, converts to SIG
       └── Echoes — In-game earnings, 1 Echo = $0.0001, 10 Echoes = 1 Shell
```

### Play-to-Earn Caps
- Daily earning cap (prevents exploitation)
- Weekly earning cap
- Per-activity limits

### SIG Conversion
Target date: mainnet launch. Conversion rate snapshots stored in `orb_conversion_snapshots`.

### Service Methods

| Method | Description |
|--------|-------------|
| `ShellsService.addShells(userId, amount, reason)` | Credit shells to wallet |
| `ShellsService.spendShells(userId, amount, reason)` | Debit shells from wallet |
| `ShellsService.tipUser(fromId, toId, amount)` | Atomic peer-to-peer transfer |
| `ShellsService.getBalance(userId)` | Current balance |
| `ShellsService.getTransactionHistory(userId)` | Transaction ledger |
| `ShellsService.createShellBundleCheckout(userId, bundleId)` | Stripe checkout session |
| `ShellsService.recordPurchaseReceipt(paymentIntent)` | Stripe webhook handler |
| `ShellsService.recordFinancialConsent(userId, ip)` | ToS compliance tracking |

### External Service: **Stripe** (fiat → Shells purchases)

---

## 14. Voice Service

File: `server/voice-service.ts` (402 lines)

AI voice synthesis for game narration and player voice cloning.

### Providers (Priority Order)
1. **ElevenLabs** — Primary, instant voice cloning, Voice ID: `pFZP5JQG7iQjIQuC4Bku` (Lily)
2. **Resemble.ai** — Secondary provider
3. **Web Speech API** — Browser fallback (free)

### Service Methods

| Method | Description |
|--------|-------------|
| `voiceService.saveVoiceSample(userId, audioBuffer)` | Store user voice recording |
| `voiceService.createVoiceClone(userId)` | Initiate cloning with ElevenLabs |
| `voiceService.generateSpeech(text, voiceId, era)` | TTS with era-appropriate style |
| `voiceService.getVoiceStatus(userId)` | Clone processing status |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chronicles/voice/narrate` | Returns audio/mpeg stream |
| `GET` | `/api/chronicles/voice/available` | Voice configs + enabled status |
| `GET` | `/api/chronicles/voice/status` | User's clone status |
| `POST` | `/api/chronicles/voice/train` | Submit voice sample for cloning |

### External Service: **ElevenLabs** (`ELEVEN_LABS_API_KEY`)

---

## 15. Notifications

File: `server/chronicles-notifications.ts` (171 lines)

Push notifications via Twilio SMS for game events.

### Notification Types
- Render completion alerts
- Invite notifications
- Security alerts
- Daily reward reminders

### External Service: **Twilio** (SMS)

---

## 16. Frontend Pages — Complete Map (43 Pages)

### Core Gameplay Pages

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles-play.tsx` | 938 | `/chronicles/play` | Core gameplay loop — scenarios, choices, consequences |
| `chronicles-hub.tsx` | 1,715 | `/chronicles/hub` | Central dashboard — journey map, syndicates, chat |
| `chronicles-onboarding.tsx` | 1,188 | `/chronicles/onboarding` | Parallel-Self quiz (Identity → Values → Instincts → Pressure) |
| `chronicles-login.tsx` | 453 | `/chronicles/login` | Auth (email/password signup + login) |
| `chronicles-portal-entry.tsx` | 885 | `/chronicles/portal` | Session entry, offline summary, tutorial progress |
| `chronicles-dashboard.tsx` | 315 | `/chronicles/dashboard` | Player status overview |

### World & Exploration

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles-world.tsx` | 660 | `/chronicles/world` | Zone navigation + activities + minigames |
| `chronicles-city.tsx` | 784 | `/chronicles/city` | City building + plot management |
| `chronicles-travel.tsx` | 673 | `/chronicles/travel` | World map + route planning + encounters |
| `chronicles-time-portal.tsx` | 542 | `/chronicles/time-portal` | Era switching via missions + riddles |
| `chronicles-estate.tsx` | 1,870 | `/chronicles/estate` | Estate builder (grid editor + 3D view) |
| `chronicles-interior.tsx` | 574 | `/chronicles/interior` | Home decoration (furniture placement) |

### Life Simulation

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles-daily-life.tsx` | 662 | `/chronicles/daily-life` | Careers + needs fulfillment |
| `chronicles-life.tsx` | 570 | `/chronicles/life` | Character status + location activities |
| `chronicles-faith.tsx` | 927 | `/chronicles/faith` | Scripture reader + prayer + worship |
| `chronicles-pets.tsx` | 604 | `/chronicles/pets` | Pet adoption + care + companions |
| `chronicles-marketplace.tsx` | 549 | `/chronicles/marketplace` | Shop + crafting + inventory |

### Social & AI

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles-npc-chat.tsx` | 535 | `/chronicles/npc-chat` | AI NPC messaging with relationship tracking |
| `chronicles-ai-demo.tsx` | 603 | `/chronicles/ai-demo` | Personality system + AI scenarios |
| `chronicles-voice.tsx` | 461 | `/chronicles/voice` | Voice cloning interface |

### Progression & Meta

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles-season-hub.tsx` | 1,442 | `/chronicles/seasons` | Season progress, milestones, voting |
| `chronicles-builder.tsx` | 651 | `/chronicles/builder` | Community builder portal + badges |
| `scenario-generator.tsx` | 549 | `/scenario-generator` | Scenario creation UI |
| `era-codex.tsx` | 537 | `/era-codex` | Era encyclopedia (70+ eras) |
| `build-your-legacy.tsx` | 614 | `/build-your-legacy` | Legacy marketing page |

### Info & Admin

| Page | Lines | Route | Purpose |
|------|------:|-------|---------|
| `chronicles.tsx` | 1,519 | `/chronicles` | Marketing entry page (cinematic hero, era explorer) |
| `chronicles-demo.tsx` | 777 | `/chronicles/demo` | Sandbox preview (factions, quests, NPCs) |
| `chronicles-tutorial.tsx` | 444 | `/chronicles/tutorial` | Tutorial guide |
| `chronicles-admin.tsx` | 869 | `/chronicles/admin` | Owner admin dashboard |
| `chronicles-executive-summary.tsx` | 686 | `/chronicles/executive-summary` | Business pitch |
| `chronicles-locked.tsx` | 49 | `/chronicles/locked` | Coming soon screen |
| `roadmap-chronicles.tsx` | 421 | `/roadmap-chronicles` | Development roadmap |

---

## 17. Components & UI Library

### chrono-ui.tsx (573 lines)

The core UI library for all Chronicles pages:

| Component | Description |
|-----------|-------------|
| `ChronoLayout` | Main wrapper with navigation header and footer |
| `VideoHero` | Cinematic hero sections with video/image backgrounds |
| `HoloCard` | Glowing, animated glassmorphism cards |
| `SocialProofTicker` | Animated stat ticker ("Join First 1,000") |

### chronicles-chat-panel.tsx (504 lines)

Persistent Signal Chat overlay:
- Era-specific channels
- Voice messaging (5 credits per message)
- WebSocket real-time updates
- Unread message indicators

### chronicles-npc.tsx (252 lines)

NPC chat component with rule-based response generator (placeholder for full LLM integration).

### chronicles-3d/ (1,814 lines)

See [Section 4: 3D Engine](#4-3d-engine-react-three-fiber) for complete breakdown.

---

## 18. Chrono Marketing Pages (11 Pages)

All use the `ChronoLayout` wrapper from `chrono-ui.tsx`.

| Page | Lines | Route | Content |
|------|------:|-------|---------|
| `chrono-home.tsx` | 569 | `/chrono` | Hero, core pillars, featured eras |
| `chrono-creators.tsx` | 549 | `/chrono/creators` | UGC tools, creator marketplace |
| `chrono-team.tsx` | 428 | `/chrono/team` | Developer profiles |
| `chrono-eras.tsx` | 425 | `/chrono/eras` | Interactive era explorer (70+ periods) |
| `chrono-community.tsx` | 355 | `/chrono/community` | Waitlist, social stats, DAO |
| `chrono-roadmap.tsx` | 340 | `/chrono/roadmap` | Development phases |
| `chrono-dashboard.tsx` | 339 | `/chrono/dashboard` | Player stats preview |
| `chrono-gameplay.tsx` | 333 | `/chrono/gameplay` | Mechanics guide |
| `chrono-economy.tsx` | 319 | `/chrono/economy` | SIG economy explainer |
| `chronochat.tsx` | 134 | `/chronochat` | Discord-style chat interface |
| `chronochat-invite.tsx` | 36 | `/chronochat/invite` | Community invite handler |

---

## 19. Routes in App.tsx

All Chronicles routes to extract and register in the standalone app:

```typescript
// Core Gameplay
/chronicles                    → chronicles.tsx (marketing)
/chronicles/login              → chronicles-login.tsx
/chronicles/onboarding         → chronicles-onboarding.tsx
/chronicles/hub                → chronicles-hub.tsx
/chronicles/play               → chronicles-play.tsx
/chronicles/portal             → chronicles-portal-entry.tsx
/chronicles/dashboard          → chronicles-dashboard.tsx

// World
/chronicles/world              → chronicles-world.tsx
/chronicles/city               → chronicles-city.tsx
/chronicles/travel             → chronicles-travel.tsx
/chronicles/time-portal        → chronicles-time-portal.tsx
/chronicles/estate             → chronicles-estate.tsx
/chronicles/interior           → chronicles-interior.tsx

// Life Sim
/chronicles/daily-life         → chronicles-daily-life.tsx
/chronicles/life               → chronicles-life.tsx
/chronicles/faith              → chronicles-faith.tsx
/chronicles/pets               → chronicles-pets.tsx
/chronicles/marketplace        → chronicles-marketplace.tsx

// Social & AI
/chronicles/npc-chat           → chronicles-npc-chat.tsx
/chronicles/ai-demo            → chronicles-ai-demo.tsx
/chronicles/voice              → chronicles-voice.tsx

// Progression
/chronicles/seasons            → chronicles-season-hub.tsx
/chronicles/builder            → chronicles-builder.tsx

// Info
/chronicles/demo               → chronicles-demo.tsx
/chronicles/tutorial           → chronicles-tutorial.tsx
/chronicles/admin              → chronicles-admin.tsx
/chronicles/executive-summary  → chronicles-executive-summary.tsx
/chronicles/locked             → chronicles-locked.tsx

// Marketing (Chrono domain)
/chrono                        → chrono-home.tsx
/chrono/creators               → chrono-creators.tsx
/chrono/team                   → chrono-team.tsx
/chrono/eras                   → chrono-eras.tsx
/chrono/community              → chrono-community.tsx
/chrono/roadmap                → chrono-roadmap.tsx
/chrono/dashboard              → chrono-dashboard.tsx
/chrono/gameplay               → chrono-gameplay.tsx
/chrono/economy                → chrono-economy.tsx
/chronochat                    → chronochat.tsx
/chronochat/invite             → chronochat-invite.tsx

// Standalone
/scenario-generator            → scenario-generator.tsx
/era-codex                     → era-codex.tsx
/build-your-legacy             → build-your-legacy.tsx
/roadmap-chronicles            → roadmap-chronicles.tsx
```

---

## 20. External Service Dependencies

| Service | Used For | Env Variable |
|---------|----------|-------------|
| **OpenAI GPT-4o** | Scenarios, NPC chat, personality, parallel self | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` |
| **OpenAI GPT-4o-mini** | NPC conversations, world clock situations | Same as above |
| **ElevenLabs** | Voice cloning, TTS narration | `ELEVEN_LABS_API_KEY` |
| **Stripe** | Shell bundle purchases | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| **Twilio** | SMS notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| **Trust Layer SSO** | Cross-app authentication | `BASE_URL` (dwtl.io) |
| **PostgreSQL** | All game state persistence | `DATABASE_URL` |

---

## 21. Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...

# AI (Required for gameplay)
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...

# Voice (Required for narration)
ELEVEN_LABS_API_KEY=...

# Payments (Required for shell purchases)
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...

# Notifications (Optional)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Trust Layer SSO
BASE_URL=https://dwtl.io

# App
CHRONICLES_DOMAIN=https://darkwavechronicles.io  # or whatever domain
```

---

## 22. API Endpoint Master List

Total: ~120+ endpoints across all route files.

### Auth (3)
```
POST /api/chronicles/auth/signup
POST /api/chronicles/auth/login
GET  /api/chronicles/auth/session
```

### Core Play (6)
```
GET  /api/chronicles/play/state
POST /api/chronicles/play/scenario
POST /api/chronicles/play/decide
GET  /api/chronicles/play/progress
GET  /api/chronicles/play/achievements
GET  /api/chronicles/play/leaderboard
```

### Social & Chat (5)
```
POST /api/chronicles/play/npc-chat
POST /api/chronicles/chat/link
GET  /api/chronicles/chat/channels
GET  /api/chronicles/chat/messages/:channelId
POST /api/chronicles/chat/messages/:channelId
```

### City (4)
```
GET  /api/chronicles/city/plots
POST /api/chronicles/city/build
GET  /api/chronicles/city/leaderboard
POST /api/chronicles/economy/spend
```

### Faith (6)
```
GET  /api/chronicles/faith/status
GET  /api/chronicles/faith/sacred-texts
POST /api/chronicles/faith/read-text
POST /api/chronicles/faith/attend-service
POST /api/chronicles/faith/pray
POST /api/chronicles/faith/talk-to-ursula
```

### World (5)
```
GET  /api/chronicles/world/zones/:era
POST /api/chronicles/world/enter-zone
POST /api/chronicles/world/do-activity
POST /api/chronicles/world/minigame/submit
POST /api/chronicles/world/heartbeat
```

### Legacy (3)
```
GET  /api/chronicles/legacy/tree
POST /api/chronicles/legacy/new-life
POST /api/chronicles/legacy/end-life
```

### Decision Trail (3)
```
POST /api/chronicles/chain/record
GET  /api/chronicles/chain/history
GET  /api/chronicles/chain/verify/:blockHash
```

### Pets (5)
```
GET  /api/chronicles/pets
GET  /api/chronicles/pets/available
POST /api/chronicles/pets/adopt
POST /api/chronicles/pets/:petId/interact
POST /api/chronicles/pets/:petId/companion
```

### Voice (4)
```
POST /api/chronicles/voice/narrate
GET  /api/chronicles/voice/available
GET  /api/chronicles/voice/status
POST /api/chronicles/voice/train
```

### NPC Chat (4)
```
GET  /api/chronicles/npc/conversations/:era
GET  /api/chronicles/npc/messages/:npcName/:era
POST /api/chronicles/npc/send
GET  /api/chronicles/npc/relationships/:era
```

### Travel (8)
```
GET  /api/chronicles/world/regions
GET  /api/chronicles/world/countries
GET  /api/chronicles/world/states
GET  /api/chronicles/world/cities
POST /api/chronicles/travel/plan
POST /api/chronicles/travel/start
GET  /api/chronicles/travel/status
POST /api/chronicles/travel/encounter/:id/resolve
```

### Daily Life (6)
```
GET  /api/chronicles/daily-life/summary
GET  /api/chronicles/careers/available
POST /api/chronicles/career/hire
POST /api/chronicles/career/work
POST /api/chronicles/career/quit
POST /api/chronicles/needs/fulfill
```

### Marketplace (6)
```
GET  /api/chronicles/marketplace/:era
POST /api/chronicles/marketplace/purchase
GET  /api/chronicles/inventory
GET  /api/chronicles/crafting/recipes
GET  /api/chronicles/crafting/:era
POST /api/chronicles/crafting/craft
```

### World Clock (3)
```
GET  /api/chronicles/world-clock/:era
GET  /api/chronicles/daily-situations/:era
POST /api/chronicles/daily-situations/assign
```

### Portal & Tutorial (6)
```
GET  /api/chronicles/portal-entry/status
POST /api/chronicles/portal-entry/enter
GET  /api/chronicles/world/offline-summary
POST /api/chronicles/world/acknowledge-events
GET  /api/chronicles/tutorial/status
POST /api/chronicles/tutorial/progress
```

### Seasons (2)
```
GET  /api/chronicles/season/progress
POST /api/chronicles/season/vote
```

### Personality & Character (5)
```
GET  /api/chronicles/personality
POST /api/chronicles/personality
GET  /api/chronicles/character
POST /api/chronicles/character
GET  /api/chronicles/character/status
```

### Interior (5)
```
GET  /api/chronicles/interior
GET  /api/chronicles/interior/room/:id
GET  /api/chronicles/interior/catalog/:era
POST /api/chronicles/interior/room/:id/objects
DELETE /api/chronicles/interior/objects/:id
```

### Time Portal (5)
```
GET  /api/chronicles/portal
GET  /api/chronicles/missions
POST /api/chronicles/missions/:id/start
POST /api/chronicles/missions/:id/riddle
POST /api/chronicles/portal/travel
```

### Shells Economy (5)
```
GET  /api/shells/balance
GET  /api/shells/transactions
POST /api/shells/checkout
POST /api/shells/tip
GET  /api/chronicles/daily-reward
```

### Estate (4)
```
GET  /api/chronicles/estate
POST /api/chronicles/estate
GET  /api/chronicles/zones
GET  /api/chronicles/era-buildings/:era
```

### Builder (6)
```
GET  /api/builder/profile
GET  /api/builder/tiers
GET  /api/builder/contribution-types
GET  /api/builder/contributions
GET  /api/builder/leaderboard
GET  /api/builder/badges
```

### Admin & Misc
```
POST /api/owner/auth
GET  /api/chronicles/game-design-doc
GET  /api/chronicles/game/season
GET  /api/chronicles/game/factions
GET  /api/chronicles/game/quests
GET  /api/chronicles/game/npcs
POST /api/chronicles/game/npc/talk
GET  /api/chronicles/stamps
GET  /api/chronicles/legacy/:userId
```

---

## 23. Vercel Migration Strategy

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Vercel (Frontend)                               │
│  darkwavechronicles.io                           │
│                                                  │
│  React 18 + Vite + TypeScript                   │
│  43 pages + components + 3D engine              │
│                                                  │
│  API calls → Render or dwtl.io backend          │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS API calls
                  ▼
┌─────────────────────────────────────────────────┐
│  Render (Backend) or dwtl.io                     │
│  chronicles-api.onrender.com                     │
│                                                  │
│  Node.js + Express + PostgreSQL                 │
│  11 service files + 120+ endpoints              │
│  WebSocket for chat                             │
│                                                  │
│  Connects to:                                    │
│  - PostgreSQL (game state)                      │
│  - OpenAI (AI features)                         │
│  - ElevenLabs (voice)                           │
│  - Stripe (payments)                            │
│  - Twilio (notifications)                       │
│  - dwtl.io (Trust Layer SSO, hallmarks)         │
└─────────────────────────────────────────────────┘
```

### Option A: Keep Backend on dwtl.io
- Frontend on Vercel calls `dwtl.io/api/chronicles/*` directly
- Add CORS headers for Chronicles domain
- Simplest approach — no backend migration needed
- All `/api/chronicles/*` endpoints already exist

### Option B: Standalone Backend on Render
- Extract all 11 Chronicles service files
- Create standalone Express server
- Replicate DB tables in separate PostgreSQL instance
- Add SSO token exchange with dwtl.io for auth bridging
- More work but fully independent

### Option C: Hybrid (Recommended)
- Frontend on Vercel
- Core gameplay API on Render (play, AI, world, economy)
- Auth + SSO stays on dwtl.io (cross-origin JWT)
- Shells economy stays on dwtl.io (shared with other apps)
- Hallmarks + Trust Stamps call dwtl.io API

### Frontend Migration Steps
1. Copy all 43 Chronicles pages + components to new Vite project
2. Update API base URL to point to backend host
3. Replace `wouter` routing (or keep it — works on Vercel with SPA fallback)
4. Copy `chrono-ui.tsx` component library
5. Copy `chronicles-3d/` engine directory
6. Install R3F dependencies: `@react-three/fiber`, `@react-three/drei`, `three`
7. Configure Vercel: `vercel.json` with SPA rewrites

### Backend Migration Steps (if Option B/C)
1. Create new Express server with the 11 service files
2. Copy all Chronicles DB tables to new PostgreSQL
3. Set up Drizzle ORM with same schema
4. Configure env vars (OpenAI, ElevenLabs, Stripe, Twilio)
5. Add CORS for Vercel domain
6. Deploy to Render

---

## 24. Implementation Checklist

### Phase 1: Frontend Setup (Vercel)
- [ ] Initialize new Vite + React + TypeScript project
- [ ] Install dependencies: tailwindcss, framer-motion, @tanstack/react-query, wouter, lucide-react
- [ ] Install 3D: @react-three/fiber, @react-three/drei, three
- [ ] Copy all 43 Chronicles pages
- [ ] Copy chrono-ui.tsx, chronicles-chat-panel.tsx, chronicles-npc.tsx
- [ ] Copy chronicles-3d/ engine (all 7 files)
- [ ] Set up routing (43 routes)
- [ ] Configure API base URL (env var)
- [ ] Deploy to Vercel with SPA config

### Phase 2: Backend (Render or keep on dwtl.io)
- [ ] Extract/duplicate 35+ game tables
- [ ] Extract 11 backend service files
- [ ] Wire up 120+ API endpoints
- [ ] Configure WebSocket for chat
- [ ] Set up env vars (OpenAI, ElevenLabs, Stripe, Twilio)
- [ ] Add CORS headers for Vercel domain
- [ ] Deploy

### Phase 3: Auth & SSO
- [ ] Set up Chronicles auth (signup/login/session)
- [ ] Configure Trust Layer SSO token exchange
- [ ] Signal Chat integration via chat/link endpoint

### Phase 4: External Services
- [ ] OpenAI: AI scenarios, NPC chat, personality engine
- [ ] ElevenLabs: Voice cloning and TTS narration
- [ ] Stripe: Shell bundle purchases
- [ ] Twilio: SMS notifications (optional)

### Phase 5: 3D Engine
- [ ] Verify all 19 location configs render correctly
- [ ] Test era switching (Modern/Medieval/Wild West)
- [ ] Validate OrbitControls and camera transitions
- [ ] Test GLB model loading with fallbacks

### Phase 6: Game Systems Verification
- [ ] Core gameplay loop (scenario → choice → consequences)
- [ ] Decision trail (blockchain hashing)
- [ ] Shells economy (earn/spend/tip/buy)
- [ ] NPC conversations with relationship tracking
- [ ] Travel system with encounters
- [ ] Daily life (needs + careers)
- [ ] Estate builder (grid + 3D)
- [ ] Faith system (prayer + scripture + services)
- [ ] Pet system (adopt/interact/companion)
- [ ] Legacy system (death → new life)
- [ ] Marketplace + crafting
- [ ] Season progress + voting

### Phase 7: Polish
- [ ] Mobile-responsive (all 43 pages)
- [ ] Voice input support
- [ ] Offline summary on re-entry
- [ ] Tutorial flow
- [ ] Daily login rewards

---

## CRITICAL: Visual Assets & Design Rules

**The Chronicles app must use photorealistic AI-generated images and cinematic flyover videos. Do NOT use emojis, emoji icons, or placeholder graphics in cards or UI elements. Every visual must be a photorealistic image or video.**

### Color Scheme (MANDATORY)

The ONLY acceptable color palette:

| Element | Value |
|---------|-------|
| **Background base** | `#06060a` (void-black) |
| **Panel backgrounds** | `#0a0b10` |
| **Borders** | `#1a1b2e` |
| **Primary accent** | `#06b6d4` (cyan / Tailwind `cyan-500`) |
| **Secondary accent** | `#a855f7` (purple / Tailwind `purple-500`) |
| **Text primary** | `white` / `white/90` |
| **Text secondary** | `white/60` / `white/40` |
| **Gradients** | Cyan-to-purple only |

**NEVER use amber, orange, yellow, or warm tones anywhere.** All glows, accents, badges, buttons, borders, and highlights must be cyan, purple, or white only.

### Hero Video Carousel (Landing Page)

The Chronicles landing page features a full-screen cinematic video carousel as the hero section. This is a core visual element — not optional.

#### Video Files (8 videos, ~145MB total)

Jason will provide these files. Place them in your assets directory (e.g., `src/assets/videos/` or `public/videos/`):

| Filename | Label | Size |
|----------|-------|------|
| `fantasy_world_cinematic_flyover.mp4` | Historical Journey | 27MB |
| `wild_west_frontier_town_flyover.mp4` | Wild West | 11MB |
| `ancient_rome_colosseum_glory.mp4` | Ancient Rome | 14MB |
| `medieval_castle_twilight_scene.mp4` | Medieval Era | 14MB |
| `victorian_london_foggy_streets.mp4` | Victorian London | 10MB |
| `ancient_egypt_pyramids_sunset.mp4` | Ancient Egypt | 13MB |
| `prehistoric_dinosaur_jungle_scene.mp4` | Prehistoric | 20MB |
| `biblical_jerusalem_temple_scene.mp4` | Biblical Era | 14MB |

There is also a 9th bonus video not currently in the carousel:
- `medieval_kingdom_establishing_shot.mp4` (24MB)

#### Video Carousel Implementation

The hero section is full-viewport with two `<video>` elements layered for crossfade transitions. Key behaviors:

1. **Auto-advances** — when the current video ends, it crossfades (700ms opacity transition) to the next video in the array
2. **Starts muted** — `videoMuted` defaults to `true`. A toggle button (top-right, `VolumeX`/`Volume2` icons) lets users unmute
3. **Audio fade** — when unmuting/muting or transitioning between videos, volume fades smoothly over 500ms (20 steps)
4. **Preloading** — the next video element has `preload="auto"` and calls `.load()` when `nextVideoIndex` changes
5. **Indicator dots** — bottom-center, pill-shaped navigation. Active dot is wider (`w-8 h-2 bg-white`), inactive dots are smaller (`w-2 h-2 bg-white/40`). Hidden on small mobile, visible on `sm:` and up
6. **Click to jump** — clicking a dot triggers a crossfade transition to that video
7. **Overlay gradients** — two gradient layers over the video:
   - `bg-gradient-to-b from-black/60 via-black/40 to-background`
   - `bg-gradient-to-r from-black/70 via-transparent to-black/70`
8. **Atmosphere layer** — a radial gradient overlay with `opacity-40`:
   - Purple glow at 20% horizontal: `rgba(168,85,247,0.4)`
   - Cyan glow at 80% horizontal: `rgba(6,182,212,0.4)`

#### React State & Refs

```typescript
const [videoMuted, setVideoMuted] = useState(true);
const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
const [nextVideoIndex, setNextVideoIndex] = useState(1);
const [isVideoTransitioning, setIsVideoTransitioning] = useState(false);
const currentVideoRef = useRef<HTMLVideoElement>(null);
const nextVideoRef = useRef<HTMLVideoElement>(null);
```

#### Audio Fade Function

```typescript
const fadeAudio = (video: HTMLVideoElement, fadeIn: boolean, duration: number = 500) => {
  const steps = 20;
  const stepTime = duration / steps;
  const startVolume = fadeIn ? 0 : 1;
  const endVolume = fadeIn ? 1 : 0;
  const volumeStep = (endVolume - startVolume) / steps;
  video.volume = startVolume;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    video.volume = Math.max(0, Math.min(1, startVolume + (volumeStep * step)));
    if (step >= steps) {
      clearInterval(interval);
      video.volume = endVolume;
    }
  }, stepTime);
};
```

#### Video End Handler (useEffect)

```typescript
useEffect(() => {
  const handleVideoEnd = () => {
    const currentVideo = currentVideoRef.current;
    if (currentVideo && !videoMuted) {
      fadeAudio(currentVideo, false, 500);
    }
    setIsVideoTransitioning(true);
    setTimeout(() => {
      setCurrentVideoIndex(nextVideoIndex);
      setNextVideoIndex((nextVideoIndex + 1) % HERO_VIDEOS.length);
      setIsVideoTransitioning(false);
    }, 400);
  };
  const video = currentVideoRef.current;
  if (video) {
    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }
}, [nextVideoIndex, videoMuted]);
```

#### Video Playback (useEffect)

```typescript
// Preload next video
useEffect(() => {
  if (nextVideoRef.current) {
    nextVideoRef.current.load();
  }
}, [nextVideoIndex]);

// Play current video with audio fade
useEffect(() => {
  if (currentVideoRef.current && !isVideoTransitioning) {
    const video = currentVideoRef.current;
    video.volume = 0;
    video.play().catch(() => {});
    if (!videoMuted) {
      fadeAudio(video, true, 500);
    }
  }
}, [currentVideoIndex, isVideoTransitioning, videoMuted]);
```

#### Hero Section JSX

```tsx
<section className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">
  <div className="absolute inset-0 bg-black">
    {/* Current video */}
    <video
      ref={currentVideoRef}
      key={`current-${currentVideoIndex}`}
      autoPlay
      muted={videoMuted}
      playsInline
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        isVideoTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <source src={HERO_VIDEOS[currentVideoIndex].src} type="video/mp4" />
    </video>
    {/* Next video (preloaded, hidden until transition) */}
    <video
      ref={nextVideoRef}
      key={`next-${nextVideoIndex}`}
      muted={videoMuted}
      playsInline
      preload="auto"
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        isVideoTransitioning ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <source src={HERO_VIDEOS[nextVideoIndex].src} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
  </div>

  {/* Atmosphere overlay */}
  <div className="absolute inset-0 opacity-40 pointer-events-none"
    style={{
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(168,85,247,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6,182,212,0.4) 0%, transparent 50%)',
    }}
  />

  {/* Video indicator dots */}
  <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
    {HERO_VIDEOS.map((video, idx) => (
      <button
        key={idx}
        onClick={() => {
          if (idx !== currentVideoIndex) {
            setNextVideoIndex(idx);
            setIsVideoTransitioning(true);
            setTimeout(() => {
              setCurrentVideoIndex(idx);
              setNextVideoIndex((idx + 1) % HERO_VIDEOS.length);
              setIsVideoTransitioning(false);
            }, 700);
          }
        }}
        className={`transition-all ${currentVideoIndex === idx
          ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white rounded-full'
          : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60 rounded-full'}`}
        title={video.label}
        data-testid={`button-video-${idx}`}
      />
    ))}
  </div>

  {/* Mute/unmute toggle */}
  <button
    onClick={() => setVideoMuted(!videoMuted)}
    className="absolute top-20 right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
    data-testid="button-toggle-sound"
  >
    {videoMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
  </button>

  {/* Hero content goes here over the video */}
</section>
```

### Photorealistic Image Assets

Jason will provide these image files. They are used throughout Chronicles for era cards, feature sections, epoch carousels, and marketing pages. Place them in your assets directory (e.g., `src/assets/images/`):

#### Era & Location Images (used in epoch cards, feature sections)

| Filename | Used For |
|----------|----------|
| `fantasy_sci-fi_world_landscape.png` | Main hero poster, fantasy era |
| `medieval_fantasy_kingdom.png` | Medieval era card, admin, demo, dashboard |
| `ancient_wisdom_library_interior.png` | Library/knowledge feature |
| `historical_time_vortex_portal.png` | Time travel feature |
| `cyberpunk_neon_city.png` | Cyberpunk era |
| `fantasy_character_heroes.png` | Character creation feature, community |
| `fantasy_lands_and_realms.png` | World exploration feature |
| `stone_age_village_scene.png` | Stone Age era |
| `industrial_steampunk_city.png` | Industrial era |
| `ancient_egyptian_kingdom_sunset.png` | Ancient Egypt era |
| `wild_west_frontier_town.png` | Wild West era |
| `victorian_london_street_scene.png` | Victorian era |
| `ancient_greek_athens_parthenon.png` | Ancient Greece era |
| `viking_longship_fjord_scene.png` | Viking era |
| `renaissance_florence_italy_scene.png` | Renaissance era |
| `roman_empire_colosseum_gladiators.png` | Roman era |
| `feudal_japan_samurai_castle.png` | Feudal Japan era |
| `quantum_dimension_realm.png` | Quantum/sci-fi era, dashboard, economy |
| `deep_space_station.png` | Deep space era, creators, economy |
| `darkwave_chronicles_hero_banner.png` | Chronicles marketing banner |
| `chronicles_historical_adventure.png` | Chronicles promo |

These are all photorealistic, AI-generated images. They should be displayed at full card width with `object-cover` styling — never shrunk to icon size.

---

## UI Styling Rules

- **Theme**: Dark only. Base: `#06060a` (void-black), panels: `#0a0b10`, borders: `#1a1b2e`
- **Palette**: Cyan (`#06b6d4`) and Purple (`#a855f7`) primary. NO amber/orange/yellow.
- **Cards**: GlassCard with `glow` prop. Padding on inner `<div>`, never on GlassCard className.
- **Touch targets**: 44px minimum on all interactive elements.
- **Fonts**: `JetBrains Mono` for code/stats, `Inter` for UI text.
- **Animations**: Framer Motion `motion.div` with spring physics.
- **Test IDs**: `data-testid` on every interactive element.
- **Images**: Always photorealistic AI-generated assets. NEVER emojis or emoji icons in cards.
- **Video**: Full-viewport cinematic flyover videos with crossfade transitions.

---

*End of DarkWave Chronicles Handoff Document*
*Source: Trust Layer Portal (dwtl.io) — Chronicles v1.0 (Season Zero)*
*Last Updated: March 2026*
