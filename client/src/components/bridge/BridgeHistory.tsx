import React from 'react';
import type { BridgeTransaction } from '@shared/bridge-types';

export const BridgeHistory: React.FC<{ items?: BridgeTransaction[] }> = ({ items = [] }) => {
  return (
    <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-800/40" data-testid="bridge-history">
      <h4 className="text-sm font-semibold text-white mb-2">Bridge History</h4>
      <div className="space-y-2">
        {items.length === 0 ? <div className="text-slate-400 text-sm">No bridge activity</div> : items.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-2 rounded-md bg-slate-900/30">
            <div>
              <div className="text-sm text-white">{tx.fromChain} → {tx.toChain}</div>
              <div className="text-xs text-slate-400">{tx.amount} • {new Date(tx.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`text-xs px-2 py-1 rounded ${tx.status === 'completed' ? 'bg-green-600 text-black' : tx.status === 'failed' ? 'bg-red-600' : 'bg-teal-500 text-black'}`}>{tx.status}</div>
              {tx.txHash && (
                <a 
                  className="text-xs text-cyan-300 mt-1 hover:underline" 
                  href={
                    tx.toChain.toLowerCase().includes('ethereum') || tx.toChain.toLowerCase().includes('sepolia') 
                      ? `https://sepolia.etherscan.io/tx/${tx.txHash}` 
                      : tx.toChain.toLowerCase().includes('solana') || tx.toChain.toLowerCase().includes('devnet')
                        ? `https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet` 
                        : tx.toChain.toLowerCase().includes('darkwave') || tx.toChain.toLowerCase().includes('dwsc')
                          ? `/explorer/tx/${tx.txHash}`
                          : `/explorer/tx/${tx.txHash}`
                  }
                  target={tx.toChain.toLowerCase().includes('darkwave') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                >Explorer</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
