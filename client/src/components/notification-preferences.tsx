import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Globe, DollarSign, TrendingUp, Coins, Gift, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/glass-card";
import { useToast } from "@/hooks/use-toast";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export function NotificationPreferences({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "large_transfers", label: "Large Transfers", description: "Alert when transfers exceed 1,000 SIG", icon: DollarSign, enabled: true },
    { id: "staking_rewards", label: "Staking Rewards", description: "Weekly staking reward summaries", icon: Coins, enabled: true },
    { id: "price_alerts", label: "Price Alerts", description: "Notify when SIG price changes significantly", icon: TrendingUp, enabled: false },
    { id: "new_features", label: "New Features", description: "Updates about new platform features", icon: Gift, enabled: true },
    { id: "security", label: "Security Alerts", description: "Important security notifications", icon: Shield, enabled: true },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSave = () => {
    toast({ title: "Preferences Saved", description: "Your notification preferences have been updated" });
    onClose();
  };

  const requestPushPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        toast({ title: "Push Enabled", description: "You'll receive push notifications" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-testid="notification-preferences-modal"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Notification Preferences</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-notifications">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          <GlassCard className="p-4" data-testid="card-email-notifications">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-black/30"
              data-testid="input-notification-email"
            />
          </GlassCard>

          <GlassCard className="p-4" data-testid="card-push-notifications">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-xs text-muted-foreground">Browser push notifications</p>
                </div>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={() => pushEnabled ? setPushEnabled(false) : requestPushPermission()}
                data-testid="switch-push-notifications"
              />
            </div>
          </GlassCard>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Notification Types
            </h3>
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                data-testid={`setting-${setting.id}`}
              >
                <div className="flex items-center gap-3">
                  <setting.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm">{setting.label}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                  data-testid={`switch-${setting.id}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-white/10">
          <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-notifications">
            Cancel
          </Button>
          <Button className="flex-1 bg-primary" onClick={handleSave} data-testid="button-save-notifications">
            Save Preferences
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
