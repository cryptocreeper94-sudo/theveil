import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'attached_assets');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FONT_BODY = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_ITALIC = 'Helvetica-Oblique';

function createHeader(doc: typeof PDFDocument.prototype, title: string) {
  doc.rect(0, 0, PAGE_WIDTH, 120).fill('#0a0f1a');
  
  doc.font(FONT_BOLD)
     .fontSize(28)
     .fillColor('#00d4ff')
     .text('DARKWAVE', MARGIN, 35, { continued: true })
     .fillColor('#a855f7')
     .text(' SMART CHAIN');
  
  doc.font(FONT_BODY)
     .fontSize(14)
     .fillColor('#94a3b8')
     .text(title, MARGIN, 75);
  
  doc.y = 140;
}

function addDarkBackground(doc: typeof PDFDocument.prototype) {
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');
}

function addSection(doc: typeof PDFDocument.prototype, title: string, content: string) {
  if (doc.y > PAGE_HEIGHT - 150) {
    doc.addPage();
    addDarkBackground(doc);
    doc.y = MARGIN;
  }
  
  doc.font(FONT_BOLD)
     .fontSize(16)
     .fillColor('#00d4ff')
     .text(title, MARGIN, doc.y);
  
  doc.moveDown(0.5);
  
  doc.font(FONT_BODY)
     .fontSize(11)
     .fillColor('#e2e8f0')
     .text(content, MARGIN, doc.y, {
       width: CONTENT_WIDTH,
       align: 'justify',
       lineGap: 3
     });
  
  doc.moveDown(1.5);
}

function addBulletList(doc: typeof PDFDocument.prototype, items: string[]) {
  for (const item of items) {
    if (doc.y > PAGE_HEIGHT - 80) {
      doc.addPage();
      addDarkBackground(doc);
      doc.y = MARGIN;
    }
    doc.font(FONT_BODY)
       .fontSize(11)
       .fillColor('#e2e8f0')
       .text('  •  ' + item, MARGIN + 15, doc.y, {
         width: CONTENT_WIDTH - 15,
         lineGap: 2
       });
    doc.moveDown(0.3);
  }
  doc.moveDown(0.5);
}

function addFooter(doc: typeof PDFDocument.prototype, pageNum: number) {
  doc.font(FONT_BODY)
     .fontSize(9)
     .fillColor('#64748b')
     .text(`DarkWave Studios | dwsc.io | Page ${pageNum}`, 0, PAGE_HEIGHT - 30, {
       width: PAGE_WIDTH,
       align: 'center'
     });
}

async function generateWhitepaper() {
  console.log('Generating Whitepaper PDF...');
  
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: 'DarkWave Smart Chain - Technical Whitepaper',
      Author: 'DarkWave Studios',
      Subject: 'Layer 1 Blockchain Technical Documentation'
    },
    bufferPages: true
  });
  
  const outputPath = path.join(outputDir, 'DWSC-Whitepaper.pdf');
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);
  
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');
  createHeader(doc, 'Technical Whitepaper v1.0');
  
  addSection(doc, 'Abstract', 
    'DarkWave Smart Chain (DWSC) is a purpose-built Layer 1 blockchain optimized for high-performance gaming, digital asset ownership, and decentralized applications. This whitepaper outlines the technical architecture, consensus mechanism, and economic model that powers the DarkWave ecosystem.');
  
  addSection(doc, '1. Introduction', 
    'Existing blockchain platforms face fundamental trade-offs between decentralization, security, and scalability. For gaming and real-time interactive applications, these trade-offs result in high latency, unpredictable fees, limited throughput, and complex user experiences.');
  
  addSection(doc, '1.1 Solution Overview', 
    'DWSC addresses these challenges through innovative design:');
  addBulletList(doc, [
    'Proof-of-Authority consensus achieving 400ms block times',
    'Throughput exceeding 200,000 transactions per second',
    'Sub-cent transaction fees ($0.0001 average)',
    'Integrated wallet and onboarding experience'
  ]);
  
  addSection(doc, '2. Technical Architecture', '');
  
  addSection(doc, '2.1 Consensus Mechanism', 
    'DWSC employs a Proof-of-Authority (PoA) consensus with a Founders Validator system:');
  addBulletList(doc, [
    'Validator Selection: Vetted node operators selected for reliability and uptime',
    'Block Production: Round-robin block production with 400ms target',
    'Finality: Instant finality upon block inclusion',
    'Security: Byzantine fault tolerance up to 33% malicious validators'
  ]);
  
  addSection(doc, '2.2 Cryptographic Primitives', '');
  addBulletList(doc, [
    'Hashing: SHA-256 for block headers and transaction hashing',
    'Signatures: HMAC-SHA256 for transaction authentication',
    'Merkle Trees: For efficient state verification and light client support'
  ]);
  
  addSection(doc, '3. Token Economics', '');
  
  addSection(doc, '3.1 Native Coin (DWC)', '');
  addBulletList(doc, [
    'Total Supply: 1,000,000,000 DWC (fixed, no inflation/deflation)',
    'Decimals: 18',
    'Utility: Gas fees, staking, governance, in-app purchases'
  ]);
  
  addSection(doc, '3.2 Coin Allocation', '');
  addBulletList(doc, [
    'Community & Ecosystem: 40% (400M) - Milestone-based vesting',
    'Development Fund: 20% (200M) - DAO-controlled',
    'Team & Advisors: 15% (150M) - 4-year vesting',
    'Presale: 15% (150M) - Immediate distribution',
    'Liquidity: 10% (100M) - Immediate for DEX'
  ]);
  
  addSection(doc, '4. Ecosystem Applications', '');
  
  addSection(doc, '4.1 DarkWave Portal', 
    'Central hub for ecosystem access including wallet management, DEX and token swaps, NFT marketplace, staking interface, and cross-chain bridge to external chains.');
  
  addSection(doc, '4.2 DarkWave Chronicles', 
    'Flagship gaming application demonstrating chain capabilities with real-time multiplayer interactions, on-chain asset ownership, dynamic economy, and 70+ playable eras.');
  
  addSection(doc, '5. Roadmap', '');
  addBulletList(doc, [
    'Phase 1 (Q1 2026): Testnet launch, core smart contracts, developer SDK',
    'Phase 2 (Q2-Q3 2026): Token Generation Event (Apr 11), DEX/staking launch, bridge deployment',
    'Phase 3 (Q3-Q4 2026): Chronicles public beta (Aug 23 launch), third-party developers, cross-chain integrations'
  ]);
  
  addSection(doc, '6. Conclusion', 
    'DarkWave Smart Chain represents a purpose-built solution for the next generation of interactive blockchain applications. By optimizing for gaming use cases while maintaining security and decentralization principles, DWSC enables experiences previously impossible on existing platforms.');
  
  doc.addPage();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');
  doc.y = MARGIN;
  
  doc.font(FONT_BOLD)
     .fontSize(20)
     .fillColor('#00d4ff')
     .text('Contact & Resources', MARGIN, doc.y);
  doc.moveDown(1);
  
  addSection(doc, 'Official Links', '');
  addBulletList(doc, [
    'Website: https://dwsc.io',
    'Documentation: https://dwsc.io/doc-hub',
    'Coin Presale: https://dwsc.io/presale',
    'Developer Portal: https://dwsc.io/developers',
    'Community Hub: https://dwsc.io/community-hub'
  ]);
  
  addSection(doc, 'Social Media', '');
  addBulletList(doc, [
    'Twitter/X: @DarkWaveChain',
    'Discord: discord.gg/darkwave',
    'Telegram: t.me/darkwavechain',
    'YouTube: @DarkWaveStudios'
  ]);
  
  addSection(doc, 'Contact', '');
  addBulletList(doc, [
    'General Inquiries: team@dwsc.io',
    'Website: https://darkwavestudios.io'
  ]);
  
  doc.moveDown(2);
  doc.font(FONT_ITALIC)
     .fontSize(10)
     .fillColor('#64748b')
     .text('Version 2.0 - January 2026', MARGIN, doc.y)
     .text('DarkWave Studios LLC', MARGIN, doc.y + 15)
     .text('This document is for informational purposes only and does not constitute financial advice.', MARGIN, doc.y + 30);
  
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    addFooter(doc, i + 1);
  }
  
  doc.end();
  
  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`Whitepaper saved: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
      resolve();
    });
    writeStream.on('error', reject);
  });
}

async function generateExecutiveSummary() {
  console.log('Generating Executive Summary PDF...');
  
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: 'DarkWave Smart Chain - Executive Summary',
      Author: 'DarkWave Studios',
      Subject: 'Investor & Partner Overview'
    },
    bufferPages: true
  });
  
  const outputPath = path.join(outputDir, 'DWSC-Executive-Summary.pdf');
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);
  
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');
  createHeader(doc, 'Executive Summary - Investor Overview');
  
  addSection(doc, 'Company Overview', 
    'DarkWave Studios is building a vertically-integrated blockchain ecosystem comprising the DarkWave Smart Chain (Layer 1 infrastructure), DarkWave Portal (ecosystem gateway), and DarkWave Chronicles (flagship gaming application). Our mission is to deliver high-performance blockchain infrastructure optimized for real-time interactive experiences.');
  
  addSection(doc, 'The Opportunity', 
    'The blockchain gaming and digital asset market is projected to reach $65.7 billion by 2027. Current solutions suffer from high latency, prohibitive fees, and poor user experience. DWSC addresses these pain points with purpose-built technology.');
  
  addSection(doc, 'Key Differentiators', '');
  addBulletList(doc, [
    '400ms block times vs 10+ seconds on Ethereum',
    '200,000+ TPS capacity for real-time gaming',
    '$0.0001 average transaction fee',
    'Integrated gaming platform with 70+ playable eras',
    'Full vertical stack from consensus to applications'
  ]);
  
  addSection(doc, 'Coin Economics (DWC)', 
    'DWC is the native coin of the DarkWave Smart Chain - a Layer 1 blockchain with its own consensus, validators, and block production. Unlike tokens built on other chains, DWC powers the entire network.');
  addBulletList(doc, [
    'Total Supply: 1 Billion DWC (fixed, no inflation or burn)',
    'Presale Price: $0.001 (Month 1), $0.0012 (Month 2), $0.0014 (Month 3)',
    'TGE Launch: April 11, 2026',
    'Use Cases: Gas fees, staking, governance, in-game purchases, NFT transactions'
  ]);
  
  addSection(doc, 'Revenue Streams', '');
  addBulletList(doc, [
    'Transaction Fees: 0.1% of all on-chain activity',
    'Gaming Revenue: In-app purchases, subscriptions, creator licensing',
    'NFT Marketplace: 2.5% transaction fees',
    'DEX Trading: 0.3% swap fees',
    'Enterprise Services: Guardian security audits ($5,999-$14,999)',
    'Domain Registration: Premium .dwsc domains'
  ]);
  
  addSection(doc, 'Traction & Milestones', '');
  addBulletList(doc, [
    'Live testnet with 4 active validators',
    'Portal fully operational with DEX, staking, NFT marketplace',
    'Chronicles beta with AI-powered gameplay',
    'Stripe payment integration complete',
    'Community platform (ChronoChat) active'
  ]);
  
  addSection(doc, 'Roadmap', '');
  addBulletList(doc, [
    'Q1 2026: Presale completion, mainnet preparation',
    'April 11, 2026: Token Generation Event (TGE)',
    'August 23, 2026: Full ecosystem launch',
    'Q4 2026: Third-party developer onboarding',
    'October 2026: Full mainnet launch'
  ]);
  
  addSection(doc, 'Team', 
    'DarkWave Studios is led by experienced blockchain architects and gaming industry veterans with backgrounds in distributed systems, cryptography, and interactive entertainment.');
  
  doc.addPage();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');
  doc.y = MARGIN;
  
  doc.font(FONT_BOLD)
     .fontSize(20)
     .fillColor('#00d4ff')
     .text('Get Involved', MARGIN, doc.y);
  doc.moveDown(1);
  
  addSection(doc, 'For Investors', '');
  addBulletList(doc, [
    'Token Presale: https://dwsc.io/presale',
    'Investor Pitch: https://dwsc.io/investor-pitch',
    'Tokenomics: https://dwsc.io/tokenomics'
  ]);
  
  addSection(doc, 'For Developers', '');
  addBulletList(doc, [
    'Developer Portal: https://dwsc.io/developers',
    'API Documentation: https://dwsc.io/api-docs',
    'Testnet Faucet: https://dwsc.io/faucet'
  ]);
  
  addSection(doc, 'For Community', '');
  addBulletList(doc, [
    'Community Hub: https://dwsc.io/community-hub',
    'Chronicles Game: https://dwsc.io/chronicles',
    'Validator Program: https://dwsc.io/validators'
  ]);
  
  addSection(doc, 'Social Media', '');
  addBulletList(doc, [
    'Twitter/X: @DarkWaveChain',
    'Discord: discord.gg/darkwave',
    'Telegram: t.me/darkwavechain',
    'YouTube: @DarkWaveStudios'
  ]);
  
  doc.moveDown(1);
  doc.font(FONT_ITALIC)
     .fontSize(10)
     .fillColor('#64748b')
     .text('January 2026 | DarkWave Studios LLC', MARGIN, doc.y)
     .text('Contact: team@dwsc.io', MARGIN, doc.y + 15)
     .text('Website: https://darkwavestudios.io', MARGIN, doc.y + 30);
  
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    addFooter(doc, i + 1);
  }
  
  doc.end();
  
  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPath);
      console.log(`Executive Summary saved: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
      resolve();
    });
    writeStream.on('error', reject);
  });
}

async function main() {
  await generateWhitepaper();
  await generateExecutiveSummary();
  console.log('\nAll PDFs generated successfully!');
}

main().catch(console.error);
