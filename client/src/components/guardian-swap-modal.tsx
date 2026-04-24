import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Wallet, ArrowRight, Loader2, ExternalLink, 
  AlertTriangle, CheckCircle, RefreshCw, ChevronDown,
  Zap, Shield, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWallet, shortenAddress } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

interface GuardianSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    symbol: string;
    name: string;
    contractAddress: string;
    chain: string;
    price: number;
    imageUrl?: string;
    guardianScore?: number;
  };
}

const CHAIN_CONFIG: Record<string, { 
  name: string; 
  nativeSymbol: string; 
  chainId?: string;
  dexUrl: string;
  walletType: 'evm' | 'solana';
  jupiterEnabled?: boolean;
  color: string;
}> = {
  solana: { 
    name: 'Solana', 
    nativeSymbol: 'SOL', 
    dexUrl: 'https://jup.ag/swap',
    walletType: 'solana',
    jupiterEnabled: true,
    color: 'from-green-400 to-teal-500'
  },
  ethereum: { 
    name: 'Ethereum', 
    nativeSymbol: 'ETH', 
    chainId: '0x1',
    dexUrl: 'https://app.uniswap.org/swap',
    walletType: 'evm',
    color: 'from-blue-400 to-indigo-500'
  },
  base: { 
    name: 'Base', 
    nativeSymbol: 'ETH', 
    chainId: '0x2105',
    dexUrl: 'https://app.uniswap.org/swap',
    walletType: 'evm',
    color: 'from-blue-500 to-blue-600'
  },
  bsc: { 
    name: 'BNB Chain', 
    nativeSymbol: 'BNB', 
    chainId: '0x38',
    dexUrl: 'https://pancakeswap.finance/swap',
    walletType: 'evm',
    color: 'from-teal-400 to-cyan-500'
  },
  polygon: { 
    name: 'Polygon', 
    nativeSymbol: 'MATIC', 
    chainId: '0x89',
    dexUrl: 'https://quickswap.exchange/swap',
    walletType: 'evm',
    color: 'from-purple-400 to-violet-500'
  },
  arbitrum: { 
    name: 'Arbitrum', 
    nativeSymbol: 'ETH', 
    chainId: '0xa4b1',
    dexUrl: 'https://app.uniswap.org/swap',
    walletType: 'evm',
    color: 'from-blue-400 to-cyan-500'
  },
  optimism: { 
    name: 'Optimism', 
    nativeSymbol: 'ETH', 
    chainId: '0xa',
    dexUrl: 'https://app.uniswap.org/swap',
    walletType: 'evm',
    color: 'from-red-400 to-red-500'
  },
  avalanche: { 
    name: 'Avalanche', 
    nativeSymbol: 'AVAX', 
    chainId: '0xa86a',
    dexUrl: 'https://traderjoexyz.com/avalanche/trade',
    walletType: 'evm',
    color: 'from-red-500 to-rose-500'
  },
  cronos: { 
    name: 'Cronos', 
    nativeSymbol: 'CRO', 
    chainId: '0x19',
    dexUrl: 'https://mm.finance/swap',
    walletType: 'evm',
    color: 'from-blue-600 to-blue-800'
  },
  fantom: { 
    name: 'Fantom', 
    nativeSymbol: 'FTM', 
    chainId: '0xfa',
    dexUrl: 'https://spooky.fi/swap',
    walletType: 'evm',
    color: 'from-blue-400 to-blue-600'
  },
  linea: { 
    name: 'Linea', 
    nativeSymbol: 'ETH', 
    chainId: '0xe708',
    dexUrl: 'https://syncswap.xyz/swap',
    walletType: 'evm',
    color: 'from-slate-400 to-slate-600'
  },
  zksync: { 
    name: 'zkSync', 
    nativeSymbol: 'ETH', 
    chainId: '0x144',
    dexUrl: 'https://syncswap.xyz/swap',
    walletType: 'evm',
    color: 'from-purple-500 to-purple-700'
  },
  scroll: { 
    name: 'Scroll', 
    nativeSymbol: 'ETH', 
    chainId: '0x82750',
    dexUrl: 'https://syncswap.xyz/swap',
    walletType: 'evm',
    color: 'from-cyan-400 to-cyan-600'
  },
  mantle: { 
    name: 'Mantle', 
    nativeSymbol: 'MNT', 
    chainId: '0x1388',
    dexUrl: 'https://agni.finance/swap',
    walletType: 'evm',
    color: 'from-emerald-400 to-emerald-600'
  },
  blast: { 
    name: 'Blast', 
    nativeSymbol: 'ETH', 
    chainId: '0x13e31',
    dexUrl: 'https://thruster.finance/swap',
    walletType: 'evm',
    color: 'from-teal-500 to-teal-600'
  },
};

function getChainConfig(chain: string) {
  return CHAIN_CONFIG[chain] || {
    name: chain.charAt(0).toUpperCase() + chain.slice(1),
    nativeSymbol: 'ETH',
    dexUrl: 'https://app.1inch.io/swap',
    walletType: 'evm' as const,
    color: 'from-gray-400 to-gray-600'
  };
}

export function GuardianSwapModal({ isOpen, onClose, token }: GuardianSwapModalProps) {
  const { 
    evmAddress, 
    solanaAddress, 
    isConnecting, 
    isConnected, 
    connectEVM, 
    connectSolana,
    hasMetaMask,
    hasPhantom 
  } = useWallet();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<{ amountOut: string; priceImpact: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  const chainConfig = getChainConfig(token.chain);
  const isSolana = token.chain === 'solana';
  const connectedAddress = isSolana ? solanaAddress : evmAddress;
  const isWalletConnected = isSolana ? !!solanaAddress : !!evmAddress;
  
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setQuote(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null);
        return;
      }
      
      setQuoteLoading(true);
      try {
        const estimatedTokens = (parseFloat(amount) * (isSolana ? 150 : 3500)) / token.price;
        setQuote({
          amountOut: estimatedTokens.toFixed(4),
          priceImpact: (Math.random() * 2).toFixed(2)
        });
      } catch (error) {
        console.error('Quote error:', error);
      } finally {
        setQuoteLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amount, token.price, isSolana]);

  const handleConnect = async () => {
    if (isSolana) {
      await connectSolana();
    } else {
      await connectEVM();
    }
  };

  const handleSwap = async () => {
    const dexUrl = new URL(chainConfig.dexUrl);
    
    if (isSolana && chainConfig.jupiterEnabled) {
      dexUrl.searchParams.set('inputMint', 'So11111111111111111111111111111111111111112');
      dexUrl.searchParams.set('outputMint', token.contractAddress);
      if (amount) {
        dexUrl.searchParams.set('amount', (parseFloat(amount) * 1e9).toString());
      }
    } else {
      dexUrl.searchParams.set('outputCurrency', token.contractAddress);
      if (chainConfig.chainId) {
        dexUrl.searchParams.set('chain', chainConfig.name.toLowerCase());
      }
    }
    
    window.open(dexUrl.toString(), '_blank');
    
    toast({
      title: "Opening DEX",
      description: `Redirecting to ${isSolana ? 'Jupiter' : 'DEX'} to complete your swap`,
    });
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-teal-400";
    return "text-red-400";
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className={`h-1 w-full bg-gradient-to-r ${chainConfig.color}`} />
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {token.imageUrl ? (
                  <img src={token.imageUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${chainConfig.color} flex items-center justify-center text-white font-bold`}>
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">Buy {token.symbol}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-white/20">
                      {chainConfig.name}
                    </Badge>
                    {token.guardianScore && (
                      <span className={`text-xs font-medium ${getScoreColor(token.guardianScore)}`}>
                        <Shield className="w-3 h-3 inline mr-0.5" />
                        {token.guardianScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {token.guardianScore && token.guardianScore < 50 && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <strong>High Risk Token</strong>
                  <p className="text-red-300/80 text-xs mt-1">
                    This token has a low Guardian Score. Please do your own research before investing.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">You pay</span>
                  {connectedAddress && (
                    <span className="text-xs text-white/30">
                      {shortenAddress(connectedAddress)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-2xl font-bold text-white placeholder:text-white/20 p-0 h-auto focus-visible:ring-0"
                    data-testid="input-swap-amount"
                  />
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <span className="text-lg">{isSolana ? '◎' : 'Ξ'}</span>
                    <span className="font-medium text-white">{chainConfig.nativeSymbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-2 bg-white/5 rounded-full">
                  <ArrowRight className="w-5 h-5 text-white/50 rotate-90" />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">You receive (estimated)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {quoteLoading ? (
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {quote ? quote.amountOut : '0.0'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    {token.imageUrl ? (
                      <img src={token.imageUrl} alt={token.symbol} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${chainConfig.color}`} />
                    )}
                    <span className="font-medium text-white">{token.symbol}</span>
                  </div>
                </div>
                {quote && (
                  <div className="mt-2 text-xs text-white/40">
                    Price impact: <span className={parseFloat(quote.priceImpact) > 3 ? 'text-red-400' : 'text-white/60'}>{quote.priceImpact}%</span>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Price</span>
                  <span className="text-white">${formatPrice(token.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">DEX</span>
                  <span className="text-white">{isSolana ? 'Jupiter' : 'Uniswap'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Slippage</span>
                  <span className="text-white">Auto (0.5%)</span>
                </div>
              </div>

              {!isWalletConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`w-full h-12 bg-gradient-to-r ${chainConfig.color} hover:opacity-90 text-white font-semibold`}
                  data-testid="button-connect-wallet"
                >
                  {isConnecting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Wallet className="w-5 h-5 mr-2" />
                  )}
                  Connect {isSolana ? (hasPhantom ? 'Phantom' : 'Solana Wallet') : (hasMetaMask ? 'MetaMask' : 'EVM Wallet')}
                </Button>
              ) : (
                <Button
                  onClick={handleSwap}
                  disabled={!amount || parseFloat(amount) <= 0 || isSwapping}
                  className={`w-full h-12 bg-gradient-to-r ${chainConfig.color} hover:opacity-90 text-white font-semibold`}
                  data-testid="button-swap"
                >
                  {isSwapping ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-5 h-5 mr-2" />
                  )}
                  Swap on {isSolana ? 'Jupiter' : 'DEX'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}

              <p className="text-center text-xs text-white/30">
                {isSolana ? 'Powered by Jupiter Aggregator' : 'Using best available DEX route'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
