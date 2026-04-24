import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  Rocket, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Gift,
  Trophy,
  Star,
  Shield,
  Zap,
  PartyPopper,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SimpleLoginModal } from "@/components/simple-login";

interface AirdropData {
  airdropBalance: number;
  airdropBalanceDwc: string;
  airdropStatus: string;
  launchDate: string;
  walletVerified: boolean;
  dwcWalletAddress: string | null;
}

interface EarlyAdopterRewards {
  bonusDwc: number;
  pioneerTitle: boolean;
  eraAccess: boolean;
  voiceSamples: number;
  scenariosCompleted: number;
}

const DWC_LAUNCH_DATE = new Date("2026-04-11T00:00:00Z");

async function fetchAirdropStatus(): Promise<AirdropData> {
  const res = await fetch("/api/referrals/my-airdrop", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch airdrop status");
  return res.json();
}

async function verifyWallet(walletAddress: string) {
  const res = await fetch("/api/referrals/verify-wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) throw new Error("Failed to verify wallet");
  return res.json();
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          total: difference,
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      data-testid={`countdown-${label.toLowerCase()}`}
    >
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl md:text-3xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent" data-testid={`text-countdown-${label.toLowerCase()}`}>
            {String(value).padStart(2, "0")}
          </span>
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-xl -z-10" />
      </motion.div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">{label}</span>
    </motion.div>
  );
}

function FloatingOrb({ delay = 0, size = "md" }: { delay?: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };
  return (
    <motion.div
      className={`absolute ${sizes[size]} rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-xl`}
      animate={{
        x: [0, 20, -10, 0],
        y: [0, -15, 10, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        left: `${Math.random() * 80}%`,
        top: `${Math.random() * 80}%`,
      }}
    />
  );
}

export function AirdropDashboard() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletInput, setWalletInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const countdown = useCountdown(DWC_LAUNCH_DATE);

  const { data: airdrop, isLoading } = useQuery<AirdropData>({
    queryKey: ["airdrop-status"],
    queryFn: fetchAirdropStatus,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const walletMutation = useMutation({
    mutationFn: verifyWallet,
    onSuccess: () => {
      toast({ title: "Wallet Verified", description: "Your wallet is now eligible for the airdrop!" });
      queryClient.invalidateQueries({ queryKey: ["airdrop-status"] });
    },
    onError: () => {
      toast({ title: "Verification Failed", description: "Invalid wallet address format", variant: "destructive" });
    },
  });

  const copyAddress = async () => {
    if (airdrop?.dwcWalletAddress) {
      await navigator.clipboard.writeText(airdrop.dwcWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <GlassCard className="p-6 text-center relative overflow-hidden">
        <FloatingOrb delay={0} size="lg" />
        <FloatingOrb delay={2} size="md" />
        <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Sign In to View Your Airdrop</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account to see your accumulated SIG rewards
        </p>
        <Button onClick={() => setShowLoginModal(true)} data-testid="button-signin-airdrop">
          Sign In to Continue
        </Button>
        <SimpleLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Coins className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading your airdrop status...</p>
        </div>
      </GlassCard>
    );
  }

  const dwcAmount = parseFloat(airdrop?.airdropBalanceDwc || "0");
  const usdValue = airdrop?.airdropBalance || 0;
  const isEligible = airdrop?.walletVerified && dwcAmount > 0;
  const hasAirdrop = dwcAmount > 0;
  const isDistributed = airdrop?.airdropStatus === "distributed";

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-cyan-900/40" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzB2Mkg0djJoMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <FloatingOrb delay={0} size="lg" />
        <FloatingOrb delay={1.5} size="md" />
        <FloatingOrb delay={3} size="sm" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(6,182,212,0.2)",
                    "0 0 40px rgba(168,85,247,0.4)",
                    "0 0 20px rgba(6,182,212,0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Rocket className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  SIG Airdrop
                </h2>
                <p className="text-xs text-muted-foreground">Your pre-launch rewards</p>
              </div>
            </div>
            <Badge
              data-testid="badge-airdrop-status"
              className={`${
                isDistributed
                  ? "bg-green-500/20 text-green-400"
                  : isEligible
                  ? "bg-cyan-500/20 text-cyan-400"
                  : hasAirdrop
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-gray-500/20 text-gray-400"
              } border-0`}
            >
              {isDistributed ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Distributed
                </>
              ) : isEligible ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" /> Ready for Launch
                </>
              ) : hasAirdrop ? (
                <>
                  <Clock className="w-3 h-3 mr-1" /> Accumulating
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" /> Start Earning
                </>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">SIG Balance</span>
              </div>
              <motion.div
                data-testid="text-dwc-balance"
                className="text-3xl font-bold font-mono bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                key={dwcAmount}
              >
                {dwcAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </motion.div>
              <div className="text-xs text-muted-foreground mt-1">SIG Tokens</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">USD Value</span>
              </div>
              <motion.div
                data-testid="text-usd-value"
                className="text-3xl font-bold text-green-400"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                key={usdValue}
              >
                ${usdValue.toFixed(2)}
              </motion.div>
              <div className="text-xs text-muted-foreground mt-1">@ $0.001/SIG</div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center justify-center gap-2">
              <PartyPopper className="w-4 h-4 text-pink-400" />
              Time Until SIG Launch
            </h3>
            <div className="flex items-center justify-center gap-3">
              <CountdownUnit value={countdown.days} label="Days" />
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              <CountdownUnit value={countdown.hours} label="Hours" />
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              <CountdownUnit value={countdown.minutes} label="Mins" />
              <span className="text-2xl font-bold text-muted-foreground hidden md:block">:</span>
              <div className="hidden md:block">
                <CountdownUnit value={countdown.seconds} label="Secs" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              June 1, 2026 • Spring Launch 🌸
            </p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-cyan-400" />
          Wallet Verification
          {airdrop?.walletVerified && (
            <Badge className="bg-green-500/20 text-green-400 text-[9px] border-0 ml-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </h3>

        {airdrop?.walletVerified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 rounded-lg bg-white/5 border border-green-500/30 font-mono text-xs truncate" data-testid="text-wallet-address">
                {airdrop.dwcWalletAddress}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="shrink-0"
                data-testid="button-copy-wallet"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Your wallet is verified and eligible for the airdrop!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              Enter your Trust Layer wallet address to receive your airdrop at launch.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="dwc1abc123..."
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                className="flex-1 font-mono text-xs"
                data-testid="input-wallet-address"
              />
              <Button
                onClick={() => walletMutation.mutate(walletInput)}
                disabled={!walletInput || walletMutation.isPending}
                size="sm"
                data-testid="button-verify-wallet"
              >
                {walletMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </div>
            <p className="text-xs text-purple-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Wallet verification required to receive airdrop
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-400" />
          Early Adopter Rewards
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 text-center"
            data-testid="reward-bonus-dwc"
          >
            <Coins className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-400" data-testid="text-bonus-dwc">500</div>
            <div className="text-[9px] text-muted-foreground">Bonus SIG</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center"
            data-testid="reward-pioneer-title"
          >
            <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-400" data-testid="text-pioneer-title">Pioneer</div>
            <div className="text-[9px] text-muted-foreground">Title</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center"
            data-testid="reward-era-access"
          >
            <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-cyan-400" data-testid="text-era-access">First</div>
            <div className="text-[9px] text-muted-foreground">Era Access</div>
          </motion.div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Exclusive rewards for early supporters - beta date driven by community participation
        </p>
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          Airdrop Eligibility Checklist
        </h3>
        <div className="space-y-2" data-testid="eligibility-checklist">
          <EligibilityItem 
            label="Account Created" 
            completed={true} 
            description="Your account is active"
            testId="eligibility-account"
          />
          <EligibilityItem 
            label="Wallet Verified" 
            completed={airdrop?.walletVerified || false} 
            description={airdrop?.walletVerified ? "Ready to receive SIG" : "Add your wallet address above"}
            testId="eligibility-wallet"
          />
          <EligibilityItem 
            label="Commission Balance" 
            completed={dwcAmount > 0} 
            description={dwcAmount > 0 ? `${dwcAmount.toFixed(2)} SIG accumulated` : "Refer friends to earn commissions"}
            testId="eligibility-commission"
          />
          <EligibilityItem 
            label="Pre-Launch Status" 
            completed={countdown.total > 0} 
            description={countdown.total > 0 ? "You're in pre-launch mode" : "SIG has launched!"}
            testId="eligibility-prelaunch"
          />
        </div>
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Eligibility Progress</span>
            <span className="font-mono text-cyan-400" data-testid="text-eligibility-progress">
              {[true, airdrop?.walletVerified, dwcAmount > 0, countdown.total > 0].filter(Boolean).length}/4
            </span>
          </div>
          <Progress 
            value={[true, airdrop?.walletVerified, dwcAmount > 0, countdown.total > 0].filter(Boolean).length * 25} 
            className="h-2"
            data-testid="progress-eligibility"
          />
        </div>
      </GlassCard>
    </div>
  );
}

function EligibilityItem({ 
  label, 
  completed, 
  description,
  testId
}: { 
  label: string; 
  completed: boolean; 
  description: string;
  testId: string;
}) {
  return (
    <motion.div
      className={`flex items-center gap-3 p-2 rounded-lg ${
        completed ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10"
      }`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      data-testid={testId}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          completed ? "bg-green-500/20" : "bg-white/10"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${completed ? "text-green-400" : ""}`}>{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
    </motion.div>
  );
}
