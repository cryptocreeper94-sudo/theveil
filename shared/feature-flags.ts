/**
 * Feature Flags Configuration
 * Centralized feature status and timeline management
 */

export type FeatureStatus = 'live' | 'coming_soon' | 'beta' | 'testnet' | 'maintenance';

export interface FeatureFlag {
  id: string;
  name: string;
  status: FeatureStatus;
  description?: string;
  expectedLaunch?: string;
  launchQuarter?: string;
  enabled: boolean;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  wallet: {
    id: 'wallet',
    name: 'Multi-Chain Wallet',
    status: 'testnet',
    description: 'Self-custody wallet with 9 chain support',
    enabled: true,
  },
  bridge: {
    id: 'bridge',
    name: 'Cross-Chain Bridge',
    status: 'coming_soon',
    description: 'Transfer assets between chains',
    expectedLaunch: 'August 23, 2026',
    launchQuarter: 'Q3 2026',
    enabled: false,
  },
  swap: {
    id: 'swap',
    name: 'Token Swap',
    status: 'coming_soon',
    description: 'Instant token swaps on DarkWave',
    expectedLaunch: 'August 23, 2026',
    launchQuarter: 'Q3 2026',
    enabled: false,
  },
  staking: {
    id: 'staking',
    name: 'SIG Staking',
    status: 'coming_soon',
    description: 'Stake SIG for rewards',
    expectedLaunch: 'August 2026',
    launchQuarter: 'Q3 2026',
    enabled: false,
  },
  nftMarketplace: {
    id: 'nftMarketplace',
    name: 'NFT Marketplace',
    status: 'coming_soon',
    description: 'Buy, sell, and trade NFTs',
    expectedLaunch: 'September 2026',
    launchQuarter: 'Q3 2026',
    enabled: false,
  },
  launchpad: {
    id: 'launchpad',
    name: 'Token Launchpad',
    status: 'coming_soon',
    description: 'Launch new tokens on DarkWave',
    expectedLaunch: 'October 2026',
    launchQuarter: 'Q4 2026',
    enabled: false,
  },
  guardianCertification: {
    id: 'guardianCertification',
    name: 'Guardian Certification',
    status: 'live',
    description: 'Smart contract security audits',
    enabled: true,
  },
  guardianShield: {
    id: 'guardianShield',
    name: 'Guardian Shield',
    status: 'coming_soon',
    description: '24/7 security monitoring',
    expectedLaunch: 'Q1 2026',
    launchQuarter: 'Q1 2026',
    enabled: false,
  },
  chronicles: {
    id: 'chronicles',
    name: 'DarkWave Chronicles',
    status: 'coming_soon',
    description: 'Parallel life simulation game — on hold pending graphics overhaul',
    expectedLaunch: 'TBD',
    launchQuarter: 'TBD',
    enabled: false,
  },
  communityHub: {
    id: 'communityHub',
    name: 'Community Hub',
    status: 'beta',
    description: 'Real-time community chat',
    enabled: true,
  },
  domains: {
    id: 'domains',
    name: '.tlid Domains',
    status: 'coming_soon',
    description: 'Blockchain domain names',
    expectedLaunch: 'Q1 2026',
    launchQuarter: 'Q1 2026',
    enabled: false,
  },
  validators: {
    id: 'validators',
    name: 'Validator Network',
    status: 'coming_soon',
    description: 'PoA validator nodes',
    expectedLaunch: 'August 23, 2026',
    launchQuarter: 'Q3 2026',
    enabled: false,
  },
  presale: {
    id: 'presale',
    name: 'Token Presale',
    status: 'live',
    description: 'SIG token presale',
    enabled: true,
  },
  faucet: {
    id: 'faucet',
    name: 'Testnet Faucet',
    status: 'testnet',
    description: 'Get test SIG tokens',
    enabled: true,
  },
  arcade: {
    id: 'arcade',
    name: 'DarkWave Arcade',
    status: 'beta',
    description: 'Play-to-earn games',
    enabled: true,
  },
  apiPlayground: {
    id: 'apiPlayground',
    name: 'API Playground',
    status: 'live',
    description: 'Test API endpoints',
    enabled: true,
  },
  studio: {
    id: 'studio',
    name: 'Developer Studio',
    status: 'coming_soon',
    description: 'Build on DarkWave',
    expectedLaunch: 'Q4 2026',
    launchQuarter: 'Q4 2026',
    enabled: false,
  },
};

export function getFeature(id: string): FeatureFlag | undefined {
  return FEATURE_FLAGS[id];
}

export function isFeatureEnabled(id: string): boolean {
  return FEATURE_FLAGS[id]?.enabled ?? false;
}

export function getFeatureStatus(id: string): FeatureStatus {
  return FEATURE_FLAGS[id]?.status ?? 'coming_soon';
}

export function getStatusBadgeColor(status: FeatureStatus): string {
  switch (status) {
    case 'live':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'beta':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'testnet':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'coming_soon':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'maintenance':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getStatusLabel(status: FeatureStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'beta':
      return 'Beta';
    case 'testnet':
      return 'Testnet';
    case 'coming_soon':
      return 'Coming Soon';
    case 'maintenance':
      return 'Maintenance';
    default:
      return 'Unknown';
  }
}
