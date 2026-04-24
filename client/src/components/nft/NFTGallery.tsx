import React, { useState } from 'react';
import { NFTCard } from './NFTCard';
import type { NFT, Collection } from '@shared/nft-types';

export const NFTGallery: React.FC<{ items?: NFT[]; collections?: Collection[] }> = ({ items = [], collections = [] }) => {
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = items.filter(i => (!filterCollection || i.collectionId === filterCollection) && (search === '' || (i.name ?? '').toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-4" data-testid="nft-gallery">
      <div className="flex gap-2">
        <select value={filterCollection ?? ''} onChange={(e) => setFilterCollection(e.target.value || null)} className="p-2 rounded-md bg-slate-900/40 text-white">
          <option value="">All collections</option>
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="flex-1 p-2 rounded-md bg-slate-900/40 text-white" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(nft => <NFTCard key={nft.id} nft={nft} onView={() => { }} />)}
      </div>
    </div>
  );
};
