import React from 'react';

export const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (!users || users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} is typing…` : `${users.join(', ')} are typing…`;
  return (
    <div className="text-xs text-slate-400 italic p-2" data-testid="typing-indicator">
      {label}
    </div>
  );
};
