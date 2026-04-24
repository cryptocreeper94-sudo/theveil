import React, { useState } from 'react';
import type { Token, LiquidityPosition } from '@shared/dex-types';

export const LiquidityPanel: React.FC = () => {
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [adding, setAdding] = useState(false);

  const onAdd = async () => {
    setAdding(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      alert('Add liquidity (stub)');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-800/40" data-testid="liquidity-panel">
      <div className="text-sm font-semibold text-white mb-2">Liquidity</div>

      <div className="grid gap-2">
        <div className="flex gap-2">
          <input className="flex-1 p-3 rounded-md bg-slate-900/40 text-white" value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="Amount A" />
          <select className="w-28 bg-slate-800/40 p-3 rounded-md text-white">
            <option>Token A</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input className="flex-1 p-3 rounded-md bg-slate-900/40 text-white" value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="Amount B" />
          <select className="w-28 bg-slate-800/40 p-3 rounded-md text-white">
            <option>Token B</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div>LP share: <span className="text-cyan-300">0.00%</span></div>
          <div>LP balance: <span className="text-slate-200">0</span></div>
        </div>
        <button data-testid="add-liquidity" onClick={onAdd} disabled={adding} className="py-3 rounded-md bg-gradient-to-r from-pink-500 to-purple-500 text-black font-semibold">
          {adding ? 'Adding…' : 'Add Liquidity'}
        </button>
      </div>
    </div>
  );
};
