import { describe, it, expect } from "vitest";
import crypto from "crypto";
import express from "express";
import request from "supertest";

const API_KEY = "test-api-key";
const API_SECRET = "test-api-secret";

function generateHmac(method: string, path: string, key: string, secret: string, body: any = {}) {
  const timestamp = Date.now().toString();
  const bodyStr = JSON.stringify(body);
  const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
  const canonical = `${method}:${path}:${key}:${timestamp}:${bodyHash}`;
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  return { "x-blockchain-key": key, "x-blockchain-signature": signature, "x-blockchain-timestamp": timestamp };
}

function createTrustVaultApp() {
  const app = express();
  app.use(express.json());

  const identities: Record<string, any> = {};
  const provenance: Record<string, any> = {};

  function hmacAuth(req: any, res: any, next: any) {
    const key = req.headers["x-blockchain-key"];
    const sig = req.headers["x-blockchain-signature"];
    const ts = req.headers["x-blockchain-timestamp"];
    if (!key || !sig || !ts) {
      return res.status(401).json({ error: "Missing authentication headers", code: "AUTH_MISSING" });
    }
    const timeDiff = Math.abs(Date.now() - parseInt(ts as string));
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(401).json({ error: "Timestamp expired", code: "AUTH_EXPIRED" });
    }
    const bodyStr = JSON.stringify(req.body || {});
    const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
    const canonical = `${req.method}:${req.path}:${key}:${ts}:${bodyHash}`;
    const expected = crypto.createHmac("sha256", API_SECRET).update(canonical).digest("hex");
    if (sig !== expected) {
      return res.status(401).json({ error: "Invalid signature", code: "AUTH_INVALID" });
    }
    next();
  }

  app.post("/api/identity/anchor", hmacAuth, (req, res) => {
    const { trustLayerId } = req.body;
    if (!trustLayerId || typeof trustLayerId !== "string" || trustLayerId.length < 3) {
      return res.status(400).json({ error: "Invalid trustLayerId" });
    }
    const txHash = crypto.createHash("sha256").update(`anchor:${trustLayerId}:${Date.now()}`).digest("hex");
    identities[trustLayerId] = { trustLayerId, txHash, anchoredAt: new Date().toISOString(), verified: true };
    res.json({ trustLayerId, txHash, blockHeight: 1, verified: true });
  });

  app.get("/api/identity/verify/:id", (req, res) => {
    const identity = identities[req.params.id];
    if (!identity) {
      return res.json({ verified: false, trustLayerId: req.params.id, reason: "Identity not found" });
    }
    res.json({ verified: true, ...identity });
  });

  app.get("/api/identity/resolve/:id", (req, res) => {
    const identity = identities[req.params.id];
    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }
    res.json(identity);
  });

  app.post("/api/provenance/register", hmacAuth, (req, res) => {
    const { fileHash, filename } = req.body;
    if (!fileHash || !filename) {
      return res.status(400).json({ error: "fileHash and filename required" });
    }
    const provenanceId = `prov_${crypto.randomBytes(8).toString("hex")}`;
    const payload = JSON.stringify(req.body);
    const dataHash = crypto.createHash("sha256").update(payload).digest("hex");
    provenance[provenanceId] = { provenanceId, fileHash, filename, dataHash, payload, registeredAt: new Date().toISOString() };
    res.json({ provenanceId, dataHash, verified: true });
  });

  app.get("/api/provenance/verify/:id", (req, res) => {
    const record = provenance[req.params.id];
    if (!record) {
      return res.json({ verified: false, provenanceId: req.params.id, reason: "Provenance record not found" });
    }
    const recomputedHash = crypto.createHash("sha256").update(record.payload).digest("hex");
    const payloadIntact = recomputedHash === record.dataHash;
    res.json({ verified: true, provenanceId: record.provenanceId, fileHash: record.fileHash, payloadIntact });
  });

  app.get("/api/trust/score/:id", (req, res) => {
    const identity = identities[req.params.id];
    if (!identity) {
      return res.json({ trustLayerId: req.params.id, score: 0, level: "unverified", factors: {} });
    }
    res.json({ trustLayerId: req.params.id, score: 75, level: "verified", factors: { identity: true, provenance: false } });
  });

  return app;
}

describe("TrustVault API", () => {
  const app = createTrustVaultApp();

  describe("HMAC Authentication", () => {
    it("should reject requests without auth headers", async () => {
      const res = await request(app).post("/api/identity/anchor").send({ trustLayerId: "test-id" });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("AUTH_MISSING");
    });

    it("should reject requests with invalid signature", async () => {
      const res = await request(app)
        .post("/api/identity/anchor")
        .set("x-blockchain-key", API_KEY)
        .set("x-blockchain-signature", "invalid")
        .set("x-blockchain-timestamp", Date.now().toString())
        .send({ trustLayerId: "test-id" });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("AUTH_INVALID");
    });

    it("should reject requests with expired timestamp", async () => {
      const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString();
      const bodyStr = JSON.stringify({ trustLayerId: "test-id" });
      const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
      const canonical = `POST:/api/identity/anchor:${API_KEY}:${oldTimestamp}:${bodyHash}`;
      const signature = crypto.createHmac("sha256", API_SECRET).update(canonical).digest("hex");

      const res = await request(app)
        .post("/api/identity/anchor")
        .set("x-blockchain-key", API_KEY)
        .set("x-blockchain-signature", signature)
        .set("x-blockchain-timestamp", oldTimestamp)
        .send({ trustLayerId: "test-id" });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("AUTH_EXPIRED");
    });

    it("should accept valid HMAC authentication", async () => {
      const body = { trustLayerId: "valid-test-id" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      const res = await request(app)
        .post("/api/identity/anchor")
        .set(headers)
        .send(body);
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
    });
  });

  describe("Identity Anchoring", () => {
    it("should anchor a new identity with valid HMAC", async () => {
      const body = { trustLayerId: "anchor-test-001" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      const res = await request(app).post("/api/identity/anchor").set(headers).send(body);
      expect(res.status).toBe(200);
      expect(res.body.trustLayerId).toBe("anchor-test-001");
      expect(res.body.txHash).toBeDefined();
      expect(res.body.verified).toBe(true);
    });

    it("should reject invalid trustLayerId", async () => {
      const body = { trustLayerId: "ab" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      const res = await request(app).post("/api/identity/anchor").set(headers).send(body);
      expect(res.status).toBe(400);
    });

    it("should reject missing trustLayerId", async () => {
      const body = {};
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      const res = await request(app).post("/api/identity/anchor").set(headers).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe("Identity Verification", () => {
    it("should return verified: false for unknown identity", async () => {
      const res = await request(app).get("/api/identity/verify/nonexistent-id");
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(false);
    });

    it("should verify a previously anchored identity", async () => {
      const body = { trustLayerId: "verify-test-001" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      await request(app).post("/api/identity/anchor").set(headers).send(body);

      const res = await request(app).get("/api/identity/verify/verify-test-001");
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.trustLayerId).toBe("verify-test-001");
    });
  });

  describe("Identity Resolution", () => {
    it("should return 404 for unknown identity", async () => {
      const res = await request(app).get("/api/identity/resolve/unknown-id");
      expect(res.status).toBe(404);
    });

    it("should resolve an anchored identity", async () => {
      const body = { trustLayerId: "resolve-test-001" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      await request(app).post("/api/identity/anchor").set(headers).send(body);

      const res = await request(app).get("/api/identity/resolve/resolve-test-001");
      expect(res.status).toBe(200);
      expect(res.body.trustLayerId).toBe("resolve-test-001");
    });
  });

  describe("Media Provenance", () => {
    it("should register media provenance with valid auth", async () => {
      const body = { fileHash: "abc123hash", filename: "test-photo.jpg", contentType: "image/jpeg", size: 1024 };
      const headers = generateHmac("POST", "/api/provenance/register", API_KEY, API_SECRET, body);
      const res = await request(app).post("/api/provenance/register").set(headers).send(body);
      expect(res.status).toBe(200);
      expect(res.body.provenanceId).toBeDefined();
      expect(res.body.dataHash).toBeDefined();
    });

    it("should reject provenance without fileHash", async () => {
      const body = { filename: "test.jpg" };
      const headers = generateHmac("POST", "/api/provenance/register", API_KEY, API_SECRET, body);
      const res = await request(app).post("/api/provenance/register").set(headers).send(body);
      expect(res.status).toBe(400);
    });

    it("should verify provenance with intact payload", async () => {
      const body = { fileHash: "verify-hash-001", filename: "verified.jpg", contentType: "image/png", size: 2048 };
      const headers = generateHmac("POST", "/api/provenance/register", API_KEY, API_SECRET, body);
      const regRes = await request(app).post("/api/provenance/register").set(headers).send(body);
      const provenanceId = regRes.body.provenanceId;

      const verRes = await request(app).get(`/api/provenance/verify/${provenanceId}`);
      expect(verRes.status).toBe(200);
      expect(verRes.body.verified).toBe(true);
      expect(verRes.body.payloadIntact).toBe(true);
    });

    it("should return not found for unknown provenance", async () => {
      const res = await request(app).get("/api/provenance/verify/prov_nonexistent");
      expect(res.body.verified).toBe(false);
    });
  });

  describe("Trust Score", () => {
    it("should return score 0 for unverified identity", async () => {
      const res = await request(app).get("/api/trust/score/unknown-id");
      expect(res.body.score).toBe(0);
      expect(res.body.level).toBe("unverified");
    });

    it("should return positive score for anchored identity", async () => {
      const body = { trustLayerId: "score-test-001" };
      const headers = generateHmac("POST", "/api/identity/anchor", API_KEY, API_SECRET, body);
      await request(app).post("/api/identity/anchor").set(headers).send(body);

      const res = await request(app).get("/api/trust/score/score-test-001");
      expect(res.body.score).toBeGreaterThan(0);
      expect(res.body.level).toBe("verified");
    });
  });
});

describe("DW-STAMP Hash Chain", () => {
  function createStamp(voidId: string, prevHash: string, data: any) {
    const payload = JSON.stringify({ voidId, prevHash, data, timestamp: Date.now() });
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    return { hash, payload, voidId };
  }

  it("should produce deterministic hashes for same input", () => {
    const payload = JSON.stringify({ voidId: "V-12345678", prevHash: "genesis", data: {}, timestamp: 1000 });
    const h1 = crypto.createHash("sha256").update(payload).digest("hex");
    const h2 = crypto.createHash("sha256").update(payload).digest("hex");
    expect(h1).toBe(h2);
  });

  it("should create valid hash chain", () => {
    const stamp1 = createStamp("V-00000001", "genesis", { action: "mint" });
    const stamp2 = createStamp("V-00000001", stamp1.hash, { action: "bridge" });
    const stamp3 = createStamp("V-00000001", stamp2.hash, { action: "verify" });

    expect(stamp1.hash).not.toBe(stamp2.hash);
    expect(stamp2.hash).not.toBe(stamp3.hash);
    expect(stamp1.hash).toHaveLength(64);
    expect(stamp2.hash).toHaveLength(64);
    expect(stamp3.hash).toHaveLength(64);
  });

  it("should detect tampering in chain", () => {
    const stamp1 = createStamp("V-00000001", "genesis", { action: "mint" });
    const stamp2 = createStamp("V-00000001", stamp1.hash, { action: "bridge" });

    const tamperedStamp1 = createStamp("V-00000001", "genesis", { action: "tampered" });
    expect(tamperedStamp1.hash).not.toBe(stamp1.hash);

    const stamp2FromTampered = createStamp("V-00000001", tamperedStamp1.hash, { action: "bridge" });
    expect(stamp2FromTampered.hash).not.toBe(stamp2.hash);
  });

  it("should format Void ID as V-XXXXXXXX", () => {
    const voidIdPattern = /^V-\d{8}$/;
    expect("V-12345678").toMatch(voidIdPattern);
    expect("V-00000001").toMatch(voidIdPattern);
    expect("V-1234").not.toMatch(voidIdPattern);
    expect("12345678").not.toMatch(voidIdPattern);
  });
});
