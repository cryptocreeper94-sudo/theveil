# tlid.io Integration Guide

## Quick Start for Agents
```
GET https://tlid.io/api/ecosystem/connection  → Full integration specs
GET https://tlid.io/api/ecosystem/status      → Test connection (add X-App-Name header)
```

## Overview
tlid.io is the Trust Layer ID gateway. This portal handles all membership, authentication, and domain resolution.

## Routing Configuration

| Request | Forward To |
|---------|-----------|
| `tlid.io` (root) | `https://tlid.io/` |
| `*.tlid.io` (subdomains) | `https://tlid.io/api/domains/resolve/:subdomain` |

## Required Headers
Pass these headers on all proxied requests:
```
x-entry-point: tlid.io
x-forwarded-host: [original host]
x-forwarded-proto: https
```

Forward all authentication headers as-is:
- `Authorization: Bearer [firebase-token]`
- `Cookie: [session cookies]`

## API Endpoints

### Authentication
- `POST /api/auth/firebase-sync` - Sync Firebase user to Trust Layer
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login

### Membership
- `GET /api/user/membership` - Get user's Trust Layer ID and status

### Domain Resolution
- `GET /api/domains/resolve/:subdomain` - Returns target URL for .tlid subdomain
- `GET /api/domains/check/:name` - Check if domain name is available

## CORS Origins (Already Configured)
- `https://tlid.io`
- `https://*.tlid.io`

## Response Format
All API responses return JSON:
```json
{
  "success": true,
  "data": { ... }
}
```

Or on error:
```json
{
  "error": "Error message"
}
```

## Domain Resolution Flow
1. User visits `jason.tlid.io`
2. Proxy calls `GET /api/domains/resolve/jason`
3. API returns `{ "target": "https://jasons-website.com" }`
4. Proxy redirects or reverse-proxies to target
