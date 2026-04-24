import React from 'react';
import type { Message } from '@shared/chat-types';

export const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className="flex gap-3 p-2" data-testid={`message-item-${message.id}`}>
      <img src={message.author.avatarUrl ?? '/avatar.png'} alt={message.author.username} className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-white">{message.author.username}</div>
          <div className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleTimeString()}</div>
        </div>
        <div className="text-sm text-slate-200">{message.content}</div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <button className="p-1" data-testid={`react-${message.id}`}>👍</button>
          <button className="p-1" data-testid={`reply-${message.id}`}>Reply</button>
          <div className="ml-2">{message.reactions?.map(r => `${r.emoji} ${r.count}`).join(' ')}</div>
        </div>
      </div>
    </div>
  );
};
