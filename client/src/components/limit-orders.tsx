import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Trash2, Check, X, AlertCircle, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TokenInfo {
  symbol: string;
  name: string;
  icon: string;
}

interface LimitOrder {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  targetPrice: number;
  currentPrice: number;
  expiresAt: Date;
  status: "open" | "filled" | "cancelled" | "expired";
  createdAt: Date;
}

const TOKENS: TokenInfo[] = [
  { symbol: "SIG", name: "Signal", icon: "🌊" },
  { symbol: "wETH", name: "Wrapped Ethereum", icon: "⟠" },
  { symbol: "wSOL", name: "Wrapped Solana", icon: "◎" },
  { symbol: "USDC", name: "USD Coin", icon: "💵" },
  { symbol: "USDT", name: "Tether", icon: "💲" },
];


interface LimitOrderFormProps {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  onTokenInClick: () => void;
  onTokenOutClick: () => void;
}

export function LimitOrderForm({ tokenIn, tokenOut, onTokenInClick, onTokenOutClick }: LimitOrderFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [expiry, setExpiry] = useState("7d");

  const currentPrice = tokenIn.symbol === "SIG" ? 0.10 : 1.00;
  const targetPriceNum = parseFloat(targetPrice) || 0;
  const priceDiff = ((targetPriceNum - currentPrice) / currentPrice) * 100;

  const handleSubmit = () => {
    if (!amount || !targetPrice) {
      toast({ title: "Missing Fields", description: "Please fill in amount and target price", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Limit Order Created", 
      description: `Order to sell ${amount} ${tokenIn.symbol} when price reaches $${targetPrice}`
    });
    setAmount("");
    setTargetPrice("");
  };

  return (
    <div className="space-y-4" data-testid="limit-order-form">
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">You Pay</Label>
          <div
            className="mt-1 p-3 bg-black/30 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
            onClick={onTokenInClick}
          >
            <div className="flex items-center justify-between">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-0 bg-transparent text-xl font-bold p-0 h-auto focus-visible:ring-0"
                onClick={(e) => e.stopPropagation()}
                data-testid="input-limit-amount"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-2xl">{tokenIn.icon}</span>
                <span className="font-bold">{tokenIn.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">You Receive</Label>
          <div
            className="mt-1 p-3 bg-black/30 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
            onClick={onTokenOutClick}
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-muted-foreground">
                {amount && targetPrice ? (parseFloat(amount) * parseFloat(targetPrice)).toFixed(4) : "0.00"}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-2xl">{tokenOut.icon}</span>
                <span className="font-bold">{tokenOut.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Target Price</Label>
            <span className="text-xs text-muted-foreground">Current: ${currentPrice.toFixed(4)}</span>
          </div>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.0001"
              placeholder="0.0000"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="pl-7"
              data-testid="input-target-price"
            />
          </div>
          {targetPrice && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${priceDiff >= 0 ? "text-green-400" : "text-red-400"}`}>
              {priceDiff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {priceDiff >= 0 ? "+" : ""}{priceDiff.toFixed(2)}% from current price
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Expires In</Label>
          <div className="mt-1 flex gap-2">
            {["1h", "24h", "7d", "30d"].map((exp) => (
              <Button
                key={exp}
                variant={expiry === exp ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setExpiry(exp)}
                data-testid={`button-expiry-${exp}`}
              >
                {exp}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleSubmit} data-testid="button-create-limit-order">
        <Target className="w-4 h-4 mr-2" />
        Create Limit Order
      </Button>
    </div>
  );
}

export function LimitOrdersList() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "filled">("all");

  const cancelOrder = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: "cancelled" as const } : o));
    toast({ title: "Order Cancelled" });
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const getStatusColor = (status: LimitOrder["status"]) => {
    switch (status) {
      case "open": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "filled": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelled": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "expired": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }
  };

  return (
    <div className="space-y-4" data-testid="limit-orders-list">
      <div className="flex gap-2">
        {(["all", "open", "filled"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs capitalize"
            data-testid={`filter-${f}`}
          >
            {f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const progress = order.status === "open" 
              ? ((order.currentPrice / order.targetPrice) * 100).toFixed(0) 
              : order.status === "filled" ? "100" : "0";

            return (
              <GlassCard key={order.id} className="p-3" data-testid={`order-${order.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{order.tokenIn.icon}</span>
                    <span className="font-bold text-sm">{order.amountIn} {order.tokenIn.symbol}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-lg">{order.tokenOut.icon}</span>
                    <span className="font-bold text-sm">{order.tokenOut.symbol}</span>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Target: ${order.targetPrice.toFixed(4)}</span>
                    <span>Current: ${order.currentPrice.toFixed(4)}</span>
                  </div>
                  {order.status === "open" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-400 hover:text-red-300"
                      onClick={() => cancelOrder(order.id)}
                      data-testid={`cancel-order-${order.id}`}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
                {order.status === "open" && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Progress to target</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, parseFloat(progress))}%` }}
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
