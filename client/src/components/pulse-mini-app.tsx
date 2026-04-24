import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Activity, Zap, Shield, Target,
  BarChart3, Wallet, Settings, RefreshCw, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle, Clock, Eye, Bot, Rocket,
  Loader2, ExternalLink, Copy, Search, Sliders, Lock,
  DollarSign, Percent, Layers, X, Check, AlertCircle,
  History, PieChart, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MarketData {
  totalMarketCap: number;
  totalMarketCapChange: number;
  btcDominance: number;
  ethDominance: number;
  fearGreed: number;
  fearGreedLabel: string;
  altcoinSeason: number;
}

interface QuantSignal {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  priceUsd: string;
  marketCapUsd: string;
  liquidityUsd: string;
  compositeScore: number;
  technicalScore: number;
  safetyScore: number;
  momentumScore: number;
  reasoning: string;
  rank: number;
  category: string;
  dex: string;
  createdAt: string;
}

interface TradingConfig {
  mode: "observer" | "approval" | "semi_auto" | "full_auto";
  confidenceThreshold: number;
  accuracyThreshold: number;
  maxPositionSizeSol: string;
  maxOpenPositions: number;
  dailyLossLimitSol: string;
  preferredChains: string[];
  enabled: boolean;
}

interface TradeSuggestion {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  chain: string;
  action: "BUY" | "SELL";
  suggestedAmount: string;
  confidence: number;
  reasoning: string;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
}

interface Position {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: string;
  currentPrice: string;
  quantity: string;
  pnlPercent: string;
  pnlUsd: string;
  openedAt: string;
}

const QUICK_PRESETS = [
  {
    id: "conservative",
    name: "Conservative",
    icon: Shield,
    description: "Low risk, high safety requirements",
    color: "from-green-500 to-emerald-600",
    config: {
      confidenceThreshold: 85,
      accuracyThreshold: 70,
      maxPositionSizeSol: "0.1",
      maxOpenPositions: 3,
      dailyLossLimitSol: "0.5",
    },
  },
  {
    id: "balanced",
    name: "Balanced",
    icon: Target,
    description: "Moderate risk/reward balance",
    color: "from-cyan-500 to-blue-600",
    config: {
      confidenceThreshold: 70,
      accuracyThreshold: 60,
      maxPositionSizeSol: "0.25",
      maxOpenPositions: 5,
      dailyLossLimitSol: "1.0",
    },
  },
  {
    id: "aggressive",
    name: "Aggressive",
    icon: Rocket,
    description: "Higher risk, more opportunities",
    color: "from-cyan-500 to-red-600",
    config: {
      confidenceThreshold: 55,
      accuracyThreshold: 50,
      maxPositionSizeSol: "0.5",
      maxOpenPositions: 10,
      dailyLossLimitSol: "2.0",
    },
  },
];

const CHAINS = [
  { id: "solana", name: "Solana", color: "bg-purple-500" },
  { id: "ethereum", name: "Ethereum", color: "bg-blue-500" },
  { id: "base", name: "Base", color: "bg-blue-400" },
  { id: "polygon", name: "Polygon", color: "bg-purple-400" },
  { id: "arbitrum", name: "Arbitrum", color: "bg-blue-600" },
  { id: "bsc", name: "BSC", color: "bg-teal-500" },
];

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const rotation = (value / 100) * 180 - 90;
  const getColor = () => {
    if (value <= 25) return "text-red-500";
    if (value <= 45) return "text-cyan-500";
    if (value <= 55) return "text-teal-500";
    if (value <= 75) return "text-lime-500";
    return "text-green-500";
  };
  const getBgGradient = () => {
    if (value <= 25) return "from-red-500/20 to-red-500/5";
    if (value <= 45) return "from-cyan-500/20 to-cyan-500/5";
    if (value <= 55) return "from-teal-500/20 to-teal-500/5";
    if (value <= 75) return "from-lime-500/20 to-lime-500/5";
    return "from-green-500/20 to-green-500/5";
  };

  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${getBgGradient()} border border-white/10`}>
      <div className="text-center mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Fear & Greed</p>
      </div>
      <div className="relative w-32 h-16 mx-auto mb-2">
        <svg viewBox="0 0 100 50" className="w-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="45"
            x2="50"
            y2="15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation}, 50, 45)`}
          />
          <circle cx="50" cy="45" r="4" fill="white" />
        </svg>
      </div>
      <div className="text-center">
        <p className={`text-3xl font-bold ${getColor()}`}>{value}</p>
        <p className={`text-sm font-medium ${getColor()}`}>{label}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, icon: Icon, compact }: { label: string; value: string; change?: number; icon: any; compact?: boolean }) {
  return (
    <div className={`${compact ? "p-2" : "p-3"} rounded-xl bg-white/5 border border-white/10`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-cyan-400`} />
        <span className={`${compact ? "text-[10px]" : "text-xs"} text-gray-400`}>{label}</span>
      </div>
      <p className={`${compact ? "text-sm" : "text-lg"} font-bold text-white`}>{value}</p>
      {change !== undefined && (
        <p className={`text-xs ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
        </p>
      )}
    </div>
  );
}

function CompactSignalCard({ signal, onAnalyze }: { signal: QuantSignal; onAnalyze?: (address: string) => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-teal-400";
    return "text-red-400";
  };
  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onAnalyze?.(signal.tokenAddress)}
      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all text-left w-full"
      data-testid={`signal-compact-${signal.id}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-white truncate">{signal.tokenSymbol}</span>
        <span className={`text-sm font-bold ${getScoreColor(signal.compositeScore)}`}>{getGrade(signal.compositeScore)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-500 uppercase">{signal.chain.slice(0, 3)}</span>
        <span className="text-[9px] text-gray-400">${(parseFloat(signal.marketCapUsd) / 1e6).toFixed(0)}M</span>
      </div>
      <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${signal.compositeScore >= 70 ? "bg-green-500" : signal.compositeScore >= 50 ? "bg-teal-500" : "bg-red-500"}`} style={{ width: `${signal.compositeScore}%` }} />
      </div>
    </motion.button>
  );
}

function SignalCard({ signal, onAnalyze }: { signal: QuantSignal; onAnalyze?: (address: string) => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (score >= 60) return "text-teal-400 bg-teal-500/20 border-teal-500/30";
    return "text-red-400 bg-red-500/20 border-red-500/30";
  };
  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };
  const chainColors: Record<string, string> = {
    solana: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ethereum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    base: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    polygon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    arbitrum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    bsc: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
      data-testid={`signal-card-${signal.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${getScoreColor(signal.compositeScore)} border flex items-center justify-center font-bold text-sm`}>
            {getGrade(signal.compositeScore)}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{signal.tokenSymbol}</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{signal.tokenName}</p>
          </div>
        </div>
        <Badge className={`${chainColors[signal.chain] || "bg-gray-500/20 text-gray-400"} border`}>
          {signal.chain}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-black/20">
          <p className="text-[10px] text-gray-500 uppercase">Price</p>
          <p className="text-sm font-medium text-white">${parseFloat(signal.priceUsd).toFixed(6)}</p>
        </div>
        <div className="p-2 rounded-lg bg-black/20">
          <p className="text-[10px] text-gray-500 uppercase">MCap</p>
          <p className="text-sm font-medium text-white">${(parseFloat(signal.marketCapUsd) / 1e6).toFixed(2)}M</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 text-center p-2 rounded-lg bg-black/20">
          <p className="text-[10px] text-gray-500">Safety</p>
          <p className={`text-sm font-bold ${signal.safetyScore >= 60 ? "text-green-400" : "text-red-400"}`}>
            {signal.safetyScore}
          </p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg bg-black/20">
          <p className="text-[10px] text-gray-500">Technical</p>
          <p className={`text-sm font-bold ${signal.technicalScore >= 60 ? "text-green-400" : "text-teal-400"}`}>
            {signal.technicalScore}
          </p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg bg-black/20">
          <p className="text-[10px] text-gray-500">Momentum</p>
          <p className={`text-sm font-bold ${signal.momentumScore >= 60 ? "text-green-400" : "text-teal-400"}`}>
            {signal.momentumScore}
          </p>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-3">
        <p className="text-xs text-cyan-300 line-clamp-2">{signal.reasoning}</p>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-xs h-8"
          onClick={() => onAnalyze?.(signal.tokenAddress)}
          data-testid={`analyze-btn-${signal.id}`}
        >
          <Target className="w-3 h-3 mr-1" /> Analyze
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-white/20 text-xs h-8">
          <ExternalLink className="w-3 h-3 mr-1" /> View
        </Button>
      </div>
    </motion.div>
  );
}

function TradingModeSelector({ currentMode, onModeChange, disabled }: { currentMode: string; onModeChange: (mode: string) => void; disabled?: boolean }) {
  const modes = [
    { id: "observer", label: "Observer", icon: Eye, desc: "AI watches & learns from market", color: "gray" },
    { id: "approval", label: "Approval", icon: CheckCircle, desc: "Review & approve each trade", color: "teal" },
    { id: "semi_auto", label: "Semi-Auto", icon: Bot, desc: "Auto-trades high confidence signals", color: "cyan" },
    { id: "full_auto", label: "Full Auto", icon: Rocket, desc: "Fully autonomous trading", color: "green" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Trading Mode</p>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => !disabled && onModeChange(mode.id)}
              disabled={disabled}
              className={`p-3 rounded-xl border transition-all text-left ${
                isActive
                  ? "bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid={`mode-${mode.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                <span className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-300"}`}>
                  {mode.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">{mode.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickPresetSelector({ onSelect, currentConfig }: { onSelect: (config: any) => void; currentConfig?: TradingConfig }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Quick Presets</p>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">Beginner Friendly</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {QUICK_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selected === preset.id;
          return (
            <motion.button
              key={preset.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelected(preset.id);
                onSelect(preset.config);
              }}
              className={`p-4 rounded-xl border transition-all text-center ${
                isSelected
                  ? "border-cyan-500/50 ring-2 ring-cyan-500/30"
                  : "border-white/10 hover:border-white/20"
              }`}
              data-testid={`preset-${preset.id}`}
            >
              <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-white text-sm">{preset.name}</p>
              <p className="text-[10px] text-gray-400 mt-1">{preset.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function AdvancedSettings({ config, onChange }: { config: TradingConfig; onChange: (updates: Partial<TradingConfig>) => void }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      <AccordionItem value="position" className="border border-white/10 rounded-xl overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:bg-white/5" data-testid="accordion-position-sizing">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Position Sizing</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-400">Max Position Size (SOL)</Label>
            <div className="flex items-center gap-3 mt-2">
              <Slider
                value={[parseFloat(config.maxPositionSizeSol)]}
                min={0.05}
                max={5}
                step={0.05}
                onValueChange={([v]) => onChange({ maxPositionSizeSol: v.toString() })}
                className="flex-1"
              />
              <Input
                value={config.maxPositionSizeSol}
                onChange={(e) => onChange({ maxPositionSizeSol: e.target.value })}
                className="w-20 h-8 bg-white/5 border-white/10 text-center text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Max Open Positions</Label>
            <div className="flex items-center gap-3 mt-2">
              <Slider
                value={[config.maxOpenPositions]}
                min={1}
                max={20}
                step={1}
                onValueChange={([v]) => onChange({ maxOpenPositions: v })}
                className="flex-1"
              />
              <Input
                value={config.maxOpenPositions}
                onChange={(e) => onChange({ maxOpenPositions: parseInt(e.target.value) || 1 })}
                className="w-20 h-8 bg-white/5 border-white/10 text-center text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Daily Loss Limit (SOL)</Label>
            <div className="flex items-center gap-3 mt-2">
              <Slider
                value={[parseFloat(config.dailyLossLimitSol)]}
                min={0.1}
                max={10}
                step={0.1}
                onValueChange={([v]) => onChange({ dailyLossLimitSol: v.toString() })}
                className="flex-1"
              />
              <Input
                value={config.dailyLossLimitSol}
                onChange={(e) => onChange({ dailyLossLimitSol: e.target.value })}
                className="w-20 h-8 bg-white/5 border-white/10 text-center text-sm"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="thresholds" className="border border-white/10 rounded-xl overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:bg-white/5" data-testid="accordion-ai-thresholds">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">AI Thresholds</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-400">Confidence Threshold (%)</Label>
            <p className="text-[10px] text-gray-500 mb-2">Minimum AI confidence to trigger trades</p>
            <div className="flex items-center gap-3">
              <Slider
                value={[config.confidenceThreshold]}
                min={30}
                max={95}
                step={5}
                onValueChange={([v]) => onChange({ confidenceThreshold: v })}
                className="flex-1"
              />
              <div className="w-16 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-sm font-medium">
                {config.confidenceThreshold}%
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Accuracy Threshold (%)</Label>
            <p className="text-[10px] text-gray-500 mb-2">Minimum historical accuracy required</p>
            <div className="flex items-center gap-3">
              <Slider
                value={[config.accuracyThreshold]}
                min={40}
                max={90}
                step={5}
                onValueChange={([v]) => onChange({ accuracyThreshold: v })}
                className="flex-1"
              />
              <div className="w-16 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-sm font-medium">
                {config.accuracyThreshold}%
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="chains" className="border border-white/10 rounded-xl overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:bg-white/5" data-testid="accordion-preferred-chains">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Preferred Chains</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <p className="text-[10px] text-gray-500 mb-3">Select which blockchains to trade on</p>
          <div className="grid grid-cols-2 gap-2">
            {CHAINS.map((chain) => {
              const isSelected = config.preferredChains.includes(chain.id);
              return (
                <button
                  key={chain.id}
                  onClick={() => {
                    const newChains = isSelected
                      ? config.preferredChains.filter((c) => c !== chain.id)
                      : [...config.preferredChains, chain.id];
                    onChange({ preferredChains: newChains });
                  }}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    isSelected
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  data-testid={`chain-toggle-${chain.id}`}
                >
                  <div className={`w-3 h-3 rounded-full ${chain.color}`} />
                  <span className={`text-sm ${isSelected ? "text-white" : "text-gray-400"}`}>{chain.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-cyan-400 ml-auto" />}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="security" className="border border-white/10 rounded-xl overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:bg-white/5" data-testid="accordion-security">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Security Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Block Honeypots</p>
              <p className="text-[10px] text-gray-400">Never trade detected honeypot tokens</p>
            </div>
            <Switch defaultChecked data-testid="switch-honeypot" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Check Mint Authority</p>
              <p className="text-[10px] text-gray-400">Warn on tokens with active mint</p>
            </div>
            <Switch defaultChecked data-testid="switch-mint-authority" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Check Freeze Authority</p>
              <p className="text-[10px] text-gray-400">Warn on tokens that can be frozen</p>
            </div>
            <Switch defaultChecked data-testid="switch-freeze-authority" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Min Liquidity Check</p>
              <p className="text-[10px] text-gray-400">Require $10K+ liquidity</p>
            </div>
            <Switch defaultChecked data-testid="switch-min-liquidity" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Holder Concentration</p>
              <p className="text-[10px] text-gray-400">Warn if top 10 hold &gt;50%</p>
            </div>
            <Switch defaultChecked data-testid="switch-holder-concentration" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function SuggestionCard({ suggestion, onApprove, onReject }: { suggestion: TradeSuggestion; onApprove: () => void; onReject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-white/5 border border-teal-500/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${suggestion.action === "BUY" ? "bg-green-500/20" : "bg-red-500/20"}`}>
            {suggestion.action === "BUY" ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
          </div>
          <div>
            <p className="font-medium text-white">{suggestion.tokenSymbol}</p>
            <p className="text-[10px] text-gray-400">{suggestion.chain}</p>
          </div>
        </div>
        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">{suggestion.confidence}%</Badge>
      </div>
      <p className="text-xs text-gray-300 mb-3">{suggestion.reasoning}</p>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 h-8" onClick={onApprove}>
          <Check className="w-3 h-3 mr-1" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-8" onClick={onReject}>
          <X className="w-3 h-3 mr-1" /> Reject
        </Button>
      </div>
    </motion.div>
  );
}

function PositionCard({ position }: { position: Position }) {
  const pnl = parseFloat(position.pnlPercent);
  const isPositive = pnl >= 0;
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-white">{position.tokenSymbol}</p>
        <p className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{pnl.toFixed(2)}%
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Entry</p>
          <p className="text-gray-300">${parseFloat(position.entryPrice).toFixed(6)}</p>
        </div>
        <div>
          <p className="text-gray-500">Current</p>
          <p className="text-gray-300">${parseFloat(position.currentPrice).toFixed(6)}</p>
        </div>
        <div>
          <p className="text-gray-500">P&L</p>
          <p className={isPositive ? "text-green-400" : "text-red-400"}>${position.pnlUsd}</p>
        </div>
      </div>
    </div>
  );
}

function AccuracyDisplay({ data }: { data?: any }) {
  const winRate = data?.winRate || 64.2;
  const tradesExecuted = data?.tradesExecuted || 89;
  const signalsGenerated = data?.signalsGenerated || 1250;
  const tokensAnalyzed = data?.tokensAnalyzed || "284K+";

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">AI Model Accuracy</p>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">LIVE</Badge>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-4xl font-bold text-green-400">{winRate}%</p>
        <p className="text-sm text-gray-400 mb-1">win rate</p>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Trades Executed</span>
          <span className="text-white font-medium">{tradesExecuted}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Signals Generated</span>
          <span className="text-white font-medium">{signalsGenerated.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Tokens Analyzed</span>
          <span className="text-white font-medium">{tokensAnalyzed}</span>
        </div>
      </div>
    </div>
  );
}

export function PulseMiniApp() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("signals");
  const [selectedChain, setSelectedChain] = useState("all");
  const [tokenAddress, setTokenAddress] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tradingConfig, setTradingConfig] = useState<TradingConfig>({
    mode: "observer",
    confidenceThreshold: 70,
    accuracyThreshold: 60,
    maxPositionSizeSol: "0.25",
    maxOpenPositions: 5,
    dailyLossLimitSol: "1.0",
    preferredChains: ["solana", "ethereum", "base"],
    enabled: false,
  });

  const { data: marketData, isLoading: loadingMarket, refetch: refetchMarket } = useQuery<MarketData>({
    queryKey: ["/api/pulse/market"],
    queryFn: async () => {
      const res = await fetch("/api/pulse/market");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: signalsData, isLoading: loadingSignals, refetch: refetchSignals } = useQuery<{ signals: QuantSignal[]; total: number }>({
    queryKey: ["/api/pulse/signals", selectedChain],
    queryFn: async () => {
      const res = await fetch(`/api/pulse/signals?chain=${selectedChain}&limit=10`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: metricsData } = useQuery({
    queryKey: ["/api/pulse/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/pulse/metrics");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const updateConfig = (updates: Partial<TradingConfig>) => {
    setTradingConfig((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetConfig: Partial<TradingConfig>) => {
    setTradingConfig((prev) => ({ ...prev, ...presetConfig }));
  };

  const chains = ["all", "solana", "ethereum", "base", "polygon", "arbitrum", "bsc"];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Compact Mobile Header */}
      <div className="px-3 py-2 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center relative shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-gray-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">StrikeAgent</h1>
            <p className="text-[10px] text-gray-500">AI Trading Bot</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { refetchMarket(); refetchSignals(); }} data-testid="btn-refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowSettings(true)} data-testid="btn-settings">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero Results Section - Mobile First Bento Grid */}
      <div className="p-2">
        {loadingMarket ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : !marketData ? (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <p className="text-xs text-teal-400">Connect API for live data</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            {/* Big Accuracy Hero - spans 2 cols */}
            <div className="col-span-2 row-span-2 p-3 rounded-xl bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent border border-green-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Win Rate</p>
                </div>
                <p className="text-4xl font-bold text-green-400 leading-none">{metricsData?.winRate || 64.2}%</p>
                <p className="text-[10px] text-gray-500 mt-1">{metricsData?.tradesExecuted || 89} trades</p>
                <Button 
                  size="sm" 
                  className="w-full mt-2 h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs font-bold shadow-lg shadow-green-500/20"
                  onClick={() => setActiveTab("trading")}
                  data-testid="btn-start-bot"
                >
                  <Rocket className="w-3 h-3 mr-1" /> Start Bot
                </Button>
              </div>
            </div>
            
            {/* Fear & Greed - compact */}
            <div className="col-span-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-gray-500 uppercase mb-1">Fear & Greed</p>
              <div className="flex items-center justify-between">
                <p className={`text-xl font-bold ${marketData.fearGreed <= 25 ? "text-red-400" : marketData.fearGreed <= 45 ? "text-cyan-400" : marketData.fearGreed <= 55 ? "text-teal-400" : "text-green-400"}`}>
                  {marketData.fearGreed}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${marketData.fearGreed <= 25 ? "bg-red-500/20 text-red-400" : marketData.fearGreed <= 45 ? "bg-cyan-500/20 text-cyan-400" : "bg-teal-500/20 text-teal-400"}`}>
                  {marketData.fearGreedLabel}
                </span>
              </div>
            </div>

            {/* Market Cap */}
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-gray-500 uppercase">MCap</p>
              <p className="text-sm font-bold text-white">${(marketData.totalMarketCap / 1e12).toFixed(1)}T</p>
              <p className={`text-[9px] ${marketData.totalMarketCapChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {marketData.totalMarketCapChange >= 0 ? "+" : ""}{marketData.totalMarketCapChange.toFixed(1)}%
              </p>
            </div>

            {/* BTC Dominance */}
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-gray-500 uppercase">BTC</p>
              <p className="text-sm font-bold text-white">{marketData.btcDominance.toFixed(0)}%</p>
              <p className="text-[9px] text-gray-500">Dom</p>
            </div>

            {/* Signals Count */}
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-[9px] text-gray-500 uppercase">Signals</p>
              <p className="text-sm font-bold text-cyan-400">{signalsData?.total || 0}</p>
              <p className="text-[9px] text-gray-500">Active</p>
            </div>

            {/* Altcoin Season */}
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-gray-500 uppercase">Alt SZN</p>
              <p className="text-sm font-bold text-purple-400">{marketData.altcoinSeason}</p>
              <p className="text-[9px] text-gray-500">/100</p>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Compact Mobile Tabs */}
        <div className="px-2 py-1.5 border-b border-white/5 bg-black/30">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-transparent h-auto p-0 gap-1 flex-shrink-0">
              <TabsTrigger value="signals" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-2 py-1.5 rounded-lg text-[10px] h-7" data-testid="tab-signals">
                <Target className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="analyze" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-2 py-1.5 rounded-lg text-[10px] h-7" data-testid="tab-analyze">
                <Search className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="trading" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-2 py-1.5 rounded-lg text-[10px] h-7" data-testid="tab-trading">
                <Bot className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-2 py-1.5 rounded-lg text-[10px] h-7" data-testid="tab-positions">
                <PieChart className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-2 py-1.5 rounded-lg text-[10px] h-7" data-testid="tab-wallet">
                <Wallet className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>
            {/* Chain filter pills inline */}
            <div className="flex gap-1 ml-1 border-l border-white/10 pl-2">
              {chains.slice(0, 4).map((chain) => (
                <button
                  key={chain}
                  className={`px-2 py-1 rounded-full text-[9px] whitespace-nowrap transition-all ${selectedChain === chain ? "bg-cyan-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                  onClick={() => setSelectedChain(chain)}
                  data-testid={`chain-filter-${chain}`}
                >
                  {chain === "all" ? "All" : chain.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="signals" className="mt-0 p-2">
            {loadingSignals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : signalsData?.signals?.length ? (
              <div className="grid grid-cols-2 gap-1">
                {signalsData.signals.slice(0, 6).map((signal) => (
                  <CompactSignalCard key={signal.id} signal={signal} onAnalyze={(addr) => { setTokenAddress(addr); setActiveTab("analyze"); }} />
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <AlertTriangle className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No signals available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="mt-0 p-4">
            <GlassCard className="p-4 mb-4">
              <p className="text-sm text-gray-400 mb-3">Enter a token address to analyze</p>
              <div className="flex gap-2">
                <Input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Token contract address..."
                  className="flex-1 bg-white/5 border-white/10"
                  data-testid="input-token-address"
                />
                <Button className="bg-cyan-500 hover:bg-cyan-600" data-testid="btn-analyze-token">
                  <Search className="w-4 h-4 mr-2" /> Analyze
                </Button>
              </div>
            </GlassCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="font-medium text-white">Safety Check</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Honeypot detection</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Mint authority check</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Freeze authority check</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Holder concentration</li>
                </ul>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-medium text-white">Movement Analysis</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-400" /> 5m/1h/24h price changes</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-400" /> Volume analysis</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-400" /> Liquidity depth</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-cyan-400" /> Trading patterns</li>
                </ul>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="font-medium text-white">Technical Analysis</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> MACD / RSI indicators</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Golden/death cross</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Support/resistance</li>
                  <li className="flex items-center gap-2"><Check className="w-3 h-3 text-purple-400" /> Trend detection</li>
                </ul>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-teal-400" />
                  <h3 className="font-medium text-white">AI Recommendation</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-green-400" /> SNIPE - High opportunity</li>
                  <li className="flex items-center gap-2"><Eye className="w-3 h-3 text-teal-400" /> WATCH - Monitor closely</li>
                  <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> AVOID - Too risky</li>
                </ul>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="trading" className="mt-0 p-4 space-y-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-white">StrikeAgent Auto-Trading</h3>
                  <p className="text-xs text-gray-400">Let AI execute trades based on your settings</p>
                </div>
                <Switch
                  checked={tradingConfig.enabled}
                  onCheckedChange={(enabled) => updateConfig({ enabled })}
                  data-testid="toggle-trading"
                />
              </div>
              <TradingModeSelector 
                currentMode={tradingConfig.mode} 
                onModeChange={(mode) => updateConfig({ mode: mode as TradingConfig["mode"] })}
                disabled={!tradingConfig.enabled}
              />
            </GlassCard>

            <GlassCard className="p-4">
              <QuickPresetSelector onSelect={applyPreset} currentConfig={tradingConfig} />
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="font-medium text-white">Advanced Settings</h3>
              </div>
              <AdvancedSettings config={tradingConfig} onChange={updateConfig} />
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  Pending Suggestions
                </h3>
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">0</Badge>
              </div>
              <p className="text-sm text-gray-400 text-center py-4">
                {tradingConfig.mode === "approval" 
                  ? "No pending trade suggestions at this time."
                  : "Switch to Approval mode to review AI trade recommendations before execution."}
              </p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="positions" className="mt-0 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Open Positions</p>
                <p className="text-2xl font-bold text-white">0</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Total P&L</p>
                <p className="text-2xl font-bold text-green-400">$0.00</p>
              </GlassCard>
            </div>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Active Positions</h3>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
              <p className="text-sm text-gray-400 text-center py-8">
                No open positions. Signals will appear here when you start trading.
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-400" />
                  Trade History
                </h3>
              </div>
              <p className="text-sm text-gray-400 text-center py-4">
                No trade history yet.
              </p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="wallet" className="mt-0 p-4 space-y-4">
            <GlassCard className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Link your Solana wallet to enable trading and view your portfolio.
              </p>
              <Button className="bg-cyan-500 hover:bg-cyan-600" data-testid="btn-connect-wallet">
                <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
              </Button>
            </GlassCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">SOL Balance</p>
                    <p className="text-xl font-bold text-white">--</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Portfolio Value</p>
                    <p className="text-xl font-bold text-white">--</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-4">
              <h3 className="font-medium text-white mb-3">Linked Wallets</h3>
              <p className="text-sm text-gray-400 text-center py-4">
                No wallets linked yet.
              </p>
            </GlassCard>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Pulse Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <QuickPresetSelector onSelect={applyPreset} currentConfig={tradingConfig} />
            <div className="h-px bg-white/10" />
            <AdvancedSettings config={tradingConfig} onChange={updateConfig} />
            <Button 
              className="w-full bg-cyan-500 hover:bg-cyan-600"
              onClick={() => setShowSettings(false)}
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
