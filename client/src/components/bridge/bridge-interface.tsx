import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, Lock, Flame, Loader2, CheckCircle, 
  XCircle, Clock, Shield, ExternalLink, Copy, RefreshCw,
  AlertCircle, Wallet
} from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ChainInfo {
  id: string;
  name: string;
  network: string;
  status: string;
  contractDeployed: boolean;
}

interface BridgeInfo {
  custodyAddress: string;
  supportedChains: ChainInfo[];
  phase: string;
  status: string;
  mode: string;
  contracts: {
    ethereum: { deployed: boolean; address: string };
    solana: { deployed: boolean; address: string };
  };
}

interface ChainStatus {
  chain: string;
  connected: boolean;
  blockHeight?: number;
  latency?: number;
  error?: string;
}

interface Transfer {
  id: string;
  type: 'lock' | 'release' | 'mint' | 'burn';
  amount: string;
  status: string;
  sourceChain?: string;
  targetChain?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  createdAt: string;
}

type BridgeDirection = 'outbound' | 'inbound';

const CHAIN_ICONS: Record<string, string> = {
  ethereum: 'Ξ',
  solana: '◎',
  trustlayer: '🌊',
};

const formatAmount = (amount: string): string => {
  try {
    const num = BigInt(amount);
    const divisor = BigInt('1000000000000000000');
    const whole = num / divisor;
    const decimal = (num % divisor).toString().padStart(18, '0').slice(0, 4);
    return `${whole}.${decimal}`;
  } catch {
    return '0';
  }
};

const convertToSmallestUnit = (amt: string): string => {
  if (!amt) return '0';
  const parts = amt.split('.');
  const wholePart = parts[0] || '0';
  const decimalPart = (parts[1] || '').padEnd(18, '0').slice(0, 18);
  return (wholePart + decimalPart).replace(/^0+/, '') || '0';
};

export function BridgeInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<BridgeDirection>('outbound');
  const [targetChain, setTargetChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [amount, setAmount] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [sourceTxHash, setSourceTxHash] = useState('');

  const { data: bridgeInfo, isLoading: infoLoading } = useQuery<BridgeInfo>({
    queryKey: ['/api/bridge/info'],
    refetchInterval: 30000,
  });

  const { data: chainStatuses } = useQuery<ChainStatus[]>({
    queryKey: ['/api/bridge/chains/status'],
    refetchInterval: 10000,
  });

  const { data: transfers, refetch: refetchTransfers } = useQuery<Transfer[]>({
    queryKey: ['/api/bridge/transfers'],
    refetchInterval: 5000,
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Enter a valid amount');
      }
      if (!targetAddress) {
        throw new Error('Enter target wallet address');
      }
      const res = await apiRequest('POST', '/api/bridge/lock', {
        fromAddress: 'user-wallet', // In real app, get from wallet context
        amount: convertToSmallestUnit(amount),
        targetChain,
        targetAddress,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Lock Initiated',
        description: `Lock ID: ${data.lockId?.slice(0, 8)}... | Processing mint on ${targetChain}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bridge/transfers'] });
      setAmount('');
      setTargetAddress('');
    },
    onError: (error: any) => {
      toast({
        title: 'Lock Failed',
        description: error.message || 'Failed to lock tokens',
        variant: 'destructive',
      });
    },
  });

  const burnMutation = useMutation({
    mutationFn: async () => {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Enter a valid amount');
      }
      if (!targetAddress) {
        throw new Error('Enter Trust Layer wallet address');
      }
      if (!sourceTxHash) {
        throw new Error('Enter the burn transaction hash from external chain');
      }
      const res = await apiRequest('POST', '/api/bridge/burn', {
        sourceChain: targetChain,
        sourceAddress: 'user-external-wallet',
        amount: convertToSmallestUnit(amount),
        targetAddress,
        sourceTxHash,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Burn Verified',
        description: `Burn ID: ${data.burnId?.slice(0, 8)}... | Releasing SIG to Trust Layer`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bridge/transfers'] });
      setAmount('');
      setTargetAddress('');
      setSourceTxHash('');
    },
    onError: (error: any) => {
      toast({
        title: 'Burn Verification Failed',
        description: error.message || 'Failed to verify burn',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending':
      case 'processing':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const isTestnetMode = bridgeInfo?.mode === 'mock';

  return (
    <div className="space-y-6">
      {isTestnetMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Testnet Development Mode</span>
          </div>
          <p className="text-sm text-purple-400/70 mt-1">
            wSIG contracts not deployed yet. Bridge operations are simulated.
          </p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard glow className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Chain Status
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bridge/chains/status'] })}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {chainStatuses?.map((chain) => (
              <div
                key={chain.chain}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CHAIN_ICONS[chain.chain] || '🔗'}</span>
                  <span className="font-medium capitalize">{chain.chain}</span>
                </div>
                <div className="flex items-center gap-2">
                  {chain.connected ? (
                    <>
                      <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">
                        Block #{chain.blockHeight?.toLocaleString()}
                      </Badge>
                      <span className="text-xs text-gray-400">{chain.latency}ms</span>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-red-400 border-red-500/30">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌊</span>
                <span className="font-medium">Trust Layer</span>
              </div>
              <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                Active
              </Badge>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow className="p-4">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-purple-400" />
            Bridge Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Phase</span>
              <span className="font-medium">{bridgeInfo?.phase || 'Loading...'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status</span>
              <Badge variant="outline" className={isTestnetMode ? 'text-purple-400 border-purple-500/30' : 'text-green-400 border-green-500/30'}>
                {bridgeInfo?.status || 'Loading...'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Bridge Fee</span>
              <span className="font-medium text-cyan-400">0.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Ethereum wSIG</span>
              <span className="font-mono text-xs">
                {bridgeInfo?.contracts?.ethereum?.deployed ? (
                  <span className="text-green-400">Deployed</span>
                ) : (
                  <span className="text-purple-400">Pending</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Solana wSIG</span>
              <span className="font-mono text-xs">
                {bridgeInfo?.contracts?.solana?.deployed ? (
                  <span className="text-green-400">Deployed</span>
                ) : (
                  <span className="text-purple-400">Pending</span>
                )}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard glow className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={direction === 'outbound' ? 'default' : 'outline'}
            onClick={() => setDirection('outbound')}
            className={direction === 'outbound' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
            data-testid="btn-bridge-outbound"
          >
            <Lock className="w-4 h-4 mr-2" />
            Bridge Out (Lock)
          </Button>
          <Button
            variant={direction === 'inbound' ? 'default' : 'outline'}
            onClick={() => setDirection('inbound')}
            className={direction === 'inbound' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
            data-testid="btn-bridge-inbound"
          >
            <Flame className="w-4 h-4 mr-2" />
            Bridge In (Burn)
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={direction}
            initial={{ opacity: 0, x: direction === 'outbound' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'outbound' ? 20 : -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-3xl mb-2">
                  {direction === 'outbound' ? '🌊' : CHAIN_ICONS[targetChain]}
                </div>
                <span className="text-sm font-medium">
                  {direction === 'outbound' ? 'Trust Layer' : targetChain === 'ethereum' ? 'Ethereum' : 'Solana'}
                </span>
              </div>
              <ArrowRightLeft className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-3xl mb-2">
                  {direction === 'outbound' ? CHAIN_ICONS[targetChain] : '🌊'}
                </div>
                <span className="text-sm font-medium">
                  {direction === 'outbound' ? (targetChain === 'ethereum' ? 'Ethereum' : 'Solana') : 'Trust Layer'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Target Chain</label>
                <div className="flex gap-2">
                  <Button
                    variant={targetChain === 'ethereum' ? 'default' : 'outline'}
                    onClick={() => setTargetChain('ethereum')}
                    className="flex-1"
                    data-testid="btn-chain-ethereum"
                  >
                    <span className="mr-2">Ξ</span> Ethereum Sepolia
                  </Button>
                  <Button
                    variant={targetChain === 'solana' ? 'default' : 'outline'}
                    onClick={() => setTargetChain('solana')}
                    className="flex-1"
                    data-testid="btn-chain-solana"
                  >
                    <span className="mr-2">◎</span> Solana Devnet
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  {direction === 'outbound' ? 'Amount (SIG)' : 'Amount (wSIG)'}
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-800/50 border-white/10"
                  data-testid="input-bridge-amount"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  {direction === 'outbound' 
                    ? `Destination ${targetChain === 'ethereum' ? 'Ethereum' : 'Solana'} Address`
                    : 'Trust Layer Wallet Address'
                  }
                </label>
                <Input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder={targetChain === 'ethereum' ? '0x...' : 'So1...'}
                  className="bg-slate-800/50 border-white/10 font-mono text-sm"
                  data-testid="input-target-address"
                />
              </div>

              {direction === 'inbound' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Burn Transaction Hash ({targetChain === 'ethereum' ? 'Ethereum' : 'Solana'})
                  </label>
                  <Input
                    type="text"
                    value={sourceTxHash}
                    onChange={(e) => setSourceTxHash(e.target.value)}
                    placeholder={targetChain === 'ethereum' ? '0x...' : 'Transaction signature...'}
                    className="bg-slate-800/50 border-white/10 font-mono text-sm"
                    data-testid="input-source-tx"
                  />
                </div>
              )}

              {amount && parseFloat(amount) > 0 && (
                <div className="p-4 rounded-lg bg-slate-800/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount</span>
                    <span>{amount} {direction === 'outbound' ? 'SIG' : 'wSIG'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bridge Fee (0.1%)</span>
                    <span className="text-purple-400">-{(parseFloat(amount) * 0.001).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t border-white/10 pt-2 mt-2">
                    <span className="text-gray-400">You Receive</span>
                    <span className="text-green-400">
                      ~{(parseFloat(amount) * 0.999).toFixed(4)} {direction === 'outbound' ? 'wSIG' : 'SIG'}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                size="lg"
                onClick={() => direction === 'outbound' ? lockMutation.mutate() : burnMutation.mutate()}
                disabled={lockMutation.isPending || burnMutation.isPending || !amount || !targetAddress}
                data-testid="btn-execute-bridge"
              >
                {(lockMutation.isPending || burnMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : direction === 'outbound' ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock SIG & Mint wSIG
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Verify Burn & Release SIG
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </GlassCard>

      <GlassCard glow className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Transfers
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchTransfers()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {transfers && transfers.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transfers.slice(0, 10).map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${transfer.type === 'lock' ? 'bg-cyan-500/20' : 'bg-cyan-500/20'}`}>
                    {transfer.type === 'lock' ? (
                      <Lock className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Flame className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm capitalize">{transfer.type}</div>
                    <div className="text-xs text-gray-400">
                      {formatAmount(transfer.amount)} SIG
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(transfer.status)}>
                    {transfer.status}
                  </Badge>
                  {transfer.txHash && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No bridge transfers yet</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
