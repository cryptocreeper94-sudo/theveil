import { useState, createContext, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Eye, Trash2, X, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard } from "@/components/glass-card";
import { Link } from "wouter";

export interface FavoriteItem {
  id: string;
  type: "token" | "nft" | "address" | "app";
  name: string;
  symbol?: string;
  address?: string;
  imageUrl?: string;
  price?: number;
  change24h?: number;
  addedAt: Date;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem("darkwave-favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("darkwave-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (item: Omit<FavoriteItem, "addedAt">) => {
    if (!favorites.find(f => f.id === item.id)) {
      setFavorites([...favorites, { ...item, addedAt: new Date() }]);
    }
  };

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
  return context;
}

export function FavoriteButton({ item }: { item: Omit<FavoriteItem, "addedAt"> }) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const isActive = isFavorite(item.id);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={`h-8 w-8 ${isActive ? "text-teal-400" : "text-muted-foreground hover:text-teal-400"}`}
      data-testid={`button-favorite-${item.id}`}
    >
      <Star className={`w-4 h-4 ${isActive ? "fill-current" : ""}`} />
    </Button>
  );
}

export function WatchlistPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { favorites, removeFavorite } = useFavorites();

  const tokens = favorites.filter(f => f.type === "token");
  const nfts = favorites.filter(f => f.type === "nft");
  const addresses = favorites.filter(f => f.type === "address");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative w-9 h-9 hover:bg-white/5"
        title="Watchlist"
        data-testid="button-watchlist"
      >
        <Eye className="w-4 h-4" />
        {favorites.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-black text-[10px] rounded-full flex items-center justify-center font-bold">
            {favorites.length}
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
              data-testid="watchlist-overlay"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-50 overflow-hidden flex flex-col"
              data-testid="watchlist-panel"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-teal-400" />
                  <h2 className="font-semibold">Watchlist</h2>
                  <span className="text-xs text-muted-foreground">({favorites.length})</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-watchlist">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Tabs defaultValue="tokens" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4" data-testid="tabs-watchlist">
                  <TabsTrigger value="tokens" data-testid="tab-tokens">Tokens ({tokens.length})</TabsTrigger>
                  <TabsTrigger value="nfts" data-testid="tab-nfts">NFTs ({nfts.length})</TabsTrigger>
                  <TabsTrigger value="addresses" data-testid="tab-addresses">Addresses ({addresses.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="tokens" className="flex-1 overflow-y-auto p-4 space-y-2">
                  {tokens.length === 0 ? (
                    <EmptyState type="tokens" />
                  ) : (
                    tokens.map(item => (
                      <WatchlistItem key={item.id} item={item} onRemove={() => removeFavorite(item.id)} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="nfts" className="flex-1 overflow-y-auto p-4 space-y-2">
                  {nfts.length === 0 ? (
                    <EmptyState type="NFTs" />
                  ) : (
                    nfts.map(item => (
                      <WatchlistItem key={item.id} item={item} onRemove={() => removeFavorite(item.id)} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="addresses" className="flex-1 overflow-y-auto p-4 space-y-2">
                  {addresses.length === 0 ? (
                    <EmptyState type="addresses" />
                  ) : (
                    addresses.map(item => (
                      <WatchlistItem key={item.id} item={item} onRemove={() => removeFavorite(item.id)} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function WatchlistItem({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  return (
    <GlassCard className="p-3" data-testid={`watchlist-item-${item.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
              {item.symbol?.[0] || item.name[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{item.name}</p>
            {item.symbol && <p className="text-xs text-muted-foreground">{item.symbol}</p>}
            {item.address && (
              <p className="text-xs text-muted-foreground font-mono">
                {item.address.slice(0, 8)}...{item.address.slice(-6)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.price !== undefined && (
            <div className="text-right">
              <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
              {item.change24h !== undefined && (
                <p className={`text-xs flex items-center gap-0.5 ${item.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {item.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(item.change24h).toFixed(2)}%
                </p>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-300"
            onClick={onRemove}
            data-testid={`button-remove-${item.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>No {type} in your watchlist</p>
      <p className="text-xs mt-1">Star items to add them here</p>
    </div>
  );
}
