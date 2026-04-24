/**
 * Updated Marketing Posts - 2026
 * DarkWave Studios - Auto-deployment content
 * Featuring: April 11 TGE, Guardian Certification, Public Registry
 */

import { db } from './db';
import { marketingPosts } from '@shared/schema';
import { eq } from 'drizzle-orm';

const UPDATED_POSTS = [
  // ============================================
  // DISCORD POSTS (longer, community-focused)
  // ============================================
  {
    platform: 'discord',
    content: `🚀 **TOKEN GENERATION EVENT: APRIL 11, 2026**

The countdown has begun. Signal (SIG) launches on our own Layer 1 blockchain.

What you're getting:
• 200,000+ TPS throughput
• 400ms finality
• $0.0001 transaction fees
• Zero compromises

This isn't another token on someone else's chain.
This is OUR chain. OUR vision. YOUR opportunity.

🔗 Presale live now → dwsc.io/presale`,
    category: 'tge',
  },
  {
    platform: 'discord',
    content: `🛡️ **GUARDIAN CERTIFICATION PROGRAM LIVE**

We're not just building a blockchain—we're setting the security standard.

Guardian Security offers:
• Professional smart contract audits
• Blockchain-verified certifications
• Public registry for verified projects
• NFT-minted proof of audit

Every certification is permanently recorded on-chain.

Check verified projects → dwsc.io/guardian-registry`,
    category: 'security',
  },
  {
    platform: 'discord',
    content: `💎 **WHY DARKWAVE SMART CHAIN?**

Other chains: Promise speed, deliver compromise.
DWSC: 200K+ TPS. 400ms finality. Verifiable.

Other chains: Copy-paste code, hope it works.
DWSC: Built from scratch. Every line intentional.

Other chains: Talk about security.
DWSC: Guardian Certification with on-chain proof.

April 11, 2026. The real one launches.`,
    category: 'tech',
  },
  {
    platform: 'discord',
    content: `🎮 **DARKWAVE CHRONICLES - BETA NOW LIVE**

The legend has begun. Beta v0.1 is LIVE.

What's playable NOW:
• AI-powered companion conversations
• Era exploration and scenario generation
• Voice cloning technology
• Character building tools
• Shells economy integration

Coming soon: Full era campaigns, multiplayer, and more.

Not a game. A parallel life.

Play now → darkwavegames.io`,
    category: 'chronicles',
  },
  {
    platform: 'discord',
    content: `⚡ **FOUNDER REWARDS INCREASING**

Early believers aren't just participants—they're architects of what's coming.

Current Founder Benefits:
• Up to 25% bonus tokens on presale
• Priority beta access to Chronicles
• Governance voting rights
• Exclusive founder badges

The earlier you join, the more you earn.

Presale ends when we reach cap → dwsc.io/presale`,
    category: 'presale',
  },
  {
    platform: 'discord',
    content: `🔒 **SECURITY ISN'T A FEATURE. IT'S THE FOUNDATION.**

Every project on DWSC can get Guardian Certified.

What that means:
✅ Professional security audit
✅ Blockchain-verified score
✅ Public registry listing
✅ NFT-minted certification

Build trust. Build on DWSC.

View verified projects → dwsc.io/guardian-registry`,
    category: 'security',
  },

  // ============================================
  // TELEGRAM POSTS (medium length, announcement style)
  // ============================================
  {
    platform: 'telegram',
    content: `🚀 <b>APRIL 11, 2026 - TOKEN GENERATION EVENT</b>

Signal (SIG) launches on our Layer 1 blockchain.

⚡ 200K+ TPS
⚡ 400ms finality  
⚡ $0.0001 fees

Not built on Ethereum. Not built on Solana.
Built from scratch. Built to last.

Presale live → dwsc.io/presale`,
    category: 'tge',
  },
  {
    platform: 'telegram',
    content: `🛡️ <b>GUARDIAN SECURITY LIVE</b>

Professional blockchain security audits with on-chain verification.

✅ Smart contract audits
✅ Public certification registry
✅ NFT-minted proof
✅ Blockchain-verified scores

Trust, verified → dwsc.io/guardian-registry`,
    category: 'security',
  },
  {
    platform: 'telegram',
    content: `💎 <b>PRESALE BONUSES</b>

Genesis Tier: 25% bonus
Founder Tier: 15% bonus
Pioneer Tier: 10% bonus
Early Bird: 5% bonus

TGE: April 11, 2026

The earlier you believe, the more you earn.

→ dwsc.io/presale`,
    category: 'presale',
  },
  {
    platform: 'telegram',
    content: `🎮 <b>CHRONICLES BETA v0.1 - LIVE NOW</b>

The legend has begun. Beta is playable today.

✅ AI companion conversations
✅ Era exploration
✅ Voice cloning tech
✅ Shells economy

Full launch date TBD. Play what's ready NOW.

→ darkwavegames.io`,
    category: 'chronicles',
  },
  {
    platform: 'telegram',
    content: `⚡ <b>200K+ TPS. VERIFIED.</b>

Not theoretical. Not "up to."
Real throughput on a real chain.

Trust Layer launches April 11, 2026.

See the metrics live → dwsc.io/explorer`,
    category: 'tech',
  },
  {
    platform: 'telegram',
    content: `🔥 <b>WHY BUILD ON DWSC?</b>

• Lowest fees in crypto
• Sub-second finality
• Guardian security audits
• Enterprise-grade infrastructure

April 11. The serious chain launches.

→ dwsc.io`,
    category: 'tech',
  },

  // ============================================
  // TWITTER/X POSTS (280 chars max, punchy)
  // ============================================
  {
    platform: 'twitter',
    content: `🚀 APRIL 11, 2026

Signal launches on our own Layer 1.

200K+ TPS. 400ms finality. $0.0001 fees.

Not another token on someone else's chain.

The real one is coming. dwsc.io`,
    category: 'tge',
  },
  {
    platform: 'twitter',
    content: `Every project on DWSC can get Guardian Certified.

On-chain verified. NFT-minted. Public registry.

Security you can prove.

dwsc.io/guardian-registry 🛡️`,
    category: 'security',
  },
  {
    platform: 'twitter',
    content: `200K+ TPS.
400ms finality.
$0.0001 fees.

Not promises. Metrics.

Trust Layer. April 11, 2026. ⚡`,
    category: 'tech',
  },
  {
    platform: 'twitter',
    content: `Presale bonuses up to 25%.

Genesis → Founder → Pioneer → Early Bird

TGE: April 11, 2026

The earlier you believe, the more you earn. 💎

dwsc.io/presale`,
    category: 'presale',
  },
  {
    platform: 'twitter',
    content: `Chronicles Beta is LIVE. 🎮

AI companions. Era exploration. Voice cloning. Shells economy.

Play what's ready now. Full launch TBD.

darkwavegames.io`,
    category: 'chronicles',
  },
  {
    platform: 'twitter',
    content: `Other chains copy-paste code and call it innovation.

We built everything from scratch.

Layer 1. 200K+ TPS. Guardian Security.

April 11, 2026. 🌊`,
    category: 'tech',
  },
  {
    platform: 'twitter',
    content: `Guardian Certification is LIVE.

Professional audits. On-chain proof. Public registry.

Building trust in crypto, one verification at a time.

dwsc.io/guardian-registry 🛡️`,
    category: 'security',
  },
  {
    platform: 'twitter',
    content: `The countdown to TGE has begun.

April 11, 2026.

Signal. Trust Layer. DarkWave Future.

Presale live → dwsc.io/presale 🚀`,
    category: 'tge',
  },
  {
    platform: 'twitter',
    content: `Building a blockchain from scratch isn't easy.

But neither is building something that lasts.

DWSC. April 11, 2026. ⚡`,
    category: 'vision',
  },
  {
    platform: 'twitter',
    content: `Security shouldn't be optional in crypto.

Guardian Certification: audits verified on-chain.

Every certified project. Every score. Permanent record.

dwsc.io/guardian-registry 🔒`,
    category: 'security',
  },
  {
    platform: 'twitter',
    content: `70+ eras. One parallel self. Your legend.

Chronicles Beta is LIVE now.

AI-powered. Voice cloning. Shells economy.

Play today → darkwavegames.io 🌌`,
    category: 'chronicles',
  },
  {
    platform: 'twitter',
    content: `Early believers get rewarded.

Up to 25% bonus tokens in presale.
Governance rights.
Founder status forever.

TGE: April 11, 2026 💎`,
    category: 'presale',
  },
  
  // NEW FEATURES - January 2026
  {
    platform: 'discord',
    content: `💳 **PRESALE NOW EASIER THAN EVER**

New one-click buy flow:
1. Click "Buy SIG Tokens"
2. Select your tier
3. Enter email
4. Checkout with Stripe

No scrolling. No confusion. Just tokens.

Genesis: $1,000 (25% bonus)
Founder: $500 (15% bonus)
Pioneer: $250 (10% bonus)
Early Bird: $100 (5% bonus)

→ dwsc.io/presale`,
    category: 'presale',
  },
  {
    platform: 'telegram',
    content: `💳 <b>PRESALE SIMPLIFIED</b>

New quick-buy:
• Click button → Select tier → Checkout

Genesis: 25% bonus
Founder: 15% bonus  
Pioneer: 10% bonus
Early Bird: 5% bonus

→ dwsc.io/presale`,
    category: 'presale',
  },
  {
    platform: 'twitter',
    content: `Presale just got easier.

One button. Pick your tier. Checkout.

Up to 25% bonus tokens.

dwsc.io/presale 💎`,
    category: 'presale',
  },
  {
    platform: 'twitter',
    content: `Chronicles Beta v0.1 is LIVE.

• AI companion chat
• Voice cloning tech
• Era exploration  
• Shells economy

Full launch date TBD. Play NOW.

darkwavegames.io 🎮`,
    category: 'chronicles',
  },
];

export async function seedUpdatedMarketingPosts() {
  console.log('[Seed] Starting updated 2026 marketing posts seed...');
  
  try {
    // Deactivate old posts instead of deleting
    await db.update(marketingPosts)
      .set({ status: 'inactive' })
      .where(eq(marketingPosts.status, 'active'));
    
    console.log('[Seed] Deactivated old posts');
    
    // Insert new posts
    for (const post of UPDATED_POSTS) {
      await db.insert(marketingPosts).values({
        platform: post.platform,
        content: post.content,
        category: post.category,
        status: 'active',
      });
    }
    
    console.log(`[Seed] Inserted ${UPDATED_POSTS.length} updated marketing posts`);
    
    // Count by platform
    const discordCount = UPDATED_POSTS.filter(p => p.platform === 'discord').length;
    const telegramCount = UPDATED_POSTS.filter(p => p.platform === 'telegram').length;
    const twitterCount = UPDATED_POSTS.filter(p => p.platform === 'twitter').length;
    
    console.log(`[Seed] Discord: ${discordCount}, Telegram: ${telegramCount}, Twitter/X: ${twitterCount}`);
    
    return { success: true, count: UPDATED_POSTS.length };
  } catch (error: any) {
    console.error('[Seed] Error seeding posts:', error.message);
    return { success: false, error: error.message };
  }
}

// Export posts for review
export const MARKETING_POSTS_2026 = UPDATED_POSTS;
