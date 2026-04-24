import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePreferences } from "@/lib/store";

interface FavoriteButtonProps {
  appId: string;
  className?: string;
}

export function FavoriteButton({ appId, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = usePreferences();
  const favorited = isFavorite(appId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(appId);
      }}
      className={`p-2 rounded-lg transition-colors ${
        favorited ? "bg-red-500/20 text-red-400" : "bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
      } ${className}`}
      data-testid={`button-favorite-${appId}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={favorited ? "filled" : "empty"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
