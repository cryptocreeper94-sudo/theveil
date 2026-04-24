import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command, Search, Home, Wallet, TrendingUp, Coins, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
  icon?: React.ElementType;
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const shortcuts: Shortcut[] = [
    { keys: ["⌘", "K"], description: "Open search", action: () => {}, icon: Search },
    { keys: ["G", "H"], description: "Go to Home", action: () => setLocation("/"), icon: Home },
    { keys: ["G", "W"], description: "Go to Wallet", action: () => setLocation("/wallet"), icon: Wallet },
    { keys: ["G", "S"], description: "Go to Swap", action: () => setLocation("/swap"), icon: TrendingUp },
    { keys: ["G", "T"], description: "Go to Staking", action: () => setLocation("/staking"), icon: Coins },
    { keys: ["G", "N"], description: "Go to NFTs", action: () => setLocation("/nft"), icon: Image },
    { keys: ["G", "E"], description: "Go to Explorer", action: () => setLocation("/explorer") },
    { keys: ["G", "P"], description: "Go to Portfolio", action: () => setLocation("/portfolio") },
    { keys: ["G", "B"], description: "Go to Bridge", action: () => setLocation("/bridge") },
    { keys: ["?"], description: "Show shortcuts", action: () => setIsOpen(true), icon: Keyboard },
    { keys: ["Esc"], description: "Close dialog", action: () => setIsOpen(false) },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        const nextKeyHandler = (e2: KeyboardEvent) => {
          const keyMap: Record<string, string> = {
            h: "/",
            w: "/wallet",
            s: "/swap",
            t: "/staking",
            n: "/nft",
            e: "/explorer",
            p: "/portfolio",
            b: "/bridge",
          };
          if (keyMap[e2.key]) {
            e2.preventDefault();
            setLocation(keyMap[e2.key]);
          }
          window.removeEventListener("keydown", nextKeyHandler);
        };
        window.addEventListener("keydown", nextKeyHandler, { once: true });
        setTimeout(() => window.removeEventListener("keydown", nextKeyHandler), 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 hover:bg-white/5"
        title="Keyboard Shortcuts (?)"
        data-testid="button-shortcuts"
      >
        <Keyboard className="w-4 h-4" />
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
              data-testid="shortcuts-overlay"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              data-testid="shortcuts-modal"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Command className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Keyboard Shortcuts</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-shortcuts">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  {shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                      data-testid={`shortcut-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && <shortcut.icon className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 text-xs bg-black/40 border border-white/20 rounded-md font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 text-center text-xs text-muted-foreground">
                Press <kbd className="px-1 bg-black/30 rounded">?</kbd> anywhere to show this panel
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
