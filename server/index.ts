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
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
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
  "https://Signal Chat.io",
  "https://www.Signal Chat.io",
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

// Background initialization — stripped to only what the book reader needs
async function initializeServices() {
  try {
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

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    servicesReady = true;
    console.log('[Init] Through The Veil — book service ready');
  } catch (err: any) {
    console.error('[Init] Service initialization error:', err);
    initError = err.message;
    throw err;
  }
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

