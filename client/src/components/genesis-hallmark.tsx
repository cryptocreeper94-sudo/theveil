import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Shield, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  QrCode,
  Hash,
  Clock,
  Zap,
  Award,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GenesisHallmark {
  id: string;
  globalSerial: string;
  serialNumber: string;
  type: string;
  chain: string;
  blockNumber: number;
  payloadHash: string;
  txHash: string;
  createdAt: string;
  verificationUrl: string;
  qrCodeSvg: string;
  metadata: {
    totalSupply: string;
    decimals: number;
    consensusType: string;
    blockTime: string;
    tps: string;
    validator: string;
    launchDate: string;
  };
  verified: boolean;
  message: string;
}

async function fetchGenesisHallmark(): Promise<GenesisHallmark> {
  const response = await fetch("/api/hallmark/genesis");
  if (!response.ok) {
    throw new Error("Failed to fetch genesis hallmark");
  }
  return response.json();
}

export function GenesisHallmarkCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { data: genesis, isLoading } = useQuery<GenesisHallmark>({
    queryKey: ["genesis-hallmark"],
    queryFn: fetchGenesisHallmark,
    staleTime: 60000,
  });

  const copyHash = () => {
    if (genesis?.payloadHash) {
      navigator.clipboard.writeText(genesis.payloadHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Hash Copied", description: "Genesis hash copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 animate-pulse" />
      </div>
    );
  }

  if (!genesis) return null;

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link href="/explorer">
        <motion.div
          className="relative cursor-pointer group"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Premium Refractor Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 shadow-2xl">
            
            {/* Holographic Shimmer Effect */}
            <motion.div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `linear-gradient(
                  ${isHovered ? '135deg' : '45deg'},
                  transparent 0%,
                  rgba(168, 85, 247, 0.4) 25%,
                  rgba(236, 72, 153, 0.4) 50%,
                  rgba(59, 130, 246, 0.4) 75%,
                  transparent 100%
                )`,
                backgroundSize: "200% 200%",
              }}
              animate={{
                backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
              }}
              transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }}
            />
            
            {/* Rainbow Border Glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50 blur-sm group-hover:opacity-75 transition-opacity" />
            
            {/* Card Content Container */}
            <div className="relative z-10 p-6 bg-gradient-to-br from-slate-900/95 via-purple-950/95 to-slate-900/95 rounded-2xl">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">Genesis</div>
                    <div className="text-xs font-bold text-white">Hallmark #1</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-green-400">Verified</span>
                </div>
              </div>
              
              {/* Main Card Display - NFT Style */}
              <div className="relative mb-6">
                {/* Token Display */}
                <div className="relative aspect-square rounded-xl bg-gradient-to-br from-purple-900/50 via-slate-900 to-pink-900/50 border border-white/10 p-4 flex flex-col items-center justify-center overflow-hidden">
                  
                  {/* Animated Background Particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [-20, 20],
                          opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* DarkWave Logo */}
                  <motion.img
                    alt="Signal Coin"
                    className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 relative z-10 drop-shadow-2xl object-contain"
                    animate={{
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                  
                  {/* Serial Number Overlay */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <motion.div 
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10"
                      animate={{ 
                        boxShadow: isHovered 
                          ? ["0 0 20px rgba(168, 85, 247, 0.5)", "0 0 40px rgba(236, 72, 153, 0.5)", "0 0 20px rgba(168, 85, 247, 0.5)"]
                          : "0 0 20px rgba(168, 85, 247, 0.3)"
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Hash className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-mono font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {genesis.globalSerial}
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Title & Info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  Trust Layer
                </h3>
                <p className="text-sm text-white/60">{genesis.message}</p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px] text-white/50 uppercase">Block Time</span>
                  </div>
                  <div className="text-sm font-bold text-white">{genesis.metadata.blockTime}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] text-white/50 uppercase">TPS</span>
                  </div>
                  <div className="text-sm font-bold text-white">{genesis.metadata.tps}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-white/50 uppercase">Consensus</span>
                  </div>
                  <div className="text-sm font-bold text-white">PoA</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-white/50 uppercase">Launch</span>
                  </div>
                  <div className="text-sm font-bold text-white">Jun 1, 2026</div>
                </div>
              </div>
              
              {/* QR Code & Hash Section - Stacked on mobile */}
              <div className="flex flex-col items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                {/* QR Code */}
                <div className="w-32 h-32 rounded-lg bg-white p-2 flex-shrink-0">
                  <img 
                    src={`data:image/svg+xml;base64,${btoa(genesis.qrCodeSvg)}`}
                    alt="Verification QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Hash Info */}
                <div className="text-center w-full">
                  <div className="text-[10px] text-white/50 uppercase mb-2">Payload Hash</div>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-[11px] font-mono text-purple-400 break-all">
                      {genesis.payloadHash.slice(0, 16)}...
                    </code>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        copyHash();
                      }}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <QrCode className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/30">Scan to verify</span>
                  </div>
                </div>
              </div>
              
              {/* View Explorer Button */}
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium mt-2"
                data-testid="button-view-explorer"
              >
                <span>View on Explorer</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              
            </div>
          </div>
          
          {/* Pedestal / Stand Effect */}
          <div className="relative mt-4">
            <div className="absolute inset-x-8 h-4 bg-gradient-to-b from-purple-500/20 to-transparent rounded-b-full blur-md" />
            <div className="absolute inset-x-12 h-2 bg-gradient-to-b from-white/10 to-transparent rounded-b-full" />
          </div>
          
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function GenesisHallmarkSection() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Hallmark System</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Genesis Hallmark
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            The first-ever Trust Layer hallmark. Every transaction, asset, and product 
            in the ecosystem is stamped with a unique 12-digit serial number for permanent 
            blockchain verification.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <GenesisHallmarkCard />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6 text-center"
        >
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Hash className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">12-Digit Serial</h3>
            <p className="text-sm text-white/60">
              Every hallmark receives a unique global serial number, supporting up to 1 trillion entries.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Immutable Proof</h3>
            <p className="text-sm text-white/60">
              SHA-256 hashing ensures every stamp is cryptographically verified and tamper-proof.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Instant Verification</h3>
            <p className="text-sm text-white/60">
              Scan the QR code to instantly verify any asset, product, or transaction on-chain.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
