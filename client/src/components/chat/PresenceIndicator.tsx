import React from 'react';

export const PresenceIndicator: React.FC<{ status: 'online' | 'idle' | 'dnd' | 'offline' }> = ({ status }) => {
  const color = status === 'online' ? 'bg-green-400' : status === 'idle' ? 'bg-teal-400' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500';
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} data-testid="presence-indicator" />;
};
