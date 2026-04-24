import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  description: string;
  target?: string; // ID of element to highlight (optional for now)
}

const steps: Step[] = [
  {
    title: "Welcome to the Trust Layer",
    description: "Trust Layer is infrastructure where accountability is built in. Not another blockchain - a foundation for verified business where trust is the default.",
  },
  {
    title: "Signal, Not Coin",
    description: "We transmit verified intent, not speculation. When you send a Signal, you're communicating with purpose - a transmission that means something.",
  },
  {
    title: "Turnkey Business Rails",
    description: "Plug into verified networks for staffing, construction, real estate, events, and more. Your reputation follows you. Bad actors have nowhere to hide.",
  },
  {
    title: "Build in DWSC Studio",
    description: "Our cloud IDE features an AI Agent Mode (Ctrl+Shift+K) that builds across your entire project autonomously. Connect GitHub, deploy to Vercel, and stamp your code on the blockchain with TrustHub — all from one workspace.",
  },
  {
    title: "Integrations & Live Preview",
    description: "Push to GitHub, deploy to Vercel, and run CI/CD pipelines right from Studio. The live preview auto-refreshes when you save, and the Problems panel catches errors in real time.",
  },
  {
    title: "The Presale is Live",
    description: "Early supporters get the best Signal pricing. Join now to be part of the foundation - before the wave arrives.",
  }
];

const STORAGE_KEY = "darkwave_onboarding_completed";

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Only show on first visit - check localStorage
  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-md pointer-events-auto"
          >
            <div className="glass-panel rounded-2xl p-6 border-glow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-primary font-bold font-display text-lg">
                  <Info className="w-5 h-5" />
                  <span>Getting Started</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full hover:bg-white/10"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-8 min-h-[100px]">
                <h3 className="text-2xl font-bold text-white mb-2">{steps[currentStep].title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentStep ? "w-8 bg-primary" : "w-2 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                
                <Button onClick={handleNext} className="bg-primary text-background hover:bg-primary/90 font-bold">
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
