import React from 'react';
import type { Member } from '../../../shared/chat-types';

export const MemberProfile: React.FC<{ member: Member; onDM: (id: string) => void; onKick?: (id: string) => void; onBan?: (id: string) => void }> = ({ member, onDM, onKick, onBan }) => {
  return (
    <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/40" data-testid="member-profile">
      <div className="flex items-center gap-3">
        <img src={member.avatarUrl ?? '/avatar.png'} alt={member.username} className="h-16 w-16 rounded-full" />
        <div>
          <div className="text-lg font-semibold text-white">{member.username}</div>
          <div className="text-xs text-slate-400">Roles: {member.roles?.join(', ')}</div>
          <div className="text-xs text-slate-400 mt-1">Joined: {member.joinedAt}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => onDM(member.id)} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="dm-btn">Message</button>
        {onKick && <button onClick={() => onKick(member.id)} className="py-2 px-3 rounded-md bg-teal-600 text-black" data-testid="kick-btn">Kick</button>}
        {onBan && <button onClick={() => onBan(member.id)} className="py-2 px-3 rounded-md bg-red-600 text-white" data-testid="ban-btn">Ban</button>}
      </div>
    </div>
  );
};
