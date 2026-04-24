import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  ArrowLeft, Copy, Check, Download, Image, MessageSquare, 
  Sparkles, Clock, Lock, Edit3, Plus, Trash2, Save, X,
  Megaphone, Zap, Shield, Crown, Star, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MessageItem {
  id: string;
  category: string;
  title: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
}

const CORE_SIGNAL_MESSAGES: MessageItem[] = [
  {
    id: "core-1",
    category: "Philosophy",
    title: "The Core Transforms",
    content: "Chaos in. Clarity out. The Signal cuts through the noise.\n\nTrust Layer - YOUR blockchain. YOUR voice. YOUR signal.",
    hashtags: ["#DarkWave", "#Signal", "#TrustLayer", "#Web3"],
  },
  {
    id: "core-2",
    category: "Philosophy",
    title: "From Silence, Signal",
    content: "We built in silence. Not to hide - to focus.\n\nThe Core is ready. The Signal transmits.\n\nNo hype. No empty promises. Just trust, verified on-chain.",
    hashtags: ["#DWTL", "#Signal", "#Blockchain", "#Trust"],
  },
  {
    id: "core-3",
    category: "Philosophy",
    title: "Inspired Core, Immutable Signal",
    content: "The Signal Core: 8 principles that can never be changed.\n\nNot because we said so - because the community deserves unchanging foundations.\n\nYour Trust Layer. Your rules. Forever.",
    hashtags: ["#SignalCore", "#DarkWave", "#Immutable", "#Community"],
  },
  {
    id: "core-4",
    category: "Community",
    title: "Your Signal, Not Ours",
    content: "This isn't our blockchain. It's YOURS.\n\nSignal (SIG) = your voice in governance\nSignal (SIG) = your stake in the future\nSignal (SIG) = your identity, verified\n\nClaim your signal.",
    hashtags: ["#Signal", "#SIG", "#YourBlockchain", "#DarkWave"],
  },
  {
    id: "core-5",
    category: "Trust",
    title: "Disrupting the Noise",
    content: "Crypto promised revolution. Delivered chaos.\n\nWe're not adding to the noise. We're cutting through it.\n\nTrust Layer - where trust is verified, not assumed.",
    hashtags: ["#DarkWave", "#TrustLayer", "#CryptoRevolution", "#Signal"],
  },
  {
    id: "core-6",
    category: "Technology",
    title: "Guardian Verified",
    content: "Every transaction. Every identity. Every promise.\n\nGuardian-verified execution means you don't have to trust us. The chain proves it.\n\nTransparency isn't a feature. It's the foundation.",
    hashtags: ["#Guardian", "#Verified", "#DarkWave", "#Blockchain"],
  },
  {
    id: "core-7",
    category: "Launch",
    title: "The Signal Awaits",
    content: "The Core is complete.\nThe Signal is ready.\nThe community awaits.\n\nJoin the Trust Layer before launch. Early supporters shape the future.",
    hashtags: ["#DarkWave", "#Signal", "#Launch", "#EarlyAdopter"],
  },
  {
    id: "core-8",
    category: "Governance",
    title: "Community Controlled Future",
    content: "Phase 1: Foundation (now)\nPhase 2: Community grows\nPhase 3: Governance activates\nPhase 4: Full autonomy\n\nWe're building this FOR you. Soon it will be YOURS entirely.",
    hashtags: ["#Governance", "#DAO", "#Community", "#DarkWave"],
  },
];

const WEEKLY_SPRINT_MESSAGES: MessageItem[] = [
  {
    id: "weekly-1",
    category: "Update",
    title: "Weekly Progress",
    content: "This week's milestones:\n\n✅ [Add milestone]\n✅ [Add milestone]\n🔄 In progress: [Add item]\n\nThe Signal grows stronger. Join us.",
    hashtags: ["#DarkWave", "#BuildInPublic", "#Progress"],
  },
  {
    id: "weekly-2",
    category: "Engagement",
    title: "Community Question",
    content: "Quick question for the community:\n\n[Add your question here]\n\nDrop your thoughts below. Every voice shapes the Signal.",
    hashtags: ["#DarkWave", "#Community", "#Signal"],
  },
  {
    id: "weekly-3",
    category: "Presale",
    title: "Presale Reminder",
    content: "Signal (SIG) presale is live.\n\nEarly supporters lock in the best rates.\nNo pressure. No FOMO. Just opportunity.\n\nLearn more at dwtl.io/presale",
    hashtags: ["#Signal", "#Presale", "#DarkWave", "#Crypto"],
  },
];

function CopyButton({ text, messageId }: { text: string; messageId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`p-2 rounded-lg transition-all ${
        copied 
          ? "bg-green-500/20 text-green-400" 
          : "bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-700/50"
      }`}
      data-testid={`button-copy-${messageId}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </motion.button>
  );
}

function MessageCard({ message, isCore = false }: { message: MessageItem; isCore?: boolean }) {
  const fullText = `${message.content}\n\n${message.hashtags.join(" ")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden"
      style={{ boxShadow: isCore ? "0 0 40px rgba(168,85,247,0.1)" : "0 0 30px rgba(0,200,255,0.05)" }}
      data-testid={`card-message-${message.id}`}
    >
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={isCore ? "border-purple-500/50 text-purple-400" : "border-cyan-500/50 text-cyan-400"}
            data-testid={`badge-category-${message.id}`}
          >
            {message.category}
          </Badge>
          {isCore && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30" data-testid={`badge-core-${message.id}`}>
              <Lock className="w-3 h-3 mr-1" /> Core
            </Badge>
          )}
        </div>
        <CopyButton text={fullText} messageId={message.id} />
      </div>

      <h3 className="font-bold text-white mb-2">{message.title}</h3>
      
      <div className="bg-slate-800/50 rounded-xl p-4 mb-3 border border-white/5">
        <p className="text-gray-300 text-sm whitespace-pre-line">{message.content}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {message.hashtags.map((tag) => (
          <span key={tag} className="text-xs text-cyan-400/70">{tag}</span>
        ))}
      </div>

      {message.imageUrl && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Image className="w-4 h-4" />
              <span>Attached Image</span>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              <Download className="w-3 h-3 mr-1" /> Download
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MessagingCatalog() {
  useEffect(() => {
    const auth = sessionStorage.getItem("ownerAuth");
    if (!auth) window.location.href = "/owner-admin";
  }, []);

  const [activeTab, setActiveTab] = useState("core");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const coreCategories = Array.from(new Set(CORE_SIGNAL_MESSAGES.map(m => m.category)));
  const weeklyCategories = Array.from(new Set(WEEKLY_SPRINT_MESSAGES.map(m => m.category)));

  const filteredCoreMessages = selectedCategory 
    ? CORE_SIGNAL_MESSAGES.filter(m => m.category === selectedCategory)
    : CORE_SIGNAL_MESSAGES;

  const filteredWeeklyMessages = selectedCategory
    ? WEEKLY_SPRINT_MESSAGES.filter(m => m.category === selectedCategory)
    : WEEKLY_SPRINT_MESSAGES;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", width: 500, height: 500, top: "-10%", left: "-10%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", width: 400, height: 400, top: "60%", left: "70%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/owner-admin">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white" data-testid="button-back-portal">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Messaging Catalog
                </span>
              </h1>
              <p className="text-gray-400">Pre-approved messaging for social media. Copy and post.</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">How to Use</h3>
              <p className="text-sm text-gray-400">
                Click the copy button on any message to copy the full text with hashtags. 
                <span className="text-purple-400"> Core Signal</span> messages are permanent brand messaging.
                <span className="text-cyan-400"> Weekly Sprint</span> messages are for current campaigns.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-white/10 p-1 rounded-xl mb-6 w-full md:w-auto">
            <TabsTrigger 
              value="core" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 rounded-lg px-6"
              data-testid="tab-core"
            >
              <Lock className="w-4 h-4 mr-2" />
              Core Signal
              <Badge className="ml-2 bg-purple-500/20 text-purple-400 text-xs">Permanent</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 rounded-lg px-6"
              data-testid="tab-weekly"
            >
              <Clock className="w-4 h-4 mr-2" />
              Weekly Sprint
              <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 text-xs">Rotating</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="core">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  size="sm"
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? "bg-purple-500" : ""}
                  data-testid="button-filter-core-all"
                >
                  All
                </Button>
                {coreCategories.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? "bg-purple-500" : ""}
                    data-testid={`button-filter-core-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoreMessages.map((msg) => (
                <MessageCard key={msg.id} message={msg} isCore />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  size="sm"
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? "bg-cyan-500" : ""}
                  data-testid="button-filter-weekly-all"
                >
                  All
                </Button>
                {weeklyCategories.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? "bg-cyan-500" : ""}
                    data-testid={`button-filter-weekly-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWeeklyMessages.map((msg) => (
                <MessageCard key={msg.id} message={msg} />
              ))}
            </div>

            {filteredWeeklyMessages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages in this category yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-slate-900/50 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Operational Hierarchy</h3>
              <p className="text-sm text-gray-400">Until community governance activates</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <span className="font-medium text-white">Founder (Vision Keeper)</span>
                <span className="text-gray-400 text-sm ml-2">• Full edit access • Final authority</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="font-medium text-white">Operations (Admin)</span>
                <span className="text-gray-400 text-sm ml-2">• Can use all messaging • Suggest edits</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-white/10 rounded-xl">
              <Star className="w-5 h-5 text-gray-500" />
              <div>
                <span className="font-medium text-gray-400">Community</span>
                <span className="text-gray-500 text-sm ml-2">• Governance activates at milestones</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
