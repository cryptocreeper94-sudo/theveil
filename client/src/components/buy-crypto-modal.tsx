import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, X, Shield, Loader, Wallet, ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";

interface BuyCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCrypto?: string;
  storedWalletAddresses?: Record<string, string>;
}

const SUPPORTED_CRYPTOS = [
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "Ξ", network: "ethereum" },
  { id: "sol", name: "Solana", symbol: "SOL", icon: "◎", network: "solana" },
  { id: "usdc", name: "USD Coin", symbol: "USDC", icon: "$", network: "ethereum" },
  { id: "matic", name: "Polygon", symbol: "MATIC", icon: "⬡", network: "polygon" },
];

export function BuyCryptoModal({ 
  isOpen, 
  onClose, 
  defaultCrypto = "eth",
  storedWalletAddresses = {}
}: BuyCryptoModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [buyAmount, setBuyAmount] = useState("100");
  const [selectedCrypto, setSelectedCrypto] = useState(defaultCrypto);
  const [externalWalletAddress, setExternalWalletAddress] = useState("");
  const [useExternalWallet, setUseExternalWallet] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCryptoInfo = SUPPORTED_CRYPTOS.find(c => c.id === selectedCrypto);
  const hasStoredWallet = Object.keys(storedWalletAddresses).length > 0;
  
  const getWalletAddress = () => {
    if (useExternalWallet || !hasStoredWallet) {
      return externalWalletAddress;
    }
    return storedWalletAddresses[selectedCrypto === 'sol' ? 'solana' : 'ethereum'] || '';
  };

  const validateWalletAddress = (address: string, network: string): boolean => {
    if (!address || address.trim() === '') return false;
    
    if (network === 'solana') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
  };

  const handleBuyCrypto = async () => {
    const walletAddress = getWalletAddress();
    const network = selectedCryptoInfo?.network || 'ethereum';
    
    if (!walletAddress) {
      toast({ 
        title: "Wallet address required", 
        description: "Enter a wallet address to receive your crypto", 
        variant: "destructive" 
      });
      return;
    }

    if (!validateWalletAddress(walletAddress, network)) {
      toast({ 
        title: "Invalid wallet address", 
        description: network === 'solana' 
          ? "Please enter a valid Solana wallet address" 
          : "Please enter a valid Ethereum address starting with 0x", 
        variant: "destructive" 
      });
      return;
    }

    if (parseFloat(buyAmount) < 10) {
      toast({ 
        title: "Minimum $10", 
        description: "Minimum purchase amount is $10 USD", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await axios.post("/api/crypto-onramp/create-session", {
        walletAddress,
        cryptoCurrency: selectedCrypto,
        fiatCurrency: "usd",
        fiatAmount: buyAmount,
      });
      
      if (response.data.sessionId) {
        toast({ 
          title: "Opening Stripe Crypto", 
          description: "Complete your purchase on Stripe's secure checkout" 
        });
        window.open(`https://crypto.stripe.com/session/${response.data.sessionId}`, '_blank');
        onClose();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.details || "Failed to start purchase. Make sure crypto onramp is enabled on your Stripe account.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <Card className="bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-emerald-500/20">
            <CardHeader className="relative pb-2">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Buy Crypto</CardTitle>
                  <p className="text-sm text-muted-foreground">Purchase with card via Stripe</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Amount Selection */}
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="pl-7 bg-white/5 border-white/10"
                    placeholder="100"
                    min="10"
                    data-testid="input-buy-amount"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {["50", "100", "250", "500"].map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      variant="outline"
                      onClick={() => setBuyAmount(amount)}
                      className={`flex-1 text-xs ${buyAmount === amount ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Cryptocurrency Selection */}
              <div className="space-y-2">
                <Label>Cryptocurrency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.id}
                      onClick={() => setSelectedCrypto(crypto.id)}
                      className={`p-3 rounded-xl border transition-all ${
                        selectedCrypto === crypto.id
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{crypto.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-sm">{crypto.symbol}</div>
                          <div className="text-xs text-muted-foreground">{crypto.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Receiving Wallet
                </Label>
                
                {hasStoredWallet && (
                  <div className="flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUseExternalWallet(false)}
                      className={`flex-1 ${!useExternalWallet ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      My Wallet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUseExternalWallet(true)}
                      className={`flex-1 ${useExternalWallet ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      External Wallet
                    </Button>
                  </div>
                )}

                {(useExternalWallet || !hasStoredWallet) ? (
                  <div className="space-y-2">
                    <Input
                      value={externalWalletAddress}
                      onChange={(e) => setExternalWalletAddress(e.target.value)}
                      placeholder={selectedCrypto === 'sol' ? 'Enter Solana wallet address...' : 'Enter Ethereum wallet address (0x...)'}
                      className="bg-white/5 border-white/10 font-mono text-sm"
                      data-testid="input-external-wallet"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your {selectedCryptoInfo?.name} wallet address (MetaMask, Phantom, etc.)
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm font-mono truncate">
                      {storedWalletAddresses[selectedCrypto === 'sol' ? 'solana' : 'ethereum'] || 'No address for this network'}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">Using your Trust Layer wallet</p>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Powered by Stripe</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Secure payment processing. Crypto deposits directly to your wallet.
                </p>
              </div>

              {/* Buy Button */}
              <Button
                onClick={handleBuyCrypto}
                disabled={isProcessing || !buyAmount || parseFloat(buyAmount) < 10 || !getWalletAddress()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 text-lg"
                data-testid="button-confirm-buy-crypto"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Buy ${buyAmount} of {selectedCryptoInfo?.symbol}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Minimum purchase: $10 USD. Fees and exchange rates apply.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
