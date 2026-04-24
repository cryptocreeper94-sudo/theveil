import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, ExternalLink, Copy, Check, Globe, Cpu, Link2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export function GenesisHallmarkBadge() {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: genesis } = useQuery<{
    verified: boolean;
    hallmark: {
      thId: string;
      appName: string;
      productName: string;
      releaseType: string;
      dataHash: string;
      txHash: string;
      blockHeight: number;
      createdAt: string;
      metadata?: Record<string, any> | string;
    };
  }>({
    queryKey: ["/api/hallmark/genesis"],
    queryFn: async () => {
      const res = await fetch("/api/hallmark/genesis");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60000,
  });

  const metadata = (genesis?.hallmark?.metadata && typeof genesis.hallmark.metadata === "string")
    ? (() => { try { return JSON.parse(genesis.hallmark.metadata); } catch { return genesis.hallmark.metadata; } })()
    : (genesis?.hallmark?.metadata || {});

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.button
        data-testid="button-genesis-hallmark"
        onClick={() => setShowDetail(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer"
      >
        <Shield className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white">Genesis Hallmark</span>
        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] px-1.5">
          TL-00000001
        </Badge>
      </motion.button>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
            >
              <div className="relative bg-[rgba(12,18,36,0.95)] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,255,255,0.15)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                        <Shield className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Genesis Hallmark</h2>
                        <p className="text-cyan-400 text-sm font-mono">TL-00000001</p>
                      </div>
                    </div>
                    <button
                      data-testid="button-close-genesis-modal"
                      onClick={() => setShowDetail(false)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>

                  {genesis?.verified && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">Verified on Trust Layer Chain</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white">Application Info</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/40 text-xs">App Name</p>
                          <p className="text-white font-medium">{genesis?.hallmark?.appName || "Trust Layer"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Domain</p>
                          <p className="text-white font-medium">{metadata?.domain || "dwtl.io"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Product</p>
                          <p className="text-white font-medium">{genesis?.hallmark?.productName || "Genesis Block"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Release Type</p>
                          <p className="text-white font-medium capitalize">{genesis?.hallmark?.releaseType || "genesis"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">Blockchain Record</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">Data Hash</span>
                          <button
                            data-testid="button-copy-hash"
                            onClick={() => copyHash(genesis?.hallmark?.dataHash || "")}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span className="font-mono text-xs truncate max-w-[200px]">
                              {genesis?.hallmark?.dataHash
                                ? `${genesis.hallmark.dataHash.slice(0, 12)}...${genesis.hallmark.dataHash.slice(-8)}`
                                : "—"}
                            </span>
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">Tx Hash</span>
                          <span className="font-mono text-xs text-white/70 truncate max-w-[200px]">
                            {genesis?.hallmark?.txHash
                              ? `${genesis.hallmark.txHash.slice(0, 12)}...${genesis.hallmark.txHash.slice(-8)}`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">Block Height</span>
                          <span className="font-mono text-xs text-white/70">
                            {genesis?.hallmark?.blockHeight || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">Ecosystem Details</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/40 text-xs">Operator</p>
                          <p className="text-white font-medium">{metadata?.operator || "DarkWave Studios LLC"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Chain</p>
                          <p className="text-white font-medium">{metadata?.chain || "Trust Layer"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Consensus</p>
                          <p className="text-white font-medium">{metadata?.consensus || "PoA + DAG"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Native Asset</p>
                          <p className="text-white font-medium">{metadata?.nativeAsset || "SIG"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <a
                      href="https://trusthub.tlid.io/hallmark/TH-00000001"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-hub-genesis"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        Hub Genesis TH-00000001
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </a>
                  </div>

                  <p className="text-center text-white/30 text-[10px] mt-4">
                    Created {genesis?.hallmark?.createdAt
                      ? new Date(genesis.hallmark.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
