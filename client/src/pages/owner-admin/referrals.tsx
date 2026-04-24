import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, TrendingUp, Gift, DollarSign,
  AlertTriangle, CheckCircle, XCircle, UserCheck,
  RefreshCw, Filter, Eye, Trophy
} from "lucide-react";
import { BackButton } from "@/components/page-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  fraud: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const TIER_COLORS: Record<string, string> = {
  explorer: '#06b6d4',
  builder: '#8b5cf6',
  architect: '#ec4899',
  oracle: '#f59e0b',
};

interface AdminStats {
  stats: {
    totalReferrals: number;
    totalConversions: number;
    totalCreditsRewarded: number;
    totalCommissionPaid: number;
  };
  topAffiliates: Array<{
    userId: string;
    currentTier: string;
    lifetimeConversions: number;
    lifetimeCreditsEarned: number;
    lifetimeCommissionEarned: number;
    pendingCommission: number;
  }>;
  recentReferrals: Array<{
    id: string;
    referrerId: string;
    refereeId: string;
    status: string;
    referrerReward: number;
    refereeReward: number;
    conversionValue: number;
    createdAt: string;
  }>;
  pendingFraudFlags: Array<{
    id: string;
    referralId: string;
    userId: string;
    flagType: string;
    reason: string;
    severity: string;
    createdAt: string;
  }>;
}

export default function OwnerReferrals() {
  const [selectedHost, setSelectedHost] = useState<"dwsc.io" | "yourlegacy.io" | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (auth !== "true") {
      window.location.href = "/owner-admin";
    }
  }, []);

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
    "Content-Type": "application/json",
  });

  const { data: adminStats, isLoading, refetch } = useQuery<AdminStats>({
    queryKey: ["/api/owner/referrals/stats", selectedHost],
    queryFn: async () => {
      const url = selectedHost 
        ? `/api/owner/referrals/stats?host=${selectedHost}` 
        : "/api/owner/referrals/stats";
      const res = await fetch(url, { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const qualifyMutation = useMutation({
    mutationFn: async (referralId: string) => {
      const res = await fetch("/api/owner/referrals/qualify", {
        method: "POST",
        headers: getOwnerHeaders(),
        body: JSON.stringify({ referralId }),
      });
      if (!res.ok) throw new Error("Failed to qualify referral");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/referrals/stats"] });
    },
  });

  const resolveFraudMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch("/api/owner/referrals/resolve-fraud", {
        method: "POST",
        headers: getOwnerHeaders(),
        body: JSON.stringify({ id, notes }),
      });
      if (!res.ok) throw new Error("Failed to resolve flag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/referrals/stats"] });
    },
  });

  const hosts = [
    { id: undefined, label: "All Hosts" },
    { id: "dwsc.io", label: "DWSC.io" },
    { id: "yourlegacy.io", label: "YourLegacy.io" },
  ];

  const statuses = [
    { id: undefined, label: "All Status" },
    { id: "pending", label: "Pending" },
    { id: "qualified", label: "Qualified" },
    { id: "converted", label: "Converted" },
  ];

  const stats = adminStats?.stats || { totalReferrals: 0, totalConversions: 0, totalCreditsRewarded: 0, totalCommissionPaid: 0 };

  const summaryStats = [
    { label: "Total Referrals", value: stats.totalReferrals, icon: <Users className="w-5 h-5 text-cyan-400" /> },
    { label: "Conversions", value: stats.totalConversions, icon: <TrendingUp className="w-5 h-5 text-green-400" /> },
    { label: "Credits Rewarded", value: stats.totalCreditsRewarded.toLocaleString(), icon: <Gift className="w-5 h-5 text-purple-400" /> },
    { label: "Commission Paid", value: `$${(stats.totalCommissionPaid / 100).toFixed(2)}`, icon: <DollarSign className="w-5 h-5 text-purple-400" /> },
  ];

  const tierDistribution = (adminStats?.topAffiliates || []).reduce((acc, a) => {
    const tier = a.currentTier || 'explorer';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tierChartData = Object.entries(tierDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={500} top="50%" left="70%" delay={2} />


      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Referral Dashboard
                </span>
              </h1>
              <p className="text-gray-400">Affiliate program management</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-white/10">
              {hosts.map((host) => (
                <button
                  key={host.id || "all"}
                  onClick={() => setSelectedHost(host.id as any)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedHost === host.id ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`button-host-${host.id || 'all'}`}
                >
                  {host.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-3 mb-2">
                {stat.icon}
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                Top Affiliates
              </h3>
            </div>
            <div className="space-y-3">
              {(adminStats?.topAffiliates || []).slice(0, 5).map((affiliate, i) => (
                <div
                  key={affiliate.userId}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm truncate max-w-[150px]">{affiliate.userId}</div>
                      <Badge 
                        variant="outline" 
                        className="text-[9px] capitalize"
                        style={{ borderColor: TIER_COLORS[affiliate.currentTier] || TIER_COLORS.explorer }}
                      >
                        {affiliate.currentTier}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{affiliate.lifetimeConversions} conv.</div>
                    <div className="text-xs text-gray-400">{affiliate.lifetimeCreditsEarned} credits</div>
                  </div>
                </div>
              ))}
              {(adminStats?.topAffiliates || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">No affiliates yet</div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10"
          >
            <h3 className="text-lg font-bold mb-4">Tier Distribution</h3>
            {tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={tierChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {tierChartData.map((tier, i) => (
                <div key={tier.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                  {tier.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {(adminStats?.pendingFraudFlags || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-500/30 mb-8"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Fraud Alerts ({adminStats?.pendingFraudFlags?.length})
            </h3>
            <div className="space-y-3">
              {(adminStats?.pendingFraudFlags || []).map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-red-500/20"
                >
                  <div>
                    <div className="font-medium text-sm">{flag.flagType}</div>
                    <div className="text-xs text-gray-400">{flag.reason}</div>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] mt-1 ${flag.severity === 'high' ? 'border-red-500 text-red-400' : 'border-purple-500 text-purple-400'}`}
                    >
                      {flag.severity}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveFraudMutation.mutate({ id: flag.id })}
                    disabled={resolveFraudMutation.isPending}
                    className="gap-1"
                    data-testid={`button-resolve-fraud-${flag.id}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recent Referrals</h3>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
              {statuses.map((status) => (
                <button
                  key={status.id || "all"}
                  onClick={() => setStatusFilter(status.id)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    statusFilter === status.id ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`button-status-${status.id || 'all'}`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-3 pr-4">Referrer</th>
                  <th className="pb-3 pr-4">Referee</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Rewards</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(adminStats?.recentReferrals || [])
                  .filter(r => !statusFilter || r.status === statusFilter)
                  .map((referral) => (
                  <tr key={referral.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-mono text-xs truncate max-w-[100px]">{referral.referrerId}</td>
                    <td className="py-3 pr-4 font-mono text-xs truncate max-w-[100px]">{referral.refereeId}</td>
                    <td className="py-3 pr-4">
                      <Badge className={`text-[9px] ${STATUS_COLORS[referral.status] || STATUS_COLORS.pending}`}>
                        {referral.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-green-400">+{referral.referrerReward + referral.refereeReward}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {referral.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => qualifyMutation.mutate(referral.id)}
                          disabled={qualifyMutation.isPending}
                          className="h-7 text-xs gap-1"
                          data-testid={`button-qualify-${referral.id}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          Qualify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(adminStats?.recentReferrals || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No referrals found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
