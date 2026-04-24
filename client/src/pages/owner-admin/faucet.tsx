import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Droplets, CheckCircle, XCircle, Clock,
  RefreshCw, TrendingUp, Wallet
} from "lucide-react";
import { BackButton } from "@/components/page-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface FaucetClaim {
  id: string;
  walletAddress: string;
  amount: string;
  status: string;
  txHash: string | null;
  ipAddress: string | null;
  claimedAt: string;
}

interface FaucetStats {
  total: number;
  claimsToday: number;
  completed: number;
  failed: number;
  pending: number;
  totalDistributed: string;
}

interface FaucetResponse {
  claims: FaucetClaim[];
  stats: FaucetStats;
}

function formatSIG(amount: string): string {
  const value = BigInt(amount);
  const wholePart = value / BigInt(10 ** 18);
  return wholePart.toLocaleString() + " SIG";
}

export default function OwnerFaucet() {
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

  const { data, isLoading, refetch } = useQuery<FaucetResponse>({
    queryKey: ["/api/owner/faucet/claims"],
    queryFn: async () => {
      const res = await fetch("/api/owner/faucet/claims", { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch faucet claims");
      return res.json();
    },
  });

  const stats = data?.stats;
  const claims = data?.claims || [];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={400} top="10%" left="10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={300} top="60%" left="70%" delay={2} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-white">Faucet Claims</h1>
              <p className="text-gray-400">Monitor testnet token distribution</p>
            </div>
          </div>
          
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="gap-2"
            data-testid="button-refresh-faucet"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-gray-400 text-sm">Total Claims</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Today</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.claimsToday || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.completed || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">Failed</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.failed || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Distributed</span>
            </div>
            <p className="text-xl font-bold text-white">{stats ? formatSIG(stats.totalDistributed) : "0 SIG"}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              Recent Claims
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No faucet claims yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Wallet</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">TX Hash</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-faucet-claim-${claim.id}`}>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-white">
                          {claim.walletAddress.slice(0, 8)}...{claim.walletAddress.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-medium">
                        {formatSIG(claim.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_COLORS[claim.status] || 'bg-gray-500/20'}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {claim.txHash ? (
                          <span className="font-mono text-xs text-gray-400">
                            {claim.txHash.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(claim.claimedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
