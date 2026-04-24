import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Gift, Zap, ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const FIRST_LOGIN_KEY = "dw_first_login_seen";

export function FirstLoginModal() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const seen = localStorage.getItem(FIRST_LOGIN_KEY);
      if (!seen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id]);

  const handleClose = () => {
    localStorage.setItem(FIRST_LOGIN_KEY, "true");
    setIsOpen(false);
  };

  const handleGoToPresale = () => {
    localStorage.setItem(FIRST_LOGIN_KEY, "true");
    setIsOpen(false);
    setLocation("/presale");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900"
          style={{ boxShadow: "0 0 80px rgba(168,85,247,0.3), 0 0 40px rgba(6,182,212,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            data-testid="button-close-first-login"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative p-6 pt-8">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative"
              >
                <Shield className="w-7 h-7 text-cyan-400" />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ boxShadow: "0 0 30px rgba(168,85,247,0.5)" }}
                />
              </motion.div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to Trust Layer
                </span>
              </h2>
              <p className="text-gray-400 text-sm">
                You're early. The Trust Layer is just getting started.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Coins className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Signal Presale Live</p>
                  <p className="text-gray-400 text-xs">$0.001 per SIG • Up to 25% bonus</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Gift className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Early Adopter Rewards</p>
                  <p className="text-gray-400 text-xs">Exclusive bonuses for founding members</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Trust Layer Membership</p>
                  <p className="text-gray-400 text-xs">Get your verified Trust Card</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleGoToPresale}
                className="w-full py-5 text-base font-bold bg-gradient-to-r from-purple-500 via-cyan-500 to-red-500 hover:opacity-90 border-0"
                data-testid="button-first-login-presale"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Acquire Signal Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <button
                onClick={handleClose}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-400 transition-colors"
                data-testid="button-first-login-later"
              >
                Maybe later
              </button>
            </div>

            <p className="text-center text-gray-600 text-xs mt-4">
              Signal is not a cryptocurrency. It's a Trust Network Access Token.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
