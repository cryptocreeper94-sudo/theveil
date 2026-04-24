import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, ExternalLink, Copy, Check, LogOut, ChevronDown , Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, shortenAddress } from "@/hooks/use-wallet";
import { Link } from "wouter";

export function WalletButton() {
  const { 
    evmAddress, 
    solanaAddress, 
    isConnecting, 
    isConnected, 
    connectEVM, 
    connectSolana, 
    disconnect,
    hasMetaMask,
    hasPhantom,
    error 
  } = useWallet();
  
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeAddress = evmAddress || solanaAddress;
  const activeChain = evmAddress ? "EVM" : solanaAddress ? "Solana" : null;

  if (isConnected && activeAddress) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          className="gap-1 sm:gap-2 h-7 sm:h-8 px-1.5 sm:px-3 text-[10px] sm:text-xs border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          data-testid="button-wallet-connected"
        >
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="hidden sm:inline">{shortenAddress(activeAddress)}</span>
          <Wallet className="w-3 h-3 sm:hidden" />
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl z-50"
              >
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">Connected via {activeChain}</div>
                  
                  {evmAddress && (
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-[10px] text-muted-foreground">EVM</div>
                        <div className="text-xs font-mono">{shortenAddress(evmAddress, 6)}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopy(evmAddress)}
                          className="p-1.5 hover:bg-white/10 rounded"
                        >
                          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`https://etherscan.io/address/${evmAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {solanaAddress && (
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Solana</div>
                        <div className="text-xs font-mono">{shortenAddress(solanaAddress, 6)}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopy(solanaAddress)}
                          className="p-1.5 hover:bg-white/10 rounded"
                        >
                          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`https://solscan.io/account/${solanaAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {!evmAddress && hasMetaMask && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={connectEVM}
                    >
                      + Add EVM Wallet
                    </Button>
                  )}
                  
                  {!solanaAddress && hasPhantom && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={connectSolana}
                    >
                      + Add Solana Wallet
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      disconnect();
                      setShowDropdown(false);
                    }}
                    data-testid="button-disconnect-wallet"
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowModal(true)}
        className="gap-1 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs bg-primary text-background hover:bg-primary/90"
        disabled={isConnecting}
        data-testid="button-connect-wallet"
      >
        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span>
          {isConnecting ? "..." : "Connect"}
        </span>
      </Button>

      {showModal && createPortal(
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 99998,
              }}
              onClick={() => setShowModal(false)}
            />
            <div 
              style={{
                position: 'fixed',
                left: '50%',
                top: '120px',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '380px',
                maxHeight: 'calc(100vh - 150px)',
                overflowY: 'auto',
                backgroundColor: '#0a0f1e',
                border: '2px solid #06b6d4',
                borderRadius: '16px',
                padding: '20px',
                zIndex: 99999,
                boxShadow: '0 0 0 4px #000, 0 25px 50px -12px rgba(0,0,0,0.9)',
                isolation: 'isolate',
              }}
            >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModal(false);
                    }}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                    style={{ pointerEvents: 'auto', zIndex: 100000 }}
                    data-testid="button-close-wallet-modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-muted-foreground text-xs mb-4">Choose your wallet to connect to Trust Layer</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Link href="/wallet" onClick={() => setShowModal(false)}>
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-gradient-to-r from-cyan-900/80 to-purple-900/80 border-primary/30 hover:border-primary/50 justify-start gap-3 text-white"
                    data-testid="button-darkwave-wallet"
                  >
                    <Shield className="w-7 h-7 text-cyan-400" />
                    <div className="text-left min-w-0">
                      <div className="font-medium text-sm">Trust Layer Wallet</div>
                      <div className="text-[10px] text-muted-foreground truncate">Create or manage your wallet</div>
                    </div>
                  </Button>
                </Link>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-[#0c1224] px-2 text-muted-foreground">or connect external</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 bg-slate-800/90 border-white/10 hover:bg-slate-700/90 hover:border-white/20 justify-start gap-3 text-white"
                  onClick={async () => {
                    await connectEVM();
                    if (!error) setShowModal(false);
                  }}
                  disabled={isConnecting}
                  data-testid="button-connect-metamask"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-7 h-7 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm">MetaMask</div>
                    <div className="text-[10px] text-muted-foreground truncate">Browser extension</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 bg-slate-800/90 border-white/10 hover:bg-slate-700/90 hover:border-white/20 justify-start gap-3 text-white"
                  onClick={async () => {
                    await connectSolana();
                    if (!error) setShowModal(false);
                  }}
                  disabled={isConnecting}
                  data-testid="button-connect-phantom"
                >
                  <div className="w-7 h-7 rounded-full bg-[#AB9FF2] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 128 128" className="w-4 h-4">
                      <path fill="white" d="M110.6 46.5c-3.3-21.8-21.3-38.4-43.3-38.4-24.2 0-43.9 19.6-43.9 43.9 0 3.1.3 6.2 1 9.1-15.3 3.3-26.8 17-26.8 33.3 0 18.8 15.3 34.1 34.1 34.1h71.6c16.6 0 30.1-13.5 30.1-30.1 0-16.4-13.1-29.7-29.4-30.1-.7-8.2-1.7-15.5-3.4-21.8z"/>
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm">Phantom</div>
                    <div className="text-[10px] text-muted-foreground truncate">Solana wallet</div>
                  </div>
                </Button>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-[10px] text-center text-muted-foreground">
                    By connecting, you agree to our Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
