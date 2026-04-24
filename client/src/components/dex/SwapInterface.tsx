import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Token, SwapQuote } from '@shared/dex-types';
import { motion } from 'framer-motion';

export const SwapInterface: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loadingSwap, setLoadingSwap] = useState(false);

  const { data: tokenList = [], isLoading: tokensLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      return [
        { address: null, symbol: 'ETH', decimals: 18 },
        { address: '0xUSDC', symbol: 'USDC', decimals: 6 }
      ] as Token[];
    }
  });

  const quote = useMemo<SwapQuote | null>(() => {
    if (!fromToken || !toToken || !amount) return null;
    return {
      amountIn: amount,
      amountOut: (parseFloat(amount) * 0.99).toString(),
      priceImpactPct: 0.4,
      executionPrice: (1 / 0.99).toString()
    };
  }, [fromToken, toToken, amount]);

  const onSwap = async () => {
    setLoadingSwap(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      alert('Swap initiated (stub)');
    } finally {
      setLoadingSwap(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 backdrop-blur-sm" data-testid="swap-interface">
      <div className="text-sm font-semibold text-white mb-2">Swap</div>

      <div className="grid gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-slate-400">From</label>
          <div className="flex gap-2 mt-1">
            <input
              aria-label="from-amount"
              data-testid="swap-from-amount"
              className="flex-1 bg-slate-900/40 p-3 rounded-md text-white placeholder-slate-500 min-h-[48px]"
              value={amount}
              inputMode="decimal"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
            />
            <select
              data-testid="swap-from-token"
              value={fromToken?.address ?? ''}
              onChange={(e) => {
                const addr = e.target.value;
                setFromToken(tokenList.find(t => (t.address ?? '') === addr) ?? null);
              }}
              className="w-28 bg-slate-800/40 p-3 rounded-md text-white"
            >
              <option value="">Select</option>
              {tokenList.map(t => <option key={t.address ?? t.symbol} value={t.address ?? ''}>{t.symbol}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-400">To</label>
          <div className="flex gap-2 mt-1">
            <input className="flex-1 bg-slate-900/40 p-3 rounded-md text-white placeholder-slate-500 min-h-[48px]" value={quote?.amountOut ?? ''} readOnly />
            <select
              data-testid="swap-to-token"
              value={toToken?.address ?? ''}
              onChange={(e) => {
                const addr = e.target.value;
                setToToken(tokenList.find(t => (t.address ?? '') === addr) ?? null);
              }}
              className="w-28 bg-slate-800/40 p-3 rounded-md text-white"
            >
              <option value="">Select</option>
              {tokenList.map(t => <option key={t.address ?? t.symbol} value={t.address ?? ''}>{t.symbol}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <label>Slippage</label>
            <input
              data-testid="slippage-input"
              type="number"
              step="0.1"
              min="0"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="w-20 bg-slate-800/40 p-2 rounded-md text-white"
            />
            <span className="text-slate-500">%</span>
          </div>
          <div>Price impact: <span className="text-pink-400">{quote ? `${quote.priceImpactPct}%` : '—'}</span></div>
        </div>

        <button
          data-testid="swap-button"
          onClick={onSwap}
          disabled={loadingSwap || !quote}
          className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold disabled:opacity-60"
        >
          {loadingSwap ? 'Swapping…' : 'Swap'}
        </button>
      </div>
    </div>
  );
};
