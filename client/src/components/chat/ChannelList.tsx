import React from 'react';
import type { Channel } from '@shared/chat-types';

export const ChannelList: React.FC<{ channels: Channel[]; onSelect: (id: string) => void; onCreate?: () => void }> = ({ channels, onSelect, onCreate }) => {
  return (
    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/40" data-testid="channel-list">
      <div className="text-xs text-slate-400 mb-2">Channels</div>
      <div className="space-y-2">
        {channels.map(c => (
          <button key={c.id} className="w-full text-left p-2 rounded-md hover:bg-slate-900/30 flex items-center justify-between" onClick={() => onSelect(c.id)} data-testid={`channel-${c.id}`}>
            <div className="text-sm text-white">#{c.name}</div>
            {c.unreadCount ? <div className="text-xs bg-pink-600 text-black px-2 rounded">{c.unreadCount}</div> : null}
          </button>
        ))}
        <button onClick={onCreate} className="w-full p-2 rounded-md bg-slate-800/40 text-white hover:bg-slate-700/50 transition-colors" data-testid="create-channel">+ Create Channel</button>
      </div>
    </div>
  );
};
