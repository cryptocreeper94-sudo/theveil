import { OrbitEcosystemClient } from './ecosystem-client';

const client = new OrbitEcosystemClient();

const snippet = {
  title: 'Trust Layer Gateway Connection',
  language: 'typescript',
  category: 'integration',
  description: 'Complete integration guide for connecting any agent or application to the Trust Layer ecosystem. Includes authentication, membership, domain resolution, and API endpoints.',
  code: `/**
 * TRUST LAYER GATEWAY CONNECTION GUIDE
 * Version: 1.0.0
 * 
 * Connect your agent or application to the Trust Layer ecosystem.
 * Primary gateway: tlid.io (Trust Layer ID)
 * 
 * WHAT YOU GET:
 * - Unified membership system (one Trust Layer ID per person)
 * - .tlid domain resolution (yourname.tlid → your website)
 * - Firebase authentication sync
 * - Cross-app identity verification
 * 
 * BASE URLS:
 * - Production: https://tlid.io
 * - Alt domains: dwtl.io, darkwavestudios.io, darkwavegames.io, yourlegacy.io
 */

// ==================== CONFIGURATION ====================

const TRUST_LAYER_CONFIG = {
  baseUrl: 'https://tlid.io',
  headers: {
    'Content-Type': 'application/json',
    'x-entry-point': 'YOUR_APP_DOMAIN', // Replace with your domain
    'x-forwarded-proto': 'https',
  },
};

// ==================== AUTHENTICATION ====================

/**
 * Sync a Firebase user to Trust Layer
 * Call this after Firebase authentication
 */
async function syncFirebaseUser(firebaseToken: string): Promise<{
  id: string;
  email: string;
  trustLayerId: string;
  memberNumber: number;
}> {
  const response = await fetch(\`\${TRUST_LAYER_CONFIG.baseUrl}/api/auth/firebase-sync\`, {
    method: 'POST',
    headers: {
      ...TRUST_LAYER_CONFIG.headers,
      'Authorization': \`Bearer \${firebaseToken}\`,
    },
  });
  return response.json();
}

/**
 * Get user's Trust Layer membership status
 */
async function getMembership(authToken: string): Promise<{
  trustLayerId: string;
  status: 'pending' | 'active';
  message: string;
}> {
  const response = await fetch(\`\${TRUST_LAYER_CONFIG.baseUrl}/api/user/membership\`, {
    method: 'GET',
    headers: {
      ...TRUST_LAYER_CONFIG.headers,
      'Authorization': \`Bearer \${authToken}\`,
    },
  });
  return response.json();
}

// ==================== DOMAIN RESOLUTION ====================

/**
 * Resolve a .tlid subdomain to its target URL
 * Example: resolve('jason') → 'https://jasons-website.com'
 */
async function resolveTlidDomain(subdomain: string): Promise<{
  target: string;
  owner?: string;
}> {
  const response = await fetch(
    \`\${TRUST_LAYER_CONFIG.baseUrl}/api/domains/resolve/\${subdomain}\`,
    { headers: TRUST_LAYER_CONFIG.headers }
  );
  return response.json();
}

/**
 * Check if a .tlid domain name is available
 */
async function checkDomainAvailability(name: string): Promise<{
  available: boolean;
  price?: number;
}> {
  const response = await fetch(
    \`\${TRUST_LAYER_CONFIG.baseUrl}/api/domains/check/\${name}\`,
    { headers: TRUST_LAYER_CONFIG.headers }
  );
  return response.json();
}

// ==================== ROUTING SETUP ====================

/**
 * If you're proxying tlid.io traffic, use this routing:
 * 
 * tlid.io (root) → Proxy to Trust Layer portal /
 * *.tlid.io (subdomains) → Call resolveTlidDomain() then redirect
 */

async function handleTlidRequest(host: string, path: string): Promise<string> {
  // Root domain
  if (host === 'tlid.io' || host === 'www.tlid.io') {
    return \`\${TRUST_LAYER_CONFIG.baseUrl}\${path}\`;
  }
  
  // Subdomain
  const subdomain = host.replace('.tlid.io', '');
  const resolved = await resolveTlidDomain(subdomain);
  return resolved.target + path;
}

// ==================== API ENDPOINTS REFERENCE ====================

const API_ENDPOINTS = {
  // Authentication
  'POST /api/auth/firebase-sync': 'Sync Firebase user, returns Trust Layer ID',
  'POST /api/auth/register': 'Email/password registration',
  'POST /api/auth/login': 'Email/password login',
  'POST /api/auth/logout': 'End session',
  
  // Membership
  'GET /api/user/membership': 'Get Trust Layer ID and status',
  'GET /api/user/member-number': 'Get signup position',
  
  // Domains (.tlid)
  'GET /api/domains/resolve/:subdomain': 'Resolve to target URL',
  'GET /api/domains/check/:name': 'Check availability',
  'GET /api/domains': 'List user domains (auth required)',
  'POST /api/domains': 'Register domain (auth required)',
  
  // Wallet & Tokens
  'GET /api/wallet': 'Get wallet balance',
  'GET /api/wallet/shells': 'Get Shells balance',
  
  // Presale
  'GET /api/presale/stats': 'Public presale statistics',
};

// ==================== CORS ORIGINS ====================

const ALLOWED_ORIGINS = [
  'https://tlid.io',
  'https://*.tlid.io',
  'https://dwtl.io',
  'https://darkwavestudios.io',
  'https://darkwavegames.io',
  'https://yourlegacy.io',
  'https://chronochat.io',
];

// ==================== INTEGRATION EXAMPLE ====================

class TrustLayerClient {
  private baseUrl: string;
  private entryPoint: string;

  constructor(entryPoint: string) {
    this.baseUrl = 'https://tlid.io';
    this.entryPoint = entryPoint;
  }

  private async request(method: string, path: string, token?: string, body?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-entry-point': this.entryPoint,
    };
    if (token) headers['Authorization'] = \`Bearer \${token}\`;

    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  }

  async syncUser(firebaseToken: string) {
    return this.request('POST', '/api/auth/firebase-sync', firebaseToken);
  }

  async getMembership(token: string) {
    return this.request('GET', '/api/user/membership', token);
  }

  async resolveDomain(subdomain: string) {
    return this.request('GET', \`/api/domains/resolve/\${subdomain}\`);
  }
}

// Usage:
// const tl = new TrustLayerClient('myapp.io');
// const user = await tl.syncUser(firebaseToken);
// console.log('Trust Layer ID:', user.trustLayerId);

export { TrustLayerClient, TRUST_LAYER_CONFIG, API_ENDPOINTS };
`
};

async function pushToHub() {
  try {
    if (!client.isConfigured()) {
      console.log('[Trust Layer Hub] API credentials not configured. Snippet saved locally.');
      console.log('[Trust Layer Hub] Set TRUSTLAYER_HUB_API_KEY and TRUSTLAYER_HUB_API_SECRET to push.');
      return { success: false, reason: 'not_configured' };
    }
    
    const result = await client.pushSnippet(snippet);
    console.log('[Trust Layer Hub] Pushed connection guide:', JSON.stringify(result, null, 2));
    return { success: true, result };
  } catch (error: any) {
    console.error('[Trust Layer Hub] Push error:', error.message);
    return { success: false, error: error.message };
  }
}

pushToHub();
