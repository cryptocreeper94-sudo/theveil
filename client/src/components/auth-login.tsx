import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowLeft, KeyRound, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type View = 'providers' | 'email-login' | 'email-signup' | 'forgot-password' | 'pin-login';

export function AuthLoginModal({ isOpen, onClose, onSuccess }: AuthLoginModalProps) {
  const { toast } = useToast();
  const { login, register } = useSimpleAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [view, setView] = useState<View>('providers');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setUsername('');
    setPin('');
    setView('providers');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({ title: "Missing info", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setLoading('email');
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You've successfully signed in." });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({ title: "Sign in failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !username) {
      toast({ title: "Missing info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (username.length < 2) {
      toast({ title: "Username too short", description: "Username must be at least 2 characters.", variant: "destructive" });
      return;
    }
    setLoading('email');
    try {
      await register(email, password, name, username);
      toast({ title: "Welcome!", description: "Your account has been created." });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setLoading('reset');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
        setView('email-login');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handlePinLogin = async () => {
    if (!email || !pin) {
      toast({ title: "Missing info", description: "Please enter your email and PIN.", variant: "destructive" });
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast({ title: "Invalid PIN", description: "PIN must be 4-6 digits.", variant: "destructive" });
      return;
    }
    setLoading('pin');
    try {
      const response = await fetch('/api/auth/pin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'PIN login failed');
      }
      toast({ title: "Welcome back!", description: "You've successfully signed in with PIN." });
      onSuccess?.();
      handleClose();
      window.location.reload();
    } catch (error: any) {
      let message = error.message || "Please try again.";
      if (message.includes("PIN not set up")) {
        message = "PIN not set up. Please sign in with password first, then set up your PIN.";
      }
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl z-[101]"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
              data-testid="button-close-auth"
            >
              <X className="w-5 h-5" />
            </button>

            {view !== 'providers' && (
              <button
                onClick={() => setView('providers')}
                className="absolute top-4 left-4 text-muted-foreground hover:text-white transition-colors"
                data-testid="button-back-auth"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {view === 'providers' && 'Welcome'}
                {view === 'email-login' && 'Sign In'}
                {view === 'email-signup' && 'Create Account'}
                {view === 'forgot-password' && 'Reset Password'}
                {view === 'pin-login' && 'Quick Sign In'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {view === 'providers' && 'Sign in to your account'}
                {view === 'email-login' && 'Enter your email and password'}
                {view === 'email-signup' && 'Create your account'}
                {view === 'forgot-password' && "We'll send you a reset link"}
                {view === 'pin-login' && 'Enter your email and PIN'}
              </p>
            </div>

            {view === 'providers' && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 justify-start gap-3 text-white"
                  onClick={() => setView('pin-login')}
                  disabled={loading !== null}
                  data-testid="button-login-pin"
                >
                  <KeyRound className="w-5 h-5" />
                  Sign In with PIN
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 justify-start gap-3 text-white"
                  onClick={() => setView('email-login')}
                  disabled={loading !== null}
                  data-testid="button-login-email"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email/Password
                </Button>

                <div className="text-center mt-4">
                  <button 
                    onClick={() => setView('email-signup')} 
                    className="text-cyan-400 hover:underline text-sm"
                    data-testid="button-create-account"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </div>
            )}

            {view === 'email-login' && (
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-email"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-password"
                />
                <Button
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold"
                  onClick={handleEmailLogin}
                  disabled={loading !== null || !email || !password}
                  data-testid="button-submit-login"
                >
                  {loading === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </Button>
                <div className="flex justify-between text-sm">
                  <button onClick={() => setView('forgot-password')} className="text-cyan-400 hover:underline">
                    Forgot password?
                  </button>
                  <button onClick={() => setView('email-signup')} className="text-cyan-400 hover:underline">
                    Create account
                  </button>
                </div>
              </div>
            )}

            {view === 'email-signup' && (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-username"
                />
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-name"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-email"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-password"
                />
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  <p className={password.length >= 8 ? "text-green-400" : ""}>• 8+ characters</p>
                  <p className={/[A-Z]/.test(password) ? "text-green-400" : ""}>• Uppercase</p>
                  <p className={/[a-z]/.test(password) ? "text-green-400" : ""}>• Lowercase</p>
                  <p className={/[0-9]/.test(password) ? "text-green-400" : ""}>• Number</p>
                  <p className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-400" : ""}>• Special char</p>
                </div>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold"
                  onClick={handleEmailSignup}
                  disabled={loading !== null || !email || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password) || !username}
                  data-testid="button-submit-signup"
                >
                  {loading === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
                <div className="text-center text-sm">
                  <button onClick={() => setView('email-login')} className="text-cyan-400 hover:underline">
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}

            {view === 'forgot-password' && (
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-email-reset"
                />
                <Button
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold"
                  onClick={handleForgotPassword}
                  disabled={loading !== null || !email}
                  data-testid="button-submit-reset"
                >
                  {loading === 'reset' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </div>
            )}

            {view === 'pin-login' && (
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                  data-testid="input-email-pin"
                />
                <Input
                  type="password"
                  placeholder="4-6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 bg-white/5 border-white/10 text-center text-2xl tracking-widest"
                  data-testid="input-pin"
                  maxLength={6}
                />
                <Button
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold"
                  onClick={handlePinLogin}
                  disabled={loading !== null || !email || !pin}
                  data-testid="button-submit-pin"
                >
                  {loading === 'pin' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </Button>
                <div className="text-center text-sm">
                  <button onClick={() => setView('email-login')} className="text-cyan-400 hover:underline">
                    Use password instead
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { AuthLoginModal as FirebaseLoginModal };
