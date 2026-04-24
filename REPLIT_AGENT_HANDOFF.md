# DarkWave — Replit Agent Handoff (high level)

**Repo / branch:** feature/ide-backend-scaffold (or whichever branch you created)  
**Scaffold location (local):** studio-prototype or darkwave-studio-build  
**Main goals:** finish ChronoChat + IDE backend + wallet/DEX/NFT UI scaffolds, secure containers & storage, wire real APIs and auth, run migrations & tests.

---

## High-priority items (must do first)

### 1. Authentication & authorization
- Implement and attach `isAuthenticated` middleware for all `/api/chat/*` endpoints and WS endpoints.
- Enforce permission checks (owner/admin/member) before community/channel/role/invite modifications.
- Validate JWT, check scopes/claims, protect Docker executor endpoints (`spawnInstall`).

### 2. Database & migrations
- Run DB migrations for `shared/chat-schema.ts` (Drizzle or SQL).
- Ensure `server/db.ts` uses real `DATABASE_URL` and DB pool.
- Verify `storage.DatabaseStorage` uses transactions where needed (invite use, member add).

### 3. WebSockets: messages, presence, typing, reactions
- Wire `server/chat-presence.ts` and `server/chat-handlers.ts` into server startup.
- Implement broadcasting of chat events using `shared/chat-events.ts` enum.
- Stream message/reaction logs to clients (WS) rather than returning massive logs in REST.
- Authenticate WS connections (token/JWT) and tie to user identity.

### 4. Container executor safety
- Use the fixed `server/studio-executor.ts` (not the initial truncated file).
- Do NOT expose Docker socket to untrusted clients. Implement a mediator/daemon pattern.
- Enforce resource limits, seccomp/gVisor, network restrictions; mount only workspace path; enable network only when vetted.
- Add per-user quotas and container lifecycle (idle shutdown, max runtime).

### 5. Frontend wiring & dependencies
- Install required client dependencies: `npm install framer-motion @tanstack/react-query ethers @solana/web3.js recharts react-virtualized` (or equivalent)
- Wire React routes (chronochat pages, Chronicle components) into app router (Wouter).
- Replace TODO stubs with real API calls (TanStack Query hooks) and WS connection logic.

---

## Medium-priority (next)

### 6. Chat REST API & storage robustness
- Harden `server/chat-routes.ts` via Zod validation and permission checks.
- Add DB-level foreign key cascades and indexes for performance.
- Implement pagination, rate-limits for message retrieval and posting.

### 7. File uploads & storage
- Store uploads in S3-compatible object storage (or Replit object store), not on local disk.
- Implement upload signed URLs and background virus/malware scanning if possible.

### 8. Wallet & signing backend (if required)
- Do NOT store private keys in DB plaintext. Use KMS or HSM.
- Provide a secure signing service for server-side operations (if server signs txs).
- Integrate Infura/Alchemy/Helius for RPCs and a caching layer.

### 9. Bot framework & sandboxing
- Implement bot sandboxing (no arbitrary code execution).
- Provide permission model for bots (what events they can respond to).

---

## Low-priority / polish

### 10. UI polish
- Finish PriceChart (candlestick) integration, DEX quote endpoints.
- Add tests and snapshots for components with `data-testid` attributes.
- Add accessibility checks (a11y).

---

## Security checklist (required)

- [ ] JWT sign/verify keys rotated, store secrets in vault/secret manager.
- [ ] No direct Docker socket exposure; use an authenticated intermediary.
- [ ] Rate limit public endpoints, especially install/exec and message posting.
- [ ] Sanitize and validate all user inputs, file names, and upload content.
- [ ] Pen-test the container execution path for breakout vectors.
- [ ] Encrypt sensitive fields at rest (wallet metadata), use KMS for private keys.
- [ ] CSRF mitigation and CORS restrictions per origin.

---

## Dev/test run quickstart (copy/paste)

```bash
# From repo root (after copying studio-prototype into repo):
cd studio-prototype
npm install

# create .env from .env.example and configure DATABASE_URL, DOCKER_HOST, STUDIO_STORAGE_PATH, JWT_SECRET

# Run TypeScript compile check:
npx tsc --noEmit

# Start dev server (requires DB + Docker as configured):
npm run dev

# Test basic endpoints:
curl http://localhost:4000/api/health
curl -X GET http://localhost:4000/api/chat/communities -H "Authorization: Bearer <dev-token>"
```

---

## Acceptance criteria for merging branch

- [ ] All API endpoints compile and pass basic integration tests (auth enforced).
- [ ] DB migrations applied; storage layer functional (create/get/list).
- [ ] WebSocket server authenticates and broadcasts message events.
- [ ] `spawnInstall` endpoint secured, container executor uses safe defaults and logs streaming implemented.
- [ ] Frontend builds (`npm run build`) without TypeScript errors; chronochat page loads and connects to WS in dev.
- [ ] Security review checklist items addressed or tracked as issues.

---

## PR checklist (what to include in PR description)

- Summary of changes and files added (list directories: `studio-prototype/server`, `client/src/components/chronicles`, chat components, shared schemas).
- How to test locally (commands above).
- Known TODOs & risks (executor hardening, bot sandboxing, KMS).
- Reviewer request: backend auth + container security review, frontend integration test for ChronoChat, DB migration verification.

---

## Known quirks & gotchas (from our session)

- `studio-executor.ts` was originally truncated in the one-shot script — ensure the corrected file is present.
- You may not have permission to push to upstream orig — if so push to your fork and open PR from fork.
- Several frontend components use placeholder logic (e.g., `ReactionPicker` uses local callbacks) — these need TanStack Query hooks and WS integration.

---

## Helpful links & tools to use

- **Drizzle ORM docs (migrations):** https://orm.drizzle.team/
- **Docker sandboxing:** gVisor, KataContainers, Firecracker as options
- **WebSocket patterns:** use heartbeat, ping/pong, and auth via token on upgrade
- **Recommended libs:** ajv/zod (validation), rate-limiter-flexible (rate-limits), multer/s3 for uploads
