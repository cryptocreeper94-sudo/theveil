import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Home, Box, Code, FileText, Coins, Search as SearchIcon, Sparkles, TrendingUp, ArrowUpRight, ArrowLeftRight, ArrowRight, Droplets, ArrowUpDown, ImageIcon, PieChart, History, Rocket, LineChart, Webhook, Palette, Shield, Heart, Gamepad2, Star, Zap, Globe, ChevronDown, ChevronRight, Layers, Gift, Users, LogIn, User, Wallet, Target, Dice1, Trophy, Crown, BarChart3, BookOpen, Building2, Bell, Vote, Activity, Crosshair, Copy, Bot, Fuel, Eye, RefreshCw, Award, MessageCircle, Lock, BookText, Compass, Flame, Timer } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { SimpleLoginModal } from "@/components/simple-login";
import { WalletButton } from "@/components/wallet-button";

import signalEmblem from "@assets/generated_images/darkwave_trust_layer_emblem_enhanced.jpg";
import shieldImage from "/shield-reference.jpg";
import crowdfundImg from "@assets/generated_images/futuristic_blockchain_network_activity_monitor.jpg";

// Streamlined nav categories - consolidated for cleaner mobile experience
const navCategories = [
  {
    label: "Explore",
    icon: Home,
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/launch", label: "Launch Countdown", icon: Rocket, badge: "🔥" },
      { href: "/explore", label: "Explore Everything", icon: Compass, badge: "Hub" },
      { href: "/note", label: "Our Story", icon: Heart },
      { href: "/ecosystem", label: "Ecosystem", icon: Compass },
      { href: "/executive-summary", label: "The Transmission", icon: Zap },
      { href: "/innovation", label: "Innovation Hub", icon: Sparkles, badge: "New" },
      { href: "/vision", label: "Vision", icon: Eye },
      { href: "/token-compare", label: "Token Compare", icon: BarChart3 },
      { href: "/investor-pitch", label: "Investor Pitch", icon: TrendingUp },
      { href: "/status", label: "Network Status", icon: Activity },
    ]
  },
  {
    label: "Games & Arcade",
    icon: Gamepad2,
    items: [
      { href: "/arcade", label: "The Arcade", icon: Gamepad2, badge: "Play" },
      { href: "/crash", label: "Orbit Crash", icon: Rocket, badge: "Hot" },
      { href: "/slots", label: "Dragon's Fortune Slots", icon: Crown },
      { href: "/coinflip", label: "Royal Coin Flip", icon: Dice1 },
      { href: "/predictions", label: "Predictions", icon: Target },
      { href: "/lottery", label: "Lottery", icon: Star },
      { href: "/spades", label: "Spades", icon: Gamepad2 },
      { href: "/solitaire", label: "Solitaire", icon: Gamepad2 },
      { href: "/minesweeper", label: "Minesweeper", icon: Gamepad2 },
      { href: "/galaga", label: "Galaga", icon: Gamepad2 },
      { href: "/tetris", label: "Tetris", icon: Gamepad2 },
      { href: "/snake", label: "Snake", icon: Gamepad2 },
      { href: "/pacman", label: "Pac-Man", icon: Gamepad2 },
      { href: "/coin-store", label: "Coin Store", icon: Coins },
      { href: "/daily-bonus", label: "Daily Bonus", icon: Gift },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/achievements", label: "Achievements", icon: Award },
      { href: "/sweepstakes-rules", label: "Sweepstakes Rules", icon: FileText },
    ]
  },
  {
    label: "Chronicles",
    icon: BookOpen,
    items: [
      { href: "https://yourlegacy.io", label: "Enter Chronicles", icon: BookOpen, badge: "Play", external: true },
      { href: "https://yourlegacy.io/legacy", label: "Build Your Legacy", icon: Star, external: true },
      { href: "https://yourlegacy.io/era-codex", label: "Era Codex", icon: BookText, external: true },
      { href: "https://yourlegacy.io/scenario-generator", label: "Scenario Generator", icon: Sparkles, external: true },
      { href: "/creator-program", label: "Creator Program", icon: Palette },
    ]
  },
  {
    label: "AI & Intelligence",
    icon: Zap,
    items: [
      { href: "/guardian-scanner", label: "Guardian Agent Scanner", icon: Shield, badge: "New" },
      { href: "/guardian-shield", label: "Guardian Screener", icon: Shield, badge: "DEX" },
      { href: "/pulse", label: "Pulse AI", icon: Zap, badge: "Live" },
      { href: "/strike-agent", label: "Strike Agent", icon: Target, badge: "New" },
      { href: "/ai-agents", label: "AI Agent Marketplace", icon: Bot, badge: "Create" },
      { href: "/ai-advisor", label: "AI Advisor", icon: Bot },
      { href: "/ai-nft", label: "AI NFT Generator", icon: ImageIcon },
    ]
  },
  {
    label: "Trading & Markets",
    icon: BarChart3,
    items: [
      { href: "/trading", label: "Trading Terminal", icon: BarChart3 },
      { href: "/markets", label: "Markets", icon: TrendingUp },
      { href: "/charts", label: "Price Charts", icon: LineChart },
      { href: "/whale-tracker", label: "Whale Tracker", icon: Eye },
      { href: "/copy-trading", label: "Copy Trading", icon: Copy },
      { href: "/dca-bot", label: "DCA Bot", icon: Bot },
      { href: "/paper-trading", label: "Paper Trading", icon: FileText },
      { href: "/token-analytics", label: "Token Analytics", icon: BarChart3 },
      { href: "/alerts", label: "Price Alerts", icon: Bell },
      { href: "/gas-estimator", label: "Gas Estimator", icon: Fuel },
      { href: "/simulate", label: "TX Simulator", icon: Crosshair },
    ]
  },
  {
    label: "DeFi",
    icon: ArrowUpDown,
    items: [
      { href: "/swap", label: "Swap", icon: ArrowUpDown },
      { href: "/staking", label: "Staking", icon: TrendingUp },
      { href: "/liquid-staking", label: "Liquid Staking", icon: Droplets },
      { href: "/liquidity", label: "Liquidity Pools", icon: Droplets },
      { href: "/bridge", label: "Cross-Chain Bridge", icon: ArrowLeftRight },
      { href: "/launchpad", label: "Token Launchpad", icon: Rocket },
      { href: "/governance", label: "DAO Governance", icon: Vote },
      { href: "/proof-of-reserve", label: "Proof of Reserve", icon: Lock },
    ]
  },
  {
    label: "NFTs & Digital Assets",
    icon: ImageIcon,
    items: [
      { href: "/nft", label: "NFT Marketplace", icon: ImageIcon },
      { href: "/nft-gallery", label: "NFT Gallery", icon: Layers },
      { href: "/nft-creator", label: "NFT Creator", icon: Palette },
      { href: "/rarity", label: "Rarity Analyzer", icon: Star },
      { href: "/rwa", label: "Real World Assets", icon: Globe, badge: "RWA" },
    ]
  },
  {
    label: "Wallet & Portfolio",
    icon: Wallet,
    items: [
      { href: "/my-hub", label: "My Hub", icon: User, badge: "You" },
      { href: "/wallet", label: "Wallet", icon: Wallet },
      { href: "/multisig", label: "MultiSig Wallet", icon: Lock },
      { href: "/portfolio", label: "Portfolio Dashboard", icon: PieChart },
      { href: "/rebalancer", label: "Portfolio Rebalancer", icon: RefreshCw },
      { href: "/dashboard-pro", label: "Dashboard Pro", icon: BarChart3 },
      { href: "/transactions", label: "Transaction History", icon: History },
      { href: "/wallet-profiler", label: "Wallet Profiler", icon: Eye },
      { href: "/profile", label: "Profile", icon: User },
    ]
  },
  {
    label: "Rewards & Earn",
    icon: Gift,
    items: [
      { href: "/rewards", label: "Early Adopter Rewards", icon: Gift, badge: "Hot" },
      { href: "/founder-program", label: "Founders Program", icon: Sparkles, badge: "VIP" },
      { href: "/referrals", label: "Refer & Earn", icon: Gift },
      { href: "/quests", label: "Quests", icon: Rocket },
      { href: "/airdrop", label: "Airdrop Claim", icon: Coins },
      { href: "/validators", label: "Become a Validator", icon: Shield, badge: "Earn" },
      { href: "/crowdfund", label: "Crowdfund", icon: Heart },
      { href: "/presale", label: "Token Presale", icon: Coins, badge: "Live" },
      { href: "/investment-simulator", label: "Investment Simulator", icon: BarChart3 },
    ]
  },
  {
    label: "Community & Social",
    icon: Users,
    items: [
      { href: "/signal-chat", label: "Signal Chat", icon: MessageCircle, badge: "Live" },
      { href: "/social", label: "Social Feed", icon: Activity },
      { href: "/activity", label: "Activity Feed", icon: Activity },
      { href: "/domains", label: "Domain Registry", icon: Globe, badge: "New" },
      { href: "/influencer-partnership", label: "KOL Program", icon: Users, badge: "Apply" },
      { href: "/partners", label: "Partner Portal", icon: Building2 },
      { href: "/game-developer", label: "Game Developer", icon: Code },
    ]
  },
  {
    label: "Blockchain",
    icon: Box,
    items: [
      { href: "/token", label: "Signal (SIG)", icon: Coins },
      { href: "/genesis", label: "Genesis Block", icon: Star },
      { href: "/explorer", label: "Block Explorer", icon: SearchIcon },
      { href: "/network", label: "Network Stats", icon: TrendingUp },
      { href: "/faucet", label: "Testnet Faucet", icon: Droplets },
    ]
  },
  {
    label: "Security & Trust",
    icon: Shield,
    items: [
      { href: "/guardian-ai", label: "Guardian AI", icon: Shield, badge: "New" },
      { href: "/guardian-certification", label: "Guardian Certification", icon: Shield },
      { href: "/guardian-ai-registry", label: "AI Agent Registry", icon: Shield },
      { href: "/security", label: "Security Overview", icon: Lock },
    ]
  },
  {
    label: "Learn & Build",
    icon: BookOpen,
    items: [
      { href: "/learn", label: "Academy", icon: BookOpen },
      { href: "/developers", label: "Developer Docs", icon: Code },
      { href: "/studio", label: "Trust Studio", icon: Sparkles },
      { href: "/code-snippets", label: "Code Snippets", icon: Code },
      { href: "/api-docs", label: "API Docs", icon: FileText },
      { href: "/webhooks", label: "Webhooks API", icon: Webhook },
      { href: "/doc-hub", label: "Documentation Hub", icon: FileText },
      { href: "/launch", label: "Launch Roadmap", icon: Rocket, badge: "🔥" },
      { href: "/roadmap", label: "Ecosystem Roadmap", icon: Star },
      { href: "/coming-features", label: "Coming Features", icon: Rocket },
      { href: "/feedback", label: "Feedback", icon: MessageCircle },
    ]
  },
  {
    label: "Business",
    icon: Building2,
    items: [
      { href: "/business-portal", label: "Business Portal", icon: Building2 },
      { href: "/business-application", label: "Business Application", icon: FileText },
      { href: "/team", label: "Team", icon: Users },
    ]
  },
  {
    label: "Ecosystem Apps",
    icon: Globe,
    items: [
      { href: "/domains", label: "TLID.io - Domains", icon: Globe },
      { href: "/guardian-ai", label: "TrustShield.tech", icon: Shield },
      { href: "/arcade", label: "The Arcade", icon: Gamepad2 },
      { href: "/studio", label: "Trust Studio", icon: Sparkles },
      { href: "/academy", label: "Academy", icon: BookOpen },
      { href: "https://yourlegacy.io", label: "YourLegacy.io", icon: Star, external: true },
      { href: "/signal-chat", label: "Signal Chat", icon: MessageCircle },
    ]
  },
];

function NavCategory({ category, location, onClose, onShowComingSoon }: { 
  category: typeof navCategories[0]; 
  location: string; 
  onClose: () => void;
  onShowComingSoon: (title: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = category.icon;
  const hasActiveItem = category.items.some(item => location === item.href);
  
  return (
    <div style={{ marginBottom: '4px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '10px',
          backgroundColor: hasActiveItem ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
          color: hasActiveItem ? '#a855f7' : '#a1a1aa',
          cursor: 'pointer',
          border: 'none',
          textAlign: 'left',
        }}
        data-testid={`nav-category-${category.label.toLowerCase()}`}
      >
        <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, flex: 1, fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>{category.label}</span>
        {isOpen ? (
          <ChevronDown style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
        ) : (
          <ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
        )}
      </button>
      
      {isOpen && (
        <div style={{ marginLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {category.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location === item.href;
            const isComingSoon = 'comingSoon' in item && (item as any).comingSoon;
            
            if (isComingSoon) {
              return (
                <div
                  key={item.href}
                  onClick={() => onShowComingSoon(item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                  }}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ItemIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, flex: 1, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  {'badge' in item && (item as any).badge && (
                    <Badge className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0">
                      {(item as any).badge}
                    </Badge>
                  )}
                </div>
              );
            }
            
            const isExternal = 'external' in item && (item as any).external;
            
            if (isExternal) {
              return (
                <a 
                  key={item.href} 
                  href={item.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  onClick={onClose}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#a1a1aa',
                      cursor: 'pointer',
                    }}
                    data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <ItemIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, flex: 1, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                    {'badge' in item && (item as any).badge && (
                      <Badge className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0">
                        {(item as any).badge}
                      </Badge>
                    )}
                    <ArrowUpRight style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                </a>
              );
            }
            
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                    color: isActive ? '#00ffff' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ItemIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, flex: 1, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  {'badge' in item && (item as any).badge && (
                    <Badge className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0">
                      {(item as any).badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ARCADE_GAMES = [
  { name: "Minesweeper", icon: "💣", desc: "Classic puzzle game" },
  { name: "Solitaire", icon: "🃏", desc: "Card game classic" },
  { name: "Spades", icon: "♠️", desc: "Trick-taking card game" },
  { name: "Crash", icon: "📈", desc: "Provably fair betting" },
  { name: "Slots", icon: "🎰", desc: "Spin to win" },
  { name: "Coin Flip", icon: "🪙", desc: "50/50 chance" },
  { name: "Dice", icon: "🎲", desc: "Roll the dice" },
  { name: "Blackjack", icon: "🂡", desc: "Beat the dealer" },
];

function GamesComingSoonModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 10001,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          borderRadius: '20px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.2), 0 0 100px rgba(6, 182, 212, 0.1)',
          zIndex: 10002,
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            The Arcade
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Classic & Casino Games Coming Soon
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '10px',
          marginBottom: '20px'
        }}>
          {ARCADE_GAMES.map((game) => (
            <div
              key={game.name}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{game.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{game.name}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{game.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            Play with SIG tokens or Shells
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Provably fair • Instant payouts • Low house edge
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="close-games-modal"
        >
          Got it!
        </button>
      </div>
    </>,
    document.body
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function MenuPanel({ onClose, onShowLogin }: { onClose: () => void; onShowLogin: () => void }) {
  const [location] = useLocation();
  const [showGamesModal, setShowGamesModal] = useState(false);
  const { user, isAuthenticated, displayName, logout } = useSimpleAuth();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const installed = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsInstalled(!!installed);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleShowComingSoon = (title: string) => {
    if (title === "Games") {
      setShowGamesModal(true);
    }
  };

  return createPortal(
    <>
      {showGamesModal && <GamesComingSoonModal onClose={() => setShowGamesModal(false)} />}
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />
      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '260px',
          backgroundColor: '#080c18',
          background: '#080c18',
          zIndex: 9999,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 700, fontSize: '20px', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>Menu</span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
            }}
            data-testid="button-close-menu"
          >
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Auth Section */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: 'rgba(168, 85, 247, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(168, 85, 247, 0.2)'
        }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <User style={{ width: '18px', height: '18px', color: '#fff' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName || 'Welcome back!'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email || 'Logged in'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                data-testid="button-mobile-signout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onShowLogin();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="button-mobile-login"
            >
              <LogIn style={{ width: '18px', height: '18px' }} />
              Log In / Sign Up
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ 
          marginBottom: '16px', 
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Search Trust Layer..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = (e.target as HTMLInputElement).value;
                if (query.trim()) {
                  onClose();
                  window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
              }
            }}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
            data-testid="input-mobile-search"
          />
          <SearchIcon 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '18px', 
              height: '18px', 
              color: 'rgba(255,255,255,0.5)' 
            }} 
          />
        </div>

        {/* Launch Countdown */}
        <Link href="/launch" style={{ textDecoration: 'none', display: 'block' }}>
          <div
            onClick={onClose}
            data-testid="featured-launch"
            style={{
              marginBottom: '12px',
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.15) 50%, rgba(6,182,212,0.15) 100%)',
              border: '2px solid rgba(239,68,68,0.4)',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(239,68,68,0.15), 0 0 60px rgba(245,158,11,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              position: 'relative' as const,
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }} />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
              flexShrink: 0,
            }}>
              <Rocket style={{ width: '24px', height: '24px', color: '#ffffff' }} />
            </div>
            <div style={{ flex: 1, position: 'relative' as const, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>August 23rd Launch</span>
                <Badge className="text-[9px] px-1.5 py-0 bg-red-500/30 text-red-300 border-red-500/30 animate-pulse">🔥</Badge>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Signal goes live — view roadmap</span>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: 'rgba(239,68,68,0.8)' }} />
          </div>
        </Link>

        {/* Presale Featured - Shield at Top */}
        <Link href="/presale" style={{ textDecoration: 'none', display: 'block' }}>
          <div
            onClick={onClose}
            data-testid="featured-presale"
            style={{
              marginBottom: '12px',
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(168,85,247,0.15) 100%)',
              border: '2px solid rgba(6,182,212,0.4)',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(6,182,212,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <img 
              src={shieldImage} 
              alt="Signal"
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                mixBlendMode: 'lighten',
                filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>Incoming Signal</span>
                <Badge className="text-[9px] px-1.5 py-0 bg-cyan-500/30 text-cyan-300 animate-pulse">Live</Badge>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Presale Now Open</span>
            </div>
            <ArrowRight style={{ width: '18px', height: '18px', color: 'rgba(6,182,212,0.8)' }} />
          </div>
        </Link>

        {/* Crowdfunding Button */}
        <Link href="/crowdfund" style={{ textDecoration: 'none', display: 'block' }}>
          <div
            onClick={onClose}
            data-testid="featured-crowdfund"
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.2) 100%)',
              border: '1px solid rgba(168,85,247,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Heart style={{ width: '18px', height: '18px', color: '#ffffff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff', display: 'block' }}>Crowdfunding</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Support the Project</span>
            </div>
            <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.5)' }} />
          </div>
        </Link>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: '16px' }} />

        {/* Install App Button */}
        {!isInstalled && (
          <button
            onClick={installPrompt ? handleInstall : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              borderRadius: '12px',
              background: installPrompt ? 'linear-gradient(135deg, #06b6d4, #a855f7)' : 'rgba(6, 182, 212, 0.1)',
              border: installPrompt ? 'none' : '1px solid rgba(6, 182, 212, 0.3)',
              color: installPrompt ? '#000' : '#06b6d4',
              cursor: installPrompt ? 'pointer' : 'default',
              fontWeight: 700,
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
            data-testid="button-install-app"
          >
            <Rocket style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              {installPrompt ? 'Install App' : 'Install: Menu → Add to Home Screen'}
            </span>
          </button>
        )}

        {/* Nav Categories */}
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {navCategories.map((category) => (
            <NavCategory 
              key={category.label} 
              category={category} 
              location={location} 
              onClose={onClose}
              onShowComingSoon={handleShowComingSoon}
            />
          ))}
        </nav>

      </div>
    </>,
    document.body
  );
}

// Primary links shown in desktop nav bar
const primaryNavItems = [
  { href: "/wallet", label: "Wallet", icon: Coins },
  { href: "/swap", label: "Swap", icon: ArrowUpDown },
  { href: "/token", label: "Coin", icon: Coins },
  { href: "/explorer", label: "Explorer", icon: SearchIcon },
  { href: "/staking", label: "Staking", icon: TrendingUp },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/developers", label: "Developers", icon: Code },
];

export function DesktopNav() {
  const [location] = useLocation();
  
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 text-xs gap-1.5 ${isActive ? 'bg-white/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
      <div className="ml-2 pl-2 border-l border-white/10">
        <WalletButton />
      </div>
    </nav>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      <SimpleLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="hover:bg-white/5 min-w-[36px] min-h-[36px] w-9 h-9 sm:min-w-[44px] sm:min-h-[44px] sm:w-11 sm:h-11"
        data-testid="button-mobile-menu"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      {mounted && isOpen && (
        <MenuPanel 
          onClose={() => setIsOpen(false)} 
          onShowLogin={() => setShowLoginModal(true)}
        />
      )}
    </div>
  );
}
