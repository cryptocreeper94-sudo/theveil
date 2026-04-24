import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, Home, Trophy, Coins, User, Menu, X,
  ArrowLeft, Sparkles, Crown, Dice1, Rocket,
  Download, Flame, Star, Zap, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { MobileNav } from "@/components/mobile-nav";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/arcade", label: "Arcade", icon: Gamepad2 },
  { href: "/coin-store", label: "Store", icon: Store },
  { href: "/daily-bonus", label: "Daily", icon: Star },
  { href: "/crash", label: "Crash", icon: Rocket, hot: true },
  { href: "/slots", label: "Slots", icon: Crown, hot: true },
];

export function GamesNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useSimpleAuth();
  const [scrolled, setScrolled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const isHome = location === "/" || location === "/home";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${
          scrolled
            ? "bg-slate-950/95 border-b border-pink-500/10 shadow-[0_2px_20px_rgba(236,72,153,0.08)]"
            : "bg-transparent"
        }`}
        style={scrolled ? { WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)' } : undefined}
        data-games-nav
      >
        <div className="w-full px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />

            {!isHome && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => {
                  if (window.history.length > 1) window.history.back();
                  else window.location.href = "/";
                }}
                data-testid="button-games-nav-back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow">
                <Gamepad2 className="w-4.5 h-4.5 text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-slate-950 animate-pulse" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-sm font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  DarkWave
                </span>
                <span className="text-[10px] text-white/50 font-medium tracking-wider uppercase">Games</span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location === link.href;
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "text-white bg-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                    data-testid={`nav-link-${link.label.toLowerCase()}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                    {link.hot && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {installPrompt && (
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-0 rounded-lg shadow-lg shadow-pink-500/20"
                data-testid="button-install-pwa"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            )}

            <Link href="/arcade/profile">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                data-testid="button-games-profile"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/wallet">
              <Button
                size="sm"
                className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-teal-500/20 to-purple-500/20 hover:from-teal-500/30 hover:to-purple-500/30 text-teal-400 border border-teal-500/20 rounded-lg"
                data-testid="button-games-wallet"
              >
                <Coins className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Wallet</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>


      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-white/5 safe-area-bottom tap-transparent" style={{ WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center justify-around px-2" style={{ height: '56px' }}>
          {[
            { href: "/", label: "Home", icon: Home },
            { href: "/arcade", label: "Arcade", icon: Gamepad2 },
            { href: "/crash", label: "Crash", icon: Rocket },
            { href: "/coin-store", label: "Store", icon: Store },
            { href: "/arcade/profile", label: "Profile", icon: User },
          ].map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all tap-transparent ${
                    active ? "text-pink-400" : "text-white/40"
                  }`}
                  style={{ minWidth: '44px', minHeight: '44px', WebkitTapHighlightColor: 'transparent' }}
                  data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]" : ""}`} />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
