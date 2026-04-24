import type { Express } from "express";

interface RouteInfo {
  method: string;
  path: string;
  category: string;
  description: string;
  auth?: string;
  tags: string[];
}

const CATEGORY_MAP: Record<string, { tag: string; description: string }> = {
  "/api/auth/": { tag: "Authentication", description: "User authentication, sessions, SSO, PIN, phone auth" },
  "/api/owner/": { tag: "Owner Admin", description: "Owner administration portal" },
  "/api/admin/": { tag: "Admin", description: "Administrative operations" },
  "/api/blockchain/": { tag: "Blockchain", description: "Blockchain engine, blocks, transactions, validators" },
  "/api/wallet/": { tag: "Wallet", description: "Multi-chain wallet operations" },
  "/api/staking/": { tag: "Staking", description: "Staking pools, rewards, and liquid staking" },
  "/api/defi/": { tag: "DeFi", description: "DEX, token swaps, liquidity pools" },
  "/api/nft/": { tag: "NFT", description: "NFT marketplace, minting, and gallery" },
  "/api/faucet/": { tag: "Faucet", description: "Testnet token faucet" },
  "/api/bridge/": { tag: "Bridge", description: "Cross-chain bridge operations" },
  "/api/chronicles/": { tag: "Chronicles", description: "Chronicles parallel life simulation" },
  "/api/chat/": { tag: "Signal Chat", description: "Signal Chat messaging platform" },
  "/api/guardian/": { tag: "Guardian", description: "Guardian Scanner and security tools" },
  "/api/screener/": { tag: "Guardian Screener", description: "DEX screener with Pulse Safety Engine" },
  "/api/identity/": { tag: "TrustVault Identity", description: "Identity anchoring and verification" },
  "/api/provenance/": { tag: "TrustVault Provenance", description: "Media provenance registration" },
  "/api/trust/": { tag: "TrustVault Trust Engine", description: "Trust scoring and relationships" },
  "/api/signal/": { tag: "Signal Token", description: "SIG token balance and transfers" },
  "/api/shells/": { tag: "Shells Economy", description: "Pre-launch virtual currency system" },
  "/api/credits/": { tag: "Credits", description: "AI credits management" },
  "/api/referral/": { tag: "Referrals", description: "Referral rewards and tracking" },
  "/api/stripe/": { tag: "Payments", description: "Stripe payment processing" },
  "/api/coinbase/": { tag: "Payments", description: "Coinbase Commerce integration" },
  "/api/subscription/": { tag: "Subscriptions", description: "Subscription management and billing" },
  "/api/academy/": { tag: "Academy", description: "Academy education platform" },
  "/api/member/": { tag: "Membership", description: "Trust Layer membership and cards" },
  "/api/business/": { tag: "Business", description: "Business tenant portals" },
  "/api/ecosystem/": { tag: "Ecosystem", description: "Cross-app ecosystem and SSO" },
  "/api/partner/": { tag: "Partners", description: "Business partner verification" },
  "/api/marketing/": { tag: "Marketing", description: "Marketing automation system" },
  "/api/blog/": { tag: "Blog", description: "Blog and content management" },
  "/api/studio/": { tag: "Trust Studio", description: "Web IDE and code execution" },
  "/api/domain/": { tag: "Domains", description: "TLID blockchain domain service" },
  "/api/void/": { tag: "The Void", description: "Premium membership identity system" },
  "/api/veil/": { tag: "Through The Veil", description: "eBook reader platform" },
  "/api/torque/": { tag: "Torque", description: "Automotive marketplace" },
  "/api/pulse/": { tag: "Pulse", description: "AI predictive market intelligence" },
  "/api/innovation/": { tag: "Innovation Hub", description: "Innovation features and quest mining" },
  "/api/multisig/": { tag: "Multi-SIG", description: "Multi-signature wallet operations" },
  "/api/launchpad/": { tag: "Token Launchpad", description: "Token launch and presale" },
  "/api/airdrop/": { tag: "Airdrop", description: "Pre-launch airdrop system" },
  "/api/zealy/": { tag: "Zealy", description: "Zealy quest integration" },
  "/api/user/": { tag: "User", description: "User profile and settings" },
  "/api/documents": { tag: "Documents", description: "Trust documents and whitepapers" },
  "/api/contact": { tag: "Contact", description: "Contact form and feedback" },
  "/api/feedback": { tag: "Contact", description: "User feedback" },
  "/api/health": { tag: "System", description: "Health checks and system status" },
  "/api/system/": { tag: "System", description: "System health and diagnostics" },
  "/api/chain/": { tag: "Chain Info", description: "Blockchain network information" },
  "/api/generate": { tag: "AI", description: "AI content generation" },
  "/api/gift": { tag: "Gifts", description: "Gift card system" },
};

function categorizeRoute(path: string): { tag: string; description: string } {
  for (const [prefix, info] of Object.entries(CATEGORY_MAP)) {
    if (path.startsWith(prefix)) return info;
  }
  return { tag: "General", description: "General API endpoints" };
}

function pathToOperationId(method: string, path: string): string {
  return `${method}_${path.replace(/[/:{}]/g, "_").replace(/__+/g, "_").replace(/^_|_$/g, "")}`;
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/:([a-zA-Z]+)/g);
  return matches ? matches.map((m) => m.substring(1)) : [];
}

function convertExpressPath(path: string): string {
  return path.replace(/:([a-zA-Z]+)/g, "{$1}");
}

export function generateOpenAPISpec(app: Express): any {
  const routes: RouteInfo[] = [];
  const stack = (app as any)._router?.stack || [];

  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route.path;
      if (typeof path !== "string" || !path.startsWith("/api/")) continue;
      if (path === "/api/stripe/webhook" || path === "/api/coinbase/webhook" || path === "/api/zealy/webhook") continue;

      for (const method of Object.keys(layer.route.methods)) {
        const cat = categorizeRoute(path);
        routes.push({
          method: method.toUpperCase(),
          path,
          category: cat.tag,
          description: cat.description,
          tags: [cat.tag],
        });
      }
    }
  }

  const tags = Array.from(new Set(routes.map((r) => r.tags[0]))).sort().map((name) => {
    const info = Object.values(CATEGORY_MAP).find((c) => c.tag === name);
    return { name, description: info?.description || name };
  });

  const paths: Record<string, any> = {};
  for (const route of routes) {
    const openApiPath = convertExpressPath(route.path);
    if (!paths[openApiPath]) paths[openApiPath] = {};

    const params = extractPathParams(route.path);
    const parameters = params.map((p) => ({
      name: p,
      in: "path",
      required: true,
      schema: { type: "string" },
    }));

    const operation: any = {
      operationId: pathToOperationId(route.method.toLowerCase(), route.path),
      tags: route.tags,
      summary: `${route.method} ${route.path}`,
      responses: {
        "200": { description: "Success" },
        "400": { description: "Bad Request" },
        "401": { description: "Unauthorized" },
        "404": { description: "Not Found" },
        "500": { description: "Internal Server Error" },
      },
    };

    if (parameters.length > 0) operation.parameters = parameters;

    if (["POST", "PUT", "PATCH"].includes(route.method)) {
      operation.requestBody = {
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };
    }

    paths[openApiPath][route.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "DarkWave Trust Layer API",
      version: "1.0.0",
      description: `DarkWave Trust Layer (DWTL) is a high-performance Layer 1 PoA blockchain ecosystem providing verified identity, accountability, and transparent audit trails.\n\n**${routes.length} endpoints** across ${tags.length} service categories.\n\n## Authentication\nMost endpoints require session-based authentication via \`/api/auth/login\`. TrustVault API endpoints use HMAC-SHA256 signatures.\n\n## Rate Limiting\nAPI requests are rate-limited per IP. Standard limit: 100 requests/minute.`,
      contact: { name: "DarkWave Trust Layer", url: "https://dwtl.io" },
    },
    servers: [{ url: "/", description: "Current server" }],
    tags,
    paths,
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session cookie authentication",
        },
        hmacAuth: {
          type: "apiKey",
          in: "header",
          name: "x-blockchain-signature",
          description: "HMAC-SHA256 signature for TrustVault API",
        },
      },
    },
  };
}

export function registerApiDocs(app: Express) {
  app.get("/api/docs/openapi.json", (_req, res) => {
    const spec = generateOpenAPISpec(app);
    res.json(spec);
  });

  app.get("/api/docs", (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DarkWave Trust Layer - API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { color: #e2e8f0; }
    .swagger-ui .info .title { color: #22d3ee; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { background: #1e293b; box-shadow: none; }
    .swagger-ui .opblock-tag { color: #e2e8f0; border-bottom: 1px solid #334155; }
    .swagger-ui .opblock .opblock-summary { border: 1px solid #334155; }
    .swagger-ui .opblock.opblock-get { background: rgba(34, 211, 238, 0.05); border-color: #22d3ee; }
    .swagger-ui .opblock.opblock-post { background: rgba(34, 197, 94, 0.05); border-color: #22c55e; }
    .swagger-ui .opblock.opblock-put { background: rgba(234, 179, 8, 0.05); border-color: #eab308; }
    .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.05); border-color: #ef4444; }
    .swagger-ui .opblock.opblock-patch { background: rgba(168, 85, 247, 0.05); border-color: #a855f7; }
    .swagger-ui .btn { border-radius: 8px; }
    .swagger-ui .model-box { background: #1e293b; }
    .swagger-ui section.models { border: 1px solid #334155; }
    .swagger-ui .model { color: #cbd5e1; }
    #swagger-ui { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .header-bar { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 40px; border-bottom: 1px solid #22d3ee33; }
    .header-bar h1 { color: #22d3ee; font-size: 28px; margin: 0 0 8px 0; font-family: system-ui; }
    .header-bar p { color: #94a3b8; margin: 0; font-family: system-ui; }
    .header-bar .badge { display: inline-block; background: #22d3ee22; color: #22d3ee; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-top: 8px; border: 1px solid #22d3ee44; }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>DarkWave Trust Layer API</h1>
    <p>Comprehensive REST API documentation for the DWTL blockchain ecosystem</p>
    <span class="badge">v1.0.0 | Layer 1 PoA Blockchain</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      layout: 'BaseLayout',
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: false,
    });
  </script>
</body>
</html>`);
  });
}
