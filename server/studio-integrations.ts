import { Express, Request, Response } from "express";
import crypto from "crypto";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const VERCEL_TOKEN_KEY = "VERCEL_TOKEN";
const GITHUB_REDIRECT_URI = `${process.env.SITE_BASE_URL || 'https://trust-layer-1pji.onrender.com'}/api/studio/github/callback`;

const githubTokens = new Map<string, string>();
const vercelTokens = new Map<string, string>();
const devServers = new Map<string, { process: any; port: number; status: string }>();

export function registerStudioIntegrations(app: Express, isAuthenticated: any) {

  app.get("/api/studio/github/auth", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Login required" });

    if (!GITHUB_CLIENT_ID) {
      return res.status(503).json({ error: "GitHub integration not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET." });
    }

    const state = crypto.randomBytes(16).toString("hex");
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo,user:email&state=${state}`;
    res.json({ url, state });
  });

  app.get("/api/studio/github/callback", async (req: any, res: Response) => {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ error: "Missing code" });

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_REDIRECT_URI,
        }),
      });
      const tokenData: any = await tokenRes.json();

      if (tokenData.access_token) {
        const userId = req.user?.id || req.user?.claims?.sub || "anonymous";
        githubTokens.set(userId, tokenData.access_token);
        res.redirect("/studio?github=connected");
      } else {
        res.redirect("/studio?github=error");
      }
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.redirect("/studio?github=error");
    }
  });

  app.get("/api/studio/github/status", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const connected = githubTokens.has(userId);
    res.json({ connected, configured: !!GITHUB_CLIENT_ID });
  });

  app.post("/api/studio/github/disconnect", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    githubTokens.delete(userId);
    res.json({ disconnected: true });
  });

  app.get("/api/studio/github/repos", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const token = githubTokens.get(userId);
    if (!token) return res.status(401).json({ error: "GitHub not connected" });

    try {
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      const repos = await response.json();
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repos" });
    }
  });

  app.post("/api/studio/github/clone", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const token = githubTokens.get(userId);
    if (!token) return res.status(401).json({ error: "GitHub not connected" });

    const { repoUrl, projectId } = req.body;
    if (!repoUrl) return res.status(400).json({ error: "Repository URL required" });

    try {
      const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      const tree: any = await contentsRes.json();

      if (!tree.tree) return res.status(404).json({ error: "Repository not found or empty" });

      const files: { path: string; content: string }[] = [];
      for (const item of tree.tree.slice(0, 50)) {
        if (item.type === "blob" && item.size < 100000) {
          try {
            const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`, {
              headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
            });
            const blob: any = await blobRes.json();
            if (blob.content) {
              files.push({ path: item.path, content: Buffer.from(blob.content, "base64").toString("utf8") });
            }
          } catch { }
        }
      }

      res.json({ files, repoName: `${owner}/${repo}`, fileCount: files.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to clone repository" });
    }
  });

  app.post("/api/studio/github/push", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const token = githubTokens.get(userId);
    if (!token) return res.status(401).json({ error: "GitHub not connected" });

    const { owner, repo, files, message } = req.body;
    if (!owner || !repo || !files) return res.status(400).json({ error: "Missing required fields" });

    try {
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      const refData: any = await refRes.json();
      const latestSha = refData.object?.sha;

      if (!latestSha) return res.status(400).json({ error: "Could not get latest commit" });

      const blobs = [];
      for (const file of files) {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
          body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
        });
        const blob: any = await blobRes.json();
        blobs.push({ path: file.name, mode: "100644", type: "blob", sha: blob.sha });
      }

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify({ base_tree: latestSha, tree: blobs }),
      });
      const tree: any = await treeRes.json();

      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || "Update from DWSC Studio", tree: tree.sha, parents: [latestSha] }),
      });
      const commit: any = await commitRes.json();

      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify({ sha: commit.sha }),
      });

      res.json({ success: true, commitSha: commit.sha, message: message || "Update from DWSC Studio" });
    } catch (error) {
      res.status(500).json({ error: "Push failed" });
    }
  });

  app.post("/api/studio/vercel/connect", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Vercel token required" });
    vercelTokens.set(userId, token);
    res.json({ connected: true });
  });

  app.get("/api/studio/vercel/status", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    res.json({ connected: vercelTokens.has(userId) });
  });

  app.post("/api/studio/vercel/disconnect", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    vercelTokens.delete(userId);
    res.json({ disconnected: true });
  });

  app.post("/api/studio/vercel/deploy", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const token = vercelTokens.get(userId);
    if (!token) return res.status(401).json({ error: "Vercel not connected" });

    const { projectName, files } = req.body;
    if (!files || !Array.isArray(files)) return res.status(400).json({ error: "Files required" });

    try {
      const vercelFiles = files.map((f: any) => ({
        file: f.name,
        data: Buffer.from(f.content).toString("base64"),
        encoding: "base64",
      }));

      const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName || "dwsc-studio-deploy",
          files: vercelFiles,
          projectSettings: { framework: null },
        }),
      });

      const deployment: any = await deployRes.json();

      if (deployment.error) {
        return res.status(400).json({ error: deployment.error.message || "Deploy failed" });
      }

      res.json({
        id: deployment.id,
        url: deployment.url ? `https://${deployment.url}` : null,
        readyState: deployment.readyState || "BUILDING",
        createdAt: deployment.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Vercel deployment failed" });
    }
  });

  app.get("/api/studio/vercel/deployment/:deploymentId", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const token = vercelTokens.get(userId);
    if (!token) return res.status(401).json({ error: "Vercel not connected" });

    try {
      const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${req.params.deploymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deployment: any = await statusRes.json();
      res.json({
        id: deployment.id,
        url: deployment.url ? `https://${deployment.url}` : null,
        readyState: deployment.readyState,
        createdAt: deployment.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check deployment status" });
    }
  });

  app.post("/api/studio/lint", isAuthenticated, async (req: any, res: Response) => {
    const { code, language, filename } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    const diagnostics: { line: number; column: number; severity: string; message: string; source: string }[] = [];
    const lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if ((language === "javascript" || language === "typescript" || language === "jsx" || language === "tsx") && line.includes("var ")) {
        diagnostics.push({ line: lineNum, column: line.indexOf("var ") + 1, severity: "warning", message: "Unexpected var, use let or const instead", source: "no-var" });
      }

      if (line.includes("console.log(")) {
        diagnostics.push({ line: lineNum, column: line.indexOf("console.log(") + 1, severity: "warning", message: "Unexpected console statement", source: "no-console" });
      }

      if ((language === "javascript" || language === "typescript") && line.includes("== ") && !line.includes("===")) {
        diagnostics.push({ line: lineNum, column: line.indexOf("== ") + 1, severity: "warning", message: "Expected '===' and instead saw '=='", source: "eqeqeq" });
      }

      if (line.includes("TODO") || line.includes("FIXME") || line.includes("HACK")) {
        diagnostics.push({ line: lineNum, column: line.indexOf("TODO") >= 0 ? line.indexOf("TODO") + 1 : line.indexOf("FIXME") >= 0 ? line.indexOf("FIXME") + 1 : line.indexOf("HACK") + 1, severity: "info", message: `Found ${line.includes("TODO") ? "TODO" : line.includes("FIXME") ? "FIXME" : "HACK"} comment`, source: "no-warning-comments" });
      }

      if (line.length > 120) {
        diagnostics.push({ line: lineNum, column: 121, severity: "warning", message: `Line exceeds maximum length of 120 characters (${line.length})`, source: "max-len" });
      }

      const unusedVarMatch = line.match(/(?:const|let)\s+(\w+)\s*=/);
      if (unusedVarMatch) {
        const varName = unusedVarMatch[1];
        const restOfCode = lines.slice(i + 1).join("\n");
        if (varName.length > 1 && !restOfCode.includes(varName)) {
          diagnostics.push({ line: lineNum, column: line.indexOf(varName) + 1, severity: "warning", message: `'${varName}' is assigned but never used`, source: "no-unused-vars" });
        }
      }

      if (language === "python") {
        if (line.match(/^\s*import \*/)) {
          diagnostics.push({ line: lineNum, column: 1, severity: "warning", message: "Wildcard import detected", source: "no-wildcard-import" });
        }
        if (line.includes("  \t") || line.includes("\t ")) {
          diagnostics.push({ line: lineNum, column: 1, severity: "error", message: "Mixed indentation (tabs and spaces)", source: "mixed-indent" });
        }
      }

      if ((language === "javascript" || language === "typescript") && line.match(/\beval\s*\(/)) {
        diagnostics.push({ line: lineNum, column: line.indexOf("eval(") + 1, severity: "error", message: "eval() is a security risk", source: "no-eval" });
      }
    }

    const bracketStack: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "{" || ch === "(" || ch === "[") bracketStack.push(ch);
        if (ch === "}" || ch === ")" || ch === "]") {
          const expected = ch === "}" ? "{" : ch === ")" ? "(" : "[";
          if (bracketStack.length === 0 || bracketStack[bracketStack.length - 1] !== expected) {
            diagnostics.push({ line: i + 1, column: lines[i].indexOf(ch) + 1, severity: "error", message: `Mismatched bracket: '${ch}'`, source: "bracket-check" });
          } else {
            bracketStack.pop();
          }
        }
      }
    }

    res.json({
      diagnostics,
      summary: {
        errors: diagnostics.filter(d => d.severity === "error").length,
        warnings: diagnostics.filter(d => d.severity === "warning").length,
        info: diagnostics.filter(d => d.severity === "info").length,
      },
    });
  });

  app.post("/api/studio/preview/start", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const { projectId, files, framework } = req.body;

    if (!projectId || !files) return res.status(400).json({ error: "Project ID and files required" });

    const key = `${userId}-${projectId}`;
    const existing = devServers.get(key);
    if (existing && existing.status === "running") {
      return res.json({ status: "running", port: existing.port, url: `/api/studio/preview/proxy/${projectId}` });
    }

    const port = 9000 + Math.floor(Math.random() * 1000);

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const tmpDir = `/tmp/studio-preview-${userId}-${projectId}`;
      await fs.mkdir(tmpDir, { recursive: true });

      for (const file of files) {
        const filePath = path.join(tmpDir, file.name);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, file.content);
      }

      const hasIndex = files.some((f: any) => f.name === "index.html");
      if (hasIndex) {
        const { exec } = await import("child_process");
        const child = exec(`npx serve -l ${port} -s`, { cwd: tmpDir });
        devServers.set(key, { process: child, port, status: "running" });

        child.on("exit", () => {
          devServers.set(key, { process: null, port, status: "stopped" });
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        res.json({ status: "running", port, url: `/api/studio/preview/proxy/${projectId}` });
      } else {
        const previewHtml = generatePreviewHtml(files);
        await fs.writeFile(path.join(tmpDir, "_preview.html"), previewHtml);
        res.json({ status: "static", html: previewHtml });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to start preview" });
    }
  });

  app.post("/api/studio/preview/stop", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    const { projectId } = req.body;
    const key = `${userId}-${projectId}`;
    const server = devServers.get(key);
    if (server?.process) {
      try { server.process.kill(); } catch { }
      devServers.delete(key);
    }
    res.json({ stopped: true });
  });

  app.get("/api/studio/integrations/status", isAuthenticated, (req: any, res: Response) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    res.json({
      github: { connected: githubTokens.has(userId), configured: !!GITHUB_CLIENT_ID },
      vercel: { connected: vercelTokens.has(userId) },
      trusthub: { available: true },
    });
  });
}

function generatePreviewHtml(files: { name: string; content: string }[]): string {
  const htmlFile = files.find(f => f.name.endsWith(".html"));
  const cssFiles = files.filter(f => f.name.endsWith(".css"));
  const jsFiles = files.filter(f => f.name.endsWith(".js") && !f.name.endsWith(".test.js"));

  if (htmlFile) {
    let html = htmlFile.content;
    for (const css of cssFiles) {
      if (!html.includes(css.name)) {
        html = html.replace("</head>", `<style>${css.content}</style></head>`);
      }
    }
    for (const js of jsFiles) {
      if (!html.includes(js.name)) {
        html = html.replace("</body>", `<script>${js.content}</script></body>`);
      }
    }
    return html;
  }

  let preview = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title>`;
  for (const css of cssFiles) {
    preview += `<style>${css.content}</style>`;
  }
  preview += `</head><body>`;
  preview += `<div id="root"></div>`;
  for (const js of jsFiles) {
    preview += `<script>${js.content}</script>`;
  }
  preview += `</body></html>`;
  return preview;
}
