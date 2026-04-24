import { useState } from "react";
import { Link } from "wouter";
import { Calculator, Users, DollarSign, Coins, Gift, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { GlassCard } from "./glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface ReferralCodeData {
  code: string;
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
}

interface ReferralStats {
  totalReferrals: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export function ReferralCalculator() {
  const [signups, setSignups] = useState(10);
  const [buyers5, setBuyers5] = useState(2);
  const [buyers25, setBuyers25] = useState(1);
  const [buyers50, setBuyers50] = useState(1);
  const [buyers100, setBuyers100] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery<ReferralCodeData>({
    queryKey: ["referral-code"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/code");
      if (!res.ok) throw new Error("Failed to fetch referral code");
      return res.json();
    },
  });

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const referralLink = referralCode ? `https://dwtl.io/join/${referralCode.code}` : "";

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseShells = signups * 1000;
  const bonus5 = buyers5 * 5000;
  const bonus25 = buyers25 * 10000;
  const bonus50 = buyers50 * 20000;
  const bonus100 = buyers100 * 50000;
  const totalShells = baseShells + bonus5 + bonus25 + bonus50 + bonus100;
  const totalSig = totalShells / 10;
  const totalValue = totalSig * 0.01;

  return (
    <GlassCard glow className="col-span-full">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm sm:text-base">Your Referral Program</h3>
            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">PRESALE BONUS</Badge>
          </div>
          <Link href="/referrals">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Full Details <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/5 rounded-xl border border-teal-500/20">
          <p className="text-sm text-muted-foreground mb-4 italic">
            "A couple posts a day. That's all it takes. Share your link, grow the network, build your bag."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-xl border border-teal-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold">Your Shell Balance</span>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-teal-400 mb-2" data-testid="shell-balance">
              {(stats?.totalEarnings || 0).toLocaleString()} Shells
            </div>
            <div className="text-xs text-muted-foreground">
              = {((stats?.totalEarnings || 0) / 10).toLocaleString()} SIG at TGE
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-sm font-semibold mb-3">What Can You Do With Shells?</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Convert to <strong className="text-cyan-400">Signal (SIG)</strong> at TGE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Exchange for <strong className="text-purple-400">Echoes</strong> in Chronicles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>Unlock <strong className="text-green-400">Premium Features</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>Redeem for <strong className="text-pink-400">Exclusive NFTs</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
          <div className="text-xs text-muted-foreground mb-2">Your Referral Link</div>
          {codeLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating your link...</span>
            </div>
          ) : referralCode ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white/5 px-3 py-2 rounded-lg text-sm font-mono truncate" data-testid="referral-link">
                {referralLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                data-testid="copy-referral-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sign in to get your referral link</div>
          )}
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-lg font-bold">{stats.totalReferrals || 0}</div>
                <div className="text-xs text-muted-foreground">Signups</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{stats.totalConversions || 0}</div>
                <div className="text-xs text-muted-foreground">Purchases</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-teal-400">{(stats.totalEarnings || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Shells Earned</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Earnings Calculator</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Referrals</div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Total Signups</label>
                  <Input
                    type="number"
                    min={0}
                    value={signups}
                    onChange={(e) => setSignups(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-10"
                    data-testid="input-signups"
                  />
                </div>
                <div className="text-right pt-5">
                  <span className="text-xs text-muted-foreground">× 1,000 Shells</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="text-xs text-muted-foreground mb-2">How many purchased:</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">$5 - $24</label>
                  <Input
                    type="number"
                    min={0}
                    value={buyers5}
                    onChange={(e) => setBuyers5(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-10"
                    data-testid="input-buyers-5"
                  />
                </div>
                <div className="text-right pt-5">
                  <span className="text-xs text-green-400">+5,000 each</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">$25 - $49</label>
                  <Input
                    type="number"
                    min={0}
                    value={buyers25}
                    onChange={(e) => setBuyers25(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-10"
                    data-testid="input-buyers-25"
                  />
                </div>
                <div className="text-right pt-5">
                  <span className="text-xs text-green-400">+10,000 each</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">$50 - $99</label>
                  <Input
                    type="number"
                    min={0}
                    value={buyers50}
                    onChange={(e) => setBuyers50(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-10"
                    data-testid="input-buyers-50"
                  />
                </div>
                <div className="text-right pt-5">
                  <span className="text-xs text-green-400">+20,000 each</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">$100+</label>
                  <Input
                    type="number"
                    min={0}
                    value={buyers100}
                    onChange={(e) => setBuyers100(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-10"
                    data-testid="input-buyers-100"
                  />
                </div>
                <div className="text-right pt-5">
                  <span className="text-xs text-green-400">+50,000 each</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Earnings</div>
            
            <div className="space-y-3 bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Base (signups)</span>
                <span className="font-mono">{baseShells.toLocaleString()} Shells</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bonus ($5-$24)</span>
                <span className="font-mono text-green-400">+{bonus5.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bonus ($25-$49)</span>
                <span className="font-mono text-green-400">+{bonus25.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bonus ($50-$99)</span>
                <span className="font-mono text-green-400">+{bonus50.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bonus ($100+)</span>
                <span className="font-mono text-green-400">+{bonus100.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Shells</span>
                  <span className="font-mono text-lg font-bold text-teal-400">{totalShells.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400">Converts To</span>
                </div>
                <div className="text-xl font-bold font-mono">{totalSig.toLocaleString()} SIG</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Value at TGE</span>
                </div>
                <div className="text-xl font-bold font-mono">${totalValue.toLocaleString()}</div>
              </div>
            </div>

            <div className="text-xs text-center text-muted-foreground mt-4">
              TGE price: 1 SIG = $0.01 · 10 Shells = 1 SIG
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-1">How It Works</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Get your referral link from your dashboard</p>
                <p>• Share it anywhere - Zealy, social media, friends, anywhere</p>
                <p>• Earn 1,000 Shells for every signup using your link</p>
                <p>• Earn bonus Shells when they make a purchase (min $5)</p>
                <p>• No cap - earn as much as you can bring in</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
