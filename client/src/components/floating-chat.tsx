import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Maximize2, Send, Users, Loader2, Crown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, Channel } from '@shared/chat-types';
import { useAuth } from '@/hooks/use-auth';
import { FoundersBadge } from './founders-badge';

function useMiniChatWebSocket(channelId: string | null, onNewMessage: (msg: Message) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
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

  return { isConnected };
}

export function FloatingChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Hidden by default
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleHidden = () => setIsHidden(!isHidden);

  const { data: foundersStatus } = useQuery<{ isFounder: boolean; tier: string | null }>({
    queryKey: ['/api/user/founders-status'],
    queryFn: () => apiRequest('GET', '/api/user/founders-status').then(r => r.json()),
    enabled: !!user,
  });

  const { data: communitiesData } = useQuery<{ communities: any[] }>({
    queryKey: ['/api/community/list'],
    queryFn: () => apiRequest('GET', '/api/community/list').then(r => r.json()),
    enabled: isOpen,
  });

  const defaultCommunity = communitiesData?.communities?.[0];

  const { data: channelsData } = useQuery<{ channels: Channel[] }>({
    queryKey: ['/api/community', defaultCommunity?.id, 'channels'],
    queryFn: () => apiRequest('GET', `/api/community/${defaultCommunity?.id}/channels`).then(r => r.json()),
    enabled: !!defaultCommunity?.id && isOpen,
  });

  useEffect(() => {
    if (!activeChannel && channelsData?.channels?.length) {
      setActiveChannel(channelsData.channels[0].id);
    }
  }, [channelsData, activeChannel]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/channel', activeChannel, 'messages'],
    queryFn: () => apiRequest('GET', `/api/channel/${activeChannel}/messages`).then(r => r.json()),
    enabled: !!activeChannel && isOpen,
  });

  const handleNewMessage = useCallback((msg: Message) => {
    queryClient.setQueryData<{ messages: Message[] }>(
      ['/api/channel', activeChannel, 'messages'],
      (old) => {
        if (!old) return { messages: [msg] };
        if (old.messages.some(m => m.id === msg.id)) return old;
        return { messages: [...old.messages, msg] };
      }
    );
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [activeChannel, queryClient, isOpen]);

  const { isConnected } = useMiniChatWebSocket(activeChannel, handleNewMessage);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/channel/${activeChannel}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channel', activeChannel, 'messages'] });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !activeChannel) return;
    sendMutation.mutate(input.trim());
    setInput('');
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messagesData]);

  const messages = messagesData?.messages || [];
  const channels = channelsData?.channels || [];

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-44 left-4 w-80 sm:w-96 h-[400px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
            data-testid="floating-chat-window"
          >
            <div className="bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Signal Chat</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-teal-400'}`} />
                {foundersStatus?.isFounder && (
                  <FoundersBadge tier={foundersStatus.tier as any} size="sm" showLabel={false} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  data-testid="button-minimize-chat"
                >
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  data-testid="button-close-chat"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {channels.length > 1 && (
              <div className="px-2 py-2 border-b border-slate-700/50 flex gap-1 overflow-x-auto">
                {channels.slice(0, 4).map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      activeChannel === channel.id
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    #{channel.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Be the first to say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(msg.author?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {msg.author?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 break-words">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  data-testid="input-chat-message"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-lg transition-colors"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-44 left-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl px-4 py-2 flex items-center gap-3 z-50"
          >
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-white text-sm font-medium">Signal Chat</span>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              data-testid="button-maximize-chat"
            >
              <Maximize2 className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden state - small restore button */}
      <AnimatePresence>
        {isHidden && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={toggleHidden}
            className="fixed bottom-28 left-4 w-8 h-8 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-slate-700/90 transition-colors"
            data-testid="button-restore-chat"
            aria-label="Restore Chat"
          >
            <MessageCircle className="w-4 h-4 text-cyan-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <AnimatePresence>
        {!isHidden && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsOpen(!isOpen);
              setIsMinimized(false);
            }}
            onContextMenu={(e) => { e.preventDefault(); toggleHidden(); }}
            className="fixed bottom-28 left-4 w-14 h-14 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-toggle-chat"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <MessageCircle className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
