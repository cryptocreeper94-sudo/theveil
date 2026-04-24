# DarkWave Studio IDE — Full Replicable Handoff

> **Target**: Embed DWSC Studio into TrustGen (trustgen.tlid.io) as a split-screen code editor + 3D workspace.
> **Source**: Trust Layer Portal (dwtl.io) — `/studio` route, ~4,400-line frontend + ~1,800 lines backend.
> **Stack**: React 18 + TypeScript + Vite (frontend), Node.js + Express + PostgreSQL + Drizzle ORM (backend).

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Database Schema (7 Tables)](#2-database-schema-7-tables)
3. [Monaco Editor Component](#3-monaco-editor-component)
4. [Frontend — studio.tsx (Complete Feature Map)](#4-frontend--studiotsx-complete-feature-map)
5. [Backend — REST API (50+ Endpoints)](#5-backend--rest-api-50-endpoints)
6. [Backend — WebSocket (Real-time Presence)](#6-backend--websocket-real-time-presence)
7. [Backend — Studio Integrations (GitHub, Vercel, Lint, Preview)](#7-backend--studio-integrations-github-vercel-lint-preview)
8. [AI Assistant & Agent Mode](#8-ai-assistant--agent-mode)
9. [TrustHub Code Provenance (Blockchain Stamps)](#9-trusthub-code-provenance-blockchain-stamps)
10. [CI/CD Pipeline Runner](#10-cicd-pipeline-runner)
11. [Project Templates (8 Languages)](#11-project-templates-8-languages)
12. [UI Layout & Panels](#12-ui-layout--panels)
13. [Keyboard Shortcuts & Command Palette](#13-keyboard-shortcuts--command-palette)
14. [TrustGen Integration — Split-Screen Layout](#14-trustgen-integration--split-screen-layout)
15. [Environment Variables](#15-environment-variables)
16. [Storage Interface Methods](#16-storage-interface-methods)
17. [Landing Page & Documentation Pages](#17-landing-page--documentation-pages)
18. [Implementation Checklist](#18-implementation-checklist)

---

## 1. Overview & Architecture

DWSC Studio is a full browser-based IDE with:

- **Monaco Editor** (VS Code's editor engine) with syntax highlighting, bracket matching, minimap, ligatures
- **File tree** with create, rename, delete, upload, download
- **Multi-tab editing** with unsaved-change tracking (dot indicators)
- **Split-view editor** (horizontal/vertical)
- **Project templates** (React, Node, Python, Vue, Next.js, Django, Go, Rust)
- **Real terminal** executing shell commands on the server
- **Git-like version control** (commits, branches, checkout)
- **Deployments** with custom domain support
- **Live preview** (iframe-based with auto-refresh on save)
- **AI Assistant** (GPT-4o, streaming SSE, $0.05/request)
- **Agent Mode** (autonomous multi-file editing, $0.25/session)
- **GitHub integration** (OAuth, clone, push)
- **Vercel integration** (deploy with token)
- **TrustHub blockchain stamps** (SHA-256 code provenance)
- **Real CI/CD pipeline runner** (multi-step, streamed output)
- **Command palette** (Ctrl+K, fuzzy search)
- **Database explorer** (browse tables, run SQL)
- **Secrets & config management** (per-environment)
- **Package manager** (npm/pip)
- **Voice-to-text input** (Web Speech API)
- **Real-time collaborative presence** (WebSocket, colored cursors)
- **Problems panel** (auto-lint on save)

### File Structure (Source)

```
client/src/
├── pages/
│   ├── studio.tsx              # Main IDE (4,439 lines)
│   ├── dev-studio.tsx          # Marketing/landing page (448 lines)
│   ├── studio-landing.tsx      # Alternative landing
│   ├── studio-docs.tsx         # Documentation page
│   └── studio-projects.tsx     # Projects list page
├── components/
│   └── monaco-editor.tsx       # Monaco wrapper (148 lines)
server/
├── routes.ts                   # Studio API routes (lines 12411–13300)
├── studio-integrations.ts      # GitHub, Vercel, lint, preview (444 lines)
├── storage.ts                  # IStorage interface + Drizzle queries
shared/
└── schema.ts                   # Studio DB tables (lines 638–810)
```

---

## 2. Database Schema (7 Tables)

All tables use `varchar` primary keys with `gen_random_uuid()` defaults.

### studio_projects

```typescript
export const studioProjects = pgTable("studio_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull().default("javascript"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### studio_files

```typescript
export const studioFiles = pgTable("studio_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  path: text("path").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull().default(""),
  language: text("language").notNull().default("plaintext"),
  isFolder: boolean("is_folder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### studio_secrets

```typescript
export const studioSecrets = pgTable("studio_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  environment: text("environment").notNull().default("shared"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### studio_configs

```typescript
export const studioConfigs = pgTable("studio_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  environment: text("environment").notNull().default("shared"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### studio_commits

```typescript
export const studioCommits = pgTable("studio_commits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  hash: text("hash").notNull(),
  parentHash: text("parent_hash"),
  message: text("message").notNull(),
  authorId: text("author_id").notNull(),
  branch: text("branch").notNull().default("main"),
  filesSnapshot: text("files_snapshot").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### studio_deployments

```typescript
export const studioDeployments = pgTable("studio_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  status: text("status").notNull().default("pending"),
  url: text("url"),
  customDomain: text("custom_domain"),
  version: text("version").notNull().default("1"),
  commitHash: text("commit_hash"),
  buildLogs: text("build_logs").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### studio_code_stamps (TrustHub Provenance)

```typescript
export const studioCodeStamps = pgTable("studio_code_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  commitHash: text("commit_hash"),
  treeHash: text("tree_hash").notNull(),
  provenanceId: text("provenance_id").notNull(),
  txHash: text("tx_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Create insert schemas with `createInsertSchema(table).omit({ id: true, createdAt: true })` for each.

---

## 3. Monaco Editor Component

File: `client/src/components/monaco-editor.tsx` (148 lines)

Loads Monaco via AMD require from CDN. Key implementation:

```typescript
interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;        // default: "vs-dark"
  className?: string;
  'data-testid'?: string;
}
```

### Monaco Configuration

```typescript
const editor = monaco.editor.create(containerRef.current, {
  value: valueRef.current,
  language: getMonacoLanguage(language),
  theme: "vs-dark",
  automaticLayout: true,
  minimap: { enabled: true },
  fontSize: 14,
  lineNumbers: "on",
  roundedSelection: true,
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  insertSpaces: true,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  padding: { top: 16, bottom: 16 },
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
});
```

### Language Map

```typescript
const languageMap: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  json: "json",
  html: "html",
  css: "css",
  markdown: "markdown",
  python: "python",
  rust: "rust",
  go: "go",
  plaintext: "plaintext",
};
```

### Loading Strategy

Monaco is loaded via a polling interval that checks for `window.require`. The HTML page must include the Monaco AMD loader script:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
<script>
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
  window.loadMonaco = () => new Promise((resolve) => {
    require(['vs/editor/editor.main'], resolve);
  });
</script>
```

### Value Sync

- External `value` prop changes update editor via `editor.setValue()` with a guard (`isUpdatingRef`) to prevent feedback loops.
- Editor `onDidChangeModelContent` fires `onChange` callback for user edits.
- Language changes update the model language dynamically via `monaco.editor.setModelLanguage()`.

---

## 4. Frontend — studio.tsx (Complete Feature Map)

### TypeScript Interfaces

```typescript
interface FileNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content: string;
  language: string;
  children?: FileNode[];
}

interface Secret { id: string; key: string; value: string; }
interface Config { id: string; key: string; value: string; environment: string; }

interface Commit {
  id: string; hash: string; message: string;
  branch: string; createdAt: string;
}

interface Run {
  id: string; command: string; status: string;
  output: string; exitCode: string | null;
}

interface Deployment {
  id: string; status: string; url: string | null;
  customDomain: string | null; version: string;
  buildLogs: string | null; createdAt: string;
}

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
}

interface PresenceUser {
  id: string; name: string; color: string;
  cursor?: { line: number; column: number };
  file?: string;
}
```

### State Variables (Complete List)

The studio component manages ~60+ state variables organized into these groups:

**Core Project State**: `projectId`, `projectName`, `files`, `secrets`, `configs`, `activeFile`, `editorContent`, `openTabs`, `unsavedFiles`, `originalContent`, `loading`, `saving`

**UI State**: `activeTab` ("files"|"search"|"database"|"secrets"|"config"), `mobileView` ("editor"|"files"|"console"|"preview"), `bottomTab` ("console"|"git"|"terminal"|"deploy"|"packages"|"cicd"|"trusthub"|"problems"), `showSettings`, `showNewFile`, `showPreview`, `showCommandPalette`, `showShortcuts`, `showHelpMenu`, `showIntegrations`, `showAiPanel`, `showLoginModal`

**Editor State**: `expandedFolders`, `renamingFile`, `renameInput`, `splitView` ("none"|"horizontal"|"vertical"), `splitFile`, `splitEditorContent`, `searchQuery`, `replaceQuery`, `searchResults`

**Terminal/Console**: `consoleOutput`, `terminalHistory`, `terminalInput`, `running`

**Git State**: `commits`, `commitMessage`

**Deploy State**: `deploying`, `deployments`, `currentDeployment`, `customDomainInput`

**Packages**: `packages`, `newPackageName`, `installingPackage`, `packageManager` ("npm"|"pip"|null)

**AI State**: `aiPrompt`, `aiResponse`, `aiLoading`, `aiCredits`, `buyingCredits`, `agentMode`, `agentTask`

**GitHub State**: `githubConnected`, `githubConfigured`, `selectedGithubRepo`, `githubRepos`, `loadingRepos`, `pushingToGithub`

**Vercel State**: `vercelConnected`, `vercelToken`, `vercelDeploying`, `vercelDeployUrl`

**TrustHub State**: `trustHubStamps`, `stampingCode`

**Diagnostics State**: `diagnostics`, `diagnosticsSummary`

**Voice State**: `isListening`, `voiceSupported`

**Database Explorer**: `dbTables`, `selectedTable`, `tableRows`, `tableColumns`, `dbQuery`, `dbQueryResult`, `dbLoading`, `dbError`

**Presence**: `presence` (PresenceUser[]), `wsRef`

### Core Functions

| Function | Description |
|----------|-------------|
| `handleFileSelect(file)` | Opens file in editor, adds to tabs, tracks unsaved state, sends cursor via WS |
| `handleCloseTab(e, fileId)` | Closes tab, switches to adjacent, clears tracking |
| `handleSave()` | PATCHes file content to API, triggers lint, refreshes preview |
| `handleCreateFile()` | POSTs new file, adds to tree, opens in editor |
| `handleDeleteFile(id)` | DELETEs file, clears from editor if active |
| `startRename(file)` / `handleRename()` | Inline rename with PATCH |
| `handleFileUpload(e)` | Multi-file upload from disk via `<input type="file">` |
| `handleDownloadFile(file)` | Creates Blob URL and triggers download |
| `handleSearch()` | Searches all files for query, populates results |
| `handleReplaceAll()` | Regex replace across all files |
| `applyTemplate(key)` | Creates all files from template, opens first file |
| `handleRun()` | Sends main JS file to API, executes in sandboxed `new Function()` on client |
| `handleCommit()` | Creates snapshot of all files, POSTs commit |
| `handleDeploy()` | Starts deployment, polls status every 1s |
| `handleTerminalCommand(cmd)` | Sends command to server, shows output |
| `handleInstallPackage()` | Adds package via API |
| `handleRemovePackage(name)` | Removes package via API |
| `handleUpdateProjectName()` | PATCHes project name |
| `handleSaveCustomDomain()` | PATCHes deployment domain |
| `askAiAssistant()` | Sends prompt + code + project files to AI endpoint, streams SSE response |
| `runAgentMode()` | Autonomous task execution via agent endpoint |
| `applyCodeBlock(code, filename?)` | Applies AI-generated code to editor or creates new file |
| `stampCode()` | Creates TrustHub blockchain stamp of current project state |
| `pushToGithub()` | Pushes files to selected GitHub repo |
| `deployToVercel()` | Deploys files to Vercel |
| `startPreview()` | Sends files to preview endpoint, gets HTML back |
| `refreshPreview()` | Client-side preview builder — injects CSS/JS into HTML, uses iframe `srcdoc` |
| `runLint(code, filename)` | Sends code to lint endpoint, updates diagnostics |
| `connectGithub()` / `disconnectGithub()` | OAuth flow for GitHub |
| `connectVercel(token)` / `disconnectVercel()` | Token-based Vercel auth |
| `buyAiCredits(amountCents)` | Redirects to Stripe checkout for credits |
| `toggleVoiceInput()` | Start/stop Web Speech API recognition |

### File Icon Helper

```typescript
const getFileIcon = (name: string, isFolder: boolean) => {
  if (isFolder) return <Folder className="w-4 h-4 text-amber-400" />;
  if (name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".tsx"))
    return <FileCode className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith(".json")) return <FileJson className="w-4 h-4 text-green-400" />;
  if (name.endsWith(".md")) return <FileText className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-gray-400" />;
};
```

### Language Detection

```typescript
const getLanguageFromFileName = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    html: "html", css: "css", json: "json", md: "markdown",
  };
  return langMap[ext] || ext;
};
```

---

## 5. Backend — REST API (50+ Endpoints)

All `/api/studio/*` routes require `isAuthenticated` middleware (session-based auth with Bearer token support). User ID is extracted from `req.user.claims.sub`.

### Project CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/studio/projects` | List user's projects |
| `POST` | `/api/studio/projects` | Create project (auto-creates starter file based on language) |
| `GET` | `/api/studio/projects/:id` | Get project + files + secrets (masked) + configs |
| `PATCH` | `/api/studio/projects/:id` | Update project (name, etc.) |
| `DELETE` | `/api/studio/projects/:id` | Delete project |

### File CRUD

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/studio/projects/:id/files` | Create file in project |
| `PATCH` | `/api/studio/files/:id` | Update file (content, name, path) |
| `DELETE` | `/api/studio/files/:id` | Delete file |

### Secrets & Configs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/studio/projects/:id/secrets` | Add secret (returned masked as "••••••") |
| `DELETE` | `/api/studio/secrets/:id` | Delete secret |
| `POST` | `/api/studio/projects/:id/configs` | Add config variable |
| `DELETE` | `/api/studio/configs/:id` | Delete config |

### Version Control

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/studio/projects/:id/commits` | List commits |
| `POST` | `/api/studio/projects/:id/commits` | Create commit (snapshots all files as JSON, SHA-256 hash) |
| `GET` | `/api/studio/commits/:id` | Get single commit |
| `POST` | `/api/studio/commits/:id/checkout` | Restore files from commit snapshot |
| `GET` | `/api/studio/projects/:id/branches` | List branches |
| `POST` | `/api/studio/projects/:id/branches` | Create branch |

### Execution

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/studio/projects/:id/run` | Run project — finds main JS file, returns code for client-side `new Function()` execution |
| `GET` | `/api/studio/runs/:id` | Get run result |
| `GET` | `/api/studio/projects/:id/runs` | List runs |
| `POST` | `/api/studio/projects/:id/terminal` | Execute shell command (with blocked patterns: rm -rf /, mkfs, etc.) |

### Preview & Deploy

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/studio/projects/:id/preview` | Get preview status |
| `POST` | `/api/studio/projects/:id/preview` | Create preview |
| `GET` | `/api/studio/projects/:id/preview/serve` | Serve project HTML (injects CSS/JS inline) |
| `POST` | `/api/studio/projects/:id/deploy` | Start deployment (simulates 3s build, generates `.darkwave.app` URL) |
| `GET` | `/api/studio/projects/:id/deployments` | List deployments |
| `GET` | `/api/studio/deployments/:id` | Get deployment status |
| `PATCH` | `/api/studio/deployments/:id/domain` | Set custom domain |

### Packages

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/studio/projects/:id/packages` | Install package |
| `DELETE` | `/api/studio/projects/:id/packages/:name` | Remove package |

### Database Explorer

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/studio/database/tables` | List all database tables with row counts |
| `GET` | `/api/studio/database/table/:name` | Get table columns and rows (LIMIT 100) |
| `POST` | `/api/studio/database/query` | Execute SQL query (read-only SELECT only) |

---

## 6. Backend — WebSocket (Real-time Presence)

Path: `/ws/studio`

### Protocol

```typescript
// Client → Server: Join project
{ type: "join", projectId: string, userId: string, userName: string }

// Client → Server: Cursor update
{ type: "cursor", projectId: string, file: string, cursor: { line: number, column: number } }

// Server → Client: Presence broadcast
{ type: "presence", users: PresenceUser[] }
```

### Server Implementation

```typescript
const PRESENCE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const wsClients = new Map<WebSocket, { projectId: string; userId: string }>();
const projectPresence = new Map<string, Map<string, PresenceUser>>();

const wss = new WebSocketServer({ server: httpServer, path: "/ws/studio" });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === "join") {
      wsClients.set(ws, { projectId: message.projectId, userId: message.userId });
      if (!projectPresence.has(message.projectId)) {
        projectPresence.set(message.projectId, new Map());
      }
      const users = projectPresence.get(message.projectId)!;
      users.set(message.userId, {
        id: message.userId,
        name: message.userName || "Anonymous",
        color: PRESENCE_COLORS[users.size % PRESENCE_COLORS.length],
      });
      broadcastPresence(message.projectId);
    }

    if (message.type === "cursor") {
      const client = wsClients.get(ws);
      if (client) {
        const user = projectPresence.get(message.projectId)?.get(client.userId);
        if (user) {
          user.cursor = message.cursor;
          user.file = message.file;
          broadcastPresence(message.projectId);
        }
      }
    }
  });

  ws.on("close", () => {
    const client = wsClients.get(ws);
    if (client) {
      projectPresence.get(client.projectId)?.delete(client.userId);
      wsClients.delete(ws);
      broadcastPresence(client.projectId);
    }
  });
});

function broadcastPresence(projectId: string) {
  const users = projectPresence.get(projectId);
  if (!users) return;
  const message = JSON.stringify({ type: "presence", users: Array.from(users.values()) });
  wsClients.forEach((client, ws) => {
    if (client.projectId === projectId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}
```

---

## 7. Backend — Studio Integrations (GitHub, Vercel, Lint, Preview)

File: `server/studio-integrations.ts` (444 lines)

### GitHub OAuth Flow

1. `GET /api/studio/github/auth` → Returns GitHub OAuth URL with `repo,user:email` scopes
2. GitHub redirects to `GET /api/studio/github/callback` → Exchanges code for token, stores in `Map<userId, token>`
3. `GET /api/studio/github/status` → Returns `{ connected, configured }`
4. `POST /api/studio/github/disconnect` → Removes token
5. `GET /api/studio/github/repos` → Lists user repos (30 most recent)
6. `POST /api/studio/github/clone` → Clones repo file tree via GitHub API (max 50 files, <100KB each)
7. `POST /api/studio/github/push` → Creates blobs → tree → commit → updates ref

### Vercel Integration

1. `POST /api/studio/vercel/connect` → Stores user-provided Vercel token
2. `GET /api/studio/vercel/status` → Returns `{ connected }`
3. `POST /api/studio/vercel/disconnect` → Removes token
4. `POST /api/studio/vercel/deploy` → Creates deployment via Vercel API v13 (files as base64)
5. `GET /api/studio/vercel/deployment/:id` → Checks deployment status

### Lint Endpoint

`POST /api/studio/lint` — Static analysis without external tools:

- `var` usage (suggests `let`/`const`)
- `console.log` statements
- `==` instead of `===`
- `TODO` / `FIXME` / `HACK` comments
- Lines over 120 chars
- Unused variable detection (simple heuristic)
- Bracket matching (`{`, `(`, `[`)
- Python: wildcard imports, mixed indentation
- `eval()` security warnings

Returns `{ diagnostics: [...], summary: { errors, warnings, info } }`.

### Live Preview Server

`POST /api/studio/preview/start`:
- Writes project files to `/tmp/studio-preview-{userId}-{projectId}/`
- If `index.html` exists: spawns `npx serve` on random port 9000–10000
- Otherwise: generates static HTML with injected CSS/JS
- Returns `{ status, html?, url? }`

`POST /api/studio/preview/stop`:
- Kills the serve process

### Integration Status

`GET /api/studio/integrations/status`:
```json
{
  "github": { "connected": false, "configured": true },
  "vercel": { "connected": false },
  "trusthub": { "available": true }
}
```

---

## 8. AI Assistant & Agent Mode

### AI Assistant (`POST /api/studio/ai/assist`)

- Rate limited: 20 requests/minute
- Cost: $0.05/request (5 cents), deducted AFTER successful completion
- Returns 402 if insufficient credits
- Streams SSE: `data: { content: "..." }` chunks, final `data: { done: true }`

**System Prompt Context**:
- Current language + active file name
- Up to 60,000 chars of project file context
- Instructions to use fenced code blocks with language + filename
- Instructions for `// NEW FILE: path/to/file.ts` format for new files

**Model**: GPT-4o, max_tokens: 4096

### Agent Mode (`POST /api/studio/ai/agent`)

- Cost: $0.25/session (25 cents)
- Up to 80,000 chars project context
- max_tokens: 8192
- Structured output format:
```json
{ "action": "edit"|"create"|"explain"|"complete", "file": "path", "content": "...", "explanation": "..." }
```

### Credits System

```typescript
const STUDIO_AI_COST_CENTS = 5;
const STUDIO_AGENT_COST_CENTS = 25;

// Check: GET /api/assistant/credits → { balanceCents, balanceUSD }
// Buy: POST /api/assistant/buy-credits → { checkoutUrl } (Stripe redirect)
// Deduct: deductCredits(userId, amountCents, category)
```

### Client-Side AI Code Application

The `applyCodeBlock(code, filename?)` function handles AI responses:
- If filename starts with `"NEW FILE:"`, creates the file via API
- Otherwise, replaces active file content in editor

---

## 9. TrustHub Code Provenance (Blockchain Stamps)

### Stamp Creation (`POST /api/studio/trusthub/stamp`)

```typescript
// 1. Get all project files
const projectFiles = await storage.getStudioFiles(projectId);

// 2. Build Merkle-style tree hash
const fileTree = projectFiles
  .map(f => `${f.name}:${sha256(f.content)}`)
  .sort()
  .join("\n");
const treeHash = sha256(fileTree);

// 3. Generate deterministic tx hash
const txHash = "0x" + sha256(`${treeHash}-${Date.now()}-${userId}`);

// 4. Store stamp
await db.insert(studioCodeStamps).values({
  projectId,
  userId,
  commitHash: commitHash || null,
  treeHash,
  provenanceId: `prov-${randomBytes(8).toString("hex")}`,
  txHash,
  blockNumber: Math.floor(Date.now() / 400),
  message: message || "Code stamp",
});
```

### List Stamps (`GET /api/studio/trusthub/stamps/:projectId`)

Returns last 50 stamps for the project, ordered by `createdAt DESC`.

---

## 10. CI/CD Pipeline Runner

`POST /api/studio/projects/:id/pipeline/run`

Accepts an array of pipeline steps, executes them sequentially with real shell commands. Streams SSE events:

```typescript
// Request
{ steps: [{ name: "Build", command: "npm run build" }, { name: "Test", command: "npm test" }] }

// SSE Events
data: { type: "step_start", step: 0, name: "Build", total: 2 }
data: { type: "step_complete", step: 0, name: "Build", status: "success", output: "...", duration: 1234 }
data: { type: "pipeline_complete", status: "success", totalDuration: 5678, results: [...] }
```

Each step has a 60-second timeout and 1MB output buffer.

---

## 11. Project Templates (8 Languages)

```typescript
const PROJECT_TEMPLATES = {
  react:  { name: "React App",    icon: "⚛️", files: [...] },
  node:   { name: "Node.js API",  icon: "🟢", files: [...] },
  python: { name: "Python Flask", icon: "🐍", files: [...] },
  vue:    { name: "Vue.js App",   icon: "💚", files: [...] },
  nextjs: { name: "Next.js App",  icon: "▲",  files: [...] },
  django: { name: "Django API",   icon: "🎸", files: [...] },
  go:     { name: "Go API",       icon: "🐹", files: [...] },
  rust:   { name: "Rust API",     icon: "🦀", files: [...] },
};
```

Each template includes:
- Main source file (with Trust Layer branding)
- Package/dependency file (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`)
- Config files where applicable

Templates show in the sidebar when a project has zero files.

---

## 12. UI Layout & Panels

### Desktop Layout (3-column)

```
┌──────────────────────────────────────────────────────────┐
│ Header Bar: Logo / Project Name / Settings / Help /      │
│   Presence / Voice / CmdPalette / Split / Integrations / │
│   AI / Save / Preview / Run / Deploy                     │
├────────┬─────────────────────────────┬───────────────────┤
│ Sidebar│     Editor Area              │  Preview (opt.)  │
│ 264px  │  ┌─────────────────────┐    │  iframe srcdoc   │
│        │  │ Tab Bar              │    │                  │
│ Files  │  ├─────────────────────┤    │                  │
│ Search │  │                     │    │                  │
│ DB     │  │  Monaco Editor      │    │                  │
│ Secrets│  │  (or split view)    │    │                  │
│ Config │  │                     │    │                  │
│        │  └─────────────────────┘    │                  │
│        ├─────────────────────────────┤                  │
│        │ Bottom Panel (resizable)     │                  │
│        │ Console│Git│Terminal│Deploy│  │                  │
│        │ Packages│CI/CD│TrustHub│    │                  │
│        │ Problems                     │                  │
├────────┴─────────────────────────────┴───────────────────┤
│ Status Bar: Presence indicators, diagnostics summary     │
└──────────────────────────────────────────────────────────┘
```

### Mobile Layout (Tabbed)

Four-tab layout at top: **Files** | **Editor** | **Preview** | **Console**

Only one panel visible at a time. All buttons minimum 44px touch targets.

### Bottom Panel Tabs

| Tab | Content |
|-----|---------|
| Console | Output log with filter, auto-scroll |
| Git | Commit message input, commit history, checkout buttons |
| Terminal | Shell input, command history, blocked-command protection |
| Deploy | Deployment status, URL, custom domain, build logs |
| Packages | Install/remove packages, version display |
| CI/CD | Pipeline definitions, run triggers, step results |
| TrustHub | Code stamps list, stamp button, provenance IDs |
| Problems | Lint diagnostics: errors/warnings/info with line numbers |

### Sidebar Tabs

| Tab | Content |
|-----|---------|
| Files | File tree with icons, new/upload/rename/delete/download |
| Search | Find & replace across all files, results with file:line |
| Database | Table browser, row viewer, SQL query executor |
| Secrets | Add/delete env secrets (values masked) |
| Config | Add/delete config variables (per environment) |

---

## 13. Keyboard Shortcuts & Command Palette

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+S` | Save current file |
| `Ctrl+F` | Open search panel |
| `Ctrl+I` | Toggle AI Assistant |
| `Ctrl+Shift+K` | Enable Agent Mode |
| `Ctrl+B` | Open console |
| `Ctrl+/` | Toggle shortcuts panel |
| `Escape` | Close panels/modals |

### Command Palette (Ctrl+K)

Fuzzy-search overlay with ~20 built-in commands plus all open files:

- Save File, Run Project, Deploy Project
- Open AI Assistant, Toggle Agent Mode
- Show Terminal/Console/Git/CI/CD/Problems
- TrustHub — Stamp Code
- Split Editor Right/Down, Close Split View
- Push to GitHub, Deploy to Vercel
- Start Live Preview, Run Lint Check
- Integrations Hub, Project Settings, Keyboard Shortcuts
- Plus all project files as quick-open targets

---

## 14. TrustGen Integration — Split-Screen Layout

### Recommended Architecture

For TrustGen's split-screen editor + 3D workspace:

```
┌──────────────────────────────────────────────────┐
│ TrustGen Header / Toolbar                         │
├────────────────────────┬─────────────────────────┤
│   Code Editor (50%)    │   3D Viewport (50%)     │
│                        │                          │
│   ┌─ File Tree ─┐     │   React Three Fiber     │
│   │  scene.tsx   │     │   Canvas                │
│   │  materials/  │     │                          │
│   │  models/     │     │   Live preview of code  │
│   └──────────────┘     │   changes               │
│                        │                          │
│   ┌─ Monaco Editor ─┐ │   OrbitControls          │
│   │                  │ │   Lighting               │
│   │  (edits sync to │ │   Scene graph from code  │
│   │   3D preview)    │ │                          │
│   └──────────────────┘ │                          │
│                        │                          │
│   ┌─ Bottom Panel ───┐ │                          │
│   │ Console/Problems │ │                          │
│   └──────────────────┘ │                          │
├────────────────────────┴─────────────────────────┤
│ Status Bar                                        │
└──────────────────────────────────────────────────┘
```

### Integration Points

1. **Split container**: Use CSS `grid` or `flex` with a draggable resize handle between editor and 3D view.

2. **Code → 3D sync**: When user edits a `.tsx`/`.jsx` file containing Three.js/R3F code, parse it and hot-reload the 3D scene. The simplest approach:
   - Detect file saves in the editor
   - If the file exports a React component with `<Canvas>`, re-render the right panel
   - Use `eval()` or a sandboxed iframe for safe code execution

3. **File types**: Add 3D-specific file icons (`.glb`, `.gltf`, `.fbx`, `.obj`, `.hdr`) and language mappings.

4. **3D templates**: Add TrustGen-specific project templates:
   ```typescript
   trustgen_scene: {
     name: "TrustGen 3D Scene",
     icon: "🎨",
     files: [
       { name: "scene.tsx", content: "..." },   // R3F scene
       { name: "materials.ts", content: "..." }, // Custom shaders
       { name: "config.json", content: "..." },  // Scene config
     ]
   }
   ```

5. **Backend**: TrustGen runs on Render (trustgen-1.onrender.com). The Studio backend endpoints can either:
   - Be replicated on the Render backend
   - Or call back to dwtl.io APIs with cross-origin auth

6. **Auth**: Use ecosystem SSO. TrustGen stores JWT as `signal_chat_token` (7-day expiry, issuer `trust-layer-sso`). Studio API calls should use the same token.

---

## 15. Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
AI_INTEGRATIONS_OPENAI_API_KEY=...    # For AI assistant
AI_INTEGRATIONS_OPENAI_BASE_URL=...   # OpenAI API base

# Optional (for integrations)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Auto-configured
BASE_URL=https://dwtl.io              # Or https://trustgen.tlid.io for TrustGen
```

---

## 16. Storage Interface Methods

The `IStorage` interface requires these studio methods:

```typescript
// Projects
getStudioProjectsByUser(userId: string): Promise<StudioProject[]>
createStudioProject(data: InsertStudioProject): Promise<StudioProject>
getStudioProject(id: string): Promise<StudioProject | null>
updateStudioProject(id: string, data: Partial<StudioProject>): Promise<StudioProject>
deleteStudioProject(id: string): Promise<void>

// Files
getStudioFiles(projectId: string): Promise<StudioFile[]>
createStudioFile(data: InsertStudioFile): Promise<StudioFile>
updateStudioFile(id: string, data: Partial<StudioFile>): Promise<StudioFile>
deleteStudioFile(id: string): Promise<void>

// Secrets
getStudioSecrets(projectId: string): Promise<StudioSecret[]>
createStudioSecret(data: InsertStudioSecret): Promise<StudioSecret>
deleteStudioSecret(id: string): Promise<void>

// Configs
getStudioConfigs(projectId: string): Promise<StudioConfig[]>
createStudioConfig(data: InsertStudioConfig): Promise<StudioConfig>
deleteStudioConfig(id: string): Promise<void>

// Commits
getStudioCommits(projectId: string): Promise<StudioCommit[]>
createStudioCommit(data: InsertStudioCommit): Promise<StudioCommit>
getStudioCommit(id: string): Promise<StudioCommit | null>

// Branches
getStudioBranches(projectId: string): Promise<StudioBranch[]>
createStudioBranch(data: InsertStudioBranch): Promise<StudioBranch>

// Runs
getStudioRuns(projectId: string): Promise<StudioRun[]>
createStudioRun(data: InsertStudioRun): Promise<StudioRun>
getStudioRun(id: string): Promise<StudioRun | null>

// Previews
getStudioPreview(projectId: string): Promise<StudioPreview | null>
createStudioPreview(data: InsertStudioPreview): Promise<StudioPreview>

// Deployments
getStudioDeployments(projectId: string): Promise<StudioDeployment[]>
createStudioDeployment(data: InsertStudioDeployment): Promise<StudioDeployment>
getStudioDeployment(id: string): Promise<StudioDeployment | null>
updateStudioDeployment(id: string, data: Partial<StudioDeployment>): Promise<StudioDeployment>
```

All implementations use Drizzle ORM queries against PostgreSQL.

---

## 17. Landing Page & Documentation Pages

### dev-studio.tsx (Landing/Marketing Page)

Bento grid layout showcasing IDE features:
- Network status carousel (Block Time, TPS, Validators, Uptime)
- Feature cards: AI Agent Mode, GitHub + Vercel, Command Palette, TrustHub Provenance, Split View, Real CI/CD, Live Preview, Problems Panel
- Carousel slides with descriptions
- GlassCard components with "Coming Soon" lock overlays
- Mobile-responsive with auto-rotating carousels

### studio-docs.tsx (Documentation Page)

Full documentation for the IDE including:
- Getting started guide
- Feature walkthroughs
- API reference
- Keyboard shortcuts reference

---

## 18. Implementation Checklist

For the agent building this into TrustGen:

### Phase 1: Database & Backend
- [ ] Create all 7 studio tables in TrustGen's PostgreSQL schema
- [ ] Create insert schemas and types
- [ ] Implement all storage interface methods with Drizzle queries
- [ ] Register all REST API routes (~50 endpoints)
- [ ] Set up WebSocket server for `/ws/studio`
- [ ] Implement studio-integrations (GitHub OAuth, Vercel, lint, preview)
- [ ] Wire up OpenAI for AI assist + agent mode
- [ ] Add TrustHub stamp endpoint

### Phase 2: Frontend — Monaco Editor
- [ ] Add Monaco AMD loader to `index.html`
- [ ] Create `MonacoEditor` component (copy from `monaco-editor.tsx`)
- [ ] Test basic editing, language switching, value sync

### Phase 3: Frontend — Split-Screen Layout
- [ ] Create split container (editor left, 3D right)
- [ ] Add draggable resize handle
- [ ] Wire file tree, tabs, bottom panel into left side
- [ ] Keep existing 3D viewport on right side
- [ ] Add toggle to show/hide editor panel

### Phase 4: Frontend — Studio Features
- [ ] File tree with create/rename/delete/upload/download
- [ ] Multi-tab editing with unsaved indicators
- [ ] Console + terminal + git + deploy bottom panels
- [ ] Search & replace across files
- [ ] Command palette (Ctrl+K)
- [ ] Keyboard shortcuts
- [ ] Settings modal
- [ ] Project templates (add 3D-specific ones)

### Phase 5: Frontend — Integrations
- [ ] AI Assistant slide-out panel with streaming
- [ ] Agent Mode toggle
- [ ] Credits display + buy flow
- [ ] GitHub connect/push UI
- [ ] Vercel deploy UI
- [ ] TrustHub stamps panel
- [ ] Live preview (iframe)
- [ ] Problems panel (lint results)
- [ ] Database explorer

### Phase 6: 3D Integration
- [ ] Hot-reload 3D scene from editor code changes
- [ ] Add 3D file type icons (.glb, .gltf, .obj)
- [ ] Scene graph inspector in sidebar
- [ ] Material/shader editor with live preview

### Phase 7: Polish
- [ ] Mobile-responsive layout
- [ ] Voice input support
- [ ] Real-time presence (WebSocket cursors)
- [ ] Split view (horizontal/vertical)
- [ ] Unsaved changes tracking
- [ ] Auto-lint on save

---

## Protocol Definitions (Instructional Material)

Built-in glossary shown in the IDE:

```typescript
const PROTOCOL_DEFINITIONS: Record<string, string> = {
  SIG:    "Signal — The native asset of Trust Layer, used for transactions and gas fees.",
  PoA:    "Proof-of-Authority — A consensus mechanism where trusted validators verify transactions.",
  Gas:    "The computational cost required to execute operations on the blockchain.",
  Block:  "A container of transactions that are cryptographically linked to form the chain.",
  Hash:   "A unique cryptographic fingerprint that identifies data on the blockchain.",
  Commit: "A snapshot of your code at a specific point in time, with a message describing changes.",
  Branch: "A parallel version of your code for developing features independently.",
  Deploy: "Publishing your project to make it accessible via a public URL.",
  Secret: "An encrypted environment variable for sensitive data like API keys.",
  Config: "A configuration variable that customizes your project's behavior.",
};
```

---

## UI Styling Rules

- **Theme**: Dark only. Background: `#050508`, panels: `#0a0b10`, borders: `#1a1b2e`
- **Palette**: Cyan (`#06b6d4`, `cyan-400/500`) and Purple (`#8b5cf6`, `purple-400/500`) only. NO amber/orange/yellow.
- **Cards**: Use GlassCard with `glow` prop. Put padding on inner `<div>`, never on GlassCard `className`.
- **Touch targets**: 44px minimum on all interactive elements.
- **Fonts**: `JetBrains Mono` / `Fira Code` for editor, `Inter` for UI.
- **Animations**: Framer Motion `motion.div` for page transitions. Spring stiffness 400, damping 25.
- **Test IDs**: `data-testid` on every interactive element using `{action}-{target}` pattern.

---

*End of DarkWave Studio IDE Handoff Document*
*Source: Trust Layer Portal (dwtl.io) — DWSC Studio v1.0*
*Last Updated: March 2026*
