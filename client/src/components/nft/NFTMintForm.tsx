import React, { useState } from 'react';
import type { Collection } from '@shared/nft-types';

export const NFTMintForm: React.FC<{ collections?: Collection[] }> = ({ collections = [] }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState<{ type: string; value: string }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(collections[0]?.id ?? null);
  const [minting, setMinting] = useState(false);

  const onMint = async () => {
    setMinting(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      alert('Mint requested (stub)');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/40" data-testid="nft-mint-form">
      <h4 className="text-sm font-semibold text-white mb-2">Mint NFT</h4>

      <div className="grid gap-3">
        <div>
          <label className="text-xs text-slate-400">Image</label>
          <div className="mt-2 p-3 rounded-md border border-dashed border-slate-700 bg-slate-900/20">
            <input data-testid="nft-image-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            {imageFile && <div className="mt-2 text-sm text-slate-300">{imageFile.name}</div>}
          </div>
        </div>

        <input data-testid="nft-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 rounded-md bg-slate-900/40 text-white" />
        <textarea data-testid="nft-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="p-2 rounded-md bg-slate-900/40 text-white" rows={3} />

        <select data-testid="nft-collection" value={selectedCollection ?? ''} onChange={(e) => setSelectedCollection(e.target.value || null)} className="p-2 rounded-md bg-slate-900/40 text-white">
          <option value="">Select collection</option>
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">Gas estimate: <span className="text-cyan-300">—</span></div>
          <button data-testid="mint-button" onClick={onMint} disabled={minting} className="py-2 px-4 rounded-md bg-gradient-to-r from-pink-500 to-purple-500 text-black">
            {minting ? 'Minting…' : 'Mint'}
          </button>
        </div>
      </div>
    </div>
  );
};
