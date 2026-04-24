import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const SCHEMA_PATH = path.join(process.cwd(), 'shared/schema.ts');
const API_BASE = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000';

function getCurrentVersion(): string {
  const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const match = content.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  return match ? match[1] : '1.0.0';
}

function bumpVersion(version: string): string {
  const parts = version.replace(/-.*$/, '').split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function updateVersion(newVersion: string): void {
  let content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  content = content.replace(
    /APP_VERSION\s*=\s*"[^"]+"/,
    `APP_VERSION = "${newVersion}"`
  );
  fs.writeFileSync(SCHEMA_PATH, content);
  console.log(`[Release] Version updated to ${newVersion}`);
}

async function stampToChains(version: string): Promise<void> {
  const apiKey = process.env.DARKWAVE_API_KEY;
  if (!apiKey) {
    console.log(`[Release] Chain stamping skipped (no API key configured)`);
    return;
  }

  const dataHash = crypto
    .createHash('sha256')
    .update(`darkwave-chain-portal-v${version}-${Date.now()}`)
    .digest('hex');

  console.log(`[Release] Stamping version ${version} to chains...`);
  console.log(`[Release] Data hash: ${dataHash}`);

  try {
    const response = await fetch(`${API_BASE}/api/stamp/dual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        dataHash,
        appId: 'darkwave-chain-portal',
        appName: 'DarkWave Chain Portal',
        category: 'release',
        metadata: JSON.stringify({
          version,
          timestamp: new Date().toISOString(),
          type: 'portal-release',
        }),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Release] Stamp created: ${result.stampId || 'success'}`);
      console.log(`[Release] DarkWave: ${result.darkwave?.status || 'pending'}`);
      console.log(`[Release] Solana: ${result.solana?.status || 'pending'}`);
    } else {
      console.log(`[Release] Stamp API returned ${response.status} - continuing build`);
    }
  } catch (error) {
    console.log(`[Release] Chain stamping skipped (server not running during build)`);
  }
}

async function generateHallmark(version: string): Promise<void> {
  const apiKey = process.env.DARKWAVE_API_KEY;
  if (!apiKey) {
    console.log(`[Release] Hallmark generation skipped (no API key configured)`);
    return;
  }

  console.log(`[Release] Generating hallmark for v${version}...`);

  try {
    const response = await fetch(`${API_BASE}/api/hallmark/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        appId: 'darkwave-chain-portal',
        appName: 'DarkWave Chain Portal',
        productName: 'Portal Release',
        version,
        releaseType: 'release',
        metadata: JSON.stringify({
          buildTime: new Date().toISOString(),
        }),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Release] Hallmark: ${result.hallmarkId}`);
    } else {
      console.log(`[Release] Hallmark API returned ${response.status} - continuing build`);
    }
  } catch (error) {
    console.log(`[Release] Hallmark generation skipped (server not running during build)`);
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  DarkWave Chain Portal - Release Script');
  console.log('========================================\n');

  const currentVersion = getCurrentVersion();
  console.log(`[Release] Current version: ${currentVersion}`);

  const newVersion = bumpVersion(currentVersion);
  updateVersion(newVersion);

  await stampToChains(newVersion);
  await generateHallmark(newVersion);

  console.log('\n[Release] Complete! Building app...\n');
}

main().catch(console.error);
