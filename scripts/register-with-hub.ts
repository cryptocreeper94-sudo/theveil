import crypto from 'crypto';

const HUB_URL = 'https://orbitstaffing.io';
const APP_ID = process.env.DARKWAVE_API_KEY || '';
const API_SECRET = process.env.DARKWAVE_API_SECRET || '';

const appRegistration = {
  appName: "DarkWave Chain",
  appSlug: "darkwave-chain",
  appUrl: "https://darkwavechain.io",
  description: "Layer 1 blockchain powering the DarkWave ecosystem with 400ms block times, 200K+ TPS capacity, and native DWT token.",
  category: "blockchain",
  permissions: ["snippets:read", "snippets:write", "logs:read", "logs:write"]
};

async function main() {
  console.log('Registering DarkWave Chain with Team Hub...');
  
  if (!APP_ID || !API_SECRET) {
    console.log('Missing credentials. Trying without auth...');
  }

  const bodyStr = JSON.stringify(appRegistration);
  const timestamp = Date.now().toString();
  const payload = timestamp + bodyStr;
  const signature = crypto.createHmac('sha256', API_SECRET).update(payload).digest('hex');

  const response = await fetch(`${HUB_URL}/api/admin/ecosystem/register-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DarkWave-App-ID': APP_ID,
      'X-DarkWave-Signature': signature,
      'X-DarkWave-Timestamp': timestamp
    },
    body: bodyStr
  });

  const result = await response.json();
  console.log('Response:', response.status, JSON.stringify(result, null, 2));
  
  if (result.appId && result.apiKey) {
    console.log('\n=== SAVE THESE CREDENTIALS ===');
    console.log('App ID:', result.appId);
    console.log('API Key:', result.apiKey);
    console.log('API Secret:', result.apiSecret);
    console.log('================================\n');
  }
}

main().catch(console.error);
