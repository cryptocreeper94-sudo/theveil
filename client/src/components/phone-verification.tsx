import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Phone, Shield, Check, Loader, AlertCircle, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PhoneVerificationProps {
  onVerified?: () => void;
  compact?: boolean;
}

export function PhoneVerification({ onVerified, compact = false }: PhoneVerificationProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "verified">("phone");
  const [countdown, setCountdown] = useState(0);

  const { data: smsStatus } = useQuery({
    queryKey: ["sms-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/phone/status");
      return res.json();
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("code");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      toast({
        title: "Code Sent",
        description: "Check your phone for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: phone, code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid code");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("verified");
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully",
      });
      onVerified?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const getRawPhone = () => {
    return "+1" + phoneNumber.replace(/\D/g, "");
  };

  if (!smsStatus?.enabled) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Phone className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">SMS Verification</p>
          <p className="text-xs text-gray-400">Add 2FA protection</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          onClick={() => setStep("phone")}
          data-testid="button-enable-sms"
        >
          Enable
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-cyan-500/20 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <MessageSquare className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">SMS Verification</h3>
            <p className="text-sm text-gray-400">Secure your account with 2FA</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+1</span>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-cyan-500"
                    maxLength={14}
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">US phone numbers only</p>
              </div>
              
              <Button
                onClick={() => sendCodeMutation.mutate(getRawPhone())}
                disabled={phoneNumber.replace(/\D/g, "").length !== 10 || sendCodeMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                data-testid="button-send-code"
              >
                {sendCodeMutation.isPending ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Send Verification Code
              </Button>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-cyan-300">
                  Code sent to {phoneNumber}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Verification Code</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest bg-gray-800/50 border-gray-700 focus:border-cyan-500"
                  maxLength={6}
                  data-testid="input-code"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("phone")}
                  className="flex-1 border-gray-700"
                  data-testid="button-back"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyCodeMutation.mutate({ phone: getRawPhone(), code: verificationCode })}
                  disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  data-testid="button-verify"
                >
                  {verifyCodeMutation.isPending ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Verify
                </Button>
              </div>
              
              {countdown > 0 ? (
                <p className="text-center text-sm text-gray-500">
                  Resend code in {countdown}s
                </p>
              ) : (
                <button
                  onClick={() => sendCodeMutation.mutate(getRawPhone())}
                  className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300"
                  data-testid="button-resend"
                >
                  Resend Code
                </button>
              )}
            </motion.div>
          )}

          {step === "verified" && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Phone Verified</h4>
              <p className="text-gray-400 text-sm">
                Your account is now protected with SMS 2FA
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
