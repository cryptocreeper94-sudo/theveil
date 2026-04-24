import React from 'react';

export const MessageActions: React.FC<{ onEdit: () => void; onDelete: () => void; onPin: () => void; onReply: () => void; onReact: () => void; onCopy: () => void }> = ({ onEdit, onDelete, onPin, onReply, onReact, onCopy }) => {
  return (
    <div className="flex gap-2 items-center" data-testid="message-actions">
      <button onClick={onReply} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-reply">Reply</button>
      <button onClick={onReact} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-react">React</button>
      <button onClick={onEdit} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-edit">Edit</button>
      <button onClick={onPin} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-pin">Pin</button>
      <button onClick={onCopy} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-copy">Copy</button>
      <button onClick={onDelete} className="p-2 rounded hover:bg-red-700/20 text-red-400" data-testid="action-delete">Delete</button>
    </div>
  );
};
