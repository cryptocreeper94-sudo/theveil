import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { createLogger } from "./logger";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Extend Express Request type for tlid subdomain routing
declare global {
  namespace Express {
    interface Request {
      tlidSubdomain?: string;
    }
  }
}
import helmet from "helmet";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startScheduler } from "./marketing-scheduler";
import { startShellsAirdropScheduler } from "./shells-airdrop-scheduler";
import { ecosystemClient } from "./ecosystem-client";
import { startReferralPayoutScheduler } from "./referral-payout-scheduler";
import { startEmailUpdateScheduler } from "./email-update-scheduler";
import { seedDocuments, seedCityZones, seedEraBuildingTemplates } from "./storage";
import { setupPresence } from "./chat-presence";
import { setupSignalChatWS } from "./chat-ws";
import { seedChatChannels } from "./seedChat";
import { setupGuardianScannerWS } from "./guardian-scanner-ws";
import { predictionTrackingService } from "./services/pulse/predictionTrackingService";
import { predictionLearningService } from "./services/pulse/predictionLearningService";
import { startMembershipReconciliationScheduler } from "./membership-reconciliation-scheduler";
// @ts-ignore
import compression from "compression";

const app = express();

let servicesReady = false;

app.get("/", (req, res, next) => {
  if (!servicesReady) {
    return res.status(200).send("OK");
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", ready: servicesReady });
});

app.use(compression());

// Firebase Auth reverse proxy - must be before other middleware
// This allows Google Sign-In to work with custom domain by avoiding third-party cookie issues
app.use(["/__/auth", "/__/firebase"], createProxyMiddleware({
  target: "https://darkwave-auth.firebaseapp.com",
  changeOrigin: true,
  secure: true,
  pathRewrite: (_path: string, req: any) => `${req.baseUrl}${req.url}`,
}));

// Redirect legacy domains to primary domain
// Exempt webhook endpoints from redirects (they need direct access)
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host === 'dwsc.io' || host === 'www.dwsc.io') {
    // Don't redirect webhook endpoints - external services need direct access
    if (req.originalUrl.includes('/api/coinbase/webhook') ||
      req.originalUrl.includes('/api/stripe/webhook')) {
      return next();
    }
    const newUrl = `https://dwtl.io${req.originalUrl}`;
    return res.redirect(301, newUrl);
  }
  next();
});

// Handle tlid.io domain routing
// Root tlid.io → Trust Layer signup page
// Subdomains (alice.tlid.io) → Route to configured website
app.use((req, res, next) => {
  const host = req.headers.host || '';

  // Check if this is a tlid.io request
  if (host.endsWith('tlid.io')) {
    const parts = host.split('.');

    // Root domain (tlid.io or www.tlid.io) → Trust Layer landing page
    if (host === 'tlid.io' || host === 'www.tlid.io') {
      // Serve the Trust Layer landing/signup page
      // The SPA router will handle showing the correct page at /
      return next();
    }

    // Subdomain (e.g., alice.tlid.io) → Route to configured website
    if (parts.length > 2) {
      const subdomain = parts[0];
      // Store subdomain for gateway routing (handled by routes.ts)
      req.tlidSubdomain = subdomain;
    }
  }
  next();
});

const httpServer = createServer(app);
const httpLog = createLogger("http");

app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).requestId = req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// Security headers via Helmet - stricter in production
const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: isProduction
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
  styleSrc: isProduction
    ? ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
    : ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "blob:", "https:"],
  mediaSrc: ["'self'", "blob:", "data:"],
  connectSrc: ["'self'", "wss:", "https:", "https://cdnjs.cloudflare.com"],
  workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com"],
  frameSrc: ["'self'", "https://js.stripe.com"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  scriptSrcAttr: null,
  upgradeInsecureRequests: isProduction ? [] : null,
};

// Remove null values for development
Object.keys(cspDirectives).forEach(key => {
  if (cspDirectives[key as keyof typeof cspDirectives] === null) {
    delete cspDirectives[key as keyof typeof cspDirectives];
  }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: false,
}));

// CORS headers for API access with strict origin allowlist
const ALLOWED_ORIGINS = [
  "https://dwtl.io",
  "https://www.dwtl.io",
  "https://dwsc.io",
  "https://www.dwsc.io",
  "https://tlid.io",
  "https://www.tlid.io",
  "https://darkwavegames.io",
  "https://www.darkwavegames.io",
  "https://darkwavestudios.io",
  "https://www.darkwavestudios.io",
  "https://yourlegacy.io",
  "https://www.yourlegacy.io",
  "https://chronochat.io",
  "https://www.chronochat.io",
  "https://trustshield.tech",
  "https://www.trustshield.tech",
  "https://trust-layer-1pji.onrender.com",
];

// Allow localhost and Replit dev domains in development
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:5000", "http://127.0.0.1:5000");
}

// Allow *.tlid.io subdomains for cross-app communication
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (
    origin.endsWith('.tlid.io') ||
    origin.endsWith('.onrender.com') ||
    (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1')))
  )) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-API-Secret");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session middleware with PostgreSQL persistence
const pgStore = connectPg(session);
const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days - keep users logged in

const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
  ttl: sessionTtl,
  tableName: "user_sessions",
  errorLog: (err: Error) => {
    if (err.message?.includes('already exists')) {
      console.log('[Session] Index already exists, ignoring...');
    } else {
      console.error('[Session] Store error:', err.message);
    }
  },
});

app.set("trust proxy", 1);
// Use secure cookies in production (always HTTPS on Render)
console.log('[Session] Config: isProduction=', isProduction);
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || process.env.OWNER_SECRET || 'darkwave-session-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction, // false on localhost (HTTP), true in production (HTTPS)
    maxAge: sessionTtl,
    sameSite: isProduction ? 'none' : 'lax', // 'lax' for localhost, 'none' for cross-site in production
  },
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

let initError: string | null = null;

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  console.log(`[Shutdown] Received ${signal}, closing server gracefully...`);
  httpServer.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!servicesReady && !req.path.startsWith('/api/') && req.method === 'GET' && req.accepts('html')) {
    res.status(200).set({ 'Content-Type': 'text/html' }).end(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Trust Layer</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.loader{text-align:center}.spinner{width:48px;height:48px;border:3px solid rgba(0,255,255,0.2);border-top-color:#00ffff;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}h1{font-size:1.25rem;font-weight:400;opacity:0.8}</style>
</head><body><div class="loader"><div class="spinner"></div><h1>Loading Trust Layer...</h1></div>
<script>setTimeout(()=>location.reload(),2000)</script></body></html>`);
    return;
  }
  next();
});

// Start server IMMEDIATELY - opens port 5000 right away
const port = parseInt(process.env.PORT || "5000", 10);

httpServer.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error] Port ${port} is already in use. Waiting 2s and retrying...`);
    setTimeout(() => {
      httpServer.close();
      httpServer.listen({ port, host: "0.0.0.0" });
    }, 2000);
  } else {
    console.error('[Error] Server error:', err);
    process.exit(1);
  }
});

httpServer.listen(
  {
    port,
    host: "0.0.0.0",
  },
  () => {
    console.log(`[Health] Server started and listening on 0.0.0.0:${port}`);
    console.log(`[Health] Application ready to accept HTTP requests`);
    log(`serving on port ${port}`);

    // Initialize heavy services in background AFTER port is open
    initializeServices().catch(err => {
      console.error('[Init] Fatal error during service initialization:', err);
      initError = err.message;
    });
  },
);

// Background initialization of heavy services
async function initializeServices() {
  try {
    // Standard Stripe initialized. (Managed webhooks disabled outside Replit environment.)
    await registerRoutes(httpServer, app);

    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const requestId = (req as any).requestId || req.headers["x-request-id"] || crypto.randomUUID();

      if (status >= 500) {
        httpLog.error(`${req.method} ${req.path} → ${status}`, {
          error: message,
          stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
          requestId,
          ip: req.ip,
        });
      } else {
        httpLog.warn(`${req.method} ${req.path} → ${status}`, {
          error: message,
          requestId,
        });
      }

      if (!res.headersSent) {
        res.status(status).json({ message, requestId });
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }
    servicesReady = true;

    // Setup ChronoChat WebSocket presence (legacy)
    setupPresence(httpServer);

    // Setup Signal Chat WebSocket (JWT-authenticated, /ws/chat)
    setupSignalChatWS(httpServer);

    // Setup Guardian Scanner WebSocket for live price updates
    setupGuardianScannerWS(httpServer);

    // Seed core documents if empty
    await seedDocuments();

    // Seed Signal Chat channels
    await seedChatChannels();

    // Seed city zones and era buildings for Chronicles Estate
    await seedCityZones();
    await seedEraBuildingTemplates();

    // Initialize Pulse AI Prediction Services
    try {
      await predictionTrackingService.initialize();
      await predictionLearningService.initialize();
      console.log('[Pulse] Prediction engine started');
    } catch (err: any) {
      console.warn('[Pulse] Prediction services skipped:', err.message);
    }

    // Start Backup Vault - auto-sync predictions to protected backup schema
    try {
      const { backupVaultService } = await import('./services/pulse/backupVaultService');
      await backupVaultService.checkAndAutoRestore();
      backupVaultService.startAutoSync(60_000);
      console.log('[BackupVault] Prediction backup vault active (60s sync)');
    } catch (err: any) {
      console.warn('[BackupVault] Backup vault skipped:', err.message);
    }

    // Start Auto Prediction Generator - generates predictions continuously
    try {
      const { autoPredictionService } = await import('./services/pulse/autoPredictionService');
      autoPredictionService.start(30_000);
      console.log('[AutoPredict] Prediction generator active (30s batches)');
    } catch (err: any) {
      console.warn('[AutoPredict] Auto prediction generator skipped:', err.message);
    }

    // Marketing auto-deploy scheduler - DISABLED (rebrand in progress)
    // startScheduler();

    // Shells airdrop scheduler - runs at 7 AM and 7 PM UTC (1 AM and 1 PM CST)
    startShellsAirdropScheduler();

    // Referral payout scheduler - runs at 2 PM and 2 AM UTC (8 AM and 8 PM CST)
    startReferralPayoutScheduler();

    // Email update scheduler - sends weekly updates every Sunday at 10 AM UTC
    startEmailUpdateScheduler();

    // Membership reconciliation scheduler - runs every 12 hours to unify accounts
    startMembershipReconciliationScheduler();

    registerEcosystemAppsToOrbit().catch(e => console.error('[Orbit] App registration failed:', e.message));

    // One-time migration: Ensure Kathy's total SIG = 200K
    try {
      const { rows: kathyPurchases } = await db.execute(sql`
        SELECT id, token_amount, payment_method FROM presale_purchases 
        WHERE LOWER(TRIM(email)) = 'kathytidwell74@gmail.com' AND status = 'completed'
      `);
      const currentTotal = kathyPurchases.reduce((sum: number, p: any) => sum + Number(p.token_amount), 0);
      const hasManualCredit = kathyPurchases.some((p: any) => p.payment_method === 'manual_credit');

      if (currentTotal < 200000) {
        const needed = 200000 - currentTotal;
        const { rows: userRows } = await db.execute(sql`
          SELECT id FROM users WHERE LOWER(TRIM(email)) = 'kathytidwell74@gmail.com' LIMIT 1
        `);
        const userId = userRows[0]?.id || null;

        if (hasManualCredit) {
          // Update existing manual credit to the right amount
          const manualId = kathyPurchases.find((p: any) => p.payment_method === 'manual_credit')?.id;
          await db.execute(sql`
            UPDATE presale_purchases SET token_amount = ${needed} WHERE id = ${manualId}
          `);
        } else {
          await db.execute(sql`
            INSERT INTO presale_purchases (id, email, buyer_name, token_amount, usd_amount_cents, tier, status, payment_method, user_id, created_at)
            VALUES (gen_random_uuid(), 'kathytidwell74@gmail.com', 'Kathy Grater', ${needed}, 0, 'founders', 'completed', 'manual_credit', ${userId}, NOW())
          `);
        }

        // Link any unlinked purchases to her account
        if (userId) {
          await db.execute(sql`
            UPDATE presale_purchases SET user_id = ${userId}
            WHERE LOWER(TRIM(email)) = 'kathytidwell74@gmail.com' AND user_id IS NULL
          `);
        }
        console.log(`[Migration] Kathy SIG: was ${currentTotal.toLocaleString()}, added ${needed.toLocaleString()}, now 200,000 total`);
      } else {
        console.log(`[Migration] Kathy SIG already at ${currentTotal.toLocaleString()} - no change needed`);
      }
    } catch (e: any) {
      console.warn('[Migration] Kathy credit check:', e.message);
    }

    servicesReady = true;
    console.log('[Init] All services initialized successfully');
  } catch (err: any) {
    console.error('[Init] Service initialization error:', err);
    initError = err.message;
    throw err;
  }
}

async function registerEcosystemAppsToOrbit() {
  if (!ecosystemClient.isConfigured()) {
    console.log('[Orbit] Skipping app registration — no API credentials configured');
    return;
  }

  const appBaseUrl = process.env.SITE_BASE_URL || 'https://trust-layer-1pji.onrender.com';

  const apps = [
    { appName: 'The Void', appSlug: 'the-void', appUrl: 'https://thevoid.tlid.io', description: 'Premium membership identity system with Void IDs and DW-STAMP hallmarks', category: 'entertainment', permissions: ['read:profile', 'read:membership'] },
    { appName: 'Happy Eats', appSlug: 'happy-eats', appUrl: 'https://happyeats.tlid.io', description: 'Food truck ordering platform with zone-based batch ordering', category: 'food-delivery', permissions: ['read:profile', 'write:orders'] },
    { appName: 'TL Driver Connect', appSlug: 'driver-connect', appUrl: 'https://driverconnect.tlid.io', description: 'Blockchain-verified driver coordination and logistics platform', category: 'transportation', permissions: ['read:profile', 'write:logistics'] },
    { appName: 'Trust Home', appSlug: 'trust-home', appUrl: 'https://trusthome.tlid.io', description: 'Personal Trust Layer dashboard for membership, balance, and activity', category: 'core', permissions: ['read:profile', 'read:membership', 'read:balance'] },
    { appName: 'Trust Vault', appSlug: 'trust-vault', appUrl: 'https://trustvault.tlid.io', description: 'Multi-chain wallet with multi-signature security', category: 'finance', permissions: ['read:profile', 'read:balance', 'write:transactions'] },
  ];

  for (const app of apps) {
    try {
      await ecosystemClient.registerApp({ ...app, metadata: { registeredFrom: appBaseUrl, version: '1.0.0' } });
      console.log(`[Orbit] Registered: ${app.appName}`);
    } catch (e: any) {
      console.log(`[Orbit] ${app.appName}: ${e.message || 'already registered'}`);
    }
  }
  console.log('[Orbit] Ecosystem app registration complete');
}

const processLog = createLogger("process");

process.on("unhandledRejection", (reason: any) => {
  processLog.fatal("Unhandled promise rejection", {
    error: reason?.message || String(reason),
    stack: reason?.stack,
  });
});

process.on("uncaughtException", (err: Error) => {
  processLog.fatal("Uncaught exception", {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
