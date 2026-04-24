import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message } from '@shared/chat-types';
import { Loader2 } from 'lucide-react';

function useChatWebSocket(channelId: string, onNewMessage: (msg: Message) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!channelId) return;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/chat?channel=${channelId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_CHANNEL', payload: { channelId } }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            onNewMessage(data.payload);
          } else if (data.type === 'TYPING_START') {
            setTypingUsers(prev => [...new Set([...prev, data.payload.userId])]);
          } else if (data.type === 'TYPING_STOP') {
            setTypingUsers(prev => prev.filter(u => u !== data.payload.userId));
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'HEARTBEAT' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [channelId, onNewMessage]);

  const sendTypingStart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING_START' }));
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING_STOP' }));
    }
  }, []);

  return { isConnected, typingUsers, sendTypingStart, sendTypingStop };
}

export const ChatContainer: React.FC<{ channelId: string }> = ({ channelId }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleNewMessage = useCallback((msg: Message) => {
    queryClient.setQueryData<{ messages: Message[] }>(
      ['/api/channel', channelId, 'messages'],
      (old) => {
        if (!old) return { messages: [msg] };
        if (old.messages.some(m => m.id === msg.id)) return old;
        return { messages: [...old.messages, msg] };
      }
    );
  }, [channelId, queryClient]);

  const { isConnected, typingUsers, sendTypingStart, sendTypingStop } = useChatWebSocket(channelId, handleNewMessage);

  const { data: messagesData, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/channel', channelId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/channel/${channelId}/messages?limit=50`).then(r => r.json()),
    enabled: !!channelId,
    staleTime: 30000,
  });
  const messages = messagesData?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/channel/${channelId}/messages`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.message) {
        handleNewMessage(data.message);
      }
    },
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMutation.mutate(input);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="px-3 py-1 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-800/40">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </div>
      
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2" data-testid="chat-message-list">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => <MessageItem key={msg.id} message={msg} />)
        )}
      </div>

      <div className="p-3 border-t border-slate-800/40 bg-slate-900/20">
        {typingUsers.length > 0 && (
          <div className="text-xs text-cyan-400 mb-2 animate-pulse">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown}
            placeholder="Type a message..." 
            className="flex-1 p-3 rounded-md bg-slate-900/40 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" 
            data-testid="chat-input" 
          />
          <button 
            onClick={sendMessage} 
            disabled={sendMutation.isPending || !input.trim()}
            className="px-4 py-3 rounded-md bg-cyan-500 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors" 
            data-testid="chat-send"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
