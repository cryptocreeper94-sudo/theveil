import React, { useState } from 'react';

export const RoleManager: React.FC<{ roles: any[]; members: any[]; onSave: (r: any) => Promise<void> }> = ({ roles = [], members = [], onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [perms, setPerms] = useState<{ [k: string]: boolean }>({ sendMessages: true, manageChannels: false });

  const createRole = async () => {
    const role = { id: `r-${Date.now()}`, name, color, permissions: perms };
    await onSave(role);
    setName('');
  };

  return (
    <div className="p-3 bg-slate-950/30 rounded-lg" data-testid="role-manager">
      <h4 className="text-sm text-white mb-2">Role Manager</h4>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="p-2 rounded-md bg-slate-900/40 text-white mb-2" data-testid="role-name" />
      <div className="flex items-center gap-2 mb-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 p-0 border-0" data-testid="role-color" />
        <div className="text-xs text-slate-400">Color</div>
      </div>

      <div className="grid gap-2 mb-2">
        {Object.keys(perms).map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={perms[p]} onChange={() => setPerms((s) => ({ ...s, [p]: !s[p] }))} data-testid={`perm-${p}`} />
            <span className="text-slate-300">{p}</span>
          </label>
        ))}
      </div>

      <button onClick={createRole} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="create-role">Create Role</button>
    </div>
  );
};
