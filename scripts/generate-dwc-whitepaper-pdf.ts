import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.join(process.cwd(), 'attached_assets', 'DWC-Coin-Whitepaper.pdf');
const publicPath = path.join(process.cwd(), 'public', 'assets', 'DWC-Coin-Whitepaper.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  info: {
    Title: 'DarkWave Coin (DWC) Technical Whitepaper',
    Author: 'DarkWave Studios',
    Subject: 'DWC Token Economics and Technical Specifications',
    Keywords: 'DWC, DarkWave, blockchain, cryptocurrency, tokenomics',
  }
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const colors = {
  primary: '#06B6D4',
  secondary: '#8B5CF6',
  dark: '#0F172A',
  text: '#1E293B',
  muted: '#64748B',
  light: '#F1F5F9',
};

function addCoverPage() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.dark);
  
  doc.fontSize(14).fillColor('#FFFFFF').opacity(0.6);
  doc.text('DARKWAVE STUDIOS', 72, 100, { align: 'center', width: doc.page.width - 144 });
  
  doc.opacity(1).fontSize(42).fillColor(colors.primary);
  doc.text('DarkWave Coin', 72, 280, { align: 'center', width: doc.page.width - 144 });
  
  doc.fontSize(24).fillColor('#FFFFFF');
  doc.text('(DWC)', 72, 340, { align: 'center', width: doc.page.width - 144 });
  
  doc.fontSize(20).fillColor(colors.secondary);
  doc.text('Technical Whitepaper', 72, 400, { align: 'center', width: doc.page.width - 144 });
  
  doc.fontSize(12).fillColor('#FFFFFF').opacity(0.7);
  doc.text('Version 2.0 | January 2026', 72, 500, { align: 'center', width: doc.page.width - 144 });
  
  doc.opacity(0.5).fontSize(10);
  doc.text('A Purpose-Built Layer 1 Blockchain for Gaming & Digital Assets', 72, 600, { align: 'center', width: doc.page.width - 144 });
  
  doc.opacity(0.4).fontSize(9);
  doc.text('https://dwsc.io | team@dwsc.io', 72, 700, { align: 'center', width: doc.page.width - 144 });
}

function addHeader(title: string) {
  doc.addPage();
  doc.fontSize(24).fillColor(colors.primary).text(title, 72, 72);
  doc.moveTo(72, 105).lineTo(540, 105).strokeColor(colors.primary).lineWidth(2).stroke();
  doc.y = 130;
}

function addSubheader(title: string) {
  doc.moveDown(0.5);
  doc.fontSize(16).fillColor(colors.secondary).text(title);
  doc.moveDown(0.3);
}

function addParagraph(text: string) {
  doc.fontSize(11).fillColor(colors.text).text(text, { align: 'justify', lineGap: 4 });
  doc.moveDown(0.5);
}

function addBullet(text: string) {
  doc.fontSize(11).fillColor(colors.text);
  doc.text(`• ${text}`, { indent: 20, lineGap: 2 });
}

function addTable(headers: string[], rows: string[][]) {
  const colWidth = (doc.page.width - 144) / headers.length;
  const startX = 72;
  let y = doc.y + 10;
  
  doc.rect(startX, y, doc.page.width - 144, 25).fill(colors.primary);
  doc.fontSize(10).fillColor('#FFFFFF');
  headers.forEach((h, i) => {
    doc.text(h, startX + (i * colWidth) + 5, y + 7, { width: colWidth - 10, align: 'center' });
  });
  y += 25;
  
  rows.forEach((row, rowIndex) => {
    const bgColor = rowIndex % 2 === 0 ? colors.light : '#FFFFFF';
    doc.rect(startX, y, doc.page.width - 144, 22).fill(bgColor);
    doc.fontSize(9).fillColor(colors.text);
    row.forEach((cell, i) => {
      doc.text(cell, startX + (i * colWidth) + 5, y + 6, { width: colWidth - 10, align: 'center' });
    });
    y += 22;
  });
  
  doc.y = y + 15;
}

addCoverPage();

addHeader('1. Executive Summary');
addParagraph('DarkWave Coin (DWC) is the native utility token of the DarkWave Smart Chain (DWSC), a purpose-built Layer 1 blockchain designed for high-performance gaming, digital asset ownership, and decentralized applications.');
addSubheader('Key Metrics');
addTable(
  ['Metric', 'Value'],
  [
    ['Token Name', 'DarkWave Coin'],
    ['Symbol', 'DWC'],
    ['Total Supply', '1,000,000,000 DWC'],
    ['Decimals', '18'],
    ['Consensus', 'Proof-of-Authority (PoA)'],
    ['Block Time', '400 milliseconds'],
    ['Throughput', '200,000+ TPS'],
    ['Transaction Fee', '~$0.0001 average'],
    ['Token Generation Event', 'April 11, 2026'],
  ]
);
addParagraph('DWC serves as the foundational currency for an integrated ecosystem spanning blockchain infrastructure, gaming, DeFi, and enterprise applications. Unlike speculative tokens, DWC derives value from actual utility across multiple revenue-generating platforms.');

addHeader('2. Introduction & Vision');
addSubheader('2.1 The Problem');
addParagraph('The blockchain industry faces a fundamental disconnect between technological capability and real-world adoption. Existing platforms suffer from:');
addBullet('Transaction latency exceeding 10+ seconds');
addBullet('Unpredictable and prohibitive gas fees');
addBullet('Limited throughput (15-50 TPS on major chains)');
addBullet('Complex user experiences requiring crypto expertise');
addBullet('$200+ billion gaming market largely untapped by blockchain');
doc.moveDown(0.5);
addSubheader('2.2 The Solution');
addParagraph('DarkWave Smart Chain and DWC address these challenges through purpose-built infrastructure for gaming and high-frequency applications, an integrated ecosystem of revenue-generating applications, sustainable economics derived from ecosystem activity, and consumer-grade UX without crypto expertise requirements.');

addHeader('3. Market Analysis');
addSubheader('3.1 Total Addressable Market');
addTable(
  ['Sector', '2025 Size', '2030 Projection', 'CAGR'],
  [
    ['Gaming', '$217B', '$340B', '9.4%'],
    ['Blockchain Gaming', '$4.6B', '$65B', '70%+'],
    ['DeFi', '$50B TVL', '$200B+ TVL', '32%'],
    ['NFTs', '$25B', '$80B', '26%'],
  ]
);
addSubheader('3.2 Layer 1 Comparison');
addTable(
  ['Chain', 'TPS', 'Finality', 'Avg Fee', 'Gaming Focus'],
  [
    ['Ethereum', '15-30', '12 min', '$2-50', 'Low'],
    ['Solana', '65,000', '400ms', '$0.00025', 'Medium'],
    ['Avalanche', '4,500', '2s', '$0.10', 'Low'],
    ['DWSC', '200,000+', '400ms', '$0.0001', 'High'],
  ]
);

addHeader('4. Technical Architecture');
addSubheader('4.1 Consensus Mechanism');
addParagraph('DWSC employs Byzantine Fault Tolerant Proof-of-Authority (BFT-PoA) with stake-weighted validator selection:');
addBullet('Minimum stake: 500,000 DWC');
addBullet('400ms target block time');
addBullet('Instant finality upon 67% validator attestation');
addBullet('Slashing for malicious behavior or downtime');
doc.moveDown(0.5);
addSubheader('4.2 Cryptographic Stack');
addTable(
  ['Component', 'Algorithm', 'Purpose'],
  [
    ['Block Hashing', 'SHA-256', 'Block header integrity'],
    ['Transaction Signing', 'ECDSA secp256k1', 'Authentication'],
    ['Merkle Trees', 'Keccak-256', 'State verification'],
    ['Key Derivation', 'BIP-32/39/44', 'HD wallet generation'],
  ]
);
addSubheader('4.3 Cross-Chain Bridges');
addParagraph('DWSC supports bridges to Ethereum and Solana with multi-sig validator threshold (4 of 7) and 15-minute confirmation windows. Lock-and-mint for DWC → wDWC (wrapped) and burn-and-release for wDWC → DWC.');

addHeader('5. Token Economics');
addSubheader('5.1 Supply Mechanics');
addTable(
  ['Parameter', 'Value'],
  [
    ['Maximum Supply', '1,000,000,000 DWC'],
    ['Initial Circulating', '250,000,000 DWC (25%)'],
    ['Inflation Rate', '0% (fixed supply)'],
    ['Burn Mechanism', 'None (fixed supply model)'],
  ]
);
addSubheader('5.2 Token Allocation');
addTable(
  ['Category', 'Percentage', 'DWC Amount', 'Vesting'],
  [
    ['Community & Ecosystem', '40%', '400,000,000', 'Milestone-based'],
    ['Development Fund', '20%', '200,000,000', 'DAO-controlled'],
    ['Team & Advisors', '15%', '150,000,000', '4-year linear'],
    ['Public Presale', '15%', '150,000,000', 'Immediate'],
    ['Liquidity Pool', '10%', '100,000,000', 'Immediate'],
  ]
);
addSubheader('5.3 Community Allocation Breakdown');
addBullet('Zealy Campaign Rewards: 50M DWC');
addBullet('Early Adopter Airdrops: 30M DWC');
addBullet('Gaming Rewards Pool: 100M DWC');
addBullet('Developer Grants: 50M DWC');
addBullet('Partnership Incentives: 70M DWC');
addBullet('Staking Rewards: 100M DWC');

addHeader('6. Token Utility');
addSubheader('6.1 Primary Utilities');
addParagraph('Transaction Fees (Gas): All on-chain transactions require DWC. Average fee ~$0.0001. Fee distribution: 70% validators, 30% ecosystem fund.');
addParagraph('Validator Staking: Minimum stake 500,000 DWC. Expected APY 8-12%. 21-day unbonding period.');
addParagraph('Liquid Staking (stDWC): Stake DWC, receive liquid stDWC. Use in DeFi while earning staking rewards.');
addParagraph('Governance: Protocol parameter voting, treasury allocation proposals. 1 DWC = 1 vote.');
addParagraph('Chronicles Game Economy: Shell conversion (100 Shells = 1 DWC), in-game purchases, NFT marketplace.');
addSubheader('6.2 Demand Drivers');
addTable(
  ['Driver', 'Mechanism', 'Impact'],
  [
    ['Gas consumption', 'Every transaction', 'Continuous demand'],
    ['Staking lockup', '500K+ per validator', 'Supply reduction'],
    ['Gaming adoption', 'Shells → DWC conversion', 'New user demand'],
    ['Enterprise usage', 'B2B service payments', 'Institutional demand'],
  ]
);

addHeader('7. Presale Structure');
addSubheader('7.1 Presale Phases');
addTable(
  ['Phase', 'Duration', 'Price', 'Allocation', 'Hard Cap'],
  [
    ['Month 1', '30 days', '$0.001', '50M DWC', '$50,000'],
    ['Month 2', '30 days', '$0.0012', '50M DWC', '$60,000'],
    ['Month 3', '30 days', '$0.0014', '50M DWC', '$70,000'],
    ['Total', '90 days', 'Avg $0.0012', '150M DWC', '$180,000'],
  ]
);
addSubheader('7.2 Presale Benefits');
addBullet('Immediate token unlock at TGE (April 11, 2026)');
addBullet('Access to private Discord channels');
addBullet('Early access to Chronicles beta');
addBullet('Exclusive NFT airdrops');
doc.moveDown(0.5);
addSubheader('7.3 Payment Methods');
addBullet('Credit/Debit Card (via Stripe)');
addBullet('USDC, ETH (Ethereum)');
addBullet('SOL (Solana)');
addBullet('Wire Transfer ($10,000+ minimum)');

addHeader('8. Distribution & Vesting');
addSubheader('8.1 Vesting Schedule');
addTable(
  ['Allocation', 'TGE Unlock', 'Cliff', 'Vesting Duration'],
  [
    ['Presale', '100%', 'None', 'Immediate'],
    ['Community', '10%', 'None', '36 months linear'],
    ['Development', '0%', '6 months', '48 months linear'],
    ['Team', '0%', '12 months', '48 months linear'],
    ['Liquidity', '100%', 'None', 'Immediate'],
  ]
);
addSubheader('8.2 Circulating Supply Projection');
addTable(
  ['Milestone', 'Months', 'Circulating', '% of Total'],
  [
    ['TGE', '0', '250M DWC', '25%'],
    ['Q4 2026', '9', '385M DWC', '38.5%'],
    ['Q4 2027', '21', '655M DWC', '65.5%'],
    ['Full Unlock', '48', '1B DWC', '100%'],
  ]
);

addHeader('9. Governance Framework');
addSubheader('9.1 DAO Structure');
addParagraph('The DarkWave DAO controls a 200M DWC treasury with a 7-seat council. All major protocol decisions require community voting with timelocks to prevent rushed changes.');
addSubheader('9.2 Proposal Types');
addTable(
  ['Type', 'Quorum', 'Threshold', 'Timelock'],
  [
    ['Parameter Change', '5%', '51%', '48 hours'],
    ['Treasury (<1M)', '10%', '60%', '48 hours'],
    ['Treasury (>1M)', '20%', '67%', '7 days'],
    ['Protocol Upgrade', '25%', '75%', '14 days'],
    ['Emergency', '33%', '80%', '24 hours'],
  ]
);
addSubheader('9.3 Voting Power');
addBullet('Base: 1 DWC = 1 vote');
addBullet('Staked DWC: 1.5x voting power');
addBullet('Validator DWC: 2x voting power');
addBullet('Delegation: Supported');

addHeader('10. Security Infrastructure');
addSubheader('10.1 Smart Contract Security');
addBullet('Multi-sig treasury (4/7 threshold)');
addBullet('Formal verification for core contracts');
addBullet('Continuous monitoring and alerting');
addBullet('Bug bounty program (up to $100,000)');
doc.moveDown(0.5);
addSubheader('10.2 Incident Response');
addBullet('24/7 monitoring');
addBullet('Automated circuit breakers');
addBullet('Emergency pause capability');
addBullet('Post-incident disclosure policy');

addHeader('11. Ecosystem Integration');
addSubheader('11.1 Core Applications');
addTable(
  ['Application', 'Type', 'Status', 'DWC Integration'],
  [
    ['DarkWave Portal', 'Web3 Hub', 'Live', 'Wallet, DEX, Staking'],
    ['Chronicles', 'Gaming', 'Beta', 'Shells, NFTs, Economy'],
    ['ChronoChat', 'Social', 'Alpha', 'Tipping, Subscriptions'],
    ['Guardian Shield', 'Security', 'Live', 'Service Payments'],
  ]
);
addSubheader('11.2 Revenue Model');
addParagraph('All ecosystem applications contribute to DWC demand through transaction fees (30% to ecosystem fund), marketplace fees (50%), subscription revenue (25%), and enterprise services (20%).');

addHeader('12. Roadmap');
addSubheader('Phase 1: Foundation (Q4 2025 - Q1 2026)');
addBullet('Blockchain mainnet launch ✓');
addBullet('Portal v1.0 deployment ✓');
addBullet('Chronicles beta release ✓');
addBullet('Presale initiation ✓');
addBullet('External security audits');
doc.moveDown(0.5);
addSubheader('Phase 2: Expansion (Q2 2026 - Q3 2026)');
addBullet('Token Generation Event (April 11, 2026)');
addBullet('DEX liquidity deployment');
addBullet('First CEX listings');
addBullet('Chronicles public launch');
addBullet('Mobile app release');
doc.moveDown(0.5);
addSubheader('Phase 3: Scale (Q4 2026 - Q2 2027)');
addBullet('Cross-chain bridges (Polygon, Arbitrum)');
addBullet('DAO governance activation');
addBullet('Developer grant program');
addBullet('100,000+ active users');
doc.moveDown(0.5);
addSubheader('Phase 4: Ecosystem Maturity (Q3 2027+)');
addBullet('Full decentralization');
addBullet('1M+ active users');
addBullet('50+ ecosystem applications');
addBullet('Institutional adoption');

addHeader('13. Risk Factors');
addSubheader('13.1 Market Risks');
addBullet('Cryptocurrency market volatility');
addBullet('Regulatory uncertainty');
addBullet('Competition from established chains');
addBullet('Macroeconomic conditions');
doc.moveDown(0.5);
addSubheader('13.2 Technical Risks');
addBullet('Smart contract vulnerabilities');
addBullet('Network attacks or exploits');
addBullet('Scalability challenges');
doc.moveDown(0.5);
addSubheader('13.3 Mitigations');
addBullet('Diversified revenue streams');
addBullet('Conservative treasury management');
addBullet('Continuous security auditing');
addBullet('Legal counsel in multiple jurisdictions');

addHeader('14. Conclusion');
addParagraph('DarkWave Coin represents a new paradigm in blockchain token design—one where utility drives value, not speculation. Through our integrated ecosystem of gaming, DeFi, and enterprise applications, DWC is positioned to capture value from real economic activity rather than relying on market sentiment alone.');
addParagraph('The combination of high-performance infrastructure (200K+ TPS, 400ms finality), consumer-grade applications (Chronicles, ChronoChat), and enterprise services (Guardian Shield) creates multiple demand vectors that sustain token value through market cycles.');
addParagraph('We invite developers, gamers, enterprises, and investors to join us in building the future of digital ownership and decentralized entertainment.');

addHeader('15. Resources & Contact');
addSubheader('Official Links');
addTable(
  ['Resource', 'URL'],
  [
    ['Website', 'https://dwsc.io'],
    ['Documentation', 'https://docs.dwsc.io'],
    ['Block Explorer', 'https://explorer.dwsc.io'],
    ['Discord', 'https://discord.gg/darkwave'],
    ['Twitter', 'https://twitter.com/DarkWaveChain'],
    ['Telegram', 'https://t.me/DarkWaveOfficial'],
  ]
);
addSubheader('Contact');
addBullet('General: team@dwsc.io');
addBullet('Partnerships: partners@dwsc.io');
addBullet('Security: security@dwsc.io');
doc.moveDown(1);
doc.fontSize(10).fillColor(colors.muted);
doc.text('Document Version: 2.0 | Last Updated: January 2026', { align: 'center' });
doc.text('Copyright © 2026 DarkWave Studios. All rights reserved.', { align: 'center' });

doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.dark);
doc.fontSize(10).fillColor('#FFFFFF').opacity(0.6);
doc.text('LEGAL DISCLAIMER', 72, 100, { align: 'center', width: doc.page.width - 144 });
doc.moveDown(2);
doc.opacity(0.8).fontSize(9);
doc.text('This whitepaper is for informational purposes only and does not constitute financial, legal, or investment advice. DWC tokens are utility tokens intended for use within the DarkWave ecosystem. Participation in any token sale involves substantial risk.', 72, 150, { align: 'justify', width: doc.page.width - 144 });
doc.moveDown(1);
doc.text('Prospective participants should conduct their own due diligence and consult with qualified professionals before making any decisions. Past performance is not indicative of future results. DarkWave Studios makes no guarantees regarding the future value or utility of DWC tokens.', { align: 'justify', width: doc.page.width - 144 });
doc.moveDown(1);
doc.text('The information contained in this document may be updated or changed without notice. Please refer to the official website (dwsc.io) for the most current version of this whitepaper.', { align: 'justify', width: doc.page.width - 144 });
doc.moveDown(2);
doc.opacity(0.5).fontSize(8);
doc.text('This document is subject to copyright protection. Unauthorized reproduction or distribution is prohibited.', { align: 'center', width: doc.page.width - 144 });

doc.end();

stream.on('finish', () => {
  fs.copyFileSync(outputPath, publicPath);
  const stats = fs.statSync(outputPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`DWC Whitepaper PDF created: ${outputPath}`);
  console.log(`Size: ${sizeKB} KB`);
  console.log(`Pages: ~20 pages`);
});
