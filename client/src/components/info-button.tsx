import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoButtonProps {
  title: string;
  content: string;
  variant?: "help" | "info" | "tip";
  size?: "sm" | "md";
  className?: string;
  testId?: string;
}

export function InfoButton({ 
  title, 
  content, 
  variant = "help",
  size = "sm",
  className,
  testId 
}: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const icons = {
    help: HelpCircle,
    info: Info,
    tip: Lightbulb,
  };

  const colors = {
    help: "from-blue-500 to-cyan-500",
    info: "from-purple-500 to-pink-500",
    tip: "from-purple-500 to-cyan-500",
  };

  const Icon = icons[variant];
  const buttonSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          buttonSize,
          "rounded-full flex items-center justify-center",
          "bg-white/10 hover:bg-white/20 transition-colors",
          "border border-white/20 hover:border-white/30",
          isOpen && "bg-white/20 border-white/30"
        )}
        data-testid={testId || "button-info"}
      >
        <Icon className={cn(iconSize, "text-white/60")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2"
          >
            <div className="relative w-72 max-w-[calc(100vw-2rem)]">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[rgba(20,30,50,0.98)] border-l border-t border-white/20" />
              
              <div className="relative rounded-xl overflow-hidden bg-[rgba(20,30,50,0.98)] backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/50">
                <div className={cn(
                  "h-1 w-full bg-gradient-to-r",
                  colors[variant]
                )} />
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br",
                        colors[variant]
                      )}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-white">{title}</h4>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                      data-testid="button-close-info"
                    >
                      <X className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-white/70 leading-relaxed">
                    {content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InfoSection({ 
  title, 
  children,
  infoTitle,
  infoContent,
  variant = "help"
}: { 
  title: string;
  children: React.ReactNode;
  infoTitle: string;
  infoContent: string;
  variant?: "help" | "info" | "tip";
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-bold font-display">{title}</h3>
        <InfoButton title={infoTitle} content={infoContent} variant={variant} />
      </div>
      {children}
    </div>
  );
}
