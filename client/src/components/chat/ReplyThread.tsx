import React, { useState } from 'react';
import type { Reply } from '../../../shared/chat-types';

export const ReplyThread: React.FC<{ replies?: Reply[]; onReply: (text: string) => void }> = ({ replies = [], onReply }) => {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    await onReply(text);
    setText('');
  };

  return (
    <div className="p-2 bg-slate-950/20 rounded-md" data-testid="reply-thread">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Thread ({replies.length})</div>
        <button onClick={() => setOpen(!open)} className="text-xs p-1 rounded bg-slate-800/30" data-testid="thread-toggle">{open ? 'Collapse' : 'Expand'}</button>
      </div>

      {open && (
        <>
          <div className="space-y-2 mt-2">
            {replies.map((r) => (
              <div key={r.id} className="p-2 bg-slate-900/20 rounded" data-testid={`reply-${r.id}`}>
                <div className="text-xs text-slate-400">{r.createdAt}</div>
                <div className="text-sm text-white">{r.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" className="flex-1 p-2 rounded-md bg-slate-900/40 text-white" data-testid="reply-input" />
            <button onClick={submit} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="reply-submit">Reply</button>
          </div>
        </>
      )}
    </div>
  );
};
