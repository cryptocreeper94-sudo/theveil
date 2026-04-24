import React, { useState } from 'react';
import type { Member } from '../../../shared/chat-types';

export const MemberList: React.FC<{ members: Member[]; onView: (id: string) => void }> = ({ members, onView }) => {
  const [query, setQuery] = useState('');
  const filtered = members.filter(m => m.username.toLowerCase().includes(query.toLowerCase()));
  return (
    <aside className="w-full sm:w-64 bg-slate-950/30 rounded-lg p-2" data-testid="member-list">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm text-white">Members</h4>
        <div className="text-xs text-slate-400">{members.length}</div>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="w-full p-2 rounded-md bg-slate-900/40 text-white mb-2" data-testid="member-search" />

      <div className="space-y-2">
        {filtered.map(m => (
          <button key={m.id} onClick={() => onView(m.id)} className="w-full p-2 rounded-md hover:bg-slate-900/20 flex items-center gap-2" data-testid={`member-${m.id}`}>
            <img src={m.avatarUrl ?? '/avatar.png'} alt={m.username} className="h-8 w-8 rounded-full" />
            <div className="flex-1 text-left">
              <div className="text-sm text-white">{m.username}</div>
              <div className="text-xs text-slate-400">{m.roles?.join(', ')}</div>
            </div>
            <div className={`h-3 w-3 rounded-full ${m.online ? 'bg-green-400' : 'bg-gray-500'}`} data-testid={`member-presence-${m.id}`} />
          </button>
        ))}
      </div>
    </aside>
  );
};
