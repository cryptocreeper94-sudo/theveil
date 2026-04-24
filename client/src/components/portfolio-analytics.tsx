import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  realizedPL: number;
  change24h: number;
  change7d: number;
  change30d: number;
  allTimeHigh: number;
  allTimeLow: number;
}

interface TokenHolding {
  symbol: string;
  name: string;
  value: number;
  allocation: number;
  color: string;
}

interface PortfolioAnalyticsProps {
  metrics?: PortfolioMetrics;
  holdings?: TokenHolding[];
  chartData?: { date: string; value: number }[];
  hasData?: boolean;
}

const COLORS = ["#8B5CF6", "#6366F1", "#3B82F6", "#10B981", "#22D3EE"];

export function PortfolioAnalytics({ metrics, holdings, chartData, hasData = false }: PortfolioAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");

  const getTimeframeChange = () => {
    if (!metrics) return 0;
    switch (timeframe) {
      case "24h": return metrics.change24h;
      case "7d": return metrics.change7d;
      case "30d": return metrics.change30d;
      case "all": return metrics.totalCost > 0 ? ((metrics.totalValue - metrics.totalCost) / metrics.totalCost) * 100 : 0;
    }
  };

  const change = getTimeframeChange();
  const isPositive = change >= 0;

  return (
    <div className="space-y-4" data-testid="portfolio-analytics">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Unrealized P/L
          </div>
          <div className={`text-lg font-bold ${hasData && metrics ? (metrics.unrealizedPL >= 0 ? "text-green-400" : "text-red-400") : "text-muted-foreground"}`}>
            {hasData && metrics ? `${metrics.unrealizedPL >= 0 ? "+" : ""}$${metrics.unrealizedPL.toLocaleString()}` : "--"}
          </div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Realized P/L
          </div>
          <div className={`text-lg font-bold ${hasData && metrics ? (metrics.realizedPL >= 0 ? "text-green-400" : "text-red-400") : "text-muted-foreground"}`}>
            {hasData && metrics ? `${metrics.realizedPL >= 0 ? "+" : ""}$${metrics.realizedPL.toLocaleString()}` : "--"}
          </div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ArrowUpRight className="w-3 h-3 text-green-400" />
            All-Time High
          </div>
          <div className="text-lg font-bold text-muted-foreground">
            {hasData && metrics && metrics.allTimeHigh > 0 ? `$${metrics.allTimeHigh.toLocaleString()}` : "--"}
          </div>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ArrowDownRight className="w-3 h-3 text-red-400" />
            All-Time Low
          </div>
          <div className="text-lg font-bold text-muted-foreground">
            {hasData && metrics && metrics.allTimeLow > 0 ? `$${metrics.allTimeLow.toLocaleString()}` : "--"}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4" data-testid="card-performance-chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Performance</h3>
          </div>
          <div className="flex gap-1">
            {(["24h", "7d", "30d", "all"] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                className={`h-6 px-2 text-[10px] ${!hasData ? 'opacity-50' : ''}`}
                disabled={!hasData}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        
        {hasData && chartData && chartData.length > 0 ? (
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke={isPositive ? "#22c55e" : "#ef4444"} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">Performance chart will appear</p>
              <p className="text-[10px] text-muted-foreground">once wallet is connected</p>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4" data-testid="card-allocation">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm">Allocation</h3>
        </div>
        
        {hasData && holdings && holdings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={holdings}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="allocation"
                    stroke="none"
                  >
                    {holdings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-1">
              {holdings.slice(0, 5).map((holding, index) => (
                <div key={holding.symbol} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: holding.color || COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{holding.symbol}</span>
                  <span className="ml-auto">{holding.allocation.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <div className="text-center">
              <PieChart className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">Allocation breakdown will appear</p>
              <p className="text-[10px] text-muted-foreground">once you have holdings</p>
            </div>
          </div>
        )}
      </GlassCard>

      {!hasData && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-3">Connect your wallet to track P/L and analytics</p>
          <Link href="/wallet">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Wallet className="w-3 h-3 mr-1" />
              Connect Wallet
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
