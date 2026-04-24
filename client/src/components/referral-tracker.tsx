import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Gift, Trophy, Copy, Check, Share2, ArrowRight, Loader2, MousePointerClick, UserPlus, DollarSign, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SimpleLoginModal } from "@/components/simple-login";

interface ReferralStats {
  profile: {
    userId: string;
    currentTier: string;
    totalReferrals: number;
    qualifiedReferrals: number;
    lifetimeConversions: number;
    lifetimeCreditsEarned: number;
    lifetimeCommissionEarned: number;
    pendingCommission: number;
  } | null;
  referralCode: {
    code: string;
    host: string;
    isActive: boolean;
    clickCount: number;
    signupCount: number;
    conversionCount: number;
  } | null;
  tier: {
    name: string;
    slug: string;
    referrerRewardCredits: number;
    refereeRewardCredits: number;
    commissionPercent: number;
    badgeColor: string;
    description: string;
  } | null;
  referrals: Array<{
    id: string;
    refereeId: string;
    status: string;
    referrerReward: number;
    refereeReward: number;
    createdAt: string;
    convertedAt: string | null;
  }>;
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  pendingCommission: number;
  lifetimeEarnings: number;
}

interface AffiliateTier {
  name: string;
  slug: string;
  minConversions: number;
  referrerRewardCredits: number;
  refereeRewardCredits: number;
  commissionPercent: number;
  badgeColor: string;
}

const TIER_ICONS: Record<string, string> = {
  explorer: "🌱",
  builder: "🚀",
  architect: "⭐",
  oracle: "👑",
};

const TIER_COLORS: Record<string, string> = {
  explorer: "from-gray-500 to-gray-600",
  builder: "from-blue-500 to-cyan-500",
  architect: "from-purple-500 to-pink-500",
  oracle: "from-purple-500 to-cyan-500",
};

async function fetchReferralStats(): Promise<ReferralStats> {
  const res = await fetch("/api/referrals/stats", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch referral stats");
  return res.json();
}

async function fetchAffiliateTiers(): Promise<{ tiers: AffiliateTier[] }> {
  const host = window.location.hostname.includes("yourlegacy") ? "yourlegacy.io" : "dwsc.io";
  const res = await fetch(`/api/referrals/tiers?host=${host}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch affiliate tiers");
  return res.json();
}

export function ReferralTracker() {
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const { data: stats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: fetchReferralStats,
    enabled: isAuthenticated,
  });

  const { data: tiersData } = useQuery<{ tiers: AffiliateTier[] }>({
    queryKey: ["affiliate-tiers"],
    queryFn: fetchAffiliateTiers,
    enabled: isAuthenticated,
  });

  const tiers = tiersData?.tiers || [];
  
  const referralCode = stats?.referralCode?.code || "LOADING...";
  const host = window.location.hostname.includes("yourlegacy") ? "yourlegacy.io" : "dwsc.io";
  const referralLink = `https://${host}?ref=${referralCode}`;
  
  const currentTierSlug = stats?.profile?.currentTier || "explorer";
  const currentTier = tiers.find(t => t.slug === currentTierSlug || t.slug === `${currentTierSlug}-legacy`);
  const nextTier = tiers.find(t => t.minConversions > (stats?.profile?.lifetimeConversions || 0));
  
  const conversions = stats?.profile?.lifetimeConversions || 0;
  const currentTierMinConversions = currentTier?.minConversions || 0;
  const nextTierMinConversions = nextTier?.minConversions || 10;
  const progressToNext = nextTier 
    ? ((conversions - currentTierMinConversions) / (nextTierMinConversions - currentTierMinConversions)) * 100
    : 100;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Join Trust Layer and get bonus credits! Use my referral link:`);
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`Join Trust Layer and get bonus credits! ${referralLink}`);
    window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, "_blank");
  };

  if (!isAuthenticated) {
    return (
      <>
      <GlassCard className="p-6 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Sign In Required</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account to access your referral dashboard and start earning rewards.
        </p>
        <Button onClick={() => setShowLoginModal(true)} data-testid="button-signin-referrals">
          Sign In to Continue
        </Button>
      </GlassCard>
      <SimpleLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tierColor = TIER_COLORS[currentTierSlug] || TIER_COLORS.explorer;
  const tierIcon = TIER_ICONS[currentTierSlug] || TIER_ICONS.explorer;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${tierColor} opacity-20`} />
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{tierIcon}</div>
              <div>
                <h3 className="font-bold text-lg capitalize">{currentTierSlug}</h3>
                <p className="text-xs text-muted-foreground">Current Tier</p>
              </div>
            </div>
            <Badge className={`bg-gradient-to-r ${tierColor} text-white border-0`}>
              {stats?.profile?.lifetimeConversions || 0} Conversions
            </Badge>
          </div>
          
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span className="font-mono">{conversions}/{nextTier.minConversions}</span>
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {nextTier.minConversions - conversions} more conversions to unlock: {nextTier.commissionPercent}% commission
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">Clicks</span>
          </div>
          <div className="text-xl font-bold" data-testid="text-referral-clicks">{stats?.totalClicks || 0}</div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-muted-foreground">Signups</span>
          </div>
          <div className="text-xl font-bold" data-testid="text-referral-signups">{stats?.totalSignups || 0}</div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-[10px] text-muted-foreground">Conversions</span>
          </div>
          <div className="text-xl font-bold" data-testid="text-referral-conversions">{stats?.totalConversions || 0}</div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] text-muted-foreground">Credits Earned</span>
          </div>
          <div className="text-xl font-bold" data-testid="text-credits-earned">{stats?.lifetimeEarnings || 0}</div>
        </GlassCard>
      </div>

      <GlassCard className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Your Referral Link
          </h4>
          {(stats?.pendingCommission || 0) > 0 && (
            <Badge className="bg-purple-500/20 text-purple-400 text-[9px]">
              ${((stats?.pendingCommission || 0) / 100).toFixed(2)} Pending
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 font-mono text-xs truncate" data-testid="text-referral-link">
            {referralLink}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(referralLink)}
            className="shrink-0"
            data-testid="button-copy-referral"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1 text-xs" variant="outline" onClick={shareToTwitter} data-testid="button-share-twitter">
            𝕏 Share
          </Button>
          <Button size="sm" className="flex-1 text-xs" variant="outline" onClick={shareToTelegram} data-testid="button-share-telegram">
            📱 Telegram
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-400" />
          Recent Referrals
        </h4>
        <div className="space-y-2">
          {(stats?.referrals || []).slice(0, 5).map((ref, i) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              data-testid={`referral-row-${ref.id}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ref.status === 'converted' ? 'bg-green-400' : ref.status === 'qualified' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                <span className="text-sm font-medium capitalize">{ref.status}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-green-400">+{ref.referrerReward} credits</div>
                <div className="text-[9px] text-muted-foreground">
                  {new Date(ref.createdAt).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
          {(stats?.referrals || []).length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No referrals yet. Share your link to start earning!
            </div>
          )}
        </div>
      </GlassCard>

      <Dialog>
        <DialogTrigger asChild>
          <button 
            className="w-full p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 hover:from-cyan-500/20 hover:to-purple-500/20 transition-all cursor-pointer text-left"
            data-testid="button-how-it-works"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">How It Works</h4>
                <p className="text-[10px] text-muted-foreground">
                  Earn {currentTier?.referrerRewardCredits || 250} credits per signup + {currentTier?.commissionPercent || 10}% commission on purchases
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              How the Referral Program Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">1. Share Your Link</h4>
                <p className="text-xs text-muted-foreground">Copy your unique referral link and share it with friends, family, or your community.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">2. They Sign Up</h4>
                <p className="text-xs text-muted-foreground">When someone clicks your link and creates an account, you both earn bonus credits.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">3. Earn Commission</h4>
                <p className="text-xs text-muted-foreground">Get {currentTier?.commissionPercent || 10}% commission on every purchase your referrals make. Forever.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">4. Level Up</h4>
                <p className="text-xs text-muted-foreground">The more referrals you bring, the higher your tier and rewards. Reach Oracle status for maximum benefits!</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <p className="text-xs text-center">
                <span className="font-bold text-cyan-400">{currentTier?.referrerRewardCredits || 250} credits</span> per signup + 
                <span className="font-bold text-purple-400"> {currentTier?.commissionPercent || 10}%</span> lifetime commission
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {tiers.length > 0 && (
        <GlassCard className="p-3">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            Tier Rewards
          </h4>
          <div className="space-y-2">
            {tiers.filter(t => !t.slug.includes("-legacy")).map((tier) => (
              <div
                key={tier.slug}
                className={`flex items-center justify-between p-2 rounded-lg ${tier.slug === currentTierSlug ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TIER_ICONS[tier.slug] || "🌱"}</span>
                  <div>
                    <span className="text-sm font-medium">{tier.name}</span>
                    <p className="text-[9px] text-muted-foreground">{tier.minConversions}+ conversions</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  {tier.commissionPercent}% commission
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
