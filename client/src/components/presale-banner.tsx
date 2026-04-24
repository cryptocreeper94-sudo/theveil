import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Rocket, TrendingUp, Users, Coins, X, ChevronRight, Zap, Wallet, Target } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { authFetch } from "@/hooks/use-auth";

interface PresaleStats {
  totalRaisedUsd: number;
  tokensSold: number;
  tokensRemaining: number;
  presaleAllocation: number;
  percentSold: string;
  isSoldOut: boolean;
  uniqueHolders: number;
  totalPurchases: number;
  currentTokenPrice: number;
  nextMilestoneUsd: number | null;
  nextTokenPrice: number | null;
  milestones: { thresholdUsd: number; price: number }[];
}

interface MyPurchases {
  purchases: any[];
  total: { tokens: number; spent: number };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  return n.toLocaleString();
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

export function PresaleBanner() {
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, isAuthenticated } = useSimpleAuth();

  const { data: stats } = useQuery<PresaleStats>({
    queryKey: ["/api/presale/stats"],
    queryFn: async () => {
      const res = await fetch("/api/presale/stats");
      if (!res.ok) throw new Error("Failed to fetch presale stats");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const { data: myPurchases } = useQuery<MyPurchases>({
    queryKey: ["/api/presale/my-purchases"],
    queryFn: async () => {
      const res = await authFetch("/api/presale/my-purchases");
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const hiddenPaths = ["/presale", "/presale/success", "/owner-admin"];
  const shouldHide = hiddenPaths.some(p => location.startsWith(p));

  if (shouldHide || dismissed || !stats) return null;

  const percentNum = parseFloat(stats.percentSold || "0");
  const tokensRemaining = stats.presaleAllocation - stats.tokensSold;
  const myBalance = myPurchases?.total?.tokens || 0;
  const mySpent = myPurchases?.total?.spent || 0;

  const milestones = stats.milestones || [];
  const currentMilestoneIdx = milestones.findIndex(m => m.thresholdUsd > stats.totalRaisedUsd);
  const prevMilestone = currentMilestoneIdx > 0 ? milestones[currentMilestoneIdx - 1] : { thresholdUsd: 0, price: stats.currentTokenPrice };
  const nextMilestone = currentMilestoneIdx >= 0 ? milestones[currentMilestoneIdx] : null;
  const milestoneDenom = nextMilestone ? (nextMilestone.thresholdUsd - prevMilestone.thresholdUsd) : 1;
  const milestoneProgress = nextMilestone && milestoneDenom > 0
    ? Math.max(0, Math.min(100, ((stats.totalRaisedUsd - prevMilestone.thresholdUsd) / milestoneDenom) * 100))
    : 100;
  const untilNextIncrease = nextMilestone ? Math.max(0, nextMilestone.thresholdUsd - stats.totalRaisedUsd) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[9999]"
        data-testid="presale-banner"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-purple-600/20 to-pink-600/20 blur-xl" />

          <div className="relative bg-slate-950/95 backdrop-blur-xl border-t border-white/10">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors z-10"
              data-testid="presale-banner-dismiss"
              aria-label="Dismiss presale banner"
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>

            <div className="container mx-auto px-3 sm:px-6">
              <div
                className="flex items-center gap-3 py-2.5 cursor-pointer sm:cursor-default"
                onClick={() => setExpanded(!expanded)}
                data-testid="presale-banner-toggle"
              >
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:hidden shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                    <Rocket className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    PRESALE LIVE
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase">
                      Signal Presale Live
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                      <span className="text-white/60">Raised:</span>
                      <span className="font-semibold text-white" data-testid="presale-stat-raised">{formatUSD(stats.totalRaisedUsd)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-teal-400" />
                      <span className="text-white/60">Price:</span>
                      <span className="font-semibold text-white" data-testid="presale-stat-price">${stats.currentTokenPrice}</span>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-green-400" />
                        <span className="text-white/60">My SIG:</span>
                        <span className="font-semibold text-green-400" data-testid="presale-stat-my-balance">{formatNumber(myBalance)}</span>
                      </div>
                    )}
                    <div className="hidden lg:flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span className="text-white/60">Holders:</span>
                      <span className="font-semibold text-white" data-testid="presale-stat-holders">{stats.uniqueHolders}</span>
                    </div>
                  </div>

                  {nextMilestone && (
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-[240px]" data-testid="presale-milestone-bar">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-white/40">
                            {formatUSD(untilNextIncrease)} to price increase
                          </span>
                          <span className="text-[9px] text-cyan-400 font-medium">
                            → ${nextMilestone.price}/SIG
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 sm:hidden">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-white/60">
                      {formatUSD(stats.totalRaisedUsd)} raised
                    </span>
                    <span className="text-cyan-400 font-medium">
                      ${stats.currentTokenPrice}/SIG
                    </span>
                    {isAuthenticated && (
                      <span className="text-green-400 font-medium" data-testid="presale-stat-my-balance-mobile">
                        {formatNumber(myBalance)} SIG
                      </span>
                    )}
                  </div>
                  {nextMilestone && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-white/30">{formatUSD(untilNextIncrease)} to price ↑</span>
                        <span className="text-[9px] text-cyan-400">→ ${nextMilestone.price}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500"
                          style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/presale" data-testid="presale-banner-cta">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold shrink-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                  >
                    <span className="hidden sm:inline">Join Presale</span>
                    <span className="sm:hidden">Join</span>
                    <ChevronRight className="w-3 h-3" />
                  </motion.div>
                </Link>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden sm:hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pb-2 pt-1">
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                          <span className="text-[10px] text-white/50">Total Raised</span>
                        </div>
                        <span className="text-sm font-bold text-white" data-testid="presale-expanded-raised">{formatUSD(stats.totalRaisedUsd)}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <Coins className="w-3 h-3 text-teal-400" />
                          <span className="text-[10px] text-white/50">SIG Price</span>
                        </div>
                        <span className="text-sm font-bold text-white" data-testid="presale-expanded-price">${stats.currentTokenPrice}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-purple-400" />
                          <span className="text-[10px] text-white/50">Holders</span>
                        </div>
                        <span className="text-sm font-bold text-white" data-testid="presale-expanded-holders">{stats.uniqueHolders}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3 text-pink-400" />
                          <span className="text-[10px] text-white/50">SIG Remaining</span>
                        </div>
                        <span className="text-sm font-bold text-white" data-testid="presale-expanded-remaining">{formatNumber(tokensRemaining)}</span>
                      </div>
                    </div>

                    {isAuthenticated && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[10px] text-white/50">My Balance</span>
                          </div>
                          <span className="text-sm font-bold text-green-400" data-testid="presale-expanded-my-balance">{formatNumber(myBalance)} SIG</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-white/40">Total Invested</span>
                          <span className="text-[10px] text-white/60">{formatUSD(mySpent)}</span>
                        </div>
                      </div>
                    )}

                    {nextMilestone && (
                      <div className="bg-white/5 rounded-lg p-2.5 mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Target className="w-3 h-3 text-cyan-400" />
                          <span className="text-[10px] text-white/50">Next Price Increase</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/70">{formatUSD(untilNextIncrease)} remaining</span>
                          <span className="text-xs text-cyan-400 font-semibold">→ ${nextMilestone.price}/SIG</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-white/30">{prevMilestone.thresholdUsd > 0 ? formatUSD(prevMilestone.thresholdUsd) : '$0'}</span>
                          <span className="text-[9px] text-white/30">{formatUSD(nextMilestone.thresholdUsd)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
