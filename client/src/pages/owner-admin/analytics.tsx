import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart3, Users, Eye, Globe, TrendingUp, 
  Clock, MapPin, Smartphone, Monitor, Tablet, Chrome,
  RefreshCw, Calendar, Filter, Download
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

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];

export default function OwnerAnalytics() {
  const [selectedHost, setSelectedHost] = useState<"dwsc.io" | "yourlegacy.io">("dwsc.io");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (auth !== "true") {
      window.location.href = "/owner-admin";
    }
  }, []);

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  });

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/owner/analytics/full", selectedHost, timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/owner/analytics/full?host=${selectedHost}&range=${timeRange}`, { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) {
        return {
          summary: { pageViews: 0, uniqueVisitors: 0, avgSessionDuration: "0:00", bounceRate: 0 },
          pageViewsOverTime: [],
          topPages: [],
          topReferrers: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          geoData: [],
        };
      }
      return res.json();
    },
  });

  const hosts = [
    { id: "dwsc.io", label: "DWSC.io" },
    { id: "yourlegacy.io", label: "YourLegacy.io" },
  ];

  const timeRanges = [
    { id: "24h", label: "24 Hours" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
  ];

  const summaryStats = [
    { label: "Page Views", value: analyticsData?.summary?.pageViews || 0, icon: <Eye className="w-5 h-5 text-cyan-400" />, change: "+12%" },
    { label: "Unique Visitors", value: analyticsData?.summary?.uniqueVisitors || 0, icon: <Users className="w-5 h-5 text-purple-400" />, change: "+8%" },
    { label: "Avg. Session", value: analyticsData?.summary?.avgSessionDuration || "0:00", icon: <Clock className="w-5 h-5 text-pink-400" />, change: "+5%" },
    { label: "Bounce Rate", value: `${analyticsData?.summary?.bounceRate || 0}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" />, change: "-3%" },
  ];

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
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Analytics Dashboard
                </span>
              </h1>
              <p className="text-gray-400">Real-time visitor insights</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-white/10">
              {hosts.map((host) => (
                <button
                  key={host.id}
                  onClick={() => setSelectedHost(host.id as any)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedHost === host.id ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`button-analytics-host-${host.id}`}
                >
                  {host.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-white/10">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    timeRange === range.id ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`button-range-${range.id}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="p-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-cyan-500/50"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                <span className="text-xs text-green-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(0,200,255,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Traffic Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData?.pageViewsOverTime || []}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#06b6d4" fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(168,85,247,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Top Pages
            </h3>
            <div className="space-y-3">
              {(analyticsData?.topPages || []).slice(0, 6).map((page: any, i: number) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                    <span className="text-sm text-gray-300 truncate max-w-[200px]">{page.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${(page.views / (analyticsData?.topPages?.[0]?.views || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium w-12 text-right">{page.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 30px rgba(236,72,153,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-pink-400" />
              Devices
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.deviceBreakdown || [{ name: 'Desktop', value: 50 }, { name: 'Mobile', value: 40 }, { name: 'Tablet', value: 10 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(analyticsData?.deviceBreakdown || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">Desktop</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Mobile</span>
              </div>
              <div className="flex items-center gap-1">
                <Tablet className="w-4 h-4 text-pink-400" />
                <span className="text-xs text-gray-400">Tablet</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 30px rgba(245,158,11,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400" />
              Top Referrers
            </h3>
            <div className="space-y-3">
              {(analyticsData?.topReferrers || [{ source: 'Direct', visits: 0 }, { source: 'Google', visits: 0 }, { source: 'Twitter', visits: 0 }]).slice(0, 5).map((ref: any, i: number) => (
                <div key={ref.source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{ref.source}</span>
                  <span className="text-sm text-white font-medium">{ref.visits}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 30px rgba(34,197,94,0.1)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Top Locations
            </h3>
            <div className="space-y-3">
              {(analyticsData?.geoData || [{ country: 'United States', visitors: 0 }, { country: 'United Kingdom', visitors: 0 }, { country: 'Germany', visitors: 0 }]).slice(0, 5).map((loc: any, i: number) => (
                <div key={loc.country} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{loc.country}</span>
                  <span className="text-sm text-white font-medium">{loc.visitors}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
