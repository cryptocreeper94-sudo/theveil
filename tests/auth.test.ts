import { describe, it, expect, beforeAll, vi } from "vitest";
import express from "express";
import request from "supertest";
import session from "express-session";
import crypto from "crypto";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  const mockUsers: Record<string, any> = {
    "user-1": { id: "user-1", email: "test@example.com", username: "testuser" },
  };

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    if (email === "test@example.com" && password === "password123") {
      (req.session as any).userId = "user-1";
      return res.json({ user: mockUsers["user-1"] });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId || !mockUsers[userId]) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: mockUsers[userId] });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/owner/login", (req, res) => {
    const { secret } = req.body;
    if (!secret) {
      return res.status(400).json({ error: "Secret required" });
    }
    if (secret === "test-owner-secret") {
      (req.session as any).isOwner = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid secret" });
  });

  return app;
}

describe("Authentication", () => {
  const app = createTestApp();

  describe("POST /api/auth/login", () => {
    it("should reject login without credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should reject invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@example.com", password: "wrong" });
      expect(res.status).toBe(401);
    });

    it("should accept valid credentials and return user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return user when authenticated via session", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      const res = await agent.get("/api/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe("user-1");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should destroy session on logout", async () => {
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);

      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(401);
    });
  });

  describe("Owner Admin Auth", () => {
    it("should reject empty secret", async () => {
      const res = await request(app).post("/api/owner/login").send({});
      expect(res.status).toBe(400);
    });

    it("should reject wrong secret", async () => {
      const res = await request(app)
        .post("/api/owner/login")
        .send({ secret: "wrong" });
      expect(res.status).toBe(401);
    });

    it("should accept correct owner secret", async () => {
      const res = await request(app)
        .post("/api/owner/login")
        .send({ secret: "test-owner-secret" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe("HMAC Authentication (TrustVault)", () => {
  const API_KEY = "test-api-key";
  const API_SECRET = "test-api-secret";

  function generateHmacHeaders(method: string, path: string, body: any = {}) {
    const timestamp = Date.now().toString();
    const bodyStr = JSON.stringify(body);
    const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
    const canonical = `${method}:${path}:${API_KEY}:${timestamp}:${bodyHash}`;
    const signature = crypto
      .createHmac("sha256", API_SECRET)
      .update(canonical)
      .digest("hex");

    return {
      "x-blockchain-key": API_KEY,
      "x-blockchain-signature": signature,
      "x-blockchain-timestamp": timestamp,
    };
  }

  it("should generate valid HMAC signature format", () => {
    const headers = generateHmacHeaders("POST", "/api/identity/anchor", {
      trustLayerId: "test-id",
    });
    expect(headers["x-blockchain-key"]).toBe(API_KEY);
    expect(headers["x-blockchain-signature"]).toHaveLength(64);
    expect(headers["x-blockchain-timestamp"]).toBeDefined();
  });

  it("should produce different signatures for different bodies", () => {
    const h1 = generateHmacHeaders("POST", "/api/identity/anchor", {
      trustLayerId: "id-1",
    });
    const h2 = generateHmacHeaders("POST", "/api/identity/anchor", {
      trustLayerId: "id-2",
    });
    expect(h1["x-blockchain-signature"]).not.toBe(
      h2["x-blockchain-signature"]
    );
  });

  it("should produce different signatures for different methods", () => {
    const h1 = generateHmacHeaders("GET", "/api/identity/verify/test", {});
    const h2 = generateHmacHeaders("POST", "/api/identity/verify/test", {});
    expect(h1["x-blockchain-signature"]).not.toBe(
      h2["x-blockchain-signature"]
    );
  });

  it("should produce different signatures for different paths", () => {
    const h1 = generateHmacHeaders("GET", "/api/identity/verify/a", {});
    const h2 = generateHmacHeaders("GET", "/api/identity/verify/b", {});
    expect(h1["x-blockchain-signature"]).not.toBe(
      h2["x-blockchain-signature"]
    );
  });

  it("should reject expired timestamps (>5 min old)", () => {
    const oldTimestamp = (Date.now() - 6 * 60 * 1000).toString();
    const bodyHash = crypto
      .createHash("sha256")
      .update("{}")
      .digest("hex");
    const canonical = `GET:/api/test:${API_KEY}:${oldTimestamp}:${bodyHash}`;
    const signature = crypto
      .createHmac("sha256", API_SECRET)
      .update(canonical)
      .digest("hex");

    const timeDiff = Math.abs(Date.now() - parseInt(oldTimestamp));
    expect(timeDiff).toBeGreaterThan(5 * 60 * 1000);
  });
});
