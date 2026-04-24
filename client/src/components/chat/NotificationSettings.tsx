import React, { useState } from 'react';

export const NotificationSettings: React.FC<{ onSave: (cfg: any) => Promise<void>; initial?: any }> = ({ onSave, initial = {} }) => {
  const [mute, setMute] = useState(initial.mute ?? false);
  const [frequency, setFrequency] = useState(initial.frequency ?? 'all');
  const [desktop, setDesktop] = useState(initial.desktop ?? true);
  const [sound, setSound] = useState(initial.sound ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ mute, frequency, desktop, sound });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 bg-slate-950/30 rounded" data-testid="notification-settings">
      <h4 className="text-sm text-white mb-2">Notifications</h4>
      <label className="flex items-center gap-2"><input type="checkbox" checked={mute} onChange={() => setMute(!mute)} data-testid="notif-mute" /> <span className="text-slate-300">Mute</span></label>
      <div className="mt-2">
        <label className="text-xs text-slate-400">Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" data-testid="notif-frequency">
          <option value="all">All messages</option>
          <option value="mentions">Mentions only</option>
          <option value="none">None</option>
        </select>
      </div>
      <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={desktop} onChange={() => setDesktop(!desktop)} data-testid="notif-desktop" /> <span className="text-slate-300">Desktop notifications</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={sound} onChange={() => setSound(!sound)} data-testid="notif-sound" /> <span className="text-slate-300">Sound</span></label>
      <div className="flex justify-end mt-3">
        <button onClick={save} disabled={saving} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="notif-save">{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
};
