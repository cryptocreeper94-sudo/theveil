import { Info, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InfoTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  iconSize?: "sm" | "md" | "lg";
  label?: string;
}

export function InfoTooltip({ content, className, side = "top", iconSize = "sm", label }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const accessibleLabel = label || "More information";
  const testId = label ? `button-info-${label.toLowerCase().replace(/\s+/g, '-')}` : "button-info-tooltip";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          aria-label={accessibleLabel}
          className={cn(
            "inline-flex items-center justify-center rounded-full p-0.5 text-white/40 hover:text-primary hover:bg-primary/10 transition-colors cursor-help",
            className
          )}
          data-testid={testId}
        >
          <Info className={sizeClasses[iconSize]} />
          <span className="sr-only">{accessibleLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="max-w-[280px] bg-[#0c1224] border border-white/10 text-white/80 text-[11px] leading-relaxed p-3 relative"
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
          data-testid="button-close-info"
        >
          <X className="w-3 h-3 text-white/50 hover:text-white" />
        </button>
        <p className="pr-4">{content}</p>
      </PopoverContent>
    </Popover>
  );
}
