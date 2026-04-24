import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, Plus, Edit2, ToggleLeft, ToggleRight, 
  Shell, Trophy, Users, Clock, CheckCircle, XCircle, AlertCircle,
  Lightbulb, ChevronDown, ChevronUp, Sparkles, RefreshCw, Download
} from "lucide-react";

const QUEST_SUGGESTIONS = [
  { category: "Daily Engagement", quests: [
    { name: "Daily Check-in", shells: 100, desc: "Visit the platform daily", maxPerUser: 90 },
    { name: "Like & Repost Daily Post", shells: 50, desc: "Engage with daily X post", maxPerUser: 90 },
    { name: "Comment on Announcement", shells: 75, desc: "Leave thoughtful comment", maxPerUser: 90 },
  ]},
  { category: "Social Growth", quests: [
    { name: "Follow on X", shells: 500, desc: "One-time follow", maxPerUser: 1 },
    { name: "Join Discord", shells: 500, desc: "One-time join", maxPerUser: 1 },
    { name: "Join Telegram", shells: 500, desc: "One-time join", maxPerUser: 1 },
    { name: "Refer a Friend", shells: 2500, desc: "Verified referral signup", maxPerUser: null },
  ]},
  { category: "Content Creation", quests: [
    { name: "Create Thread about DWSC", shells: 5000, desc: "Original content", maxPerUser: 10 },
    { name: "Make a Meme", shells: 2000, desc: "Creative content", maxPerUser: 10 },
    { name: "Record Video Review", shells: 10000, desc: "YouTube/TikTok", maxPerUser: 5 },
    { name: "Write Blog Post", shells: 7500, desc: "Medium/Substack", maxPerUser: 5 },
  ]},
  { category: "Community Building", quests: [
    { name: "Attend X Space", shells: 1500, desc: "Stay for 15+ mins", maxPerUser: 12 },
    { name: "Ask Question in AMA", shells: 500, desc: "Participate actively", maxPerUser: 12 },
    { name: "Help New Member", shells: 250, desc: "Answer questions", maxPerUser: null },
    { name: "Report Bug/Issue", shells: 1000, desc: "Valid bug report", maxPerUser: 10 },
  ]},
  { category: "Weekly Sprints", quests: [
    { name: "Complete Weekly Sprint", shells: 5000, desc: "All week's tasks done", maxPerUser: 12 },
    { name: "Top 10 Weekly Leaderboard", shells: 10000, desc: "Weekly bonus", maxPerUser: 12 },
    { name: "Perfect Week (7/7 days)", shells: 3000, desc: "Daily streak bonus", maxPerUser: 12 },
  ]},
  { category: "Milestones", quests: [
    { name: "30-Day Completion", shells: 25000, desc: "Month 1 complete", maxPerUser: 1 },
    { name: "60-Day Completion", shells: 25000, desc: "Month 2 complete", maxPerUser: 1 },
    { name: "90-Day Completion", shells: 50000, desc: "Full campaign bonus", maxPerUser: 1 },
    { name: "Founders Circle Qualification", shells: 100000, desc: "Top contributor bonus", maxPerUser: 1 },
  ]},
];

interface QuestMapping {
  id: string;
  zealyQuestId: string;
  zealyQuestName: string;
  shellsReward: number;
  dwcReward: string;
  reputationReward: number;
  maxRewardsPerUser: number | null;
  totalRewardsCap: number | null;
  currentRewards: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuestEvent {
  id: string;
  zealyUserId: string;
  zealyQuestId: string;
  zealyRequestId: string;
  userId: string | null;
  email: string | null;
  twitterHandle: string | null;
  status: string;
  shellsGranted: number;
  errorMessage: string | null;
  createdAt: string;
}

const GlowOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) => (
  <motion.div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{ background: color, width: size, height: size, top, left }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, delay }}
  />
);

function getOwnerHeaders() {
  return {
    "Content-Type": "application/json",
    "x-owner-token": sessionStorage.getItem("ownerToken") || "",
  };
}

export default function ZealyAdmin() {
  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (!auth) window.location.href = "/owner-admin";
  }, []);

  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    zealyQuestId: "",
    zealyQuestName: "",
    shellsReward: 0,
    maxRewardsPerUser: "",
    totalRewardsCap: "",
  });

  const importSuggestion = (quest: { name: string; shells: number; maxPerUser: number | null }) => {
    const questId = quest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setFormData({
      zealyQuestId: questId,
      zealyQuestName: quest.name,
      shellsReward: quest.shells,
      maxRewardsPerUser: quest.maxPerUser?.toString() || "",
      totalRewardsCap: "",
    });
    setShowAddForm(true);
    setShowSuggestions(false);
  };

  const { data: mappings = [], isLoading: mappingsLoading } = useQuery<QuestMapping[]>({
    queryKey: ["/api/owner/zealy/mappings"],
    queryFn: async () => {
      const res = await fetch("/api/owner/zealy/mappings", { headers: getOwnerHeaders() });
      if (!res.ok) throw new Error("Failed to fetch mappings");
      return res.json();
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<QuestEvent[]>({
    queryKey: ["/api/owner/zealy/events"],
    queryFn: async () => {
      const res = await fetch("/api/owner/zealy/events?limit=20", { headers: getOwnerHeaders() });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/owner/zealy/mappings", {
        method: "POST",
        headers: getOwnerHeaders(),
        body: JSON.stringify({
          ...data,
          maxRewardsPerUser: data.maxRewardsPerUser ? parseInt(data.maxRewardsPerUser) : null,
          totalRewardsCap: data.totalRewardsCap ? parseInt(data.totalRewardsCap) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create mapping");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/zealy/mappings"] });
      setShowAddForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuestMapping> }) => {
      const res = await fetch(`/api/owner/zealy/mappings/${id}`, {
        method: "PUT",
        headers: getOwnerHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update mapping");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/zealy/mappings"] });
      setEditingId(null);
    },
  });

  const toggleActive = (mapping: QuestMapping) => {
    updateMutation.mutate({ id: mapping.id, data: { isActive: !mapping.isActive } });
  };

  // Zealy API Sync - Pull completed quests and award shells
  const [syncResult, setSyncResult] = useState<{ processed: number; awarded: number; pending: number; message?: string } | null>(null);
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/owner/zealy/sync", {
        method: "POST",
        headers: getOwnerHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sync");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/owner/zealy/events"] });
    },
  });

  const resetForm = () => {
    setFormData({
      zealyQuestId: "",
      zealyQuestName: "",
      shellsReward: 0,
      maxRewardsPerUser: "",
      totalRewardsCap: "",
    });
  };

  const statusColors: Record<string, string> = {
    processed: "text-green-400",
    rejected: "text-teal-400",
    failed: "text-red-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    processed: <CheckCircle className="w-4 h-4 text-green-400" />,
    rejected: <AlertCircle className="w-4 h-4 text-teal-400" />,
    failed: <XCircle className="w-4 h-4 text-red-400" />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <GlowOrb color="linear-gradient(135deg, #8b5cf6, #06b6d4)" size={500} top="-5%" left="60%" />
      <GlowOrb color="linear-gradient(135deg, #ec4899, #8b5cf6)" size={400} top="70%" left="10%" delay={2} />


      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/owner-admin">
            <motion.button
              whileHover={{ x: -4 }}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              data-testid="button-back-owner-admin"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Owner Portal
            </motion.button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Zealy Quest Manager
                </span>
              </h1>
              <p className="text-gray-400">Configure Shell rewards for community quests</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold"
              data-testid="button-add-quest-mapping"
            >
              <Plus className="w-5 h-5" />
              Add Quest Mapping
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-teal-500/30 rounded-xl text-teal-400 font-semibold"
              data-testid="button-toggle-suggestions"
            >
              <Lightbulb className="w-5 h-5" />
              Quest Suggestions
              {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </motion.button>
          </div>
        </motion.div>

        {/* ZEALY API SYNC SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Zealy API Sync
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Pull completed quests from Zealy and award Shells to matched users
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl text-white font-bold disabled:opacity-50 shadow-lg shadow-green-500/20"
              data-testid="button-sync-zealy"
            >
              <RefreshCw className={`w-5 h-5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync from Zealy'}
            </motion.button>
          </div>

          {syncMutation.isError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              Error: {(syncMutation.error as Error).message}
            </div>
          )}

          {syncResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              {syncResult.message && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
                  {syncResult.message}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">{syncResult.processed || 0}</div>
                  <div className="text-sm text-gray-400">Quests Processed</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{syncResult.awarded || 0}</div>
                  <div className="text-sm text-gray-400">Shells Awarded</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-teal-400">{syncResult.pending || 0}</div>
                  <div className="text-sm text-gray-400">Pending Match</div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-teal-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Quest Templates</h3>
                    <p className="text-sm text-gray-400">Click any quest to import it - you can customize before saving</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {QUEST_SUGGESTIONS.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
                        {category.category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {category.quests.map((quest) => (
                          <motion.button
                            key={quest.name}
                            whileHover={{ scale: 1.02, borderColor: "rgba(168, 85, 247, 0.5)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => importSuggestion(quest)}
                            className="text-left p-3 bg-slate-800/50 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors"
                            data-testid={`button-import-${quest.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-white text-sm">{quest.name}</span>
                              <span className="text-cyan-400 text-xs font-bold">{quest.shells.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-500">{quest.desc}</p>
                            {quest.maxPerUser && (
                              <p className="text-xs text-gray-600 mt-1">Max {quest.maxPerUser}x per user</p>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-cyan-500/20">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-2">90-Day Campaign Math</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">~11K</div>
                      <div className="text-xs text-gray-400">Daily Shells (top tier)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">1M+</div>
                      <div className="text-xs text-gray-400">90-day potential</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">$1,000</div>
                      <div className="text-xs text-gray-400">Top tier value</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">2x</div>
                      <div className="text-xs text-gray-400">Founders multiplier</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">New Quest Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Zealy Quest ID</label>
                    <input
                      type="text"
                      value={formData.zealyQuestId}
                      onChange={(e) => setFormData({ ...formData, zealyQuestId: e.target.value })}
                      placeholder="e.g., abc123"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      data-testid="input-zealy-quest-id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Quest Name</label>
                    <input
                      type="text"
                      value={formData.zealyQuestName}
                      onChange={(e) => setFormData({ ...formData, zealyQuestName: e.target.value })}
                      placeholder="e.g., Join Discord Server"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      data-testid="input-zealy-quest-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Shell Reward</label>
                    <input
                      type="number"
                      value={formData.shellsReward}
                      onChange={(e) => setFormData({ ...formData, shellsReward: parseInt(e.target.value) || 0 })}
                      placeholder="50"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      data-testid="input-shells-reward"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Per User (optional)</label>
                    <input
                      type="number"
                      value={formData.maxRewardsPerUser}
                      onChange={(e) => setFormData({ ...formData, maxRewardsPerUser: e.target.value })}
                      placeholder="1"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      data-testid="input-max-per-user"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Total Cap (optional)</label>
                    <input
                      type="number"
                      value={formData.totalRewardsCap}
                      onChange={(e) => setFormData({ ...formData, totalRewardsCap: e.target.value })}
                      placeholder="1000"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      data-testid="input-total-cap"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createMutation.mutate(formData)}
                    disabled={createMutation.isPending || !formData.zealyQuestId || !formData.zealyQuestName}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold disabled:opacity-50"
                    data-testid="button-save-mapping"
                  >
                    {createMutation.isPending ? "Saving..." : "Save Mapping"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowAddForm(false); resetForm(); }}
                    className="px-6 py-2 bg-slate-800 border border-white/10 rounded-xl text-gray-300"
                    data-testid="button-cancel-add"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(139,92,246,0.1)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Quest Mappings</h3>
            </div>

            {mappingsLoading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : mappings.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No quest mappings yet</p>
                <p className="text-sm mt-2">Add your first mapping to start rewarding community quests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mappings.map((mapping) => (
                  <motion.div
                    key={mapping.id}
                    layout
                    className={`bg-slate-800/50 border rounded-xl p-4 ${
                      mapping.isActive ? "border-purple-500/30" : "border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{mapping.zealyQuestName}</h4>
                          {!mapping.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">ID: {mapping.zealyQuestId}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Shell className="w-4 h-4" />
                            {mapping.shellsReward} Shells
                          </span>
                          {mapping.maxRewardsPerUser && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Users className="w-4 h-4" />
                              {mapping.maxRewardsPerUser}/user
                            </span>
                          )}
                          {mapping.totalRewardsCap && (
                            <span className="text-gray-400">
                              {mapping.currentRewards}/{mapping.totalRewardsCap} claimed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleActive(mapping)}
                          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                          data-testid={`button-toggle-${mapping.id}`}
                        >
                          {mapping.isActive ? (
                            <ToggleRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-500" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(6,182,212,0.1)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            </div>

            {eventsLoading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : events.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No quest activity yet</p>
                <p className="text-sm mt-2">Events will appear here when users complete quests</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-800/30 border border-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {statusIcons[event.status] || <AlertCircle className="w-4 h-4 text-gray-400" />}
                        <span className={`text-sm font-medium ${statusColors[event.status] || "text-gray-400"}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      {event.email || event.twitterHandle || `Zealy User: ${event.zealyUserId.slice(0, 8)}...`}
                    </div>
                    {event.shellsGranted > 0 && (
                      <div className="text-xs text-cyan-400 mt-1">
                        +{event.shellsGranted} Shells awarded
                      </div>
                    )}
                    {event.errorMessage && (
                      <div className="text-xs text-red-400 mt-1">
                        {event.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3">Quick Setup Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="bg-slate-800/30 rounded-xl p-4">
              <div className="text-purple-400 font-semibold mb-2">1. Create Quest in Zealy</div>
              <p>Set up your community quest in Zealy's dashboard with tasks like joining Discord, following Twitter, etc.</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4">
              <div className="text-pink-400 font-semibold mb-2">2. Add Mapping Here</div>
              <p>Copy the Quest ID from Zealy and create a mapping above with your desired Shell reward amount.</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4">
              <div className="text-cyan-400 font-semibold mb-2">3. Users Complete & Earn</div>
              <p>When users complete quests on Zealy, they automatically receive Shells if their email matches.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
