import { Keyboard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useFavorites, FavoriteItem } from "./favorites-watchlist";

const KEYBOARD_SHORTCUTS = [
  { keys: ["G", "H"], description: "Go to Home" },
  { keys: ["G", "W"], description: "Go to Wallet" },
  { keys: ["G", "S"], description: "Go to Swap" },
  { keys: ["G", "T"], description: "Go to Coin" },
  { keys: ["G", "N"], description: "Go to NFT" },
  { keys: ["G", "E"], description: "Go to Explorer" },
  { keys: ["/"], description: "Focus Search" },
  { keys: ["?"], description: "Show Shortcuts" },
];

export function HeaderTools() {
  const { favorites } = useFavorites();
  const watchlistCount = favorites.length;

  return (
    <div className="hidden md:flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative" data-testid="button-watchlist-header">
            <Star className="w-4 h-4" />
            {watchlistCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 text-[9px] bg-purple-500 text-black px-1">
                {watchlistCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="end">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                Watchlist
              </h3>
              <Link href="/watchlist">
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {favorites.length > 0 ? (
              <div className="divide-y divide-white/5">
                {favorites.slice(0, 5).map((item) => (
                  <WatchlistItem key={item.id} item={item} />
                ))}
                {favorites.length > 5 && (
                  <div className="p-2 text-center">
                    <span className="text-xs text-muted-foreground">+{favorites.length - 5} more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Star className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No items in watchlist</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-shortcuts-header">
            <Keyboard className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="end">
          <div className="p-3 border-b border-white/10">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-primary" />
              Keyboard Shortcuts
            </h3>
          </div>
          <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
            {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                <span className="text-xs text-muted-foreground">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, j) => (
                    <kbd key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 border border-white/20 font-mono">
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function WatchlistItem({ item }: { item: FavoriteItem }) {
  const getIcon = () => {
    switch (item.type) {
      case "token": return "🪙";
      case "nft": return "🖼️";
      case "address": return "👛";
      case "app": return "📱";
      default: return "⭐";
    }
  };

  return (
    <div className="p-2 hover:bg-white/5 flex items-center gap-2">
      <span className="text-lg">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="text-[10px] text-muted-foreground capitalize">{item.type}</div>
      </div>
    </div>
  );
}
