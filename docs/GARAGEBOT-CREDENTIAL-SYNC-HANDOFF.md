# GarageBot ↔ Trust Layer: Credential Sync Integration

> **No redirects. No SSO popups. Just behind-the-scenes credential sync.**
> Users register and log in directly on GarageBot. Trust Layer is notified so the same email + password works everywhere.

---

## How It Works

```
┌─────────────────┐                          ┌───────────────────┐
│    GarageBot     │  ── API calls ──────▶    │   Trust Layer     │
│  (garagebot.io)  │                          │   (dwtl.io)       │
│                  │                          │                   │
│  Own login form  │  1. User registers ──▶   │  Stores same      │
│  Own WelcomeGate │  2. Password change ──▶  │  email + password │
│  Own session mgmt│  3. Verify creds  ◀──▶   │  for all apps     │
└─────────────────┘                          └───────────────────┘
```

- Email is the shared identifier across all DarkWave apps
- GarageBot handles its own login UI (WelcomeGate) - users never see dwtl.io
- Trust Layer hashes passwords with its own salt (SHA-256 + salt)
- GarageBot sends plaintext password over HTTPS + HMAC-signed request

---

## GarageBot Credentials

> **DO NOT commit real credentials to version control.**
> Get your API key and secret from the Trust Layer Owner Admin portal or database.

```
API Key:    <your-dw-api-key>
API Secret: <your-dw-api-secret>
Base URL:   https://dwtl.io
```

Store these as environment variables in GarageBot:
```
TRUST_LAYER_API_KEY=<your-dw-api-key>
TRUST_LAYER_API_SECRET=<your-dw-api-secret>
TRUST_LAYER_BASE_URL=https://dwtl.io
```

---

## Password Policy (Ecosystem-Wide)

Both apps must enforce the same rules:
- 8+ characters minimum
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

---

## Authentication: HMAC-SHA256 Request Signing

Every API call requires 3 headers:

| Header | Value |
|--------|-------|
| `x-app-key` | Your API key |
| `x-app-signature` | HMAC-SHA256(apiSecret, requestBody + timestamp) |
| `x-app-timestamp` | Current Unix timestamp in milliseconds |

Timestamps must be within 5 minutes of server time to prevent replay attacks.

**Important:** The signature is computed over the **exact JSON string** that gets sent as the request body, concatenated with the timestamp. Both sides must use the same bytes. The helper below uses `JSON.stringify(body)` and sends that same string as the `body` parameter to `fetch` - this guarantees the server sees the same bytes used for signing.

### Signing Helper (Copy-Paste for GarageBot)

```typescript
// utils/trustLayerClient.ts
import crypto from 'crypto';

const TRUST_LAYER_API_KEY = process.env.TRUST_LAYER_API_KEY!;
const TRUST_LAYER_API_SECRET = process.env.TRUST_LAYER_API_SECRET!;
const TRUST_LAYER_BASE_URL = process.env.TRUST_LAYER_BASE_URL || 'https://dwtl.io';

async function callTrustLayer(endpoint: string, body: Record<string, any>) {
  const timestamp = Date.now().toString();
  const bodyString = JSON.stringify(body);
  
  const signature = crypto
    .createHmac('sha256', TRUST_LAYER_API_SECRET)
    .update(bodyString + timestamp)
    .digest('hex');

  const response = await fetch(`${TRUST_LAYER_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': TRUST_LAYER_API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
    body: bodyString,
  });

  return response.json();
}

export { callTrustLayer };
```

---

## Endpoint 1: Sync User (Registration)

**When to call:** After a user successfully registers on GarageBot.

```
POST /api/ecosystem/sync-user
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "displayName": "John Doe",
  "username": "johndoe"
}
```

**Response (new user):**
```json
{
  "success": true,
  "action": "created",
  "userId": "abc-123-def",
  "signupPosition": "4521"
}
```

**Response (user already exists on Trust Layer, no password set):**
```json
{
  "success": true,
  "action": "password_set",
  "userId": "abc-123-def"
}
```

**Response (user already exists with password):**
```json
{
  "success": true,
  "action": "already_exists",
  "userId": "abc-123-def"
}
```

### GarageBot Integration Code

```typescript
// Call this in your registration handler AFTER saving the user locally
import { callTrustLayer } from './utils/trustLayerClient';

async function onUserRegistered(email: string, password: string, displayName?: string, username?: string) {
  try {
    const result = await callTrustLayer('/api/ecosystem/sync-user', {
      email,
      password,
      displayName: displayName || undefined,
      username: username || undefined,
    });
    
    console.log(`[TrustLayer Sync] User ${email}: ${result.action}`);
    // result.action is "created", "password_set", or "already_exists"
    return result;
  } catch (error) {
    // Don't block GarageBot registration if Trust Layer is down
    console.error('[TrustLayer Sync] Failed to sync user:', error);
    return null;
  }
}
```

---

## Endpoint 2: Sync Password (Password Change)

**When to call:** After a user changes their password on GarageBot.

```
POST /api/ecosystem/sync-password
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "NewSecurePass2!"
}
```

**Response:**
```json
{
  "success": true,
  "action": "password_updated",
  "userId": "abc-123-def"
}
```

### GarageBot Integration Code

```typescript
import { callTrustLayer } from './utils/trustLayerClient';

async function onPasswordChanged(email: string, newPassword: string) {
  try {
    const result = await callTrustLayer('/api/ecosystem/sync-password', {
      email,
      newPassword,
    });
    
    console.log(`[TrustLayer Sync] Password updated for ${email}`);
    return result;
  } catch (error) {
    console.error('[TrustLayer Sync] Failed to sync password:', error);
    return null;
  }
}
```

---

## Endpoint 3: Verify Credentials (Optional)

**When to call:** If a user tries to log in on GarageBot but doesn't have a local account. You can check if they exist on Trust Layer with a valid password.

```
POST /api/ecosystem/verify-credentials
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "userId": "abc-123-def",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "profileImageUrl": null
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "reason": "invalid_password"
}
```

**Response (user not found):**
```json
{
  "valid": false,
  "reason": "user_not_found"
}
```

### GarageBot Integration Code

```typescript
import { callTrustLayer } from './utils/trustLayerClient';

async function verifyWithTrustLayer(email: string, password: string) {
  try {
    const result = await callTrustLayer('/api/ecosystem/verify-credentials', {
      email,
      password,
    });
    
    if (result.valid) {
      // User exists on Trust Layer with valid password
      // Create local GarageBot account for them
      console.log(`[TrustLayer] Verified user ${email}, creating local account`);
      return {
        verified: true,
        userId: result.userId,
        displayName: result.displayName,
        username: result.username,
      };
    }
    
    return { verified: false, reason: result.reason };
  } catch (error) {
    console.error('[TrustLayer] Verification failed:', error);
    return { verified: false, reason: 'network_error' };
  }
}
```

---

## Complete Login Flow for GarageBot

Here's the recommended flow combining all 3 endpoints:

```typescript
// server/auth.ts (GarageBot side)

import { callTrustLayer } from './utils/trustLayerClient';

// REGISTRATION
async function handleRegistration(email: string, password: string, displayName: string, username: string) {
  // 1. Validate password locally (same rules)
  // 2. Create local GarageBot account
  // 3. Sync to Trust Layer (fire-and-forget, don't block signup)
  
  // ... your local account creation ...
  
  // Sync in background
  callTrustLayer('/api/ecosystem/sync-user', { email, password, displayName, username })
    .then(r => console.log('[Sync]', r.action))
    .catch(e => console.error('[Sync Error]', e));
}

// LOGIN
async function handleLogin(email: string, password: string) {
  // 1. Check local GarageBot database first
  const localUser = await findLocalUser(email);
  
  if (localUser) {
    // Verify against local password hash
    if (verifyLocalPassword(password, localUser.passwordHash)) {
      return { success: true, user: localUser };
    }
    return { success: false, error: 'Invalid password' };
  }
  
  // 2. User not in GarageBot? Check Trust Layer
  const tlResult = await callTrustLayer('/api/ecosystem/verify-credentials', { email, password });
  
  if (tlResult.valid) {
    // Create local account from Trust Layer data
    const newLocalUser = await createLocalUser({
      email,
      password, // hash locally too
      displayName: tlResult.displayName,
      username: tlResult.username,
    });
    return { success: true, user: newLocalUser, source: 'trust_layer' };
  }
  
  return { success: false, error: 'Invalid email or password' };
}

// PASSWORD CHANGE
async function handlePasswordChange(email: string, newPassword: string) {
  // 1. Update local password
  // ... your local password update ...
  
  // 2. Sync to Trust Layer
  callTrustLayer('/api/ecosystem/sync-password', { email, newPassword })
    .then(r => console.log('[Sync]', r.action))
    .catch(e => console.error('[Sync Error]', e));
}
```

---

## Error Handling

| HTTP Status | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Missing or invalid fields (check `error` message) |
| 401 | Invalid API key, expired timestamp, or bad HMAC signature |
| 404 | User not found (sync-password only) |
| 429 | Rate limited - too many requests |
| 500 | Server error |

---

## Key Rules

1. **GarageBot sends plaintext password** (over HTTPS + HMAC). Trust Layer hashes it.
2. **Don't block registration** if Trust Layer sync fails. Sync in background.
3. **Email is always lowercase** - both apps normalize to lowercase before storing/comparing.
4. **Same password policy everywhere** - enforce the same 8+ char rules on GarageBot.
5. **Timestamps expire in 5 minutes** - HMAC signatures with old timestamps are rejected.
6. **Trust Layer NEVER redirects users** - all syncing is server-to-server API calls.
