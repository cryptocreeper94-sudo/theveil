import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart3, Users, Megaphone, Settings, Search, Globe,
  ArrowRight, Shield, Lock, Eye, TrendingUp, Activity,
  Zap, DollarSign, Crown, Gamepad2, Clock, CheckCircle2, ShieldCheck
} from "lucide-react";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

function SecretEntry({ onSuccess }: { onSuccess: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = async () => {
    if (secret.length < 4) {
      setError("Secret must be at least 4 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/owner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        sessionStorage.setItem("ownerAuth", "true");
        sessionStorage.setItem("ownerToken", data.token);
        onSuccess();
      } else {
        setError(data.error || "Invalid credentials");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError("Connection error. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={400} top="10%" left="10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={300} top="60%" left="70%" delay={2} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 ${shake ? 'animate-shake' : ''}`}
        style={{ boxShadow: "0 0 60px rgba(0,200,255,0.1)" }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Owner Portal Access</h1>
          <p className="text-gray-400 text-sm">Enter your secret key to continue</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter secret key..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 pr-12"
              autoFocus
              data-testid="input-owner-secret"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || secret.length < 4}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-cyan-500/25"
            data-testid="button-owner-auth"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Access Portal
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function PinEntry({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/owner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: pin }),
      });
      
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("ownerAuth", "true");
        sessionStorage.setItem("ownerToken", data.token);
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 500);
      }
    } catch {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={400} top="10%" left="10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={300} top="60%" left="70%" delay={2} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 ${shake ? 'animate-shake' : ''}`}
        style={{ boxShadow: "0 0 60px rgba(0,200,255,0.1)" }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Owner Portal Access</h1>
          <p className="text-gray-400 text-sm">Enter your 4-digit PIN to continue</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all
                  ${pin.length > i ? 'border-cyan-500 bg-cyan-500/20 text-white' : 'border-white/20 bg-slate-800/50 text-gray-600'}
                  ${error && pin.length <= i ? 'border-red-500/50' : ''}`}
              >
                {pin.length > i ? "•" : ""}
              </div>
            ))}
          </div>

          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && handlePinSubmit()}
            className="sr-only"
            autoFocus
            data-testid="input-owner-pin"
          />

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (num === 'del') setPin(p => p.slice(0, -1));
                  else if (num !== null && pin.length < 4) setPin(p => p + num);
                  setError(false);
                }}
                className={`h-14 rounded-xl font-bold text-xl transition-all
                  ${num === null ? 'invisible' : 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 hover:border-cyan-500/50'}`}
                data-testid={num !== null ? `button-pin-${num}` : undefined}
              >
                {num === 'del' ? '←' : num}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-cyan-500 to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-pin"
          >
            Unlock Portal
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-center text-sm"
            >
              Invalid PIN. Please try again.
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function BentoCard({ 
  children, 
  className = "", 
  span = "1", 
  href,
  glow = "cyan"
}: { 
  children: React.ReactNode; 
  className?: string; 
  span?: "1" | "2" | "row"; 
  href?: string;
  glow?: "cyan" | "purple" | "pink" | "emerald";
}) {
  const glowColors = {
    cyan: "rgba(0,200,255,0.15)",
    purple: "rgba(168,85,247,0.15)",
    pink: "rgba(236,72,153,0.15)",
    emerald: "rgba(16,185,129,0.15)",
  };
  
  const spanClasses = {
    "1": "col-span-1",
    "2": "col-span-1 md:col-span-2",
    "row": "col-span-1 md:col-span-2 lg:col-span-3",
  };
  
  const content = (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 ${spanClasses[span]} ${className} ${href ? 'cursor-pointer' : ''}`}
      style={{ boxShadow: `0 0 40px ${glowColors[glow]}` }}
      whileHover={href ? { scale: 1.02, borderColor: "rgba(255,255,255,0.2)" } : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function OwnerDashboard() {
  const [selectedHost, setSelectedHost] = useState<"dwsc.io" | "yourlegacy.io">("dwsc.io");
  const [showValidatorReminder, setShowValidatorReminder] = useState(() => {
    return !sessionStorage.getItem("validatorReminderDismissed");
  });

  const getOwnerHeaders = () => ({
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  });

  const { data: analyticsStats } = useQuery({
    queryKey: ["/api/owner/analytics", selectedHost],
    queryFn: async () => {
      const res = await fetch(`/api/owner/analytics?host=${selectedHost}`, { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) return { pageViews: 0, uniqueVisitors: 0, topPages: [], bounceRate: 0 };
      return res.json();
    },
  });

  const { data: marketingStats } = useQuery({
    queryKey: ["/api/marketing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/marketing/stats", { credentials: "include" });
      if (!res.ok) return { totalPosts: 0, deployed: 0, pending: 0 };
      return res.json();
    },
  });

  const quickStats = [
    { label: "Page Views (24h)", value: analyticsStats?.pageViews || 0, icon: <Eye className="w-5 h-5 text-cyan-400" />, trend: "up" },
    { label: "Unique Visitors", value: analyticsStats?.uniqueVisitors || 0, icon: <Users className="w-5 h-5 text-purple-400" />, trend: "up" },
    { label: "Marketing Posts", value: marketingStats?.totalPosts || 0, icon: <Megaphone className="w-5 h-5 text-pink-400" />, trend: "neutral" },
    { label: "Posts Deployed", value: marketingStats?.deployed || 0, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, trend: "up" },
  ];

  const portalModules = [
    { id: "presale", title: "Presale Dashboard", description: "All purchases, revenue analytics, buyer insights", icon: <DollarSign className="w-6 h-6" />, href: "/owner-admin/presale", glow: "emerald" as const },
    { id: "ops-center", title: "Operations Center", description: "Daily reports, airdrop processing, team dashboard", icon: <Activity className="w-6 h-6" />, href: "/ops-center", glow: "purple" as const },
    { id: "guardian", title: "Guardian Admin", description: "Security certifications, audits, revenue tracking", icon: <Shield className="w-6 h-6" />, href: "/owner-admin/guardian", glow: "emerald" as const },
    { id: "users", title: "User Management", description: "Waitlist, beta testers, whitelist, payments", icon: <Users className="w-6 h-6" />, href: "/owner-admin/users", glow: "cyan" as const },
    { id: "kyc", title: "KYC Verification", description: "Review and approve identity verifications", icon: <ShieldCheck className="w-6 h-6" />, href: "/owner-admin/kyc", glow: "purple" as const },
    { id: "business-verification", title: "Business Verification", description: "Approve business memberships, EIN lookup, Main Street slots", icon: <Gamepad2 className="w-6 h-6" />, href: "/owner-admin/business-verification", glow: "emerald" as const },
    { id: "analytics", title: "Analytics Dashboard", description: "Real visitor data, traffic sources, geographic insights", icon: <BarChart3 className="w-6 h-6" />, href: "/owner-admin/analytics", glow: "purple" as const },
    { id: "seo", title: "SEO Manager", description: "Meta tags, OpenGraph, structured data per route", icon: <Search className="w-6 h-6" />, href: "/owner-admin/seo", glow: "pink" as const },
    { id: "referrals", title: "Referral Dashboard", description: "Affiliate management, fraud detection, payouts", icon: <Crown className="w-6 h-6" />, href: "/owner-admin/referrals", glow: "purple" as const },
    { id: "faucet", title: "Faucet Claims", description: "Monitor testnet token distribution", icon: <Zap className="w-6 h-6" />, href: "/owner-admin/faucet", glow: "cyan" as const },
    { id: "marketing", title: "Marketing Automation", description: `${marketingStats?.totalPosts || 0} branded posts, auto-deployment`, icon: <Megaphone className="w-6 h-6" />, href: "/admin/marketing", glow: "cyan" as const },
    { id: "feedback", title: "Bug Reports & Feedback", description: "User-submitted bugs, feature requests, feedback", icon: <Activity className="w-6 h-6" />, href: "/owner-admin/feedback", glow: "emerald" as const },
    { id: "messaging", title: "Messaging Catalog", description: "Pre-approved social media copy & images", icon: <Megaphone className="w-6 h-6" />, href: "/owner-admin/messaging", glow: "purple" as const },
  ];

  const hosts = [
    { id: "dwsc.io", label: "DWSC.io", icon: <Zap className="w-4 h-4" />, description: "Blockchain Portal" },
    { id: "yourlegacy.io", label: "YourLegacy.io", icon: <Crown className="w-4 h-4" />, description: "Chronicles Standalone" },
  ];

  const dismissReminder = () => {
    sessionStorage.setItem("validatorReminderDismissed", "true");
    setShowValidatorReminder(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={500} top="50%" left="70%" delay={2} />
      <GlowOrb color="linear-gradient(135deg, #f59e0b, #ef4444)" size={400} top="80%" left="20%" delay={4} />

      <AnimatePresence>
        {showValidatorReminder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              style={{ boxShadow: "0 0 60px rgba(0,200,255,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Validator Nodes Reminder</h3>
                  <p className="text-sm text-gray-400">Action needed for decentralization</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-white/5">
                <p className="text-sm text-gray-300 mb-3">
                  Sign up for <span className="text-cyan-400 font-semibold">DigitalOcean</span> or <span className="text-cyan-400 font-semibold">Vultr</span> to run 3 validator nodes (~$15/month total).
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <a 
                    href="https://digitalocean.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" /> digitalocean.com
                  </a>
                  <a 
                    href="https://vultr.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" /> vultr.com
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={dismissReminder}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold text-sm"
                  data-testid="button-dismiss-validator-reminder"
                >
                  Got it, dismiss
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Owner Portal
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Complete ecosystem control • Real-time analytics</p>
          </div>

          <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-white/10">
            {hosts.map((host) => (
              <motion.button
                key={host.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedHost(host.id as any)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  selectedHost === host.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid={`button-host-${host.id}`}
              >
                {host.icon}
                <span className="hidden sm:inline">{host.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
              style={{ boxShadow: "0 0 30px rgba(0,200,255,0.05)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {portalModules.map((module, i) => (
            <BentoCard key={module.id} href={module.href} glow={module.glow}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-${module.glow}-500/20 to-purple-500/20 border border-white/10`}>
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{module.title}</h3>
                    <p className="text-gray-400 text-sm">{module.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500" />
              </div>
            </BentoCard>
          ))}
        </div>

        <BentoCard span="row" glow="purple">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Ecosystem Quick Links</h3>
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Main Portal", href: "/", icon: <Globe className="w-4 h-4" /> },
              { label: "Chronicles", href: "/chronicles", icon: <Gamepad2 className="w-4 h-4" /> },
              { label: "Presale", href: "/presale", icon: <Zap className="w-4 h-4" /> },
              { label: "Crowdfund", href: "/crowdfund", icon: <DollarSign className="w-4 h-4" /> },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.02, borderColor: "rgba(168,85,247,0.5)" }}
                  className="p-3 bg-slate-800/50 rounded-xl border border-white/10 flex items-center gap-2 cursor-pointer"
                >
                  {link.icon}
                  <span className="text-sm text-gray-300">{link.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}

export default function OwnerAdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("ownerAuth") === "true";
  });

  if (!isAuthenticated) {
    return <SecretEntry onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <OwnerDashboard />;
}
