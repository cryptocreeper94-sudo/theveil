import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Plus, Trash2, TrendingUp, TrendingDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/glass-card";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  id: string;
  token: string;
  condition: "above" | "below";
  price: number;
  enabled: boolean;
  createdAt: Date;
}

const TOKENS = [
  { symbol: "SIG", name: "Signal", price: 0.10 },
  { symbol: "wETH", name: "Wrapped Ethereum", price: 3500 },
  { symbol: "wSOL", name: "Wrapped Solana", price: 180 },
  { symbol: "USDC", name: "USD Coin", price: 1.00 },
  { symbol: "USDT", name: "Tether", price: 1.00 },
];

export function PriceAlerts() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: "1", token: "SIG", condition: "above", price: 0.15, enabled: true, createdAt: new Date() },
    { id: "2", token: "SIG", condition: "below", price: 0.08, enabled: true, createdAt: new Date() },
  ]);
  const [newAlert, setNewAlert] = useState({ token: "SIG", condition: "above" as "above" | "below", price: "" });

  const addAlert = () => {
    if (!newAlert.price || isNaN(parseFloat(newAlert.price))) {
      toast({ title: "Invalid Price", description: "Please enter a valid price", variant: "destructive" });
      return;
    }
    const alert: PriceAlert = {
      id: Date.now().toString(),
      token: newAlert.token,
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      enabled: true,
      createdAt: new Date(),
    };
    setAlerts([...alerts, alert]);
    setNewAlert({ token: "SIG", condition: "above", price: "" });
    toast({ title: "Alert Created", description: `You'll be notified when ${newAlert.token} goes ${newAlert.condition} $${newAlert.price}` });
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({ title: "Alert Deleted" });
  };

  const activeAlerts = alerts.filter(a => a.enabled).length;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative w-9 h-9 hover:bg-white/5"
        title="Price Alerts"
        data-testid="button-price-alerts"
      >
        <Bell className="w-4 h-4" />
        {activeAlerts > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] rounded-full flex items-center justify-center">
            {activeAlerts}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
              data-testid="price-alerts-overlay"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-50 overflow-hidden flex flex-col"
              data-testid="price-alerts-panel"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Price Alerts</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-alerts">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-medium mb-3">Create New Alert</h3>
                <div className="flex gap-2">
                  <Select value={newAlert.token} onValueChange={v => setNewAlert({ ...newAlert, token: v })}>
                    <SelectTrigger className="w-24" data-testid="select-alert-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.map(t => (
                        <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newAlert.condition} onValueChange={v => setNewAlert({ ...newAlert, condition: v as "above" | "below" })}>
                    <SelectTrigger className="w-24" data-testid="select-alert-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAlert.price}
                      onChange={e => setNewAlert({ ...newAlert, price: e.target.value })}
                      className="pl-7"
                      data-testid="input-alert-price"
                    />
                  </div>
                  <Button onClick={addAlert} size="icon" data-testid="button-add-alert">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No price alerts yet</p>
                    <p className="text-xs mt-1">Create one above to get started</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const token = TOKENS.find(t => t.symbol === alert.token);
                    const isTriggered = alert.condition === "above" 
                      ? (token?.price || 0) >= alert.price 
                      : (token?.price || 0) <= alert.price;

                    return (
                      <GlassCard
                        key={alert.id}
                        className={`p-3 ${!alert.enabled ? "opacity-50" : ""}`}
                        data-testid={`alert-${alert.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              alert.condition === "above" ? "bg-green-500/20" : "bg-red-500/20"
                            }`}>
                              {alert.condition === "above" 
                                ? <TrendingUp className="w-4 h-4 text-green-400" />
                                : <TrendingDown className="w-4 h-4 text-red-400" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {alert.token} {alert.condition} ${alert.price.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Current: ${token?.price.toFixed(2)}
                                {isTriggered && alert.enabled && (
                                  <span className="ml-2 text-primary">Triggered!</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={alert.enabled}
                              onCheckedChange={() => toggleAlert(alert.id)}
                              data-testid={`switch-alert-${alert.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => deleteAlert(alert.id)}
                              data-testid={`button-delete-alert-${alert.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
