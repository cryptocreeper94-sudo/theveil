import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateCommunityModal: React.FC<{ open: boolean; onClose: () => void; onCreate: (payload: { name: string; description?: string; privacy: string; icon?: File | null }) => Promise<void> }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite-only'>('public');
  const [icon, setIcon] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    setCreating(true);
    try {
      await onCreate({ name, description, privacy, icon });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="create-community-modal">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md mx-4 bg-slate-950 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Create Community</h3>

        <div className="grid gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-description" />
          <div>
            <label className="text-xs text-slate-400">Icon</label>
            <input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} className="mt-1" data-testid="create-community-icon" />
          </div>

          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-community-privacy">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite-only">Invite Only</option>
          </select>

          <div className="flex justify-end">
            <button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-community-submit">{creating ? 'Creating…' : 'Create'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
