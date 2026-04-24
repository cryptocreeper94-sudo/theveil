import { useState, useEffect, useRef } from "react";
import { 
  Search, X, FileText, Box, ArrowRight, Clock, Home, Wallet, 
  TrendingUp, Users, Gamepad2, MessageCircle, Globe, Shield, 
  BookOpen, Settings, Crown, Target, Gift, ImageIcon, Rocket,
  PieChart, ArrowLeftRight, Droplets, BarChart3, HelpCircle,
  Sparkles, Award, ExternalLink, Compass, Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchEcosystemApps, fetchDocuments } from "@/lib/api";
import { usePreferences } from "@/lib/store";

interface SearchResult {
  type: "app" | "doc" | "page" | "url";
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof FileText;
  category?: string;
}

const staticPages: SearchResult[] = [
  { type: "page", id: "home", title: "Home", description: "Trust Layer homepage", href: "/", icon: Home, category: "Main" },
  { type: "page", id: "my-hub", title: "My Dashboard", description: "Your personal dashboard and hub", href: "/my-hub", icon: Compass, category: "Main" },
  { type: "page", id: "wallet", title: "Wallet", description: "Manage your assets and Signal", href: "/wallet", icon: Wallet, category: "Finance" },
  { type: "page", id: "swap", title: "Token Swap", description: "Trade and swap tokens", href: "/swap", icon: ArrowLeftRight, category: "Finance" },
  { type: "page", id: "staking", title: "Staking", description: "Stake tokens and earn rewards", href: "/staking", icon: TrendingUp, category: "Finance" },
  { type: "page", id: "portfolio", title: "Portfolio", description: "Track your holdings", href: "/portfolio", icon: PieChart, category: "Finance" },
  { type: "page", id: "bridge", title: "Bridge", description: "Cross-chain transfers", href: "/bridge", icon: Globe, category: "Finance" },
  { type: "page", id: "liquidity", title: "Liquidity Pools", description: "Provide liquidity and earn fees", href: "/liquidity", icon: Droplets, category: "Finance" },
  { type: "page", id: "pulse", title: "Pulse Trading", description: "Advanced token trading", href: "/pulse", icon: BarChart3, category: "Finance" },
  { type: "page", id: "trading", title: "Trading", description: "Trade tokens", href: "/trading", icon: TrendingUp, category: "Finance" },
  { type: "page", id: "chronicles", title: "Chronicles Game", description: "Play the historical adventure game", href: "/chronicles", icon: Gamepad2, category: "Games" },
  { type: "page", id: "community", title: "Signal Chat", description: "Community chat and discussions", href: "/signal-chat", icon: MessageCircle, category: "Community" },
  { type: "page", id: "members", title: "Member Directory", description: "Browse trusted members", href: "/members", icon: Users, category: "Community" },
  { type: "page", id: "referrals", title: "Referrals", description: "Refer friends and earn rewards", href: "/referrals", icon: Gift, category: "Community" },
  { type: "page", id: "quests", title: "Daily Quests", description: "Complete quests to earn Shells", href: "/quests", icon: Target, category: "Earn" },
  { type: "page", id: "rewards", title: "Rewards", description: "View your rewards and bonuses", href: "/rewards", icon: Crown, category: "Earn" },
  { type: "page", id: "nft", title: "NFT Gallery", description: "Browse and trade NFTs", href: "/nft", icon: ImageIcon, category: "NFTs" },
  { type: "page", id: "nft-creator", title: "NFT Creator", description: "Create your own NFTs", href: "/nft-creator", icon: Sparkles, category: "NFTs" },
  { type: "page", id: "launchpad", title: "Token Launchpad", description: "Launch new tokens", href: "/launchpad", icon: Rocket, category: "Launch" },
  { type: "page", id: "learn", title: "Learn", description: "Learn about the Trust Layer", href: "/learn", icon: BookOpen, category: "Learn" },
  { type: "page", id: "academy", title: "Academy", description: "Blockchain education and courses", href: "/academy", icon: Award, category: "Learn" },
  { type: "page", id: "faq", title: "FAQ", description: "Frequently asked questions", href: "/faq", icon: HelpCircle, category: "Learn" },
  { type: "page", id: "vision", title: "Our Vision", description: "The Trust Layer vision and mission", href: "/vision", icon: Sparkles, category: "About" },
  { type: "page", id: "ecosystem", title: "Ecosystem Map", description: "Explore all ecosystem apps", href: "/ecosystem", icon: Globe, category: "About" },
  { type: "page", id: "trust-layer", title: "Trust Layer", description: "Learn about Trust Layer technology", href: "/trust-layer", icon: Shield, category: "About" },
  { type: "page", id: "team", title: "Team", description: "Meet the Trust Layer team", href: "/team", icon: Users, category: "About" },
  { type: "page", id: "feedback", title: "Give Feedback", description: "Submit bug reports or suggestions", href: "/feedback", icon: HelpCircle, category: "Support" },
  { type: "page", id: "settings", title: "Settings", description: "Account and app settings", href: "/settings", icon: Settings, category: "Account" },
  { type: "page", id: "presale", title: "Signal Presale", description: "Join the Signal presale", href: "/presale", icon: Rocket, category: "Buy" },
  { type: "page", id: "shop", title: "Shells Shop", description: "Buy Shells with card", href: "/shop", icon: Crown, category: "Buy" },
];

// Export function to open search from anywhere
export function openGlobalSearch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('openGlobalSearch'));
  }
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { preferences, addRecentSearch } = usePreferences();

  // Listen for custom event to open search
  useEffect(() => {
    const handleOpenSearch = () => setIsOpen(true);
    window.addEventListener('openGlobalSearch', handleOpenSearch);
    return () => window.removeEventListener('openGlobalSearch', handleOpenSearch);
  }, []);

  const { data: apps = [] } = useQuery({
    queryKey: ["ecosystem-apps"],
    queryFn: fetchEcosystemApps,
    staleTime: 60000,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fetchDocuments(),
    staleTime: 60000,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const [, navigate] = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (lowerQuery) {
    if (query.startsWith("/") || query.startsWith("http")) {
      results.push({
        type: "url",
        id: "direct-url",
        title: `Go to: ${query}`,
        description: "Navigate directly to this URL",
        href: query,
        icon: ExternalLink,
        category: "Navigate"
      });
    }
    
    staticPages.forEach((page) => {
      if (page.title.toLowerCase().includes(lowerQuery) || 
          page.description.toLowerCase().includes(lowerQuery) ||
          page.category?.toLowerCase().includes(lowerQuery)) {
        results.push(page);
      }
    });

    apps.forEach((app) => {
      if (app.name.toLowerCase().includes(lowerQuery) || app.description?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "app",
          id: app.id,
          title: app.name,
          description: app.description || "",
          href: "/ecosystem",
          icon: Box,
        });
      }
    });

    docs.forEach((doc) => {
      if (doc.title.toLowerCase().includes(lowerQuery) || doc.content?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "doc",
          id: doc.id,
          title: doc.title,
          description: doc.content?.slice(0, 100) || "",
          href: `/doc-hub?doc=${doc.id}`,
          icon: FileText,
        });
      }
    });
  } else {
    results.push(...staticPages.slice(0, 8));
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    addRecentSearch(result.title);
    if (result.type === "url" && result.href.startsWith("http")) {
      window.open(result.href, "_blank");
    } else {
      navigate(result.href);
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, Math.min(results.length - 1, 9)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        data-testid="button-global-search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-white/10 rounded">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
            >
              <div className="bg-black/90 border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search pages, features, or type a URL..."
                    className="flex-1 bg-transparent text-white placeholder:text-muted-foreground outline-none"
                    data-testid="input-global-search"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {!query && preferences.recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wider">Recent Searches</div>
                      {preferences.recentSearches.slice(0, 5).map((search, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(search)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-white/5 rounded-lg"
                        >
                          <Clock className="w-4 h-4" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}

                  {query && results.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No results found for "{query}"
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="p-2">
                      {results.slice(0, 10).map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all ${
                            index === selectedIndex 
                              ? "bg-cyan-500/20 border border-cyan-500/30" 
                              : "hover:bg-white/5 border border-transparent"
                          }`}
                          data-testid={`search-result-${result.id}`}
                        >
                          <div className={`p-2 rounded-lg ${
                            index === selectedIndex ? "bg-cyan-500/30" : "bg-white/5"
                          }`}>
                            <result.icon className={`w-4 h-4 ${
                              index === selectedIndex ? "text-cyan-400" : "text-white/50"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${
                              index === selectedIndex ? "text-white" : "text-white/80"
                            }`}>{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.category && <span className="text-cyan-400/60">{result.category} • </span>}
                              {result.description}
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 ${
                            index === selectedIndex ? "text-cyan-400" : "text-white/20"
                          }`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-white/10 text-xs text-muted-foreground flex items-center gap-4">
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd> to select</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">esc</kbd> to close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
