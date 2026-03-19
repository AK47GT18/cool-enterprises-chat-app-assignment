"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { decryptMessage } from '@/lib/encryption';
import { LocalRealtimeService } from '@/services/local-realtime.service';

interface ChatStore {
  conversations: any[];
  currentUser: any;
  presence: Record<string, any>;
  loading: boolean;
  totalUnreadCount: number;
  pendingHollersCount: number;
  refreshConversations: () => Promise<void>;
  markAsSeen: (conversationId: string) => void;
}

const ChatStoreContext = createContext<ChatStore>({
  conversations: [],
  currentUser: null,
  presence: {},
  loading: true,
  totalUnreadCount: 0,
  pendingHollersCount: 0,
  refreshConversations: async () => {},
  markAsSeen: () => {},
});

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingHollersCount, setPendingHollersCount] = useState(0);
  const fetchedRef = useRef(false);

  const markAsSeen = useCallback((conversationId: string) => {
    setConversations(current => {
      return current.map(c => {
        if (c.id === conversationId) {
          const updatedMembers = c.members?.map((m: any) => {
            if (m.userId === currentUser?.id) {
              return { ...m, hasSeenLatest: true };
            }
            return m;
          });
          return { ...c, members: updatedMembers };
        }
        return c;
      });
    });
  }, [currentUser?.id]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingHollers = useCallback(async () => {
    try {
      const response = await fetch('/api/contact-requests');
      if (response.ok) {
        const data = await response.json();
        setPendingHollersCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching pending hollers:", err);
    }
  }, []);

  const [presence, setPresence] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to local SSE realtime
    const subscription = LocalRealtimeService.subscribe((eventName, data) => {
      switch(eventName) {
        case 'message:new': {
          const decryptedBody = data.body ? decryptMessage(data.body) : data.body;
          
          setConversations(current => {
            const index = current.findIndex(c => c.id === data.conversationId);
            if (index === -1) {
               fetchConversations();
               return current;
            }
            const updated = [...current];
            const chat = { ...updated[index] };
            
            // Resolve sender
            let sender = data.sender;
            if (!sender) {
              if (data.senderId === currentUser.id) {
                sender = { username: currentUser.username || 'You', image: currentUser.image };
              } else {
                sender = { username: 'Someone', image: null }; // Fallback for list
              }
            }

            // Decrypt replyTo if present
            const replyTo = data.replyTo ? {
              ...data.replyTo,
              body: data.replyTo.body ? decryptMessage(data.replyTo.body) : data.replyTo.body
            } : null;

            chat.messages = [{ 
              ...data, 
              body: decryptedBody,
              sender,
              replyTo
            }];
            
            updated[index] = chat;
            // Move to top
            const [moved] = updated.splice(index, 1);
            return [moved, ...updated];
          });
          break;
        }

        case 'message:update':
          setConversations(current => {
            const index = current.findIndex(c => c.id === data.conversationId);
            if (index === -1) return current;
            const updated = [...current];
            const chat = { ...updated[index] };
            if (chat.messages?.[0]?.id === data.id) {
              chat.messages = [{ ...chat.messages[0], ...data }];
              updated[index] = chat;
            }
            return updated;
          });
          break;

        case 'message:seen': {
          setConversations(current => {
            return current.map(c => {
              if (c.id === data.conversationId) {
                const updatedMembers = c.members?.map((m: any) => {
                  if (m.userId === data.userId) {
                    return { ...m, hasSeenLatest: true };
                  }
                  return m;
                });
                return { ...c, members: updatedMembers };
              }
              return c;
            });
          });
          break;
        }
        case 'presence:update': {
          setPresence(prev => ({
            ...prev,
            [data.userId]: data.timestamp
          }));
          break;
        }
      }
    });

    // Broadcast presence every 1 min
    LocalRealtimeService.setPresence('online');
    const pingInterval = setInterval(() => {
      LocalRealtimeService.setPresence('online');
    }, 60000);

    // Prune stale presence (5 mins) every minute
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      setPresence(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [userId, timestamp] of Object.entries(next)) {
          if (now - (timestamp as number) > 5 * 60 * 1000) {
            delete next[userId];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 60000);

    return () => {
      subscription.cleanup();
      clearInterval(pingInterval);
      clearInterval(pruneInterval);
    };
  }, [currentUser, fetchConversations]);

  // Initial fetch for user and convos
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user) setCurrentUser(user);
      });

    fetchConversations();
    fetchPendingHollers();
  }, [fetchConversations, fetchPendingHollers]);

  const totalUnreadCount = React.useMemo(() => {
    return conversations.filter(c => {
      const me = c.members?.find((m: any) => m.userId === currentUser?.id);
      return me?.hasSeenLatest === false;
    }).length;
  }, [conversations, currentUser?.id]);

  const value = React.useMemo(() => ({ 
    conversations, 
    currentUser, 
    presence, 
    loading, 
    totalUnreadCount,
    pendingHollersCount,
    refreshConversations: fetchConversations,
    markAsSeen
  }), [conversations, currentUser, presence, loading, totalUnreadCount, pendingHollersCount, fetchConversations, markAsSeen]);

  return (
    <ChatStoreContext.Provider value={value}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore() {
  return useContext(ChatStoreContext);
}
