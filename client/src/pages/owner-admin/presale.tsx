import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, Users, TrendingUp, Coins, 
  RefreshCw, Download, Search, ChevronDown
} from "lucide-react";
import { BackButton } from "@/components/page-nav";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

const TIER_COLORS: Record<string, string> = {
  'signal_believer': '#22c55e',
  'early_supporter': '#06b6d4',
  'community_builder': '#8b5cf6',
  'trust_pioneer': '#ec4899',
  'genesis_founder': '#f59e0b',
};

export default function OwnerPresale() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (auth !== "true") {
      window.location.href = "/owner-admin";
    }
  }, []);

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/owner/presale/stats"],
    queryFn: async () => {
      const res = await fetch("/api/owner/presale/stats", { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: purchasesData, isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ["/api/owner/presale/purchases"],
    queryFn: async () => {
      const res = await fetch("/api/owner/presale/purchases", { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) return { purchases: [] };
      return res.json();
    },
  });

  const refetch = () => {
    refetchStats();
    refetchPurchases();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const formatTier = (tier: string) => {
    return tier?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const purchases = purchasesData?.purchases || [];
  
  const filteredPurchases = purchases
    .filter((p: any) => 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === "amount") return (b.usd_amount_cents || 0) - (a.usd_amount_cents || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const summaryStats = [
    { 
      label: "Total Raised", 
      value: formatCurrency(stats?.totalRaisedCents || 0), 
      icon: <DollarSign className="w-5 h-5 text-green-400" />,
      color: "green"
    },
    { 
      label: "Unique Buyers", 
      value: stats?.uniqueBuyers || 0, 
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      color: "cyan"
    },
    { 
      label: "Total Purchases", 
      value: stats?.totalPurchases || 0, 
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      color: "purple"
    },
    { 
      label: "SIG Sold", 
      value: (stats?.totalTokensSold || 0).toLocaleString(), 
      icon: <Coins className="w-5 h-5 text-purple-400" />,
      color: "purple"
    },
  ];

  const tierData = (stats?.tierBreakdown || []).map((t: any) => ({
    name: formatTier(t.tier),
    value: parseInt(t.total_cents) || 0,
    count: parseInt(t.count) || 0,
    color: TIER_COLORS[t.tier] || '#64748b'
  }));

  const dailyData = (stats?.dailyPurchases || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: (parseInt(d.total_cents) || 0) / 100,
    purchases: parseInt(d.purchases) || 0
  }));

  const exportCSV = () => {
    const headers = ['Date', 'Email', 'Name', 'Wallet', 'Amount', 'SIG', 'Tier', 'Status', 'Method'];
    const rows = purchases.map((p: any) => [
      new Date(p.created_at).toISOString(),
      p.email,
      p.buyer_name || '',
      p.wallet_address || '',
      (p.usd_amount_cents / 100).toFixed(2),
      p.token_amount,
      p.tier,
      p.status,
      p.payment_method
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presale-purchases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #22c55e, #06b6d4)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #8b5cf6, #ec4899)" size={500} top="50%" left="70%" delay={2} />


      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                  Presale Dashboard
                </span>
              </h1>
              <p className="text-gray-400">All Signal (SIG) purchases</p>
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-green-500/50 text-sm"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refetch}
              className="p-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-cyan-500/50"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading || purchasesLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
              style={{ boxShadow: "0 0 30px rgba(0,200,255,0.05)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(34,197,94,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Revenue Over Time
            </h3>
            <div className="h-64">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No purchase data yet
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(139,92,246,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-400" />
              Revenue by Tier
            </h3>
            <div className="h-64">
              {tierData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {tierData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No tier data yet
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          style={{ boxShadow: "0 0 40px rgba(0,200,255,0.1)" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              All Purchases ({purchases.length})
            </h3>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search email, name, wallet..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none w-64"
                  data-testid="input-search-purchases"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                data-testid="select-sort-by"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium hidden md:table-cell">Name</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">SIG</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium hidden lg:table-cell">Tier</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {purchasesLoading ? 'Loading...' : 'No purchases found'}
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase: any) => (
                    <tr 
                      key={purchase.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      data-testid={`row-purchase-${purchase.id}`}
                    >
                      <td className="py-3 px-2 text-gray-300">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-white">{purchase.email}</td>
                      <td className="py-3 px-2 text-gray-300 hidden md:table-cell">
                        {purchase.buyer_name || '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-green-400 font-medium">
                        {formatCurrency(purchase.usd_amount_cents || 0)}
                      </td>
                      <td className="py-3 px-2 text-right text-cyan-400">
                        {(purchase.token_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${TIER_COLORS[purchase.tier] || '#64748b'}20`,
                            color: TIER_COLORS[purchase.tier] || '#64748b'
                          }}
                        >
                          {formatTier(purchase.tier)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          purchase.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : purchase.status === 'pending'
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
