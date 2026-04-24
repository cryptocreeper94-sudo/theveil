import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Search, Globe, Plus, Edit2, Trash2, Save,
  Eye, EyeOff, Code, Image, FileText, Check, X, RefreshCw,
  ChevronDown, ChevronRight, ExternalLink
} from "lucide-react";
import { BackButton } from "@/components/page-nav";

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

interface SeoConfig {
  id: string;
  host: string;
  route: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  structuredData: string | null;
  customTags: string | null;
  isActive: boolean;
}

export default function OwnerSeoManager() {
  const [selectedHost, setSelectedHost] = useState<"dwsc.io" | "yourlegacy.io">("dwsc.io");
  const [editingConfig, setEditingConfig] = useState<SeoConfig | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

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

  const { data: seoConfigs, isLoading, refetch } = useQuery({
    queryKey: ["/api/owner/seo", selectedHost],
    queryFn: async () => {
      const res = await fetch(`/api/owner/seo?host=${selectedHost}`, { 
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (config: Partial<SeoConfig>) => {
      const res = await fetch("/api/owner/seo", {
        method: config.id ? "PUT" : "POST",
        headers: getOwnerHeaders(),
        credentials: "include",
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/seo"] });
      setEditingConfig(null);
      setShowNewForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/seo/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/seo"] });
    },
  });

  const hosts = [
    { id: "dwsc.io", label: "DWSC.io" },
    { id: "yourlegacy.io", label: "YourLegacy.io" },
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const SeoConfigCard = ({ config }: { config: SeoConfig }) => {
    const isExpanded = expandedSections[config.id];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 0 30px rgba(0,200,255,0.05)" }}
      >
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30"
          onClick={() => toggleSection(config.id)}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{config.route}</span>
                {!config.isActive && (
                  <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">Inactive</span>
                )}
              </div>
              <span className="text-sm text-gray-400">{config.title || "No title set"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); setEditingConfig(config); }}
              className="p-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-cyan-500/50"
              data-testid={`button-edit-${config.id}`}
            >
              <Edit2 className="w-4 h-4 text-cyan-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(config.id); }}
              className="p-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-red-500/50"
              data-testid={`button-delete-${config.id}`}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Basic SEO</h4>
                  <div className="space-y-2">
                    <div><span className="text-gray-400">Title:</span> <span className="text-white">{config.title || "—"}</span></div>
                    <div><span className="text-gray-400">Description:</span> <span className="text-white">{config.description || "—"}</span></div>
                    <div><span className="text-gray-400">Keywords:</span> <span className="text-white">{config.keywords || "—"}</span></div>
                    <div><span className="text-gray-400">Robots:</span> <span className="text-white">{config.robots || "—"}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Open Graph</h4>
                  <div className="space-y-2">
                    <div><span className="text-gray-400">OG Title:</span> <span className="text-white">{config.ogTitle || "—"}</span></div>
                    <div><span className="text-gray-400">OG Description:</span> <span className="text-white">{config.ogDescription || "—"}</span></div>
                    <div><span className="text-gray-400">OG Image:</span> <span className="text-white truncate">{config.ogImage || "—"}</span></div>
                    <div><span className="text-gray-400">OG Type:</span> <span className="text-white">{config.ogType || "—"}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Twitter Card</h4>
                  <div className="space-y-2">
                    <div><span className="text-gray-400">Card Type:</span> <span className="text-white">{config.twitterCard || "—"}</span></div>
                    <div><span className="text-gray-400">Title:</span> <span className="text-white">{config.twitterTitle || "—"}</span></div>
                    <div><span className="text-gray-400">Description:</span> <span className="text-white">{config.twitterDescription || "—"}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Advanced</h4>
                  <div className="space-y-2">
                    <div><span className="text-gray-400">Canonical:</span> <span className="text-white">{config.canonicalUrl || "—"}</span></div>
                    <div><span className="text-gray-400">Structured Data:</span> <span className="text-white">{config.structuredData ? "✓ Set" : "—"}</span></div>
                    <div><span className="text-gray-400">Custom Tags:</span> <span className="text-white">{config.customTags ? "✓ Set" : "—"}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const SeoEditForm = ({ config, onClose }: { config: SeoConfig | null; onClose: () => void }) => {
    const [form, setForm] = useState<Partial<SeoConfig>>(config || {
      host: selectedHost,
      route: "/",
      title: "",
      description: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogType: "website",
      twitterCard: "summary_large_image",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
      canonicalUrl: "",
      robots: "index, follow",
      structuredData: "",
      customTags: "",
      isActive: true,
    });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ boxShadow: "0 0 60px rgba(0,200,255,0.1)" }}
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">{config ? "Edit SEO Config" : "New SEO Config"}</h2>
            <p className="text-gray-400 text-sm">Configure meta tags for {selectedHost}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Route</label>
                <input
                  type="text"
                  value={form.route || ""}
                  onChange={(e) => setForm({ ...form, route: e.target.value })}
                  placeholder="/presale"
                  className="w-full mt-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  data-testid="input-route"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Robots</label>
                <select
                  value={form.robots || "index, follow"}
                  onChange={(e) => setForm({ ...form, robots: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  data-testid="select-robots"
                >
                  <option value="index, follow">index, follow</option>
                  <option value="noindex, follow">noindex, follow</option>
                  <option value="index, nofollow">index, nofollow</option>
                  <option value="noindex, nofollow">noindex, nofollow</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Page Title</label>
              <input
                type="text"
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Trust Layer - High Performance Blockchain"
                className="w-full mt-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                data-testid="input-title"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Meta Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Experience the future of blockchain with 200K+ TPS..."
                rows={3}
                className="w-full mt-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                data-testid="input-description"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Keywords</label>
              <input
                type="text"
                value={form.keywords || ""}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="blockchain, crypto, DeFi, NFT, DarkWave"
                className="w-full mt-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                data-testid="input-keywords"
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Open Graph (Facebook, LinkedIn)</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.ogTitle || ""}
                  onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                  placeholder="OG Title (uses page title if empty)"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  data-testid="input-og-title"
                />
                <textarea
                  value={form.ogDescription || ""}
                  onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                  placeholder="OG Description"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                  data-testid="input-og-description"
                />
                <input
                  type="text"
                  value={form.ogImage || ""}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="OG Image URL"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  data-testid="input-og-image"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Twitter Card</h3>
              <div className="space-y-4">
                <select
                  value={form.twitterCard || "summary_large_image"}
                  onChange={(e) => setForm({ ...form, twitterCard: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  data-testid="select-twitter-card"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="player">Player</option>
                </select>
                <input
                  type="text"
                  value={form.twitterTitle || ""}
                  onChange={(e) => setForm({ ...form, twitterTitle: e.target.value })}
                  placeholder="Twitter Title"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  data-testid="input-twitter-title"
                />
                <textarea
                  value={form.twitterDescription || ""}
                  onChange={(e) => setForm({ ...form, twitterDescription: e.target.value })}
                  placeholder="Twitter Description"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                  data-testid="input-twitter-description"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Advanced</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.canonicalUrl || ""}
                  onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                  placeholder="Canonical URL (leave empty for auto)"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  data-testid="input-canonical"
                />
                <textarea
                  value={form.structuredData || ""}
                  onChange={(e) => setForm({ ...form, structuredData: e.target.value })}
                  placeholder='JSON-LD Structured Data (e.g., {"@type": "Organization"...})'
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none font-mono text-sm"
                  data-testid="input-structured-data"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive !== false}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                data-testid="checkbox-active"
              />
              <label htmlFor="isActive" className="text-gray-300">Active (apply these SEO settings)</label>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800/50 border border-white/10 rounded-xl text-gray-300 hover:text-white"
              data-testid="button-cancel"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium flex items-center justify-center gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : "Save Config"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #8b5cf6, #ec4899)" size={600} top="-10%" left="-10%" />
      <GlowOrb color="linear-gradient(135deg, #06b6d4, #8b5cf6)" size={500} top="50%" left="70%" delay={2} />


      <AnimatePresence>
        {(editingConfig || showNewForm) && (
          <SeoEditForm 
            config={editingConfig} 
            onClose={() => { setEditingConfig(null); setShowNewForm(false); }} 
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  SEO Manager
                </span>
              </h1>
              <p className="text-gray-400">Configure meta tags for maximum visibility</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-white/10">
              {hosts.map((host) => (
                <button
                  key={host.id}
                  onClick={() => setSelectedHost(host.id as any)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedHost === host.id ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`button-seo-host-${host.id}`}
                >
                  {host.label}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="p-2 bg-slate-800/50 rounded-lg border border-white/10 hover:border-purple-500/50"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center gap-2"
              data-testid="button-new-config"
            >
              <Plus className="w-4 h-4" />
              New Config
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
          style={{ boxShadow: "0 0 40px rgba(168,85,247,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Search className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">SEO Configuration for {selectedHost}</h3>
              <p className="text-sm text-gray-400">{(seoConfigs || []).length} route(s) configured</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-800/30 rounded-xl">
              <p className="text-2xl font-bold text-white">{(seoConfigs || []).filter((c: SeoConfig) => c.isActive).length}</p>
              <p className="text-xs text-gray-400">Active</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl">
              <p className="text-2xl font-bold text-white">{(seoConfigs || []).filter((c: SeoConfig) => c.ogImage).length}</p>
              <p className="text-xs text-gray-400">With OG Image</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl">
              <p className="text-2xl font-bold text-white">{(seoConfigs || []).filter((c: SeoConfig) => c.structuredData).length}</p>
              <p className="text-xs text-gray-400">With Schema</p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-xl">
              <p className="text-2xl font-bold text-white">{(seoConfigs || []).filter((c: SeoConfig) => !c.isActive).length}</p>
              <p className="text-xs text-gray-400">Inactive</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading configurations...</div>
          ) : (seoConfigs || []).length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No SEO configurations for {selectedHost}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium"
                data-testid="button-create-first"
              >
                Create First Config
              </motion.button>
            </div>
          ) : (
            (seoConfigs || []).map((config: SeoConfig) => (
              <SeoConfigCard key={config.id} config={config} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
