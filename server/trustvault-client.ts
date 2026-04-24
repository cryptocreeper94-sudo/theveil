import crypto from "crypto";

const TRUSTVAULT_API_KEY = process.env.TRUSTVAULT_API_KEY || "";
const TRUSTVAULT_API_SECRET = process.env.TRUSTVAULT_API_SECRET || "";
const TRUSTVAULT_API_BASE = process.env.TRUSTVAULT_API_BASE || "https://trustvault.replit.app/api/studio";

function generateHmacHeaders(method: string, path: string, body?: object): Record<string, string> {
  const timestamp = Date.now().toString();
  const bodyHash = body && Object.keys(body).length > 0
    ? crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")
    : "";
  const canonical = `${method.toUpperCase()}:${path}:${TRUSTVAULT_API_KEY}:${timestamp}:${bodyHash}`;
  const signature = crypto.createHmac("sha256", TRUSTVAULT_API_SECRET).update(canonical).digest("hex");

  return {
    "Content-Type": "application/json",
    "x-blockchain-key": TRUSTVAULT_API_KEY,
    "x-blockchain-signature": signature,
    "x-blockchain-timestamp": timestamp,
  };
}

async function trustVaultRequest(method: string, path: string, body?: object): Promise<any> {
  if (!TRUSTVAULT_API_KEY || !TRUSTVAULT_API_SECRET) {
    console.warn("[TrustVault] API credentials not configured, skipping request");
    return null;
  }

  const url = `${TRUSTVAULT_API_BASE}${path}`;
  const headers = generateHmacHeaders(method, path, body);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[TrustVault] ${method} ${path} failed (${res.status}):`, errText);
      return { error: true, status: res.status, message: errText };
    }

    return await res.json();
  } catch (error: any) {
    console.error(`[TrustVault] ${method} ${path} network error:`, error.message);
    return { error: true, message: error.message };
  }
}

export async function anchorIdentity(trustLayerId: string) {
  return trustVaultRequest("POST", "/identity/anchor", { trustLayerId });
}

export async function registerProvenance(data: {
  trustLayerId: string;
  fileHash: string;
  filename: string;
  contentType: string;
  size: number;
  uploadTimestamp: string;
}) {
  return trustVaultRequest("POST", "/provenance/register", data);
}

export async function verifyTrust(requesterId: string, targetId: string) {
  return trustVaultRequest("POST", "/trust/verify", { requesterId, targetId });
}

export async function transferSignal(fromTrustLayerId: string, toTrustLayerId: string, amount: number) {
  return trustVaultRequest("POST", "/signal/transfer", { fromTrustLayerId, toTrustLayerId, amount });
}

export async function registerBookProvenance(data: {
  trustLayerId: string;
  bookId: string;
  title: string;
  authorName: string;
  contentHash: string;
  wordCount: number;
  publishedAt: string;
}) {
  const fileHash = crypto.createHash("sha256").update(
    `${data.bookId}:${data.title}:${data.contentHash}:${data.publishedAt}`
  ).digest("hex");

  return registerProvenance({
    trustLayerId: data.trustLayerId,
    fileHash,
    filename: `trustbook://${data.bookId}/${data.title}`,
    contentType: "application/trustbook+publication",
    size: data.wordCount,
    uploadTimestamp: data.publishedAt,
  });
}

export function isConfigured(): boolean {
  return !!(TRUSTVAULT_API_KEY && TRUSTVAULT_API_SECRET);
}

export const trustVaultClient = {
  anchorIdentity,
  registerProvenance,
  verifyTrust,
  transferSignal,
  registerBookProvenance,
  isConfigured,
};
