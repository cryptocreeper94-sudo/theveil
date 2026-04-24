import React from 'react';
import type { NFT } from '@shared/nft-types';

export const NFTCard: React.FC<{ nft: NFT; onBuy?: (nft: NFT) => void; onView?: (nft: NFT) => void; onBid?: (nft: NFT) => void; }> = ({ nft, onBuy, onView, onBid }) => {
  return (
    <div className="rounded-lg overflow-hidden bg-slate-950/30 border border-slate-800/40" data-testid={`nft-card-${nft.id}`}>
      <div className="w-full h-48 bg-slate-800 flex items-center justify-center">
        {nft.image ? <img src={nft.image} alt={nft.name} className="object-cover w-full h-full" /> : <div className="text-slate-500">No image</div>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{nft.name ?? `#${nft.tokenId}`}</div>
            <div className="text-xs text-slate-400">{nft.collectionId}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white">{nft.price ?? '—'}</div>
            <div className="text-xs text-slate-400">price</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button data-testid={`nft-buy-${nft.id}`} onClick={() => onBuy?.(nft)} className="flex-1 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black text-sm">Buy</button>
          <button data-testid={`nft-bid-${nft.id}`} onClick={() => onBid?.(nft)} className="py-2 px-3 rounded-md bg-slate-800/40 text-white text-sm">Bid</button>
        </div>
      </div>
    </div>
  );
};
