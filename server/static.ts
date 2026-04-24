import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

type AppDomain = "dwsc" | "games" | "chronicles" | "chronochat";

function getAppFromHost(hostname: string): AppDomain {
  const host = hostname.toLowerCase();
  
  if (host.includes("darkwavegames") || host.includes("games.")) {
    return "games";
  }
  if (host.includes("yourlegacy") || host === "yourlegacy.io" || host === "www.yourlegacy.io") {
    return "chronicles";
  }
  if (host.includes("chronochat") || host === "chronochat.io" || host === "www.chronochat.io") {
    return "chronochat";
  }
  return "dwsc";
}

const APP_CONFIG: Record<AppDomain, {
  manifest: string;
  themeColor: string;
  title: string;
  description: string;
  icon: string;
}> = {
  dwsc: {
    manifest: "/manifest-dwsc.webmanifest",
    themeColor: "#00ffff",
    title: "Trust Layer",
    description: "The next-generation Layer 1 blockchain. DeFi, staking, NFTs, and developer tools.",
    icon: "/icons/dwsc-512x512.png",
  },
  games: {
    manifest: "/manifest-games.webmanifest",
    themeColor: "#ec4899",
    title: "The Arcade",
    description: "Provably fair blockchain games. Win real SIG with instant payouts.",
    icon: "/icons/games-512x512.png",
  },
  chronicles: {
    manifest: "/manifest-chrono.webmanifest",
    themeColor: "#a855f7",
    title: "Chronicles",
    description: "Not a game. A life. Live your legacy across 70+ historical eras in the ChronoVerse.",
    icon: "/marketing/darkwave_games_app_icon.jpg",
  },
  chronochat: {
    manifest: "/manifest-chronochat.webmanifest",
    themeColor: "#06b6d4",
    title: "Signal Chat",
    description: "Connect across the ecosystem. The community hub for Trust Layer.",
    icon: "/icons/icon-512x512.png",
  },
};

// Cache index.html in memory to prevent cold start issues
let cachedIndexHtml: string | null = null;

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Pre-load index.html into memory at startup
  const indexPath = path.resolve(distPath, "index.html");
  try {
    cachedIndexHtml = fs.readFileSync(indexPath, "utf8");
    console.log('[Static] index.html cached in memory');
  } catch (err) {
    console.error('[Static] Failed to cache index.html:', err);
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const appType = getAppFromHost(req.hostname);
    (req as any).appType = appType;
    (req as any).appConfig = APP_CONFIG[appType];
    next();
  });

  app.get("/sw.js", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(path.join(distPath, "sw.js"));
  });

  app.get("/manifest.webmanifest", (req: Request, res: Response) => {
    const appConfig = (req as any).appConfig;
    const manifestPath = path.join(distPath, appConfig.manifest.replace("/", ""));
    
    if (fs.existsSync(manifestPath)) {
      res.setHeader("Content-Type", "application/manifest+json");
      res.sendFile(manifestPath);
    } else {
      res.sendFile(path.join(distPath, "manifest.webmanifest"));
    }
  });

  app.use(express.static(distPath, {
    maxAge: '0',
    setHeaders: (res, filePath) => {
      // Cache hashed JS/CSS assets forever (immutable)
      if (filePath.includes('/assets/') && /\-[a-zA-Z0-9]{8,}\.(js|css)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Cache video and image assets aggressively (1 year, Cloudflare will edge-cache)
      if (/\.(mp4|webm|ogg|jpg|jpeg|png|webp|svg|gif|avif)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  
  // Serve ebook assets from public/assets
  const publicAssetsPath = path.resolve(process.cwd(), "public/assets");
  app.use("/assets", express.static(publicAssetsPath));

  app.use("*", (req: Request, res: Response) => {
    const appConfig = (req as any).appConfig;
    
    // Use cached HTML if available, otherwise read from disk
    let html = cachedIndexHtml;
    
    if (!html) {
      try {
        html = fs.readFileSync(indexPath, "utf8");
        cachedIndexHtml = html; // Cache for next time
      } catch (err) {
        console.error('[Static] Failed to read index.html:', err);
        res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Loading...</title><meta http-equiv="refresh" content="2"></head>
          <body style="background:#0f172a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <h2>Starting up...</h2>
              <p>Please wait a moment. The page will refresh automatically.</p>
            </div>
          </body>
          </html>
        `);
        return;
      }
    }
    
    let modifiedHtml = html
      .replace(/<title>.*?<\/title>/, `<title>${appConfig.title}</title>`)
      .replace(/content="Trust Layer[^"]*"/g, `content="${appConfig.title}"`)
      .replace(/<meta name="theme-color" content="[^"]*"/, `<meta name="theme-color" content="${appConfig.themeColor}"`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${appConfig.description}"`)
      .replace(/href="\/manifest\.webmanifest"/, `href="${appConfig.manifest}"`);
    
    res.send(modifiedHtml);
  });
}
