import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
// @ts-ignore
import compression from "compression";
import session from "express-session";
// @ts-ignore
import createMemoryStore from "memorystore";

// ─── App Setup ───────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Session (in-memory, no Postgres needed) ────────────────────────
const MemoryStore = createMemoryStore(session);
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || "veil-session-secret-dev",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? "none" : "lax",
  },
}));

// ─── CORS ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (
    origin.endsWith(".tlid.io") ||
    origin.endsWith(".onrender.com") ||
    (!isProduction && (origin.includes("localhost") || origin.includes("127.0.0.1")))
  )) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Health Check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ready: true });
});

// ─── Veil Ebook Parser ──────────────────────────────────────────────
let cachedVeilChapters: any = null;
let cachedVeilMtime: number = 0;

function findVeilMarkdown(): string | null {
  const paths = [
    path.join(process.cwd(), "client", "public", "through-the-veil.md"),
    path.join(process.cwd(), "public", "through-the-veil.md"),
    path.join(process.cwd(), "dist", "public", "through-the-veil.md"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseVeilMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const chapters: { id: string; title: string; content: string; partTitle: string }[] = [];
  let currentChapter: typeof chapters[0] | null = null;
  let currentContent: string[] = [];
  let currentPart = "";
  let inFrontMatter = true;
  let frontMatterContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^# PART [IVXLC]+[-]?[A-Z]?:/i) || line.match(/^# PART (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)[-]?[A-Z]?:/i)) {
      currentPart = line.replace(/^# /, "").trim();
      continue;
    }

    const chapterMatch = line.match(/^# (CHAPTER \d+[A-Z]?:.+)$/i);
    const appendixMatch = line.match(/^# (APPENDIX[^:]*:.*)$/i) || line.match(/^# (APPENDIX.*)$/i);

    if (chapterMatch || appendixMatch) {
      inFrontMatter = false;
      if (currentChapter) {
        currentChapter.content = currentContent.join("\n").trim();
        chapters.push(currentChapter);
      }
      const title = (chapterMatch ? chapterMatch[1] : appendixMatch![1]).trim();
      const id = "ch-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").substring(0, 50);
      if (appendixMatch && !currentPart.includes("APPENDIX")) {
        currentPart = "APPENDIX: Reference Materials";
      }
      currentChapter = { id, title, content: "", partTitle: currentPart };
      currentContent = [];
      continue;
    }

    if (line.match(/^## TABLE OF CONTENTS/i)) {
      while (i < lines.length - 1 && !lines[i + 1].match(/^# PART/i)) { i++; }
      continue;
    }

    if (inFrontMatter && !line.match(/^# PART/)) {
      frontMatterContent.push(line);
    }

    if (currentChapter) {
      currentContent.push(line);
    }
  }

  if (currentChapter) {
    currentChapter.content = currentContent.join("\n").trim();
    chapters.push(currentChapter);
  }

  // Parse front matter sections
  const frontMatterSections: typeof chapters = [];
  const fmText = frontMatterContent.join("\n");
  const fmSectionRegex = /^## (.+)$/gm;
  const fmSectionMatches: { title: string; start: number }[] = [];
  let fmMatch;
  while ((fmMatch = fmSectionRegex.exec(fmText)) !== null) {
    const title = fmMatch[1].trim();
    if (title.toUpperCase() === "TABLE OF CONTENTS") continue;
    fmSectionMatches.push({ title, start: fmMatch.index });
  }

  const titlePageSections = ["the greatest story ever stole?", "the greatest story ever stole"];
  let titlePageEnd = fmSectionMatches.length > 0 ? fmSectionMatches[0].start : fmText.length;
  let firstContentSection = 0;
  if (fmSectionMatches.length > 0 && titlePageSections.includes(fmSectionMatches[0].title.toLowerCase())) {
    firstContentSection = 1;
    titlePageEnd = fmSectionMatches.length > 1 ? fmSectionMatches[1].start : fmText.length;
  }
  let titleContent = fmText.substring(0, titlePageEnd).trim();
  if (!titleContent.startsWith("# ")) {
    titleContent = "# THROUGH THE VEIL\n\n" + titleContent;
  }
  if (titleContent.length > 20) {
    frontMatterSections.push({ id: "fm-title", title: "Title Page", content: titleContent, partTitle: "Front Matter" });
  }

  for (let s = firstContentSection; s < fmSectionMatches.length; s++) {
    const sec = fmSectionMatches[s];
    const nextStart = s + 1 < fmSectionMatches.length ? fmSectionMatches[s + 1].start : fmText.length;
    const secContent = fmText.substring(sec.start, nextStart).trim();
    // Strip the leading ## heading since it's already used as the section title
    const strippedContent = secContent.replace(/^##\s+.+\n*/, '').trim();
    if (strippedContent.length > 10) {
      frontMatterSections.push({
        id: "fm-" + sec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").substring(0, 40),
        title: sec.title,
        content: strippedContent,
        partTitle: "Front Matter",
      });
    }
  }

  if (frontMatterSections.length === 0 && frontMatterContent.join("\n").trim().length > 0) {
    frontMatterSections.push({ id: "front-matter", title: "Introduction & Front Matter", content: frontMatterContent.join("\n").trim(), partTitle: "Front Matter" });
  }

  // Group into volumes by part
  const partMap = new Map<string, typeof chapters>();
  partMap.set("Front Matter", frontMatterSections);
  for (const chapter of chapters) {
    const part = chapter.partTitle || "Main Content";
    if (!partMap.has(part)) partMap.set(part, []);
    partMap.get(part)!.push(chapter);
  }

  const volumes: { id: string; title: string; subtitle: string; chapters: typeof chapters }[] = [];
  let volumeIndex = 0;
  for (const [partTitle, partChapters] of Array.from(partMap.entries())) {
    if (partChapters.length === 0) continue;
    volumes.push({
      id: `volume-${volumeIndex}`,
      title: partTitle === "Front Matter" ? "Front Matter" : partTitle,
      subtitle: partTitle === "Front Matter"
        ? `${partChapters.length} sections — introduction, dedication, and author notes`
        : `${partChapters.length} chapter${partChapters.length > 1 ? "s" : ""}`,
      chapters: partChapters,
    });
    volumeIndex++;
  }

  return volumes;
}

function getVeilVolumes() {
  const mdPath = findVeilMarkdown();
  if (!mdPath) return null;
  const stat = fs.statSync(mdPath);
  if (cachedVeilChapters && stat.mtimeMs === cachedVeilMtime) return cachedVeilChapters;
  const content = fs.readFileSync(mdPath, "utf-8");
  cachedVeilChapters = parseVeilMarkdown(content);
  cachedVeilMtime = stat.mtimeMs;
  return cachedVeilChapters;
}

// ─── Veil API Routes ─────────────────────────────────────────────────
app.get("/api/veil/toc", (req, res) => {
  try {
    const preview = req.query.preview === "true";
    let volumes = getVeilVolumes();
    if (!volumes) return res.status(404).json({ error: "Ebook content not found" });
    if (preview) {
      volumes = volumes.slice(0, 1).map((v: any) => ({ ...v, chapters: v.chapters?.slice(0, 4) || [] }));
    }
    const toc = volumes.map((v: any) => ({
      id: v.id, title: v.title, subtitle: v.subtitle,
      chapters: v.chapters.map((c: any) => ({ id: c.id, title: c.title, partTitle: c.partTitle })),
    }));
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(toc);
  } catch (error: any) {
    console.error("Veil TOC error:", error);
    res.status(500).json({ error: "Failed to parse ebook" });
  }
});

app.get("/api/veil/chapters", (req, res) => {
  try {
    const preview = req.query.preview === "true";
    let volumes = getVeilVolumes();
    if (!volumes) return res.status(404).json({ error: "Ebook content not found" });
    if (preview) {
      volumes = volumes.slice(0, 1).map((v: any) => ({ ...v, chapters: v.chapters?.slice(0, 4) || [] }));
    }
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(volumes);
  } catch (error: any) {
    console.error("Veil chapters error:", error);
    res.status(500).json({ error: "Failed to parse ebook" });
  }
});

app.get("/api/veil/chapter/:volIndex/:chapIndex", (req, res) => {
  try {
    const volIndex = parseInt(req.params.volIndex, 10);
    const chapIndex = parseInt(req.params.chapIndex, 10);
    if (isNaN(volIndex) || isNaN(chapIndex) || volIndex < 0 || chapIndex < 0) {
      return res.status(400).json({ error: "Invalid volume or chapter index" });
    }
    const volumes = getVeilVolumes();
    if (!volumes) return res.status(404).json({ error: "Ebook content not found" });
    if (volIndex >= volumes.length) return res.status(404).json({ error: "Volume not found" });
    if (chapIndex >= volumes[volIndex].chapters.length) return res.status(404).json({ error: "Chapter not found" });
    const chapter = volumes[volIndex].chapters[chapIndex];
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ id: chapter.id, title: chapter.title, content: chapter.content, partTitle: chapter.partTitle });
  } catch (error: any) {
    console.error("Veil chapter error:", error);
    res.status(500).json({ error: "Failed to load chapter" });
  }
});

// ─── PDF / EPUB Downloads ────────────────────────────────────────────
app.get("/api/veil/pdf", (_req, res) => {
  const pdfPaths = [
    path.join(process.cwd(), "server", "data", "INVARIANT.pdf"),
    path.join(process.cwd(), "server", "data", "Through-The-Veil.pdf"),
    path.join(process.cwd(), "server-data", "INVARIANT.pdf"),
    path.join(process.cwd(), "server-data", "Through-The-Veil.pdf"),
    path.join(process.cwd(), "dist", "server-data", "INVARIANT.pdf"),
    path.join(process.cwd(), "dist", "server-data", "Through-The-Veil.pdf"),
  ];
  for (const p of pdfPaths) {
    if (fs.existsSync(p)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="INVARIANT.pdf"');
      return fs.createReadStream(p).pipe(res);
    }
  }
  res.status(404).json({ error: "PDF not found" });
});

app.get("/api/veil/epub", (_req, res) => {
  const epubPaths = [
    path.join(process.cwd(), "server", "data", "INVARIANT.epub"),
    path.join(process.cwd(), "server", "data", "Through-The-Veil.epub"),
    path.join(process.cwd(), "server-data", "INVARIANT.epub"),
    path.join(process.cwd(), "server-data", "Through-The-Veil.epub"),
    path.join(process.cwd(), "dist", "server-data", "INVARIANT.epub"),
    path.join(process.cwd(), "dist", "server-data", "Through-The-Veil.epub"),
  ];
  for (const p of epubPaths) {
    if (fs.existsSync(p)) {
      res.setHeader("Content-Type", "application/epub+zip");
      res.setHeader("Content-Disposition", 'attachment; filename="INVARIANT.epub"');
      return fs.createReadStream(p).pipe(res);
    }
  }
  res.status(404).json({ error: "EPUB not found" });
});

// ─── Voice TTS (OpenAI) ─────────────────────────────────────────────
app.post("/api/voice/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.length < 1) {
      return res.status(400).json({ error: "Text is required" });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Voice service not configured" });
    }
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text.substring(0, 4096),
      response_format: "mp3",
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Voice-Provider", "openai");
    res.setHeader("X-Voice-Name", "Nova");
    res.send(buffer);
  } catch (error: any) {
    console.error("TTS error:", error.message);
    res.status(500).json({ error: "Voice generation failed" });
  }
});

// ─── Auth Stub (minimal — just for paygate domain check) ─────────────
app.get("/api/auth/me", (req, res) => {
  const user = (req.session as any)?.user;
  res.json({ user: user || null });
});

app.post("/api/auth/login", (_req, res) => {
  res.status(501).json({ error: "Login coming soon" });
});

app.post("/api/auth/register", (_req, res) => {
  res.status(501).json({ error: "Registration coming soon" });
});

app.post("/api/auth/logout", (req, res) => {
  req.session?.destroy(() => {});
  res.json({ ok: true });
});

// ─── Static Serving + SPA Fallback ───────────────────────────────────
const distPath = isProduction
  ? path.resolve(__dirname, "public")
  : path.resolve(process.cwd(), "client", "public");

if (isProduction && fs.existsSync(distPath)) {
  // Cache index.html in memory
  const indexPath = path.resolve(distPath, "index.html");
  let cachedHtml: string | null = null;
  try {
    cachedHtml = fs.readFileSync(indexPath, "utf8");
    console.log("[Static] index.html cached");
  } catch {}

  app.use(express.static(distPath, {
    maxAge: "0",
    setHeaders: (res, filePath) => {
      if (filePath.includes("/assets/") && /\-[a-zA-Z0-9]{8,}\.(js|css)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      if (/\.(mp4|webm|ogg|jpg|jpeg|png|webp|svg|gif|avif)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));

  // SPA fallback — serve index.html for all non-API routes
  app.use("/*splat", (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith("/api/") || req.originalUrl.startsWith("/api")) {
      return next();
    }
    const html = cachedHtml || (() => { try { return fs.readFileSync(indexPath, "utf8"); } catch { return null; } })();
    if (!html) {
      return res.status(500).send("<h1>Starting up...</h1><script>setTimeout(()=>location.reload(),2000)</script>");
    }
    res.send(html);
  });
}

// ─── Start Server ────────────────────────────────────────────────────
const port = parseInt(process.env.PORT || "5000", 10);

httpServer.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`[Veil] Through The Veil server ready on port ${port}`);
  console.log(`[Veil] Ebook markdown: ${findVeilMarkdown() || "NOT FOUND"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => { httpServer.close(() => process.exit(0)); setTimeout(() => process.exit(1), 5000); });
process.on("SIGINT", () => { httpServer.close(() => process.exit(0)); setTimeout(() => process.exit(1), 5000); });
process.on("unhandledRejection", (r: any) => console.error("[Unhandled]", r?.message || r));
