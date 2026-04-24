# GarageBot Marketing Hub - Complete Handoff

## Files Included
- `garagebot-marketing-hub.tsx` - Full frontend UI (8,333 lines)
- This document - Backend setup instructions

---

## 1. DATABASE SCHEMA (add to shared/schema.ts)

```typescript
import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

// Marketing Posts for content library
export const marketingPosts = pgTable("marketing_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('garagebot'),
  content: text("content").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // facebook, instagram, x, nextdoor
  hashtags: text("hashtags").array(),
  imageFilename: varchar("image_filename", { length: 255 }),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Images library
export const marketingImages = pgTable("marketing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('garagebot'),
  filename: varchar("filename", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meta (Facebook/Instagram) Integration
export const metaIntegrations = pgTable("meta_integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().unique(),
  facebookPageId: varchar("facebook_page_id", { length: 100 }),
  facebookPageName: varchar("facebook_page_name", { length: 255 }),
  facebookPageAccessToken: text("facebook_page_access_token"),
  facebookConnected: boolean("facebook_connected").default(false),
  instagramAccountId: varchar("instagram_account_id", { length: 100 }),
  instagramUsername: varchar("instagram_username", { length: 100 }),
  instagramConnected: boolean("instagram_connected").default(false),
  twitterApiKey: varchar("twitter_api_key", { length: 255 }),
  twitterApiSecret: varchar("twitter_api_secret", { length: 255 }),
  twitterAccessToken: varchar("twitter_access_token", { length: 255 }),
  twitterAccessTokenSecret: varchar("twitter_access_token_secret", { length: 255 }),
  twitterUsername: varchar("twitter_username", { length: 100 }),
  twitterConnected: boolean("twitter_connected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled Posts tracking
export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  scheduledFor: timestamp("scheduled_for").notNull(),
  postedAt: timestamp("posted_at"),
  externalPostId: varchar("external_post_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default('pending'), // pending, posted, failed
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 2. SECRETS NEEDED (Replit Secrets)

```
META_APP_ID          - Facebook App ID
META_APP_SECRET      - Facebook App Secret  
TWITTER_API_KEY      - X/Twitter API Key
TWITTER_API_SECRET   - X/Twitter API Secret
TWITTER_ACCESS_TOKEN - X/Twitter Access Token
TWITTER_ACCESS_TOKEN_SECRET - X/Twitter Access Token Secret
```

---

## 3. SOCIAL CONNECTORS (server/social-connectors.ts)

```typescript
import crypto from 'crypto';

export interface DeployResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

export class TwitterConnector {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;

  constructor() {
    this.apiKey = process.env.TWITTER_API_KEY || '';
    this.apiSecret = process.env.TWITTER_API_SECRET || '';
    this.accessToken = process.env.TWITTER_ACCESS_TOKEN || '';
    this.accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || '';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret && this.accessToken && this.accessTokenSecret);
  }

  private getOAuthHeader(method: string, url: string): string {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.accessToken,
      oauth_version: '1.0',
    };
    const signature = generateOAuthSignature(method, url, oauthParams, this.apiSecret, this.accessTokenSecret);
    oauthParams.oauth_signature = signature;
    const headerParts = Object.keys(oauthParams).filter(k => k.startsWith('oauth_')).sort()
      .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`);
    return `OAuth ${headerParts.join(', ')}`;
  }

  async post(text: string): Promise<DeployResult> {
    if (!this.isConfigured()) return { success: false, error: 'Twitter not configured' };
    try {
      const url = 'https://api.twitter.com/2/tweets';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.getOAuthHeader('POST', url),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok && data.data?.id) {
        return { success: true, externalId: data.data.id };
      }
      return { success: false, error: JSON.stringify(data) };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export async function postToFacebook(
  pageId: string,
  pageToken: string,
  message: string,
  imageUrl?: string
): Promise<DeployResult> {
  try {
    let url: string;
    let body: any;
    if (imageUrl) {
      url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      body = { url: imageUrl, message, access_token: pageToken };
    } else {
      url = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      body = { message, access_token: pageToken };
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.id || data.post_id) {
      return { success: true, externalId: data.id || data.post_id };
    }
    return { success: false, error: JSON.stringify(data) };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function postToInstagram(
  accountId: string,
  accessToken: string,
  caption: string,
  imageUrl: string
): Promise<DeployResult> {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
      }
    );
    const containerData = await containerResponse.json();
    if (!containerData.id) {
      return { success: false, error: JSON.stringify(containerData) };
    }
    // Step 2: Publish
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
      }
    );
    const publishData = await publishResponse.json();
    if (publishData.id) {
      return { success: true, externalId: publishData.id };
    }
    return { success: false, error: JSON.stringify(publishData) };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

---

## 4. MARKETING SCHEDULER (server/marketing-scheduler.ts)

```typescript
import { db } from './db';
import { marketingPosts, marketingImages, metaIntegrations, scheduledPosts } from '@shared/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { TwitterConnector, postToFacebook, postToInstagram } from './social-connectors';

const POSTING_HOURS = [8, 10, 12, 14, 16, 18, 20]; // 7 posts/day
const GARAGEBOT_URL = 'https://garagebot.io';

let isRunning = false;
let lastPostHour = -1;

async function getIntegration() {
  const [integration] = await db.select().from(metaIntegrations)
    .where(eq(metaIntegrations.tenantId, 'garagebot')).limit(1);
  return integration;
}

async function getNextPost() {
  const [post] = await db.select().from(marketingPosts)
    .where(and(eq(marketingPosts.tenantId, 'garagebot'), eq(marketingPosts.isActive, true)))
    .orderBy(asc(marketingPosts.usageCount), asc(marketingPosts.lastUsedAt)).limit(1);
  return post;
}

async function getNextImage() {
  const [image] = await db.select().from(marketingImages)
    .where(and(eq(marketingImages.tenantId, 'garagebot'), eq(marketingImages.isActive, true)))
    .orderBy(asc(marketingImages.usageCount), asc(marketingImages.lastUsedAt)).limit(1);
  return image;
}

async function executeScheduledPosts() {
  const now = new Date();
  const hour = now.getHours();
  
  // Only post once per hour slot, and only at designated hours
  if (!POSTING_HOURS.includes(hour) || hour === lastPostHour) return;
  lastPostHour = hour;

  const integration = await getIntegration();
  if (!integration) {
    console.log('[GarageBot Marketing] No integration configured');
    return;
  }

  const post = await getNextPost();
  const image = await getNextImage();
  if (!post && !image) {
    console.log('[GarageBot Marketing] No content available');
    return;
  }

  const message = post 
    ? `${post.content}\n\n${GARAGEBOT_URL}` 
    : `Check out GarageBot - your trusted auto repair estimator!\n\n${GARAGEBOT_URL}`;
  
  // Replace YOUR_DOMAIN with actual domain or object storage URL
  const imageUrl = image ? `https://YOUR_DOMAIN/${image.filePath}` : undefined;

  console.log(`[GarageBot Marketing] Posting at ${hour}:00...`);

  // Facebook
  if (integration.facebookConnected && integration.facebookPageId && integration.facebookPageAccessToken) {
    const result = await postToFacebook(
      integration.facebookPageId, 
      integration.facebookPageAccessToken, 
      message, 
      imageUrl
    );
    console.log(`[GarageBot FB] ${result.success ? 'Posted' : 'Failed'}: ${result.externalId || result.error}`);
  }

  // Instagram (requires image)
  if (integration.instagramConnected && integration.instagramAccountId && imageUrl) {
    const result = await postToInstagram(
      integration.instagramAccountId, 
      integration.facebookPageAccessToken!, 
      message, 
      imageUrl
    );
    console.log(`[GarageBot IG] ${result.success ? 'Posted' : 'Failed'}: ${result.externalId || result.error}`);
  }

  // X/Twitter
  const twitter = new TwitterConnector();
  if (twitter.isConfigured()) {
    // Truncate for Twitter's 280 char limit
    const tweetContent = message.length > 280 ? message.substring(0, 277) + '...' : message;
    const result = await twitter.post(tweetContent);
    console.log(`[GarageBot X] ${result.success ? 'Posted' : 'Failed'}: ${result.externalId || result.error}`);
  }

  // Update usage counts
  if (post) {
    await db.update(marketingPosts)
      .set({ usageCount: sql`${marketingPosts.usageCount} + 1`, lastUsedAt: new Date() })
      .where(eq(marketingPosts.id, post.id));
  }
  if (image) {
    await db.update(marketingImages)
      .set({ usageCount: sql`${marketingImages.usageCount} + 1`, lastUsedAt: new Date() })
      .where(eq(marketingImages.id, image.id));
  }
}

export function startMarketingScheduler() {
  if (isRunning) return;
  console.log('[GarageBot Marketing] Starting scheduler...');
  console.log('[GarageBot Marketing] Post times: 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm');
  isRunning = true;
  
  // Check every minute
  setInterval(() => executeScheduledPosts().catch(console.error), 60 * 1000);
  
  // Initial check
  executeScheduledPosts().catch(console.error);
}
```

---

## 5. API ROUTES (add to server/routes.ts)

```typescript
import { marketingPosts, marketingImages, metaIntegrations, scheduledPosts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { TwitterConnector, postToFacebook, postToInstagram } from './social-connectors';

// Get all posts
app.get('/api/marketing/posts', async (req, res) => {
  const posts = await db.select().from(marketingPosts)
    .where(eq(marketingPosts.tenantId, 'garagebot'));
  res.json(posts);
});

// Create post
app.post('/api/marketing/posts', async (req, res) => {
  const { content, platform, hashtags } = req.body;
  const [post] = await db.insert(marketingPosts)
    .values({ tenantId: 'garagebot', content, platform, hashtags })
    .returning();
  res.json(post);
});

// Delete post
app.delete('/api/marketing/posts/:id', async (req, res) => {
  await db.delete(marketingPosts).where(eq(marketingPosts.id, req.params.id));
  res.json({ success: true });
});

// Get images
app.get('/api/marketing/images', async (req, res) => {
  const images = await db.select().from(marketingImages)
    .where(eq(marketingImages.tenantId, 'garagebot'));
  res.json(images);
});

// Get integration status
app.get('/api/marketing/integration', async (req, res) => {
  const [integration] = await db.select().from(metaIntegrations)
    .where(eq(metaIntegrations.tenantId, 'garagebot'));
  res.json(integration || { 
    facebookConnected: false, 
    instagramConnected: false, 
    twitterConnected: false 
  });
});

// Get scheduled posts
app.get('/api/marketing/scheduled', async (req, res) => {
  const posts = await db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.tenantId, 'garagebot'));
  res.json(posts);
});

// Post now (immediate post)
app.post('/api/marketing/post-now', async (req, res) => {
  const { content, platform, imageUrl } = req.body;
  const [integration] = await db.select().from(metaIntegrations)
    .where(eq(metaIntegrations.tenantId, 'garagebot'));
  
  if (!integration) {
    return res.json({ success: false, error: 'No social accounts connected' });
  }

  let result = { success: false, error: 'Platform not configured' };

  if (platform === 'facebook' || platform === 'all') {
    if (integration.facebookConnected && integration.facebookPageId) {
      result = await postToFacebook(
        integration.facebookPageId,
        integration.facebookPageAccessToken!,
        content,
        imageUrl
      );
    }
  }

  if (platform === 'x' || platform === 'all') {
    const twitter = new TwitterConnector();
    if (twitter.isConfigured()) {
      result = await twitter.post(content);
    }
  }

  if (platform === 'instagram' || platform === 'all') {
    if (integration.instagramConnected && integration.instagramAccountId && imageUrl) {
      result = await postToInstagram(
        integration.instagramAccountId,
        integration.facebookPageAccessToken!,
        content,
        imageUrl
      );
    }
  }

  res.json(result);
});
```

---

## 6. START SCHEDULER (add to server/index.ts)

```typescript
import { startMarketingScheduler } from './marketing-scheduler';

// Add after app.listen():
startMarketingScheduler();
```

---

## 7. FACEBOOK APP SETUP

1. Go to https://developers.facebook.com
2. Create or select your app
3. Add "Facebook Login" product
4. Add permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
5. Generate a Page Access Token (use the Token Debugger to extend to 60 days or never-expiring)
6. Store credentials in the `meta_integrations` table:

```sql
INSERT INTO meta_integrations (tenant_id, facebook_page_id, facebook_page_name, facebook_page_access_token, facebook_connected)
VALUES ('garagebot', 'YOUR_PAGE_ID', 'GarageBot', 'YOUR_TOKEN', true);
```

---

## 8. SEED CONTENT (run once)

```sql
INSERT INTO marketing_posts (tenant_id, content, platform) VALUES
('garagebot', 'Stop overpaying for auto repairs! GarageBot shows you fair prices for any car service.', 'facebook'),
('garagebot', 'Know before you go. GarageBot gives you repair estimates in seconds.', 'facebook'),
('garagebot', 'Mechanics hate this one simple trick... just kidding, they love informed customers!', 'x'),
('garagebot', 'Your car deserves fair pricing. Get instant estimates with GarageBot.', 'instagram'),
('garagebot', 'Brake job quote too high? Check it with GarageBot first.', 'all'),
('garagebot', 'Oil change, brakes, transmission - know the fair price before you pay.', 'all'),
('garagebot', 'Empower yourself at the mechanic. GarageBot has your back.', 'facebook'),
('garagebot', 'No more repair shop anxiety. Get estimates instantly.', 'instagram');
```

---

## 9. FRONTEND SETUP

1. Copy `garagebot-marketing-hub.tsx` to `client/src/pages/marketing-hub.tsx`
2. Add route in `App.tsx`:
```tsx
import MarketingHub from "@/pages/marketing-hub";
// ...
<Route path="/marketing" component={MarketingHub} />
```
3. Update imports - the frontend file references PaintPros-specific assets, you'll need to:
   - Remove/replace image imports at the top
   - Update tenant references from painting to auto repair
   - Adjust color schemes to match GarageBot branding

---

## 10. QUICK ADAPTATION CHECKLIST

- [ ] Add database schema and run `npm run db:push`
- [ ] Add secrets to Replit
- [ ] Create `server/social-connectors.ts`
- [ ] Create `server/marketing-scheduler.ts`
- [ ] Add API routes
- [ ] Start scheduler in index.ts
- [ ] Copy and adapt frontend file
- [ ] Connect Facebook/Instagram via Meta Developer
- [ ] Seed initial content
- [ ] Test posting!

---

## Notes

- The frontend file is built for PaintPros - you'll need to update branding, colors, and image imports
- The scheduler posts 7 times per day (8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm)
- X/Twitter free tier: 500 posts/month - the scheduler includes burst protection
- Instagram REQUIRES an image for every post
- Facebook can post with or without images
