import { Resend } from 'resend';

let cachedClient: { client: Resend; fromEmail: string } | null = null;

async function getResendClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  cachedClient = {
    client: new Resend(apiKey),
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Trust Layer <team@dwsc.io>',
  };
  console.log('[Email] Resend client initialized');
  return cachedClient;
}

const TEAM_EMAIL = "team@dwsc.io";
const BASE_URL = "https://dwsc.io";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { client, fromEmail } = await getResendClient();

  const emailPayload: any = {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    replyTo: options.replyTo || TEAM_EMAIL,
  };

  if (options.html) {
    emailPayload.html = options.html;
  }
  if (options.text) {
    emailPayload.text = options.text;
  }

  const result = await client.emails.send(emailPayload);
  return result;
}

function baseTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>DarkWave Trust Layer</title>
</head>
<body style="margin:0;padding:0;background-color:#070b14;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;font-size:1px;color:#070b14;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}${'&zwnj;&nbsp;'.repeat(30)}</div>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#070b14;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

<!-- Logo Header -->
<tr><td style="padding:32px 0 24px;text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="width:42px;height:42px;background:linear-gradient(135deg,#06b6d4,#a855f7);border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;font-weight:bold;color:#fff;">D</td>
    <td style="padding-left:12px;">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">DarkWave</span><br/>
      <span style="font-size:11px;font-weight:500;color:#06b6d4;letter-spacing:2px;text-transform:uppercase;">Trust Layer</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Main Content Card -->
<tr><td>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg,#0f1724 0%,#0d1117 100%);border-radius:16px;border:1px solid rgba(6,182,212,0.15);overflow:hidden;">
  <tr><td style="padding:40px 36px 36px;">
    ${content}
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 20px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
    
    <!-- Quick Links -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-bottom:16px;">
      <a href="${BASE_URL}/home" style="color:#94a3b8;font-size:12px;text-decoration:none;margin:0 10px;">Dashboard</a>
      <span style="color:#334155;">|</span>
      <a href="${BASE_URL}/wallet" style="color:#94a3b8;font-size:12px;text-decoration:none;margin:0 10px;">Wallet</a>
      <span style="color:#334155;">|</span>
      <a href="${BASE_URL}/membership" style="color:#94a3b8;font-size:12px;text-decoration:none;margin:0 10px;">Membership</a>
      <span style="color:#334155;">|</span>
      <a href="${BASE_URL}/settings" style="color:#94a3b8;font-size:12px;text-decoration:none;margin:0 10px;">Settings</a>
    </td></tr>
    </table>

    <!-- Support -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-bottom:20px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 6px;">Need help? Our team is here for you.</p>
      <a href="mailto:${TEAM_EMAIL}" style="color:#06b6d4;font-size:13px;font-weight:600;text-decoration:none;">${TEAM_EMAIL}</a>
    </td></tr>
    </table>

    <!-- Social -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding:0 8px;"><a href="https://twitter.com/DarkWaveChain" style="color:#64748b;font-size:12px;text-decoration:none;">Twitter/X</a></td>
      <td style="color:#334155;font-size:12px;">·</td>
      <td style="padding:0 8px;"><a href="https://discord.gg/darkwave" style="color:#64748b;font-size:12px;text-decoration:none;">Discord</a></td>
      <td style="color:#334155;font-size:12px;">·</td>
      <td style="padding:0 8px;"><a href="https://t.me/darkwave" style="color:#64748b;font-size:12px;text-decoration:none;">Telegram</a></td>
    </tr>
    </table>

    <!-- Legal -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:20px;">
      <p style="color:#475569;font-size:10px;margin:0;line-height:1.6;">
        &copy; ${new Date().getFullYear()} DarkWave Trust Layer. All rights reserved.<br/>
        <a href="${BASE_URL}/terms" style="color:#475569;text-decoration:underline;">Terms of Service</a> &middot; <a href="${BASE_URL}/privacy" style="color:#475569;text-decoration:underline;">Privacy Policy</a>
      </p>
    </td></tr>
    </table>

  </td></tr>
  </table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function heroSection(title: string, subtitle?: string, accentColor: string = '#06b6d4'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-bottom:28px;">
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">${title}</h1>
      ${subtitle ? `<p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.5;">${subtitle}</p>` : ''}
      <div style="width:60px;height:3px;background:linear-gradient(90deg,${accentColor},#a855f7);border-radius:3px;margin:16px auto 0;"></div>
    </td></tr>
    </table>`;
}

function statCard(label: string, value: string, color: string = '#06b6d4'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:12px;">
    <tr><td style="padding:20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">${label}</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:${color};line-height:1.2;">${value}</p>
    </td></tr>
    </table>`;
}

function highlightBox(content: string, borderColor: string = '#06b6d4'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(6,182,212,0.05);border-left:4px solid ${borderColor};border-radius:0 10px 10px 0;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      ${content}
    </td></tr>
    </table>`;
}

function ctaButton(text: string, url: string, gradient: string = 'linear-gradient(135deg,#06b6d4,#a855f7)'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td style="background:${gradient};border-radius:10px;text-align:center;">
      <a href="${url}" style="display:inline-block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">${text}</a>
    </td></tr>
    </table>`;
}

function receiptRow(label: string, value: string, bold: boolean = false): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#94a3b8;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:14px;text-align:right;${bold ? 'font-weight:700;' : ''}">${value}</td>
    </tr>`;
}

function receiptTable(rows: { label: string; value: string; bold?: boolean }[]): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${rows.map(r => receiptRow(r.label, r.value, r.bold)).join('')}
      </table>
    </td></tr>
    </table>`;
}

function badge(text: string, color: string = '#06b6d4'): string {
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">${text}</span>`;
}


export async function sendPresaleConfirmationEmail(to: string, amountPaid: string, tier: string, tokenAmount: number, bonusTokens: number) {
  const tierNames: Record<string, string> = { genesis: "Genesis", founder: "Founder", pioneer: "Pioneer", early_bird: "Early Bird" };
  const tierName = tierNames[tier] || tier;
  const totalTokens = tokenAmount + bonusTokens;
  const bonusPercent = tokenAmount > 0 ? Math.round((bonusTokens / tokenAmount) * 100) : 0;

  const content = `
    ${heroSection('Purchase Confirmed', 'Your Signal (SIG) tokens have been secured.')}
    
    ${statCard('Your Signal Allocation', `${totalTokens.toLocaleString()} SIG`)}
    
    ${bonusTokens > 0 ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
    <tr><td style="text-align:center;">
      <span style="display:inline-block;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);color:#00ff88;font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;">+${bonusTokens.toLocaleString()} Bonus Signal (${bonusPercent}% Bonus)</span>
    </td></tr>
    </table>` : ''}
    
    ${receiptTable([
    { label: 'Amount Paid', value: `$${amountPaid}` },
    { label: 'Tier', value: tierName },
    { label: 'Base Tokens', value: `${tokenAmount.toLocaleString()} SIG` },
    { label: 'Bonus Tokens', value: `+${bonusTokens.toLocaleString()} SIG` },
    { label: 'Total Allocation', value: `${totalTokens.toLocaleString()} SIG`, bold: true },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">Next Steps</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Register your membership at <a href="${BASE_URL}" style="color:#06b6d4;font-weight:600;">dwsc.io</a> using this email (<strong style="color:#fff;">${to}</strong>)</li>
        <li>Access your dashboard, membership card, and ecosystem features</li>
        <li>20% of your Signal released at TGE, 80% vested over 12 months</li>
        <li>Create your Trust Layer wallet before launch to receive tokens</li>
      </ul>
    `)}
    
    ${ctaButton('Access Your Dashboard', `${BASE_URL}/home`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:8px;">
      <p style="margin:0;color:#f87171;font-size:13px;font-weight:600;">Important: Register using this email address (${to}) to link your tokens.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `Signal (SIG) Purchase Confirmed - ${tierName} Tier | ${totalTokens.toLocaleString()} SIG`,
    html: baseTemplate(content, `Your ${totalTokens.toLocaleString()} SIG tokens have been secured. Complete your registration to access your dashboard.`),
  });
}


export async function sendCrowdfundConfirmationEmail(to: string, amountPaid: string, tierName: string, donorName: string) {
  const content = `
    ${heroSection('Thank You, Supporter!', `Your contribution to DarkWave is confirmed.`, '#00ff88')}
    
    ${statCard('Contribution Amount', `$${amountPaid}`, '#00ff88')}
    
    ${receiptTable([
    { label: 'Donor Name', value: donorName },
    { label: 'Tier', value: tierName },
    { label: 'Amount', value: `$${amountPaid}`, bold: true },
    { label: 'Status', value: 'Confirmed' },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#00ff88;font-size:15px;font-weight:700;">What Your Support Enables</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Accelerated development of the Trust Layer ecosystem</li>
        <li>Mainnet launch and token generation event</li>
        <li>Expansion of Chronicles and ecosystem apps</li>
        <li>You've earned Early Adopter status with bonus Signal at launch</li>
      </ul>
    `, '#00ff88')}
    
    ${ctaButton('View Your Contribution', `${BASE_URL}/crowdfund`, 'linear-gradient(135deg,#00ff88,#06b6d4)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:13px;">Your generosity is building the future of trust infrastructure.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `Crowdfund Contribution Confirmed - $${amountPaid} | Thank You!`,
    html: baseTemplate(content, `Your $${amountPaid} contribution to DarkWave has been confirmed. Thank you for supporting the ecosystem.`),
  });
}


export async function sendSubscriptionActivatedEmail(to: string, planName: string, billingCycle: string, amount: string, nextBillingDate?: string) {
  const planDisplayNames: Record<string, string> = {
    pulse_pro: "Pulse Pro",
    strike_agent: "Strike Agent",
    complete_bundle: "Trust Layer Complete",
    chronicles_pro: "Chronicles Pro",
    guardian_watch: "Guardian Watch",
    guardian_shield: "Guardian Shield",
    guardian_command: "Guardian Command",
  };
  const displayPlan = planDisplayNames[planName] || planName;

  const planFeatures: Record<string, string[]> = {
    pulse_pro: ["AI-powered market intelligence", "ML price predictions", "Fear & Greed tracking", "Accuracy analytics dashboard"],
    strike_agent: ["Solana memecoin sniper bot", "AI risk scoring", "Honeypot detection", "One-click Phantom integration"],
    complete_bundle: ["Everything in Pulse Pro", "Everything in Strike Agent", "Chronicles Pro access", "Priority support"],
    chronicles_pro: ["Enhanced AI storytelling", "Voice cloning", "Exclusive scenarios", "Premium character creation"],
    guardian_watch: ["Basic threat detection", "Security alerts", "Dashboard monitoring"],
    guardian_shield: ["24/7 advanced monitoring", "Multi-chain coverage", "Instant alerts", "Threat intelligence"],
    guardian_command: ["Dedicated security team", "Custom integrations", "Priority incident response", "Enterprise SLAs"],
  };
  const features = planFeatures[planName] || ["Full plan access"];

  const content = `
    ${heroSection('Subscription Activated', `Welcome to ${displayPlan}!`, '#a855f7')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="text-align:center;padding-bottom:16px;">
    <tr><td>${badge(billingCycle === 'annual' ? 'Annual Plan' : 'Monthly Plan', '#a855f7')}</td></tr>
    </table>
    
    ${statCard('Your Plan', displayPlan, '#a855f7')}
    
    ${receiptTable([
    { label: 'Plan', value: displayPlan },
    { label: 'Billing Cycle', value: billingCycle === 'annual' ? 'Annual' : 'Monthly' },
    { label: 'Amount', value: `$${amount}/${billingCycle === 'annual' ? 'yr' : 'mo'}`, bold: true },
    ...(nextBillingDate ? [{ label: 'Next Billing Date', value: nextBillingDate }] : []),
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 10px;color:#a855f7;font-size:15px;font-weight:700;">Your ${displayPlan} Features</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        ${features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    `, '#a855f7')}
    
    ${ctaButton('Go to Dashboard', `${BASE_URL}/home`, 'linear-gradient(135deg,#a855f7,#ec4899)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Manage your subscription anytime from <a href="${BASE_URL}/settings" style="color:#06b6d4;">Settings</a>. Cancel anytime, no questions asked.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `${displayPlan} Activated - Your Premium Features Are Live`,
    html: baseTemplate(content, `Your ${displayPlan} subscription is now active. Enjoy your premium features!`),
  });
}


export async function sendSubscriptionRenewalEmail(to: string, planName: string, amount: string, nextBillingDate: string) {
  const planDisplayNames: Record<string, string> = {
    pulse_pro: "Pulse Pro", strike_agent: "Strike Agent", complete_bundle: "Trust Layer Complete",
    chronicles_pro: "Chronicles Pro", guardian_watch: "Guardian Watch", guardian_shield: "Guardian Shield", guardian_command: "Guardian Command",
  };
  const displayPlan = planDisplayNames[planName] || planName;

  const content = `
    ${heroSection('Subscription Renewed', `Your ${displayPlan} access continues uninterrupted.`, '#a855f7')}
    
    ${receiptTable([
    { label: 'Plan', value: displayPlan },
    { label: 'Amount Charged', value: `$${amount}`, bold: true },
    { label: 'Next Renewal', value: nextBillingDate },
    { label: 'Status', value: 'Active' },
  ])}
    
    ${ctaButton('Go to Dashboard', `${BASE_URL}/home`, 'linear-gradient(135deg,#a855f7,#06b6d4)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Manage your subscription in <a href="${BASE_URL}/settings" style="color:#06b6d4;">Settings</a>.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `${displayPlan} Renewed - Thank You for Staying With Us`,
    html: baseTemplate(content, `Your ${displayPlan} subscription has been successfully renewed.`),
  });
}


export async function sendGoldCoinPurchaseEmail(to: string, gcAmount: number, scBonus: number, amountPaid: string) {
  const content = `
    ${heroSection('Gold Coins Purchased!', 'Your coins are ready to play.', '#FFD700')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Gold Coins', `${gcAmount.toLocaleString()} GC`, '#FFD700')}
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Free Bonus', `${scBonus.toLocaleString()} SC`, '#00ff88')}
      </td>
    </tr>
    </table>
    
    ${receiptTable([
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
    { label: 'Gold Coins (GC)', value: `${gcAmount.toLocaleString()} GC` },
    { label: 'Free Sweep Coins (SC)', value: `+${scBonus.toLocaleString()} SC` },
    { label: 'Status', value: 'Credited Instantly' },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#FFD700;font-size:15px;font-weight:700;">How It Works</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li><strong style="color:#FFD700;">Gold Coins (GC)</strong> - Play for fun across all casino games</li>
        <li><strong style="color:#00ff88;">Sweep Coins (SC)</strong> - Free bonus coins, redeemable for SIG tokens</li>
        <li>Both coin types are available instantly in your account</li>
      </ul>
    `, '#FFD700')}
    
    ${ctaButton('Play Now', `${BASE_URL}/arcade`, 'linear-gradient(135deg,#FFD700,#f59e0b)')}
  `;

  return sendEmail({
    to,
    subject: `${gcAmount.toLocaleString()} Gold Coins Purchased + ${scBonus.toLocaleString()} Free Sweep Coins`,
    html: baseTemplate(content, `Your ${gcAmount.toLocaleString()} Gold Coins and ${scBonus.toLocaleString()} bonus Sweep Coins are ready to play!`),
  });
}


export async function sendCreditsConfirmationEmail(to: string, creditsAmount: number, amountPaid: string, newBalance: number) {
  const content = `
    ${heroSection('Credits Added!', 'Your credits are ready to use.', '#06b6d4')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Credits Added', `${creditsAmount.toLocaleString()}`, '#06b6d4')}
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;">
        ${statCard('New Balance', `${newBalance.toLocaleString()}`, '#a855f7')}
      </td>
    </tr>
    </table>
    
    ${receiptTable([
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
    { label: 'Credits Purchased', value: `${creditsAmount.toLocaleString()}` },
    { label: 'Account Balance', value: `${newBalance.toLocaleString()} credits` },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">Use Your Credits For</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>AI chat conversations and analysis</li>
        <li>Scenario generation in Chronicles</li>
        <li>Voice cloning and personality summaries</li>
        <li>Advanced blockchain analytics</li>
      </ul>
    `)}
    
    ${ctaButton('Use Your Credits', `${BASE_URL}/home`)}
  `;

  return sendEmail({
    to,
    subject: `${creditsAmount.toLocaleString()} Credits Added to Your Account`,
    html: baseTemplate(content, `${creditsAmount.toLocaleString()} credits have been added to your account. Your new balance is ${newBalance.toLocaleString()}.`),
  });
}


export async function sendGuardianCertificationEmail(to: string, projectName: string, tier: string, amountPaid: string, certificationId?: string) {
  const tierNames: Record<string, string> = { assurance_lite: "Assurance Lite", guardian_premier: "Guardian Premier" };
  const displayTier = tierNames[tier] || tier;

  const tierDetails: Record<string, string[]> = {
    assurance_lite: [
      "Automated smart contract analysis",
      "Common vulnerability scanning",
      "Basic code quality review",
      "Summary report with findings",
    ],
    guardian_premier: [
      "Full manual code audit by security experts",
      "Penetration testing and attack simulation",
      "Comprehensive vulnerability report",
      "Public registry listing and certification badge",
      "Ongoing advisory and re-audit option",
    ],
  };
  const details = tierDetails[tier] || ["Comprehensive security analysis"];

  const content = `
    ${heroSection('Certification Initiated', `${displayTier} audit for ${projectName}`, '#10b981')}
    
    ${receiptTable([
    { label: 'Project', value: projectName },
    { label: 'Audit Tier', value: displayTier },
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
    { label: 'Status', value: 'Pending Review' },
    ...(certificationId ? [{ label: 'Reference ID', value: certificationId }] : []),
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#10b981;font-size:15px;font-weight:700;">${displayTier} Includes</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        ${details.map(d => `<li>${d}</li>`).join('')}
      </ul>
    `, '#10b981')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.15);border-radius:12px;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      <h3 style="margin:0 0 8px;color:#10b981;font-size:15px;font-weight:700;">What Happens Next</h3>
      <ol style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Our team reviews your submission (1-2 business days)</li>
        <li>Audit begins - you'll receive progress updates</li>
        <li>Draft report delivered for your review</li>
        <li>Final certification issued and published to registry</li>
      </ol>
    </td></tr>
    </table>
    
    ${ctaButton('View Certification Status', `${BASE_URL}/guardian-registry`, 'linear-gradient(135deg,#10b981,#06b6d4)')}
  `;

  return sendEmail({
    to,
    subject: `Guardian ${displayTier} Certification Initiated - ${projectName}`,
    html: baseTemplate(content, `Your ${displayTier} security certification for ${projectName} is now in progress.`),
  });
}


export async function sendGuardianIntakeEmail(to: string, projectName: string, tier: string, certificationId: string) {
  const tierNames: Record<string, string> = {
    guardian_scan: "Guardian Scan",
    guardian_assurance: "Guardian Assurance",
    guardian_certified: "Guardian Certified",
    guardian_premier: "Guardian Premier",
    self_cert: "Self-Cert",
    assurance_lite: "Assurance Lite",
  };
  const displayTier = tierNames[tier] || tier;

  const content = `
    ${heroSection('Intake Received', `We've received your certification request for ${projectName}.`, '#10b981')}
    
    ${receiptTable([
    { label: 'Project', value: projectName },
    { label: 'Interested Tier', value: displayTier },
    { label: 'Certification ID', value: certificationId },
    { label: 'Status', value: 'Intake Received' },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#10b981;font-size:15px;font-weight:700;">What Happens Next</h3>
      <ol style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Our team reviews your submission (1-2 business days)</li>
        <li>We'll reach out to discuss scope and next steps</li>
        <li>Once confirmed, your certification process begins</li>
        <li>Track your progress anytime at the Guardian Portal</li>
      </ol>
    `, '#10b981')}
    
    ${statCard('Your Certification ID', certificationId, '#06b6d4')}
    
    ${ctaButton('Track Your Certification', `${BASE_URL}/guardian-portal`, 'linear-gradient(135deg,#10b981,#06b6d4)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Save your Certification ID to check your progress at any time.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `Guardian Certification Intake Received - ${projectName} | ID: ${certificationId}`,
    html: baseTemplate(content, `Your Guardian certification intake for ${projectName} has been received. Track your progress with ID: ${certificationId}`),
  });
}


export async function sendDomainRegistrationEmail(to: string, domainName: string, domainTier: string, amountPaid: string, isLifetime: boolean) {
  const content = `
    ${heroSection('Domain Registered!', `${domainName}.tlid is yours.`, '#ec4899')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,rgba(236,72,153,0.1),rgba(168,85,247,0.1));border:1px solid rgba(236,72,153,0.2);border-radius:16px;margin:0 0 20px;text-align:center;">
    <tr><td style="padding:28px;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#ec4899;font-weight:600;">Your Trust Layer Domain</p>
      <p style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:1px;">${domainName}<span style="color:#ec4899;">.tlid</span></p>
      ${isLifetime ? `<p style="margin:8px 0 0;"><span style="display:inline-block;background:linear-gradient(135deg,#FFD700,#f59e0b);color:#000;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">Lifetime Ownership</span></p>` : ''}
    </td></tr>
    </table>
    
    ${receiptTable([
    { label: 'Domain', value: `${domainName}.tlid` },
    { label: 'Tier', value: domainTier },
    { label: 'Duration', value: isLifetime ? 'Lifetime' : 'Annual' },
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#ec4899;font-size:15px;font-weight:700;">Your Domain Powers</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Blockchain-verified identity name</li>
        <li>Use as your wallet address across all chains</li>
        <li>Link to your Trust Layer profile and membership</li>
        <li>Transferable and tradeable as an NFT</li>
      </ul>
    `, '#ec4899')}
    
    ${ctaButton('Manage Your Domain', `${BASE_URL}/domains`, 'linear-gradient(135deg,#ec4899,#a855f7)')}
  `;

  return sendEmail({
    to,
    subject: `Domain Registered: ${domainName}.tlid - ${isLifetime ? 'Lifetime' : 'Annual'} Ownership`,
    html: baseTemplate(content, `Congratulations! ${domainName}.tlid is now registered to your Trust Layer account.`),
  });
}


export async function sendOrbsPurchaseEmail(to: string, orbsAmount: number, amountPaid: string) {
  const content = `
    ${heroSection('Orbs Purchased!', 'Your Orbs are ready to use across the ecosystem.', '#f59e0b')}
    
    ${statCard('Orbs Added', `${orbsAmount.toLocaleString()}`, '#f59e0b')}
    
    ${receiptTable([
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
    { label: 'Orbs Received', value: `${orbsAmount.toLocaleString()} Orbs` },
    { label: 'Status', value: 'Credited Instantly' },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#f59e0b;font-size:15px;font-weight:700;">Spend Orbs On</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Chronicles character upgrades and items</li>
        <li>Premium AI scenarios and voice packs</li>
        <li>Ecosystem cosmetics and badges</li>
        <li>Exclusive limited-edition content</li>
      </ul>
    `, '#f59e0b')}
    
    ${ctaButton('Use Your Orbs', `${BASE_URL}/chronicles`, 'linear-gradient(135deg,#f59e0b,#ec4899)')}
  `;

  return sendEmail({
    to,
    subject: `${orbsAmount.toLocaleString()} Orbs Added to Your Account`,
    html: baseTemplate(content, `${orbsAmount.toLocaleString()} Orbs have been added to your DarkWave account.`),
  });
}


export async function sendShellsPurchaseEmail(to: string, shellsAmount: number, amountPaid: string, newBalance: number) {
  const sigEquivalent = (shellsAmount * 0.1).toLocaleString();

  const content = `
    ${heroSection('Shells Purchased!', 'Your pre-launch currency is ready.', '#06b6d4')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Shells Added', `${shellsAmount.toLocaleString()}`, '#06b6d4')}
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;">
        ${statCard('SIG Equivalent', sigEquivalent, '#a855f7')}
      </td>
    </tr>
    </table>
    
    ${receiptTable([
    { label: 'Amount Paid', value: `$${amountPaid}`, bold: true },
    { label: 'Shells Received', value: `${shellsAmount.toLocaleString()}` },
    { label: 'Shell Balance', value: `${newBalance.toLocaleString()} Shells` },
    { label: 'SIG Value at Launch', value: `${sigEquivalent} SIG` },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">About Shells</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>1 Shell = $0.001 value</li>
        <li>10 Shells = 1 SIG token at launch</li>
        <li>Shells convert to Signal automatically at the Token Generation Event</li>
        <li>Earn more through referrals, activities, and engagement</li>
      </ul>
    `)}
    
    ${ctaButton('View Your Balance', `${BASE_URL}/wallet`)}
  `;

  return sendEmail({
    to,
    subject: `${shellsAmount.toLocaleString()} Shells Added - Converts to ${sigEquivalent} SIG at Launch`,
    html: baseTemplate(content, `${shellsAmount.toLocaleString()} Shells have been added to your account. They'll convert to ${sigEquivalent} SIG at launch.`),
  });
}


export async function sendWelcomeEmail(to: string, name: string) {
  const content = `
    ${heroSection('Welcome to Trust Layer!', `Hi ${name}, you\'re now part of the next generation of blockchain technology.`)}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">Get Started</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Explore the blockchain via <a href="${BASE_URL}/explorer" style="color:#06b6d4;">DarkWaveScan</a></li>
        <li>Register as a developer and get API keys</li>
        <li>Submit hashes and generate hallmarks</li>
      </ul>
    `)}
    
    ${ctaButton('Explore DarkWave', `${BASE_URL}/home`)}
  `;

  return sendEmail({ to, subject: "Welcome to Trust Layer!", html: baseTemplate(content) });
}


export async function sendApiKeyEmail(to: string, name: string, apiKey: string, appName: string) {
  const content = `
    ${heroSection('Your API Key is Ready', `Hi ${name}, your key for ${appName} has been generated.`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:12px;margin:20px 0;">
    <tr><td style="padding:20px 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">API Key</p>
      <p style="margin:0;font-size:14px;font-family:'Courier New',monospace;color:#06b6d4;word-break:break-all;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;">${apiKey}</p>
    </td></tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:8px 0;text-align:center;">
      <p style="margin:0;color:#f87171;font-size:13px;font-weight:600;">Keep this key secure. Never share it publicly.</p>
    </td></tr>
    </table>
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">Use Your Key To</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Submit hashes to the Trust Layer</li>
        <li>Generate hallmarks for your products</li>
        <li>Access the DarkWave API</li>
      </ul>
    `)}
    
    ${ctaButton('API Documentation', `${BASE_URL}/docs`)}
  `;

  return sendEmail({ to, subject: `Your DarkWave API Key for ${appName}`, html: baseTemplate(content) });
}


export async function sendHallmarkEmail(to: string, hallmarkId: string, productName: string) {
  const content = `
    ${heroSection('Hallmark Created', `For ${productName}`, '#10b981')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.15);border-radius:12px;margin:20px 0;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">Hallmark ID</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#10b981;font-family:'Courier New',monospace;">${hallmarkId}</p>
    </td></tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:14px;">This hallmark is recorded on the Trust Layer and can be verified at:</p>
      <p style="margin:8px 0 0;"><a href="${BASE_URL}/explorer" style="color:#06b6d4;font-weight:600;">${BASE_URL}/explorer</a></p>
    </td></tr>
    </table>
    
    ${ctaButton('View on Explorer', `${BASE_URL}/explorer`, 'linear-gradient(135deg,#10b981,#06b6d4)')}
  `;

  return sendEmail({ to, subject: `Hallmark Generated: ${hallmarkId}`, html: baseTemplate(content) });
}


export async function sendStakingRewardEmail(to: string, rewardAmount: string, totalStaked: string) {
  const content = `
    ${heroSection('Staking Rewards Claimed!', 'Your rewards have been added to your wallet.', '#00ff88')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Rewards Claimed', `${rewardAmount} SIG`, '#00ff88')}
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Total Staked', `${totalStaked} SIG`, '#a855f7')}
      </td>
    </tr>
    </table>
    
    ${ctaButton('View Staking', `${BASE_URL}/staking`, 'linear-gradient(135deg,#00ff88,#06b6d4)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Keep staking to earn more rewards!</p>
    </td></tr>
    </table>
  `;

  return sendEmail({ to, subject: `Staking Rewards Claimed: ${rewardAmount} SIG`, html: baseTemplate(content) });
}


export async function sendLargeTransferAlert(to: string, amount: string, direction: 'sent' | 'received', txHash: string) {
  const action = direction === 'sent' ? 'Sent' : 'Received';
  const color = direction === 'sent' ? '#f87171' : '#00ff88';

  const content = `
    ${heroSection(`Large Transfer ${action}`, undefined, color)}
    
    ${statCard(`Amount ${action}`, `${amount} SIG`, color)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin:16px 0;">
    <tr><td style="padding:16px 24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">Transaction Hash</p>
      <p style="margin:0;font-size:12px;font-family:'Courier New',monospace;color:#06b6d4;word-break:break-all;">${txHash}</p>
    </td></tr>
    </table>
    
    ${direction === 'sent' ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding:12px 0;">
      <p style="margin:0;color:#f87171;font-size:13px;font-weight:600;">If you did not initiate this transfer, secure your wallet immediately.</p>
    </td></tr>
    </table>` : ''}
    
    ${ctaButton('View Transaction', `${BASE_URL}/explorer`)}
  `;

  return sendEmail({ to, subject: `Large Transfer Alert: ${amount} SIG ${action}`, html: baseTemplate(content) });
}


export async function sendFounderWelcomeEmail(to: string, founderNumber: number, referralCode: string) {
  const content = `
    ${heroSection(`Welcome, Legacy Founder #${founderNumber}!`, 'You are among the earliest supporters of Trust Layer.', '#FFD700')}
    
    ${highlightBox(`
      <h3 style="margin:0 0 10px;color:#FFD700;font-size:15px;font-weight:700;">Your Exclusive Perks</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>35,000 SIG Airdrop at Mainnet Launch</li>
        <li>Unlimited AI Analysis (Crypto & Stocks)</li>
        <li>StrikeAgent Sniper Bot Access</li>
        <li>Founding Member Badge (Forever)</li>
        <li>Priority Staking Pool Access</li>
        <li>No Recurring Billing - Lifetime Access</li>
      </ul>
    `, '#FFD700')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,rgba(6,182,212,0.1),rgba(168,85,247,0.1));border:1px solid rgba(6,182,212,0.2);border-radius:12px;margin:20px 0;text-align:center;">
    <tr><td style="padding:24px;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#64748b;font-weight:600;">Your Referral Code</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#06b6d4;font-family:'Courier New',monospace;letter-spacing:4px;">${referralCode}</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">Share this code and earn bonus rewards for each referral!</p>
    </td></tr>
    </table>
    
    ${ctaButton('Access Your Dashboard', `${BASE_URL}/home`)}
  `;

  return sendEmail({ to, subject: `Welcome, Legacy Founder #${founderNumber}!`, html: baseTemplate(content) });
}


export async function sendReferralBonusEmail(to: string, referralCount: number, bonusAmount: string) {
  const content = `
    ${heroSection('Referral Bonus Earned!', undefined, '#00ff88')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="48%" style="vertical-align:top;">
        ${statCard('You Earned', `${bonusAmount} SIG`, '#00ff88')}
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;">
        ${statCard('Total Referrals', `${referralCount}`, '#FFD700')}
      </td>
    </tr>
    </table>
    
    ${ctaButton('View Your Rewards', `${BASE_URL}/referrals`, 'linear-gradient(135deg,#00ff88,#06b6d4)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Keep sharing your referral code to earn more rewards!</p>
    </td></tr>
    </table>
  `;

  return sendEmail({ to, subject: `Referral Bonus: ${bonusAmount} SIG Earned!`, html: baseTemplate(content) });
}


export async function sendBridgeCompletionEmail(to: string, amount: string, fromChain: string, toChain: string, txHash: string) {
  const content = `
    ${heroSection('Bridge Transfer Complete!', `${amount} successfully bridged.`, '#06b6d4')}
    
    ${statCard('Amount Bridged', amount, '#06b6d4')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td width="44%" style="vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
        <tr><td style="padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">From</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;">${fromChain}</p>
        </td></tr>
        </table>
      </td>
      <td width="12%" style="text-align:center;vertical-align:middle;color:#06b6d4;font-size:20px;">→</td>
      <td width="44%" style="vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
        <tr><td style="padding:16px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">To</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;">${toChain}</p>
        </td></tr>
        </table>
      </td>
    </tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin:16px 0;">
    <tr><td style="padding:16px 24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">Transaction Hash</p>
      <p style="margin:0;font-size:12px;font-family:'Courier New',monospace;color:#06b6d4;word-break:break-all;">${txHash}</p>
    </td></tr>
    </table>
    
    ${ctaButton('View on Explorer', `${BASE_URL}/explorer`)}
  `;

  return sendEmail({ to, subject: `Bridge Complete: ${amount} Transferred`, html: baseTemplate(content) });
}


export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const content = `
    ${heroSection('Password Reset Request', 'We received a request to reset your password.', '#f59e0b')}
    
    ${ctaButton('Reset Password', resetLink, 'linear-gradient(135deg,#f59e0b,#ec4899)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin:16px 0;">
    <tr><td style="padding:16px 24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;">Or copy this link</p>
      <p style="margin:0;font-size:12px;font-family:'Courier New',monospace;color:#06b6d4;word-break:break-all;">${resetLink}</p>
    </td></tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding:12px 0;">
      <p style="margin:0;color:#f87171;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({ to, subject: "Reset Your Password - DarkWave", html: baseTemplate(content) });
}


export async function sendEmailVerificationCode(to: string, code: string, name: string) {
  const content = `
    ${heroSection('Verify Your Email', `Welcome to DarkWave, ${name}!`)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,rgba(6,182,212,0.1),rgba(168,85,247,0.1));border:1px solid rgba(6,182,212,0.2);border-radius:16px;margin:20px 0;text-align:center;">
    <tr><td style="padding:32px;">
      <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">Your verification code is:</p>
      <p style="margin:0;font-size:44px;font-weight:800;color:#06b6d4;font-family:'Courier New',monospace;letter-spacing:10px;">${code}</p>
    </td></tr>
    </table>
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:14px;">Enter this code on the verification page to complete your registration.</p>
      <p style="margin:12px 0 0;color:#f87171;font-size:12px;">This code expires in 10 minutes. If you didn't create an account, ignore this email.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({ to, subject: `Your DarkWave Verification Code: ${code}`, html: baseTemplate(content) });
}


export async function sendWalletCreationReminder(to: string, name: string, tokenAmount: number) {
  const content = `
    ${heroSection("You're In The System!", `Hi${name ? ` ${name}` : ''}, your allocation is secured.`, '#FFD700')}
    
    ${statCard('Your Signal Allocation', `${tokenAmount.toLocaleString()} SIG`)}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">Your Next Step: Create Your Wallet</h3>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">
        Before the Signal Generation Event, you'll need a Trust Layer wallet to receive your airdrop. 
        We'll notify you when the TGE date is announced - but you can create your wallet anytime!
      </p>
    `)}
    
    ${ctaButton('Create Wallet Now', `${BASE_URL}/wallet`)}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#FFD700;font-size:15px;font-weight:700;">Milestone-Based Launch</h3>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">
        We're building in public and launching when key milestones are hit - not on a fixed date. 
        You'll receive updates as we progress. Your allocation is locked in and waiting for you!
      </p>
    `, '#FFD700')}
  `;

  return sendEmail({ to, subject: "Action Required: Create Your Trust Layer Wallet", html: baseTemplate(content) });
}


export async function sendSignupWelcomeEmail(to: string, name: string, referralCode?: string) {
  const content = `
    ${heroSection('Welcome to Trust Layer!', `Hi${name ? ` ${name}` : ''}, thanks for joining us!`)}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">What's Next?</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Explore the <a href="${BASE_URL}/presale" style="color:#06b6d4;font-weight:600;">presale</a> to own Signal early</li>
        <li>Join our community and earn Shells through activities</li>
        <li>Create your wallet when you're ready</li>
        ${referralCode ? `<li>Share your referral code: <strong style="color:#06b6d4;">${referralCode}</strong></li>` : ''}
      </ul>
    `)}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#FFD700;font-size:15px;font-weight:700;">Milestone-Based Launch</h3>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">
        We're building in public and will announce the Signal Generation Event when key milestones are hit.
        You'll need a Trust Layer wallet to receive your airdrop - we'll send you a reminder when it's time!
      </p>
    `, '#FFD700')}
    
    ${ctaButton('Explore Trust Layer', `${BASE_URL}/home`)}
  `;

  return sendEmail({ to, subject: "Welcome to Trust Layer - You're In!", html: baseTemplate(content) });
}


export async function sendBusinessApprovalEmail(to: string, businessName: string, isMainStreet: boolean) {
  const mainStreetSection = isMainStreet ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.15));border:1px solid rgba(168,85,247,0.25);border-radius:12px;margin:20px 0;text-align:center;">
    <tr><td style="padding:24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#a855f7;font-weight:600;">Legacy Main Street Member</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">Virtual Storefront Granted in Chronicles!</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">Your storefront will appear in city centers across all eras.</p>
    </td></tr>
    </table>` : '';

  const content = `
    ${heroSection('Business Verified!', `${businessName} is now a Trust Layer member.`, '#00ff88')}
    
    ${mainStreetSection}
    
    ${highlightBox(`
      <h3 style="margin:0 0 10px;color:#00ff88;font-size:15px;font-weight:700;">Your Business Benefits</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li><strong style="color:#fff;">API Access</strong> - Generate API keys for Trust Layer integration</li>
        <li><strong style="color:#fff;">Webhooks</strong> - Receive real-time event notifications</li>
        <li><strong style="color:#fff;">2.5x Referral Bonus</strong> - Earn more from referrals</li>
        <li><strong style="color:#fff;">Team Management</strong> - Invite your team members</li>
        <li><strong style="color:#fff;">Trust Layer Hash</strong> - Verified identity on the blockchain</li>
      </ul>
    `, '#00ff88')}
    
    ${ctaButton('Access Business Portal', `${BASE_URL}/business-portal`, 'linear-gradient(135deg,#00ff88,#06b6d4)')}
  `;

  return sendEmail({ to, subject: `Business Verified: ${businessName} is Now a Trust Layer Member!`, html: baseTemplate(content) });
}


export async function sendBusinessRejectionEmail(to: string, businessName: string, reason: string) {
  const content = `
    ${heroSection('Application Update', `Status update for ${businessName}`, '#f59e0b')}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#f59e0b;font-size:15px;font-weight:700;">Review Feedback</h3>
      <p style="margin:0;color:#ffffff;font-size:14px;line-height:1.7;">${reason}</p>
    `, '#f59e0b')}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#06b6d4;font-size:15px;font-weight:700;">What You Can Do</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Review the feedback and address any concerns</li>
        <li>Gather additional documentation if needed</li>
        <li>Submit a new application when ready</li>
        <li>Contact us at <a href="mailto:${TEAM_EMAIL}" style="color:#06b6d4;">${TEAM_EMAIL}</a> if you have questions</li>
      </ul>
    `)}
    
    ${ctaButton('Submit New Application', `${BASE_URL}/business-application`)}
  `;

  return sendEmail({ to, subject: `Business Application Update: ${businessName}`, html: baseTemplate(content) });
}


export async function sendPaymentFailedEmail(to: string, planName: string, amount: string) {
  const planDisplayNames: Record<string, string> = {
    pulse_pro: "Pulse Pro", strike_agent: "Strike Agent", complete_bundle: "Trust Layer Complete",
    chronicles_pro: "Chronicles Pro", guardian_watch: "Guardian Watch", guardian_shield: "Guardian Shield", guardian_command: "Guardian Command",
  };
  const displayPlan = planDisplayNames[planName] || planName;

  const content = `
    ${heroSection('Payment Issue', `We couldn't process your ${displayPlan} payment.`, '#f87171')}
    
    ${receiptTable([
    { label: 'Plan', value: displayPlan },
    { label: 'Amount Due', value: `$${amount}`, bold: true },
    { label: 'Status', value: 'Payment Failed' },
  ])}
    
    ${highlightBox(`
      <h3 style="margin:0 0 8px;color:#f87171;font-size:15px;font-weight:700;">What to Do</h3>
      <ul style="margin:0;padding-left:18px;color:#94a3b8;font-size:14px;line-height:2;">
        <li>Update your payment method in Settings</li>
        <li>Ensure your card has sufficient funds</li>
        <li>Contact your bank if the issue persists</li>
        <li>Reach out to <a href="mailto:${TEAM_EMAIL}" style="color:#06b6d4;">${TEAM_EMAIL}</a> for help</li>
      </ul>
    `, '#f87171')}
    
    ${ctaButton('Update Payment Method', `${BASE_URL}/settings`, 'linear-gradient(135deg,#f87171,#ec4899)')}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="text-align:center;padding-top:4px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Your subscription will remain active for a short grace period while you resolve this.</p>
    </td></tr>
    </table>
  `;

  return sendEmail({ to, subject: `Payment Issue - ${displayPlan} Subscription`, html: baseTemplate(content) });
}
