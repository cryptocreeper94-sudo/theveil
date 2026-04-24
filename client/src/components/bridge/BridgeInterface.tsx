import React, { useMemo, useState } from 'react';
import type { ChainConfig } from '@shared/bridge-types';

const CHAINS: ChainConfig[] = [
  { id: 'eth', name: 'Ethereum', short: 'ETH', rpcUrls: [] },
  { id: 'sol', name: 'Solana', short: 'SOL', rpcUrls: [] }
];

export const BridgeInterface: React.FC = () => {
  const [fromChain, setFromChain] = useState(CHAINS[0].id);
  const [toChain, setToChain] = useState(CHAINS[1].id);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fee = useMemo(() => '0.001', []);

  const onBridge = async () => {
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      alert('Bridge initiated (stub)');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/40" data-testid="bridge-interface">
      <h4 className="text-sm font-semibold text-white mb-2">Bridge</h4>

      <div className="grid gap-3">
        <div>
          <label className="text-xs text-slate-400">From</label>
          <select data-testid="bridge-from" value={fromChain} onChange={(e) => setFromChain(e.target.value)} className="w-full p-3 rounded-md bg-slate-900/40 text-white">
            {CHAINS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">To</label>
          <select data-testid="bridge-to" value={toChain} onChange={(e) => setToChain(e.target.value)} className="w-full p-3 rounded-md bg-slate-900/40 text-white">
            {CHAINS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Amount</label>
          <div className="flex gap-2 mt-1">
            <input data-testid="bridge-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="flex-1 p-3 rounded-md bg-slate-900/40 text-white" />
            <button data-testid="bridge-max" onClick={() => setAmount('MAX')} className="p-3 rounded-md bg-slate-800/40 text-white min-w-[64px]">Max</button>
          </div>
        </div>

        <div className="text-xs text-slate-400">Estimated fee: <span className="text-cyan-300">{fee}</span></div>

        <button data-testid="bridge-button" onClick={onBridge} disabled={processing} className="py-3 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold">
          {processing ? 'Processing…' : 'Bridge'}
        </button>
      </div>
    </div>
  );
};
