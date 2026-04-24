import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface PageNavProps {
  showHome?: boolean;
  showBack?: boolean;
  homeLabel?: string;
  backLabel?: string;
  className?: string;
}

export function PageNav({ 
  showHome = true, 
  showBack = true, 
  homeLabel = "Home",
  backLabel = "Back",
  className = ""
}: PageNavProps) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBack && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-1 hover:bg-white/5 px-2 text-muted-foreground hover:text-white"
          onClick={handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Button>
      )}
      {showHome && (
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs gap-1 hover:bg-white/5 px-2 text-muted-foreground hover:text-white"
            data-testid="button-home"
          >
            <Home className="w-3 h-3" />
            <span className="hidden sm:inline">{homeLabel}</span>
          </Button>
        </Link>
      )}
    </div>
  );
}

export function BackButton({ 
  label = "Back",
  className = "" 
}: { 
  label?: string;
  className?: string;
}) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`h-8 text-xs gap-1 hover:bg-white/5 px-2 text-muted-foreground hover:text-white ${className}`}
      onClick={handleBack}
      data-testid="button-back"
    >
      <ArrowLeft className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function HomeButton({ 
  label = "Home",
  className = "" 
}: { 
  label?: string;
  className?: string;
}) {
  return (
    <Link href="/">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`h-8 text-xs gap-1 hover:bg-white/5 px-2 text-muted-foreground hover:text-white ${className}`}
        data-testid="button-home"
      >
        <Home className="w-3 h-3" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </Link>
  );
}
