/**
 * Social Media Connectors
 * Proprietary auto-deployment system for DarkWave Studios
 * Supports: Discord (webhooks), Telegram (bot API), X/Twitter, Facebook
 */

interface DeployResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

/**
 * Deploy to Discord via webhook
 */
async function deployToDiscord(webhookUrl: string, content: string, imageUrl?: string | null): Promise<DeployResult> {
  try {
    const payload: any = { content };
    
    if (imageUrl) {
      payload.embeds = [{
        image: { url: imageUrl }
      }];
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Discord API error: ${response.status} - ${errorText}` };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Telegram via Bot API
 */
async function deployToTelegram(botToken: string, channelId: string, content: string, imageUrl?: string | null): Promise<DeployResult> {
  try {
    const baseUrl = `https://api.telegram.org/bot${botToken}`;
    
    if (imageUrl) {
      // Send photo with caption
      const response = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          photo: imageUrl,
          caption: content,
          parse_mode: 'HTML',
        }),
      });
      
      const data = await response.json();
      if (!data.ok) {
        return { success: false, error: data.description || 'Telegram API error' };
      }
      return { success: true, externalId: String(data.result.message_id) };
    } else {
      // Send text message
      const response = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: content,
          parse_mode: 'HTML',
        }),
      });
      
      const data = await response.json();
      if (!data.ok) {
        return { success: false, error: data.description || 'Telegram API error' };
      }
      return { success: true, externalId: String(data.result.message_id) };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to X/Twitter via API v2 with media upload support
 */
async function deployToTwitter(content: string, imageUrl?: string | null): Promise<DeployResult> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return { success: false, error: 'Twitter API credentials not configured' };
  }
  
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
    
    // If we have an image URL, download and upload it to Twitter
    if (imageUrl) {
      try {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download image from ${imageUrl}: ${imageResponse.status}`);
          // Fall back to text-only tweet
          const tweet = await client.v2.tweet(content);
          return { success: true, externalId: tweet.data.id };
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Upload media to Twitter using v1 API (required for media upload)
        const mediaId = await client.v1.uploadMedia(imageBuffer, { 
          mimeType: 'image/png',
          target: 'tweet'
        });
        
        // Post tweet with media
        const tweet = await client.v2.tweet({
          text: content,
          media: { media_ids: [mediaId] }
        });
        
        return { success: true, externalId: tweet.data.id };
      } catch (mediaError: any) {
        console.error('Media upload failed, posting text-only:', mediaError.message);
        // Fall back to text-only tweet if media upload fails
        const tweet = await client.v2.tweet(content);
        return { success: true, externalId: tweet.data.id };
      }
    }
    
    // Text-only tweet
    const tweet = await client.v2.tweet(content);
    return { success: true, externalId: tweet.data.id };
  } catch (error: any) {
    // If twitter-api-v2 is not installed, return a helpful error
    if (error.code === 'MODULE_NOT_FOUND') {
      return { success: false, error: 'Twitter API library not installed. Run: npm install twitter-api-v2' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Facebook Page via Graph API
 */
async function deployToFacebook(content: string, imageUrl?: string | null): Promise<DeployResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  
  if (!pageId || !pageToken) {
    return { success: false, error: 'Facebook Page credentials not configured' };
  }
  
  try {
    const apiVersion = 'v22.0';
    let url: string;
    let payload: any;
    
    if (imageUrl) {
      url = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
      payload = {
        url: imageUrl,
        message: content,
        access_token: pageToken,
      };
    } else {
      url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      payload = {
        message: content,
        access_token: pageToken,
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message || 'Facebook API error' };
    }
    
    return { success: true, externalId: data.id || data.post_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Main deployment function - routes to appropriate connector
 */
export async function deploySocialPost(
  platform: string,
  content: string,
  imageUrl?: string | null
): Promise<DeployResult> {
  // Convert relative URLs to absolute URLs for social media platforms
  let absoluteImageUrl = imageUrl;
  if (imageUrl && imageUrl.startsWith('/')) {
    const baseUrl = process.env.SITE_BASE_URL || 'https://dwsc.io';
    absoluteImageUrl = `${baseUrl}${imageUrl}`;
  }
  
  switch (platform.toLowerCase()) {
    case 'discord': {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        return { success: false, error: 'Discord webhook URL not configured (DISCORD_WEBHOOK_URL)' };
      }
      return deployToDiscord(webhookUrl, content, absoluteImageUrl);
    }
    
    case 'telegram': {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const channelId = process.env.TELEGRAM_CHANNEL_ID;
      if (!botToken || !channelId) {
        return { success: false, error: 'Telegram credentials not configured (TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID)' };
      }
      return deployToTelegram(botToken, channelId, content, absoluteImageUrl);
    }
    
    case 'twitter':
    case 'x': {
      return deployToTwitter(content, absoluteImageUrl);
    }
    
    case 'facebook': {
      return deployToFacebook(content, absoluteImageUrl);
    }
    
    default:
      return { success: false, error: `Unknown platform: ${platform}` };
  }
}

/**
 * Check which platforms are configured and ready
 */
export function getConfiguredPlatforms(): { platform: string; configured: boolean; missing?: string[] }[] {
  return [
    {
      platform: 'discord',
      configured: !!process.env.DISCORD_WEBHOOK_URL,
      missing: process.env.DISCORD_WEBHOOK_URL ? [] : ['DISCORD_WEBHOOK_URL'],
    },
    {
      platform: 'telegram',
      configured: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL_ID,
      missing: [
        ...(!process.env.TELEGRAM_BOT_TOKEN ? ['TELEGRAM_BOT_TOKEN'] : []),
        ...(!process.env.TELEGRAM_CHANNEL_ID ? ['TELEGRAM_CHANNEL_ID'] : []),
      ],
    },
    {
      platform: 'twitter',
      configured: !!(
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_TOKEN_SECRET
      ),
      missing: [
        ...(!process.env.TWITTER_API_KEY ? ['TWITTER_API_KEY'] : []),
        ...(!process.env.TWITTER_API_SECRET ? ['TWITTER_API_SECRET'] : []),
        ...(!process.env.TWITTER_ACCESS_TOKEN ? ['TWITTER_ACCESS_TOKEN'] : []),
        ...(!process.env.TWITTER_ACCESS_TOKEN_SECRET ? ['TWITTER_ACCESS_TOKEN_SECRET'] : []),
      ],
    },
    {
      platform: 'facebook',
      configured: !!process.env.FACEBOOK_PAGE_ID && !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      missing: [
        ...(!process.env.FACEBOOK_PAGE_ID ? ['FACEBOOK_PAGE_ID'] : []),
        ...(!process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? ['FACEBOOK_PAGE_ACCESS_TOKEN'] : []),
      ],
    },
  ];
}
