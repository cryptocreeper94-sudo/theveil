import { AlertTriangle } from "lucide-react";

interface DYORDisclaimerProps {
  variant?: "compact" | "full";
  className?: string;
}

export function DYORDisclaimer({ variant = "compact", className = "" }: DYORDisclaimerProps) {
  if (variant === "full") {
    return (
      <div className={`bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 ${className}`} data-testid="dyor-disclaimer">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-200/80 space-y-2">
            <p className="font-semibold text-purple-300">Do Your Own Research (DYOR)</p>
            <p>
              This is not financial advice. Cryptocurrency investments are highly volatile and speculative. 
              You could lose some or all of your investment. Always conduct your own research and consult 
              with a qualified financial advisor before making any investment decisions. Never invest more 
              than you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 text-[10px] text-purple-400/70 ${className}`} data-testid="dyor-disclaimer-compact">
      <AlertTriangle className="w-3 h-3" />
      <span>DYOR: Not financial advice. Crypto is volatile. Never invest more than you can afford to lose.</span>
    </div>
  );
}
