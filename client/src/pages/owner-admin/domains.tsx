import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Globe, Plus, Trash2, Save, ArrowLeft, Shield, Lock, Eye,
  Server, Settings, Check, X, Loader2, ExternalLink, Copy,
  Crown, Sparkles, Zap, Link2, Clock, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

const FloatingParticle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
    animate={{
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
    }}
    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay }}
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
      {[...Array(8)].map((_, i) => <FloatingParticle key={i} delay={i * 0.5} />)}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 ${shake ? 'animate-shake' : ''}`}
        style={{ boxShadow: "0 0 60px rgba(0,200,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)" }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20 blur-sm pointer-events-none" />
        
        <div className="relative text-center mb-8">
          <motion.div 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center relative"
            animate={{ boxShadow: ["0 0 20px rgba(6,182,212,0.3)", "0 0 40px rgba(139,92,246,0.3)", "0 0 20px rgba(6,182,212,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Globe className="w-10 h-10 text-cyan-400" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </motion.div>
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Domain Manager
          </h1>
          <p className="text-gray-400 text-sm">Enter your secret key to manage domains</p>
        </div>

        <div className="relative space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type={showSecret ? "text" : "password"}
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter secret key..."
              className="relative w-full px-4 py-4 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none pr-12 transition-all"
              autoFocus
              data-testid="input-owner-domain-secret"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || secret.length < 4}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]"
            data-testid="button-owner-domain-auth"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Access Domain Manager
                </>
              )}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface Domain {
  id: string;
  name: string;
  tld: string;
  ownerAddress: string;
  registeredAt: string;
  expiresAt: string | null;
  ownershipType: string;
  isPremium: boolean;
  isProtected: boolean;
}

const SUPPORTED_TLDS = [
  { value: "tlid", label: ".tlid", color: "from-cyan-500 to-blue-500", icon: Zap },
  { value: "legacy", label: ".legacy", color: "from-purple-500 to-cyan-500", icon: Crown },
  { value: "chrono", label: ".chrono", color: "from-purple-500 to-pink-500", icon: Clock },
  { value: "pulse", label: ".pulse", color: "from-green-500 to-emerald-500", icon: Star },
];

const getTldStyle = (tld: string) => {
  const found = SUPPORTED_TLDS.find(t => t.value === tld);
  return found || SUPPORTED_TLDS[0];
};

function DomainCard({ domain, onDelete, onCopy, index }: { 
  domain: Domain; 
  onDelete: () => void; 
  onCopy: (text: string) => void;
  index: number;
}) {
  const tldStyle = getTldStyle(domain.tld);
  const TldIcon = tldStyle.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative"
      data-testid={`card-domain-${domain.id}`}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden group-hover:border-white/20 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div 
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tldStyle.color} p-0.5 flex-shrink-0`}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                <TldIcon className="w-7 h-7 text-white" />
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white truncate">
                  {domain.name}
                  <span className={`bg-gradient-to-r ${tldStyle.color} bg-clip-text text-transparent`}>.{domain.tld}</span>
                </h3>
                <motion.button 
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onCopy(`${domain.name}.${domain.tld}`)}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </motion.button>
              </div>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {domain.isPremium && (
                  <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 border-purple-500/30 gap-1">
                    <Crown className="w-3 h-3" /> Premium
                  </Badge>
                )}
                {domain.isProtected && (
                  <Badge className="bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30 gap-1">
                    <Shield className="w-3 h-3" /> Protected
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 gap-1">
                  <Check className="w-3 h-3" /> {domain.ownershipType === "lifetime" ? "Lifetime" : "Active"}
                </Badge>
              </div>
              
              <p className="text-gray-500 text-sm mt-2 font-mono">
                {domain.ownerAddress === "OWNER_MANAGED" ? "Owner Managed" : `${domain.ownerAddress.slice(0, 10)}...${domain.ownerAddress.slice(-6)}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link href={`/domain-manager/${domain.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:text-white hover:border-cyan-400/50 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Configure
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 hover:border-red-400/50 hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm font-medium justify-center"
              data-testid={`button-delete-domain-${domain.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DomainManager() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: "", tld: "dwsc" });
  const [adding, setAdding] = useState(false);

  const ownerToken = sessionStorage.getItem("ownerToken");

  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/owner/domains"],
    queryFn: async () => {
      const res = await fetch("/api/owner/domains", {
        headers: { "x-owner-token": sessionStorage.getItem("ownerToken") || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch domains");
      return res.json();
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: { name: string; tld: string }) => {
      const res = await fetch("/api/owner/domains", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-owner-token": sessionStorage.getItem("ownerToken") || "",
        },
        body: JSON.stringify(domain),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/domains"] });
      setShowAddDialog(false);
      setNewDomain({ name: "", tld: "dwsc" });
      toast.success("Domain added successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/domains/${id}`, {
        method: "DELETE",
        headers: { "x-owner-token": sessionStorage.getItem("ownerToken") || "" },
      });
      if (!res.ok) throw new Error("Failed to delete domain");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/domains"] });
      toast.success("Domain removed");
    },
  });

  const handleAddDomain = async () => {
    if (!newDomain.name.trim()) return;
    setAdding(true);
    try {
      await addDomainMutation.mutateAsync(newDomain);
    } finally {
      setAdding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const selectedTld = getTldStyle(newDomain.tld);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={500} top="-10%" left="-5%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={400} top="60%" left="75%" delay={2} />
      <GlowOrb color="linear-gradient(135deg, #22c55e, #06b6d4)" size={300} top="80%" left="20%" delay={4} />
      {[...Array(12)].map((_, i) => <FloatingParticle key={i} delay={i * 0.3} />)}

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-4">
            <Link href="/owner-admin">
              <motion.button
                whileHover={{ scale: 1.1, x: -3 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Domain Manager
              </h1>
              <p className="text-gray-400 mt-1">Manage your owned domains directly - no wallet required</p>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddDialog(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25"
            data-testid="button-add-domain"
          >
            <Plus className="w-5 h-5" />
            Add Domain
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-400"
            />
            <p className="text-gray-400 mt-4">Loading domains...</p>
          </div>
        ) : domains.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-16 text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Globe className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">No Domains Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Add your first domain to start managing your web3 identity. No wallet connection needed.
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddDialog(true)}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Domain
                <Sparkles className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {domains.map((domain, index) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                index={index}
                onDelete={() => deleteDomainMutation.mutate(domain.id)}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {SUPPORTED_TLDS.map((tld, i) => {
            const Icon = tld.icon;
            return (
              <motion.div
                key={tld.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group cursor-pointer"
                onClick={() => { setNewDomain(prev => ({ ...prev, tld: tld.value })); setShowAddDialog(true); }}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${tld.color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity`} />
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center group-hover:border-white/20 transition-all">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-r ${tld.color} p-0.5`}>
                    <div className="w-full h-full rounded-[6px] bg-slate-900 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold bg-gradient-to-r ${tld.color} bg-clip-text text-transparent`}>{tld.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur pointer-events-none" />
          <DialogHeader className="relative">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <Globe className="w-6 h-6 text-cyan-400" />
              Add Domain
            </DialogTitle>
            <DialogDescription className="text-gray-400">Add a domain you already own to manage it here.</DialogDescription>
          </DialogHeader>
          <div className="relative space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-white font-medium">Domain Name</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Input
                    value={newDomain.name}
                    onChange={(e) => setNewDomain(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="mydomain"
                    className="relative bg-slate-800/80 border-white/10 text-white text-lg h-12 focus:border-cyan-500/50"
                    data-testid="input-new-domain-name"
                  />
                </div>
                <Select value={newDomain.tld} onValueChange={(v) => setNewDomain(prev => ({ ...prev, tld: v }))}>
                  <SelectTrigger className={`w-32 h-12 bg-gradient-to-r ${selectedTld.color} text-white border-0 font-bold`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {SUPPORTED_TLDS.map(tld => (
                      <SelectItem key={tld.value} value={tld.value} className="text-white hover:bg-white/5 focus:bg-white/10">
                        <span className={`font-bold bg-gradient-to-r ${tld.color} bg-clip-text text-transparent`}>{tld.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newDomain.name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-400"
                >
                  Preview: <span className="text-white font-mono">{newDomain.name}</span>
                  <span className={`bg-gradient-to-r ${selectedTld.color} bg-clip-text text-transparent font-bold`}>.{newDomain.tld}</span>
                </motion.p>
              )}
            </div>
          </div>
          <DialogFooter className="relative gap-2">
            <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-gray-400 hover:text-white">
              Cancel
            </Button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddDomain}
              disabled={!newDomain.name.trim() || adding}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg text-white font-bold disabled:opacity-50 flex items-center gap-2"
              data-testid="button-confirm-add-domain"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Domain
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OwnerDomains() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (auth === "true") {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return <SecretEntry onSuccess={() => setAuthenticated(true)} />;
  }

  return <DomainManager />;
}
