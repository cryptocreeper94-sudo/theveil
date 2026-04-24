import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Bot, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  ExternalLink
} from "lucide-react";
import { GlassCard } from "./glass-card";

interface StrikeRecommendation {
  id: string;
  tokenSymbol: string;
  tokenName: string | null;
  tokenAddress: string;
  priceUsd: string;
  marketCapUsd: string | null;
  aiRecommendation: 'snipe' | 'watch' | 'avoid';
  aiScore: number;
  aiReasoning: string | null;
  mintAuthorityActive: boolean | null;
  freezeAuthorityActive: boolean | null;
  isHoneypot: boolean | null;
  liquidityLocked: boolean | null;
  createdAt: string;
}

const recommendationStyles = {
  snipe: {
    bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: Target,
    label: 'SNIPE',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  },
  watch: {
    bg: 'bg-gradient-to-r from-purple-500/20 to-teal-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: Eye,
    label: 'WATCH',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]'
  },
  avoid: {
    bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: AlertTriangle,
    label: 'AVOID',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  }
};

function RecommendationCard({ rec }: { rec: StrikeRecommendation }) {
  const style = recommendationStyles[rec.aiRecommendation];
  const Icon = style.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${style.bg} ${style.glow} rounded-lg border ${style.border} p-3`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${style.bg} ${style.border} border`}>
            <Icon className={`w-3.5 h-3.5 ${style.text}`} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">${rec.tokenSymbol}</div>
            <div className="text-[10px] text-white/40 truncate max-w-[100px]">
              {rec.tokenName || rec.tokenAddress.slice(0, 8) + '...'}
            </div>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} border`}>
          {style.label}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <div className="text-[10px] text-white/40 uppercase">Price</div>
          <div className="text-xs font-medium text-white">
            ${rec.priceUsd ? parseFloat(rec.priceUsd).toFixed(6) : '0.00'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-white/40 uppercase">MCap</div>
          <div className="text-xs font-medium text-white">
            {rec.marketCapUsd ? `$${(parseFloat(rec.marketCapUsd) / 1000).toFixed(0)}K` : 'N/A'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-white/40 uppercase">Score</div>
          <div className={`text-xs font-bold ${(rec.aiScore || 0) >= 70 ? 'text-emerald-400' : (rec.aiScore || 0) >= 40 ? 'text-purple-400' : 'text-red-400'}`}>
            {rec.aiScore || 0}/100
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 flex-wrap">
        {rec.mintAuthorityActive === false && (
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            Mint Disabled
          </span>
        )}
        {rec.freezeAuthorityActive === false && (
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            Freeze Disabled
          </span>
        )}
        {rec.liquidityLocked && (
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            LP Locked
          </span>
        )}
        {rec.isHoneypot && (
          <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">
            Honeypot Risk
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function StrikeAgentWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['strike-agent-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/pulse/strike-agent/recommendations?limit=5');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
    refetchInterval: 30000
  });

  const recommendations = (data?.recommendations || []) as StrikeRecommendation[];

  return (
    <GlassCard glow className="col-span-1 md:col-span-2">
      <div className="p-4 md:p-5 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-slate-900" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Strike Agent
                <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded uppercase tracking-wider">
                  AI Powered
                </span>
              </h3>
              <p className="text-[10px] text-white/40">Real-time token discovery & safety analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <span className="text-xs text-white/40">Scanning tokens...</span>
            </div>
          </div>
        ) : error || recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-cyan-500/30 mx-auto mb-2" />
            <p className="text-sm text-white/50 mb-1">No active recommendations</p>
            <p className="text-[10px] text-white/30">Strike Agent is monitoring the market</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-white/50">Snipe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] text-white/50">Watch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-white/50">Avoid</span>
            </div>
          </div>
          <a 
            href="/pulse" 
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            data-testid="link-pulse-dashboard"
          >
            View All
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}

export function StrikeAgentMini() {
  const { data, isLoading } = useQuery({
    queryKey: ['strike-agent-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/pulse/strike-agent/recommendations?limit=3');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 30000
  });

  const recommendations = (data?.recommendations || []) as StrikeRecommendation[];
  const snipeCount = recommendations.filter(r => r.aiRecommendation === 'snipe').length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white">Strike Agent</span>
        <span className="ml-auto text-[10px] text-emerald-400">
          {snipeCount} opportunities
        </span>
      </div>
      <div className="flex gap-2">
        {isLoading ? (
          <div className="text-[10px] text-white/40">Scanning...</div>
        ) : recommendations.slice(0, 3).map((rec) => (
          <div 
            key={rec.id}
            className={`flex-1 text-center py-1 px-2 rounded ${
              rec.aiRecommendation === 'snipe' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : rec.aiRecommendation === 'watch'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            <div className="text-[10px] font-bold">${rec.tokenSymbol}</div>
            <div className="text-[9px] opacity-70">{rec.aiScore}pts</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
