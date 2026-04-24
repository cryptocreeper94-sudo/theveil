import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BadgeCheck, CreditCard, Coins, Trophy, Gift, 
  ChevronDown, Sparkles, X, ExternalLink, QrCode, Hash, Copy, Check, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";

interface MemberStats {
  signupPosition: number | null;
  crowdfundTotalCents: number;
  tokenPurchasePosition: number | null;
}

interface EarlyAdopterCounters {
  signupPosition: string;
  tokenPurchasePosition: string;
}

interface TokenBalance {
  sources: {
    presale: { tokens: number };
    crowdfund: { tokens: number };
    affiliateCommissions: { tokens: number };
    earlyAdopterBonus: { tokens: number; signupPosition: number | null };
    shellsConverted: { tokens: number };
    zealyRewards: { tokens: number };
  };
  totalTokens: number;
  totalPendingTokens: number;
}

function generateTrustHash(userId: string, memberNumber: number): string {
  const data = `DWTL-${userId}-${memberNumber}-TRUST`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hexHash}${memberNumber.toString(16).padStart(4, '0')}`;
}

export function MemberBadge({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: userStats } = useQuery<MemberStats>({
    queryKey: ["/api/user/early-adopter-stats"],
    enabled: !!userId,
  });

  const { data: counters } = useQuery<EarlyAdopterCounters>({
    queryKey: ["/api/early-adopter/counters"],
  });

  const { data: tokenBalance } = useQuery<TokenBalance>({
    queryKey: ["/api/user/token-balance"],
    enabled: !!userId,
  });

  const memberNumber = userStats?.signupPosition ?? null;
  const totalMembers = counters?.signupPosition ? parseInt(counters.signupPosition) : 0;
  const isEarlyAdopter = memberNumber !== null && memberNumber !== undefined && memberNumber <= 500;
  
  const trustHash = userId && memberNumber ? generateTrustHash(userId, memberNumber) : null;
  const verifyUrl = trustHash ? `${window.location.origin}/verify/${trustHash}` : null;
  
  const qrCodeUrl = verifyUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}&bgcolor=00000000&color=22d3ee`
    : null;

  const copyHash = async () => {
    if (trustHash) {
      await navigator.clipboard.writeText(trustHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadMemberInfo = async () => {
    if (!trustHash || !memberNumber) return;
    
    const memberInfo = {
      memberNumber,
      trustHash,
      isEarlyAdopter,
      totalMembers,
      signalBalance: tokenBalance?.totalTokens || 0,
      pendingAirdrop: tokenBalance?.totalPendingTokens || 0,
      contributed: userStats?.crowdfundTotalCents ? (userStats.crowdfundTotalCents / 100) : 0,
      verifyUrl,
      generatedAt: new Date().toISOString(),
    };

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e1b4b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22d3ee"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="16" fill="url(#bg)"/>
  <rect x="0" y="0" width="400" height="4" fill="url(#accent)"/>
  <text x="24" y="40" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#22d3ee">Trust Layer</text>
  <text x="24" y="70" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">VERIFIED MEMBER</text>
  <text x="24" y="105" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="white">#${memberNumber}</text>
  ${isEarlyAdopter ? '<text x="24" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#fbbf24">★ Early Adopter</text>' : ''}
  <text x="24" y="165" font-family="monospace" font-size="10" fill="#94a3b8">Trust Hash</text>
  <text x="24" y="182" font-family="monospace" font-size="12" fill="#22d3ee">${trustHash}</text>
  <text x="24" y="210" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Signal Balance: ${(tokenBalance?.totalTokens || 0).toLocaleString()} SIG</text>
  <text x="24" y="230" font-family="system-ui, sans-serif" font-size="9" fill="#475569">Generated: ${new Date().toLocaleDateString()}</text>
  <circle cx="360" cy="125" r="30" fill="none" stroke="url(#accent)" stroke-width="2"/>
  <text x="360" y="130" font-family="system-ui, sans-serif" font-size="10" fill="#22d3ee" text-anchor="middle">✓</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `darkwave-member-${memberNumber}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!userId || memberNumber === null || memberNumber === undefined) return null;

  const formatTokens = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid="button-member-badge"
      >
        <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
        <span className="text-xs sm:text-sm font-bold text-white">#{memberNumber}</span>
        {isEarlyAdopter && (
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
        )}
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm z-50 md:absolute md:left-auto md:top-full md:right-0 md:translate-x-0 md:translate-y-0 md:mt-2 md:w-72"
            >
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                        <BadgeCheck className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Member #{memberNumber}</p>
                        <p className="text-[10px] text-muted-foreground">
                          of {totalMembers.toLocaleString()} total members
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  {trustHash && (
                    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start gap-3">
                        {qrCodeUrl && (
                          <div className="shrink-0 p-1 rounded-lg bg-black/40 border border-cyan-500/30">
                            <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <Hash className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] text-muted-foreground">Trust Hash</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] font-mono text-cyan-400 truncate block">
                              {trustHash}
                            </code>
                            <button 
                              onClick={copyHash}
                              className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                            >
                              {copied ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white/60" />
                              )}
                            </button>
                          </div>
                          <Link 
                            href={`/explorer?address=${trustHash}`}
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] text-primary hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            View on Explorer
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {isEarlyAdopter && (
                    <div className="mb-4 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-400">Early Adopter Status</span>
                      </div>
                      <p className="text-[10px] text-purple-400/70 mt-1">
                        First 500 members get bonus rewards
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-primary" />
                        <span className="text-xs text-white/80">Signal Balance</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {tokenBalance ? formatTokens(tokenBalance.totalTokens) : "0"} SIG
                      </span>
                    </div>

                    {tokenBalance && tokenBalance.totalPendingTokens > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-white/80">Pending Airdrop</span>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          +{formatTokens(tokenBalance.totalPendingTokens)} SIG
                        </span>
                      </div>
                    )}

                    {userStats && userStats.crowdfundTotalCents > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-white/80">Contributed</span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          ${(userStats.crowdfundTotalCents / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Link href="/my-hub" onClick={() => setIsOpen(false)}>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black text-xs h-9 font-semibold"
                        data-testid="button-my-hub"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Go to My Hub
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant="outline"
                          className="w-full border-white/20 text-white text-xs h-8"
                          data-testid="button-view-trust-card"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Trust Card
                        </Button>
                      </Link>
                      <Button 
                        variant="outline"
                        onClick={downloadMemberInfo}
                        className="w-full border-white/20 text-white text-xs h-8"
                        data-testid="button-download-member-card"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Save Card
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
