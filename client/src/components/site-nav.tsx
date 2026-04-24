import { Link, useLocation } from "wouter";
import { Search, MessageCircle, Zap, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { WalletButton } from "@/components/wallet-button";
import { MemberBadge } from "@/components/member-badge";
import { openGlobalSearch } from "@/components/global-search";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import signalEmblem from "@assets/darkwave_trust_layer_emblem_enhanced_1769161177418.png";

const HIDDEN_PATHS = [
  "/chronicles/login",
  "/chronicles/onboarding",
  "/owner-admin",
  "/command-center",
];

const LANDING_PATHS = ["/"];

export function SiteNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useSimpleAuth();

  const isHidden = HIDDEN_PATHS.some(p => location.startsWith(p));
  const isLanding = LANDING_PATHS.includes(location);
  if (isHidden || isLanding) return null;

  const isHome = location === "/" || location === "/home" || location === "/portal" || location === "/explore";
  const showBack = !isHome;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-background/90 backdrop-blur-xl" data-site-nav>
      <div className="w-full px-3 sm:px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <MobileNav />
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.href = "/";
              }}
              data-testid="button-nav-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Link href="/" className="flex items-center">
            <img src={signalEmblem} alt="Home" className="w-7 h-7 sm:w-8 sm:h-8" />
          </Link>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 rounded" data-testid="badge-beta">Beta</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthenticated && user?.id && (
            <MemberBadge userId={user.id.toString()} />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={openGlobalSearch}
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            data-testid="button-global-search-nav"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Link href="/community">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              data-testid="button-messenger-nav"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              data-testid="button-explore-nav"
            >
              <Compass className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/executive-summary">
            <Button
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white border-0"
              data-testid="button-vision-nav"
            >
              <Zap className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Vision</span>
            </Button>
          </Link>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
