import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, X, Search, ChevronRight, ChevronDown,
  BookOpen, Shield, Wallet, Coins, ArrowLeftRight,
  Gamepad2, Code, Lock, Rocket, Building2, Compass,
  Users, Sparkles, GraduationCap, Home, MessageSquare,
  ExternalLink, Lightbulb
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";

interface HelpEntry {
  title: string;
  content: string;
  link?: { label: string; href: string };
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  entries: HelpEntry[];
}

interface ContextMapping {
  routes: string[];
  sectionIds: string[];
  quickTips: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Rocket className="w-4 h-4" />,
    entries: [
      {
        title: "What is Trust Layer?",
        content: "Trust Layer is infrastructure where accountability is built into the foundation. Every participant is verified, every action carries a timestamp, and every commitment becomes a permanent record. It's the foundation for business where trust isn't optional.",
        link: { label: "Learn More", href: "/learn" }
      },
      {
        title: "Creating Your Account",
        content: "Click 'Sign In' at the top of any page. You can sign up with email, Google, or Apple ID. Once registered, you'll have your own dashboard, wallet, and access to the entire ecosystem. No prior crypto experience needed."
      },
      {
        title: "Setting Up Your Wallet",
        content: "Your wallet is created automatically when you join. No browser extensions or separate apps needed. View your balance, send and receive Signal, and track all transactions from your Dashboard.",
        link: { label: "Go to Wallet", href: "/wallet" }
      },
      {
        title: "Getting Your First Signal",
        content: "You can acquire Signal through the presale at discounted rates, earn through Quest Mining by completing tasks, receive from other participants, or stake existing Signal for rewards.",
        link: { label: "Join Presale", href: "/presale" }
      }
    ]
  },
  {
    id: "signal-basics",
    title: "Signal (SIG)",
    icon: <Coins className="w-4 h-4" />,
    entries: [
      {
        title: "What is Signal?",
        content: "Signal (SIG) is the native asset of the Trust Layer — like ETH is to Ethereum. When you send Signal, you're transmitting verified intent from one participant to another, recorded permanently. Total supply: 1 billion SIG, fixed forever."
      },
      {
        title: "Checking Your Balance",
        content: "Your Signal balance appears on your dashboard and wallet page. You'll see: Available Balance, Staked Balance, Pending transactions, and Total Value in USD.",
        link: { label: "View Dashboard", href: "/dashboard" }
      },
      {
        title: "Sending & Receiving",
        content: "To send: go to Wallet > Send > enter address and amount > confirm. To receive: go to Wallet > Receive > share your address or QR code. Transactions confirm in under a second."
      }
    ]
  },
  {
    id: "staking",
    title: "Staking & Earning",
    icon: <Sparkles className="w-4 h-4" />,
    entries: [
      {
        title: "What is Staking?",
        content: "Staking is like a savings account that helps secure the network. Lock your Signal for a period, earn rewards in return. The more you stake and the longer you commit, the higher your rewards."
      },
      {
        title: "How to Stake",
        content: "Go to the Staking page, choose your amount and period, then confirm. Your Signal is locked until the period ends, but you earn rewards daily. Some pools allow early withdrawal with a small penalty.",
        link: { label: "Start Staking", href: "/staking" }
      },
      {
        title: "Liquid Staking (stSIG)",
        content: "Liquid staking gives you stSIG tokens representing your staked Signal. These can be traded or used in DeFi while your original Signal keeps earning rewards. Redeem stSIG anytime for Signal plus accumulated rewards.",
        link: { label: "Liquid Staking", href: "/liquid-staking" }
      }
    ]
  },
  {
    id: "defi",
    title: "DeFi & Trading",
    icon: <ArrowLeftRight className="w-4 h-4" />,
    entries: [
      {
        title: "Token Swap (DEX)",
        content: "Swap between different assets directly on the Trust Layer without a middleman. Select your pair, enter the amount, review the rate, and confirm. Swaps execute instantly with minimal fees.",
        link: { label: "Open Swap", href: "/swap" }
      },
      {
        title: "Cross-Chain Bridge",
        content: "Move assets between Trust Layer and other networks like Ethereum or Solana. Connect your external wallet, choose source and destination, select amount, and confirm. Usually takes 5-15 minutes.",
        link: { label: "Use Bridge", href: "/bridge" }
      },
      {
        title: "Liquidity Pools",
        content: "Provide liquidity by depositing asset pairs into pools. You earn a share of trading fees proportional to your contribution. Higher risk than staking, but potentially higher returns.",
        link: { label: "View Pools", href: "/pools" }
      }
    ]
  },
  {
    id: "nft",
    title: "NFTs & Digital Assets",
    icon: <Compass className="w-4 h-4" />,
    entries: [
      {
        title: "NFT Marketplace",
        content: "Browse, buy, and sell unique digital assets. Each NFT is verified on the Trust Layer with provenance tracking. Filter by collection, price, or category to find what you're looking for.",
        link: { label: "Browse NFTs", href: "/nft-marketplace" }
      },
      {
        title: "Creating NFTs",
        content: "Use the NFT Creator tool to mint your own digital assets. Upload your artwork, set properties and royalties, then mint directly to the Trust Layer. Your creation is permanently recorded with verifiable ownership.",
        link: { label: "Create NFT", href: "/nft-creator" }
      }
    ]
  },
  {
    id: "guardian",
    title: "Guardian Security",
    icon: <Shield className="w-4 h-4" />,
    entries: [
      {
        title: "Guardian Scanner",
        content: "Scan any smart contract or wallet address to check for security risks. The Guardian AI analyzes code patterns, transaction history, and known vulnerability databases to give you a trust score.",
        link: { label: "Open Scanner", href: "/guardian-scanner" }
      },
      {
        title: "Guardian Certification",
        content: "Projects with Guardian certification have passed rigorous security audits. Look for the Guardian badge when interacting with contracts or applications on the Trust Layer.",
        link: { label: "Certification Program", href: "/guardian-certification" }
      },
      {
        title: "Account Security",
        content: "Protect your account with a strong password, two-factor authentication, and Passkey/WebAuthn for passwordless login. Trust Layer staff will never ask for your recovery phrase or private keys."
      }
    ]
  },
  {
    id: "chronicles",
    title: "Chronicles",
    icon: <Gamepad2 className="w-4 h-4" />,
    entries: [
      {
        title: "What is Chronicles?",
        content: "Chronicles is a life simulation game set across three eras — Modern, Medieval, and Wild West. Your choices shape your character's story, reputation, and legacy. Powered by AI for personalized experiences.",
        link: { label: "Play Chronicles", href: "/chronicles" }
      },
      {
        title: "Getting Started",
        content: "Start by creating your 'Parallel Self' through the onboarding assessment. This shapes your character's personality and starting conditions. Then explore your era, interact with NPCs, and build your legacy.",
        link: { label: "Tutorial", href: "/chronicles/tutorial" }
      },
      {
        title: "In-Game Economy",
        content: "Chronicles uses Echoes as in-game currency (1 Echo = $0.0001). Earn Echoes through gameplay, trade with NPCs, or convert Shells to Echoes. 10 Echoes = 1 Shell."
      }
    ]
  },
  {
    id: "arcade",
    title: "The Arcade",
    icon: <Gamepad2 className="w-4 h-4" />,
    entries: [
      {
        title: "About The Arcade",
        content: "Play classic and casino-style games with Shell currency. Includes slots, crash, coin flip, and more. Win Shells that convert to Signal at launch. Fair odds, transparent mechanics.",
        link: { label: "Visit Arcade", href: "/arcade" }
      }
    ]
  },
  {
    id: "trust-book",
    title: "Trust Book (Veil)",
    icon: <BookOpen className="w-4 h-4" />,
    entries: [
      {
        title: "Reading on Veil",
        content: "Veil is a premium ebook platform with blockchain-verified provenance. Browse the library, purchase books, and read with our built-in reader featuring AI narration, adjustable text, and beautiful typography.",
        link: { label: "Browse Library", href: "/trust-book" }
      },
      {
        title: "AI Narration",
        content: "Every book can be read aloud by our AI voice system. Tap the speaker icon while reading to start narration. The AI reads chapter by chapter and advances automatically. You can pause, resume, or stop at any time."
      },
      {
        title: "Publishing on Veil",
        content: "Authors earn 70% royalties on every sale. Upload your manuscript, set your price, and publish with blockchain-verified ownership. Your work is permanently attributed to you.",
        link: { label: "Author Portal", href: "/trust-book/publish" }
      }
    ]
  },
  {
    id: "academy",
    title: "Lume Academy",
    icon: <GraduationCap className="w-4 h-4" />,
    entries: [
      {
        title: "About Lume Academy",
        content: "Learn programming from the ground up through 8 course tracks — from Programming Foundations to AI-Powered 3D Creation. Built around Lume, the world's first AI-native programming language.",
        link: { label: "Visit Academy", href: "/academy" }
      },
      {
        title: "Certifications",
        content: "Earn blockchain-verified certifications: CLF (Foundations), CLE (Expert), CDA (Digital Architecture), and CSR (Self-Sustaining Runtime). Each proves your skills permanently on-chain."
      },
      {
        title: "The Lume Language",
        content: "Lume is an AI-native language where 'ask', 'think', and 'generate' are native keywords. It even accepts natural English as valid source code — you can literally speak your code into existence."
      }
    ]
  },
  {
    id: "trusthome",
    title: "TrustHome",
    icon: <Home className="w-4 h-4" />,
    entries: [
      {
        title: "About TrustHome",
        content: "TrustHome is a professional platform for real estate agents. Manage verified agent profiles, property listings, client relationships, and build trust scores — all backed by blockchain verification.",
        link: { label: "Open TrustHome", href: "/trusthome" }
      }
    ]
  },
  {
    id: "business",
    title: "Business Rails",
    icon: <Building2 className="w-4 h-4" />,
    entries: [
      {
        title: "What are Business Rails?",
        content: "Pre-built pathways for specific industries to plug into the Trust Layer. Instead of building trust infrastructure from scratch, businesses join verified networks where identity, transactions, and reputation are already established."
      },
      {
        title: "Available Rails",
        content: "Construction & Trades: verified contractors, tracked materials, timestamped inspections. Staffing & HR: verified credentials, tracked hours, processed payroll. More rails coming soon."
      }
    ]
  },
  {
    id: "community",
    title: "Community & Support",
    icon: <Users className="w-4 h-4" />,
    entries: [
      {
        title: "Signal Chat",
        content: "Our built-in messaging platform for the Trust Layer community. Connect with other participants, join topic channels, and stay up to date on ecosystem news.",
        link: { label: "Open Signal Chat", href: "/signal-chat" }
      },
      {
        title: "Affiliate Program",
        content: "Earn Signal by referring others. Share your unique link, earn commission on every successful referral. Tiers range from 10% (Base) to 20% (Diamond) based on your referral count.",
        link: { label: "Affiliate Dashboard", href: "/affiliate" }
      },
      {
        title: "Support Center",
        content: "Submit tickets for technical issues, billing questions, or feature requests. Our team responds to all inquiries. Check your ticket history anytime.",
        link: { label: "Get Support", href: "/support" }
      }
    ]
  }
];

const contextMappings: ContextMapping[] = [
  {
    routes: ["/", "/home", "/welcome"],
    sectionIds: ["getting-started", "signal-basics", "community"],
    quickTips: [
      "New here? Start by creating an account — it takes less than a minute.",
      "Your wallet is created automatically when you sign up.",
      "Check the presale for the best Signal pricing before public launch."
    ]
  },
  {
    routes: ["/dashboard", "/my-hub"],
    sectionIds: ["signal-basics", "staking", "getting-started"],
    quickTips: [
      "Your dashboard shows your Signal balance, staking rewards, and recent activity.",
      "Click any transaction to see its full details and blockchain verification."
    ]
  },
  {
    routes: ["/wallet", "/send", "/receive"],
    sectionIds: ["signal-basics", "getting-started"],
    quickTips: [
      "Share your wallet address or QR code to receive Signal from others.",
      "Transactions confirm in under a second on the Trust Layer."
    ]
  },
  {
    routes: ["/presale", "/token"],
    sectionIds: ["signal-basics", "getting-started", "community"],
    quickTips: [
      "The presale offers founder-rate pricing before public launch.",
      "Signal has a fixed supply of 1 billion — no additional minting ever."
    ]
  },
  {
    routes: ["/staking", "/liquid-staking"],
    sectionIds: ["staking", "signal-basics", "defi"],
    quickTips: [
      "Longer staking periods earn higher reward rates.",
      "Liquid staking gives you stSIG you can use in DeFi while still earning."
    ]
  },
  {
    routes: ["/swap", "/markets", "/trading", "/pools"],
    sectionIds: ["defi", "signal-basics", "staking"],
    quickTips: [
      "Review swap rates before confirming — prices update in real time.",
      "Providing liquidity earns you a share of all trading fees in that pool."
    ]
  },
  {
    routes: ["/bridge"],
    sectionIds: ["defi", "signal-basics"],
    quickTips: [
      "Bridging usually takes 5-15 minutes depending on the source network.",
      "Wrapped tokens are always 1:1 backed by the originals locked in the bridge."
    ]
  },
  {
    routes: ["/nft-marketplace", "/nft-gallery", "/nft-creator"],
    sectionIds: ["nft", "signal-basics"],
    quickTips: [
      "Every NFT on Trust Layer has verified provenance and ownership history.",
      "Creators set their own royalty percentages on secondary sales."
    ]
  },
  {
    routes: ["/guardian-scanner", "/guardian-shield", "/guardian-ai", "/guardian-certification", "/guardian-registry"],
    sectionIds: ["guardian", "getting-started"],
    quickTips: [
      "Scan any address or contract to check its security score before interacting.",
      "Look for the Guardian badge — it means the project passed a full security audit."
    ]
  },
  {
    routes: ["/chronicles", "/chronicles/play", "/chronicles/tutorial", "/eras", "/gameplay"],
    sectionIds: ["chronicles", "getting-started"],
    quickTips: [
      "Your choices in Chronicles permanently shape your character's legacy.",
      "Interact with NPCs to discover quests, trade, and build reputation."
    ]
  },
  {
    routes: ["/arcade", "/slots", "/coinflip", "/crash"],
    sectionIds: ["arcade", "getting-started"],
    quickTips: [
      "Shells won in the Arcade convert to Signal at launch.",
      "All game mechanics use provably fair random number generation."
    ]
  },
  {
    routes: ["/trust-book", "/veil"],
    sectionIds: ["trust-book", "getting-started"],
    quickTips: [
      "Tap the speaker icon while reading to activate AI narration.",
      "Authors earn 70% royalties on every sale — the highest in publishing."
    ]
  },
  {
    routes: ["/academy"],
    sectionIds: ["academy", "getting-started"],
    quickTips: [
      "Start with Programming Foundations if you're new to coding.",
      "Lume is the first language where you can literally speak your code."
    ]
  },
  {
    routes: ["/trusthome"],
    sectionIds: ["trusthome", "business", "guardian"],
    quickTips: [
      "TrustHome is built for real estate professionals — agents, brokers, and teams.",
      "Your trust score builds over time based on verified transactions and reviews."
    ]
  },
  {
    routes: ["/learn"],
    sectionIds: ["getting-started", "signal-basics", "staking", "defi", "guardian"],
    quickTips: [
      "The Learning Center covers everything from basics to advanced DeFi strategies.",
      "Each section links directly to the relevant tools and pages."
    ]
  },
  {
    routes: ["/faq"],
    sectionIds: ["getting-started", "signal-basics", "community"],
    quickTips: [
      "Can't find your answer? Submit a support ticket for personalized help."
    ]
  },
  {
    routes: ["/affiliate"],
    sectionIds: ["community", "signal-basics"],
    quickTips: [
      "Share your referral link to earn commission on every successful signup.",
      "Diamond tier (50+ referrals) earns 20% commission on referred purchases."
    ]
  },
  {
    routes: ["/signal-chat"],
    sectionIds: ["community", "getting-started"],
    quickTips: [
      "Signal Chat is the ecosystem's built-in messaging platform."
    ]
  }
];

function getContextForRoute(pathname: string): { sections: HelpSection[]; tips: string[] } {
  const mapping = contextMappings.find(m =>
    m.routes.some(r => pathname === r || pathname.startsWith(r + "/"))
  );

  if (mapping) {
    const sections = mapping.sectionIds
      .map(id => helpSections.find(s => s.id === id))
      .filter((s): s is HelpSection => !!s);
    return { sections, tips: mapping.quickTips };
  }

  return {
    sections: [
      helpSections.find(s => s.id === "getting-started")!,
      helpSections.find(s => s.id === "signal-basics")!,
      helpSections.find(s => s.id === "community")!
    ],
    tips: [
      "Use the search bar above to find help on any topic.",
      "Visit the Learning Center for in-depth guides on everything."
    ]
  };
}

function HelpEntryItem({ entry }: { entry: HelpEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-3 px-3 text-left hover:bg-white/5 transition-colors"
        data-testid={`button-help-${entry.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <ChevronRight className={`w-3 h-3 text-white/40 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <span className="text-white/90 text-sm font-medium">{entry.title}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-8">
              <p className="text-white/60 text-xs leading-relaxed">{entry.content}</p>
              {entry.link && (
                <Link href={entry.link.href}>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
                    {entry.link.label} <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HelpSectionBlock({ section, defaultOpen }: { section: HelpSection; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen || false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-2 px-3 text-left hover:bg-white/5 transition-colors rounded-lg"
        data-testid={`button-help-section-${section.id}`}
      >
        <span className="text-cyan-400">{section.icon}</span>
        <span className="text-white font-medium text-sm flex-1">{section.title}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/40" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-2 border-l border-white/10">
              {section.entries.map((entry, i) => (
                <HelpEntryItem key={i} entry={entry} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContextualHelp() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"contextual" | "all" | "resources">("contextual");

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hiddenRoutes = [
    "/chronicles/play", "/chronicles/interior", "/chronicles/city",
    "/chronicles/npc-chat", "/studio/editor", "/signal-chat"
  ];
  const shouldHide = hiddenRoutes.some(r => location.startsWith(r));

  useEffect(() => {
    setSearchQuery("");
    setActiveTab("contextual");
  }, [location]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const contextData = useMemo(() => getContextForRoute(location), [location]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { section: string; entry: HelpEntry }[] = [];
    for (const section of helpSections) {
      for (const entry of section.entries) {
        if (
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q)
        ) {
          results.push({ section: section.title, entry });
        }
      }
    }
    return results;
  }, [searchQuery]);

  if (shouldHide) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 z-[60] w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-110"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #06b6d4, #a855f7)"
            : "linear-gradient(135deg, rgba(6, 182, 212, 0.9), rgba(168, 85, 247, 0.9))"
        }}
        data-testid="button-help-toggle"
        aria-label={isOpen ? "Close help" : "Open help"}
        aria-expanded={isOpen}
        aria-controls="contextual-help-panel"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <HelpCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-[76px] right-4 z-[60] w-[340px] max-h-[70vh] flex flex-col"
            id="contextual-help-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Help panel"
            data-testid="panel-help"
          >
            <GlassCard glow>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-base">How can we help?</h3>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search help topics..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    data-testid="input-help-search"
                  />
                </div>

                {searchQuery.trim() ? (
                  <div className="max-h-[calc(70vh-180px)] overflow-y-auto custom-scrollbar">
                    {searchResults.length > 0 ? (
                      <div>
                        <p className="text-white/40 text-xs mb-2 px-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                        {searchResults.map((r, i) => (
                          <div key={i} className="mb-1">
                            <span className="text-xs text-purple-400 px-3">{r.section}</span>
                            <HelpEntryItem entry={r.entry} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-white/40 text-sm">No results found</p>
                        <p className="text-white/30 text-xs mt-1">Try different keywords</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-3">
                      {([
                        { key: "contextual" as const, label: "For This Page" },
                        { key: "all" as const, label: "All Topics" },
                        { key: "resources" as const, label: "Resources" }
                      ]).map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                            activeTab === tab.key
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                          }`}
                          data-testid={`button-help-tab-${tab.key}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[calc(70vh-220px)] overflow-y-auto custom-scrollbar">
                      {activeTab === "contextual" && (
                        <div>
                          {contextData.tips.length > 0 && (
                            <div className="mb-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-cyan-400 text-xs font-medium">Quick Tips</span>
                              </div>
                              {contextData.tips.map((tip, i) => (
                                <p key={i} className="text-white/60 text-xs leading-relaxed mb-1 last:mb-0 pl-5">
                                  • {tip}
                                </p>
                              ))}
                            </div>
                          )}
                          {contextData.sections.map((section, i) => (
                            <HelpSectionBlock key={section.id} section={section} defaultOpen={i === 0} />
                          ))}
                        </div>
                      )}

                      {activeTab === "all" && (
                        <div>
                          {helpSections.map(section => (
                            <HelpSectionBlock key={section.id} section={section} />
                          ))}
                        </div>
                      )}

                      {activeTab === "resources" && (
                        <div className="space-y-2">
                          {([
                            { icon: <BookOpen className="w-4 h-4" />, label: "Learning Center", desc: "In-depth guides on every topic", href: "/learn" },
                            { icon: <HelpCircle className="w-4 h-4" />, label: "FAQ", desc: "Frequently asked questions", href: "/faq" },
                            { icon: <GraduationCap className="w-4 h-4" />, label: "Lume Academy", desc: "Learn programming with AI", href: "/academy" },
                            { icon: <Shield className="w-4 h-4" />, label: "Guardian Whitepaper", desc: "Security architecture deep dive", href: "/guardian-whitepaper" },
                            { icon: <MessageSquare className="w-4 h-4" />, label: "Support Center", desc: "Submit a ticket for help", href: "/support" },
                            { icon: <Users className="w-4 h-4" />, label: "Signal Chat", desc: "Connect with the community", href: "/signal-chat" },
                            { icon: <Code className="w-4 h-4" />, label: "Developer Portal", desc: "APIs, SDKs, and documentation", href: "/developers" },
                            { icon: <Compass className="w-4 h-4" />, label: "Block Explorer", desc: "Browse the Trust Layer blockchain", href: "/explorer" }
                          ]).map((item, i) => (
                            <Link key={i} href={item.href}>
                              <div
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => setIsOpen(false)}
                                data-testid={`link-help-resource-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium group-hover:text-cyan-300 transition-colors">{item.label}</p>
                                  <p className="text-white/40 text-xs truncate">{item.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}