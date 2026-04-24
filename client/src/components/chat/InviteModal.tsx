import React, { useState } from 'react';

export const InviteModal: React.FC<{ open: boolean; onClose: () => void; onGenerate: (opts: { expiresAt?: string; maxUses?: number }) => Promise<{ code: string }>; existing?: { code: string; expiresAt?: string; uses?: number }[] }> = ({ open, onClose, onGenerate, existing = [] }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    try {
      await onGenerate({ expiresAt: expiresAt || undefined, maxUses });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="invite-modal">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-950 rounded p-4">
        <h4 className="text-white text-lg mb-2">Generate Invite</h4>
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-expires" />
        <input type="number" value={maxUses ?? ''} onChange={(e) => setMaxUses(Number(e.target.value) || undefined)} placeholder="Max uses (optional)" className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-maxuses" />
        <div className="flex justify-end gap-2">
          <button onClick={gen} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="invite-gen">{loading ? 'Generating…' : 'Generate'}</button>
        </div>

        <div className="mt-3">
          <h5 className="text-sm text-slate-300 mb-2">Existing Invites</h5>
          <div className="space-y-2">
            {existing.map((i) => (
              <div key={i.code} className="flex items-center justify-between p-2 bg-slate-900/20 rounded">
                <div className="text-xs text-white">{i.code}</div>
                <div className="text-xs text-slate-400">Uses: {i.uses ?? 0}</div>
                <button className="text-xs text-pink-400" data-testid={`revoke-${i.code}`}>Revoke</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
