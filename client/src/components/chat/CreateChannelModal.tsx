import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateChannelModal: React.FC<{ open: boolean; categories: string[]; onClose: () => void; onCreate: (payload: { name: string; description?: string; category?: string; type?: string }) => Promise<void> }> = ({ open, categories, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | undefined>(categories[0]);
  const [type, setType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    setCreating(true);
    try {
      await onCreate({ name, description, category, type });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="create-channel-modal">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md mx-4 bg-slate-950 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Create Channel</h3>
        <div className="grid gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel name" className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-channel-name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-channel-desc" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-channel-category">
            <option value="">No category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-channel-type">
            <option value="text">Text</option>
            <option value="voice">Voice (placeholder)</option>
            <option value="announcement">Announcement</option>
          </select>
          <div className="flex justify-end">
            <button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-channel-submit">{creating ? 'Creating…' : 'Create'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
