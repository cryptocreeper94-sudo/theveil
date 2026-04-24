import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, Coins, Gift, Trophy, TrendingUp, Sparkles, ArrowUpRight, Calendar, Lock , Shield } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/hooks/use-auth";

interface DwcBagData {
  totalDwc: number;
  currentValue: number;
  launchProjectedValue: number;
  sources: {
    presale: {
      tokens: number;
      spentUsd: number;
      purchases: number;
    };
    shells: {
      balance: number;
      convertedToDwc: number;
      conversionRate: number;
    };
    airdrops: {
      pending: number;
    };
    earlyAdopterBonus: {
      tokens: number;
      signupPosition: number | null;
      isEarlyAdopter: boolean;
    };
  };
  tgeDate: string;
  launchPrice: number;
  currentPrice: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function DwcBagDashboard({ compact = false }: { compact?: boolean }) {
  const { data: bagData, isLoading, error } = useQuery<DwcBagData>({
    queryKey: ["/api/user/dwc-bag"],
    queryFn: async () => {
      const res = await authFetch("/api/user/dwc-bag");
      if (!res.ok) throw new Error("Failed to fetch SIG bag");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6" glow>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </GlassCard>
    );
  }

  if (error || !bagData) {
    return null;
  }

  const { totalDwc, currentValue, launchProjectedValue, sources, tgeDate, launchPrice } = bagData;
  
  const daysUntilLaunch = Math.max(0, Math.ceil(
    (new Date(tgeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const potentialGain = launchProjectedValue - currentValue;
  const potentialMultiplier = currentValue > 0 ? (launchProjectedValue / currentValue) : 100;

  if (compact) {
    return (
      <GlassCard className="p-4" glow>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-7 h-7 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md animate-pulse" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Signals Dashboard</p>
              <p className="text-xl font-bold text-white">{formatNumber(totalDwc)} SIG</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">At Launch</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(launchProjectedValue)}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <GlassCard className="p-6 overflow-hidden relative" glow>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Shield className="w-7 h-7 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-400">Signals Dashboard</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {formatNumber(totalDwc)} SIG
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Current Value: <span className="text-white">{formatCurrency(currentValue)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              {potentialMultiplier.toFixed(0)}x Potential
            </Badge>
            <div className="text-right">
              <p className="text-sm text-gray-400">At Launch ({formatCurrency(launchPrice)}/SIG)</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(launchProjectedValue)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Token Generation Event</span>
            </div>
            <span className="text-sm font-medium text-cyan-400">{daysUntilLaunch} days</span>
          </div>
          <Progress 
            value={Math.max(5, 100 - (daysUntilLaunch / 365 * 100))} 
            className="h-2 bg-gray-800"
          />
          <p className="text-xs text-gray-500 mt-2">
            <Lock className="w-3 h-3 inline mr-1" />
            Create your Trust Layer wallet before TGE ({new Date(tgeDate).toLocaleDateString()}) to receive tokens
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Presale</span>
          </div>
          <p className="text-lg font-bold text-white">{formatNumber(sources.presale.tokens)}</p>
          <p className="text-xs text-gray-500">{sources.presale.purchases} purchase(s)</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">From Shells</span>
          </div>
          <p className="text-lg font-bold text-white">{formatNumber(sources.shells.convertedToDwc)}</p>
          <p className="text-xs text-gray-500">{formatNumber(sources.shells.balance)} shells</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-gray-400">Airdrops</span>
          </div>
          <p className="text-lg font-bold text-white">{formatNumber(sources.airdrops.pending)}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Early Bonus</span>
          </div>
          <p className="text-lg font-bold text-white">{formatNumber(sources.earlyAdopterBonus.tokens)}</p>
          {sources.earlyAdopterBonus.isEarlyAdopter && (
            <p className="text-xs text-purple-500">#{sources.earlyAdopterBonus.signupPosition} Early Adopter</p>
          )}
        </GlassCard>
      </div>

      {totalDwc === 0 && (
        <GlassCard className="p-6 text-center">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Start Building Your Bag</h3>
          <p className="text-gray-400 text-sm mb-4">
            No wallet needed yet! Purchase SIG tokens or earn Shells - all tracked by your account until TGE.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/presale">
              <Button className="bg-gradient-to-r from-cyan-600 to-purple-600" data-testid="link-buy-presale">
                <Coins className="w-4 h-4 mr-2" />
                Buy Presale
              </Button>
            </Link>
            <Link href="/zealy-campaign">
              <Button variant="outline" className="border-cyan-500/50 text-cyan-400" data-testid="link-earn-shells">
                <Sparkles className="w-4 h-4 mr-2" />
                Earn Shells
              </Button>
            </Link>
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}

export function DwcBagCard() {
  return <DwcBagDashboard compact />;
}
