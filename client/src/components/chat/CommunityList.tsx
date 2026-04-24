import React from 'react';
import { motion } from 'framer-motion';
import type { Community } from '@shared/chat-types';

type Props = {
  communities: Community[];
  activeCommunityId?: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export const CommunityList: React.FC<Props> = ({ communities, activeCommunityId, onSelect, onCreate }) => {
  return (
    <aside className="w-full sm:w-64 bg-slate-950/40 backdrop-blur-sm p-2 rounded-lg" data-testid="community-list">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold text-white">Communities</h3>
        <button
          onClick={onCreate}
          className="p-2 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black text-xs min-h-[40px]"
          data-testid="community-create-btn"
          aria-label="Create community"
        >
          + Create
        </button>
      </div>

      <div className="space-y-2">
        {communities.length === 0 && <div className="text-slate-400 text-sm px-2">No communities</div>}
        {communities.map((c) => (
          <motion.button
            key={c.id}
            onClick={() => onSelect(c.id)}
            layout
            className={`w-full flex items-center gap-3 p-2 rounded-md ${activeCommunityId === c.id ? 'bg-slate-900/60 ring-1 ring-cyan-400' : 'hover:bg-slate-900/20'}`}
            data-testid={`community-${c.id}`}
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-black font-bold">
              {c.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm text-white truncate">{c.name}</div>
              <div className="text-xs text-slate-400 truncate">{c.description ?? ''}</div>
            </div>
            {('unreadCount' in c && (c as any).unreadCount) ? <div className="px-2 py-1 text-xs bg-pink-600 text-black rounded" data-testid={`community-unread-${c.id}`}>{(c as any).unreadCount}</div> : null}
          </motion.button>
        ))}
      </div>
    </aside>
  );
};
