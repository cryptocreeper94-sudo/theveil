import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Coins, TrendingUp, Image, Users, Rocket, Shield, Gift, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShareAchievement } from "@/components/social-share";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: "trading" | "staking" | "nft" | "social" | "explorer";
  requirement: number;
  progress: number;
  reward: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_swap", title: "First Trade", description: "Complete your first token swap", icon: TrendingUp, category: "trading", requirement: 1, progress: 1, reward: "10 SIG", unlocked: true, rarity: "common" },
  { id: "swap_10", title: "Trader", description: "Complete 10 token swaps", icon: TrendingUp, category: "trading", requirement: 10, progress: 7, reward: "50 SIG", unlocked: false, rarity: "common" },
  { id: "swap_100", title: "Active Trader", description: "Complete 100 token swaps", icon: TrendingUp, category: "trading", requirement: 100, progress: 7, reward: "500 SIG", unlocked: false, rarity: "rare" },
  { id: "swap_1000", title: "Trading Legend", description: "Complete 1,000 token swaps", icon: Zap, category: "trading", requirement: 1000, progress: 7, reward: "5,000 SIG", unlocked: false, rarity: "legendary" },
  { id: "first_stake", title: "Staker", description: "Stake your first SIG", icon: Coins, category: "staking", requirement: 1, progress: 1, reward: "25 SIG", unlocked: true, rarity: "common" },
  { id: "stake_1000", title: "Committed", description: "Stake 1,000+ SIG", icon: Coins, category: "staking", requirement: 1000, progress: 500, reward: "100 SIG", unlocked: false, rarity: "common" },
  { id: "stake_10000", title: "Whale Staker", description: "Stake 10,000+ SIG", icon: Coins, category: "staking", requirement: 10000, progress: 500, reward: "1,000 SIG", unlocked: false, rarity: "epic" },
  { id: "stake_30days", title: "Diamond Hands", description: "Stake for 30+ days", icon: Shield, category: "staking", requirement: 30, progress: 12, reward: "500 SIG", unlocked: false, rarity: "rare" },
  { id: "first_nft", title: "Collector", description: "Own your first NFT", icon: Image, category: "nft", requirement: 1, progress: 0, reward: "50 SIG", unlocked: false, rarity: "common" },
  { id: "nft_10", title: "Art Enthusiast", description: "Own 10 NFTs", icon: Image, category: "nft", requirement: 10, progress: 0, reward: "200 SIG", unlocked: false, rarity: "rare" },
  { id: "mint_nft", title: "Creator", description: "Mint your own NFT", icon: Star, category: "nft", requirement: 1, progress: 0, reward: "100 SIG", unlocked: false, rarity: "rare" },
  { id: "referral_1", title: "Networker", description: "Refer 1 friend", icon: Users, category: "social", requirement: 1, progress: 0, reward: "100 SIG", unlocked: false, rarity: "common" },
  { id: "referral_10", title: "Influencer", description: "Refer 10 friends", icon: Users, category: "social", requirement: 10, progress: 0, reward: "1,000 SIG", unlocked: false, rarity: "epic" },
  { id: "early_adopter", title: "Early Adopter", description: "Join before mainnet launch", icon: Rocket, category: "explorer", requirement: 1, progress: 1, reward: "Legacy NFT", unlocked: true, rarity: "legendary" },
  { id: "explorer", title: "Explorer", description: "Visit all major pages", icon: Gift, category: "explorer", requirement: 10, progress: 6, reward: "25 SIG", unlocked: false, rarity: "common" },
];

const RARITY_COLORS = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-purple-400 to-cyan-500",
};

const RARITY_GLOW = {
  common: "shadow-gray-500/20",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-purple-500/50",
};

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;
  const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 rounded-xl border transition-all ${
        achievement.unlocked
          ? `border-white/20 bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} bg-opacity-10 shadow-lg ${RARITY_GLOW[achievement.rarity]}`
          : "border-white/5 bg-black/20 opacity-60"
      }`}
      data-testid={`achievement-${achievement.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          achievement.unlocked ? `bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}` : "bg-white/10"
        }`}>
          {achievement.unlocked ? (
            <Icon className="w-6 h-6 text-white" />
          ) : (
            <Lock className="w-5 h-5 text-white/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{achievement.title}</h3>
            {achievement.unlocked && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]} text-white`}>
              {achievement.rarity}
            </span>
            <span className="text-[10px] text-primary">{achievement.reward}</span>
          </div>
          {!achievement.unlocked && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {achievement.progress} / {achievement.requirement}
              </p>
            </div>
          )}
        </div>
        {achievement.unlocked && (
          <ShareAchievement title={achievement.title} description={achievement.description} />
        )}
      </div>
    </motion.div>
  );
}

export function AchievementsPanel() {
  const [filter, setFilter] = useState<string>("all");
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  const filtered = filter === "all" 
    ? ACHIEVEMENTS 
    : filter === "unlocked" 
    ? ACHIEVEMENTS.filter(a => a.unlocked)
    : ACHIEVEMENTS.filter(a => a.category === filter);

  return (
    <div className="space-y-4" data-testid="achievements-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-bold">Achievements</h2>
          <span className="text-xs text-muted-foreground">
            {unlockedCount}/{ACHIEVEMENTS.length} Unlocked
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "unlocked", "trading", "staking", "nft", "social"].map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
            className="text-xs capitalize"
            data-testid={`filter-${cat}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

export function AchievementToast({ achievement }: { achievement: Achievement }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed bottom-24 right-4 w-80 p-4 rounded-xl border border-white/20 bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} shadow-2xl z-50`}
      data-testid="achievement-toast"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-xs text-white/80">Achievement Unlocked!</p>
          <h3 className="font-bold text-white">{achievement.title}</h3>
          <p className="text-xs text-white/70">+{achievement.reward}</p>
        </div>
      </div>
    </motion.div>
  );
}
