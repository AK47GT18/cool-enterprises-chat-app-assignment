"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LocalRealtimeService } from '@/services/local-realtime.service';

export interface CallLog {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'audio' | 'video';
  name: string;
  avatar: string;
  timestamp: number;
}

interface ChatStore {
  conversations: any[];
  currentUser: any;
  presence: Record<string, any>;
  loading: boolean;
  totalUnreadCount: number;
  pendingHollersCount: number;
  pendingHollers: any[];
  callsCount: number;
  callLogs: CallLog[];
  refreshConversations: () => Promise<void>;
  refreshPendingHollers: () => Promise<void>;
  markAsSeen: (conversationId: string) => void;
  addCallLog: (log: Omit<CallLog, 'id' | 'timestamp'>) => void;
}

const ChatStoreContext = createContext<ChatStore>({
  conversations: [],
  currentUser: null,
  presence: {},
  loading: true,
  totalUnreadCount: 0,
  pendingHollersCount: 0,
  pendingHollers: [],
  callsCount: 0,
  callLogs: [],
  refreshConversations: async () => {},
  refreshPendingHollers: async () => {},
  markAsSeen: () => {},
  addCallLog: () => {},
});

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingHollersCount, setPendingHollersCount] = useState(0);
  const [pendingHollers, setPendingHollers] = useState<any[]>([]);
  const [callsCount, setCallsCount] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const fetchedRef = useRef(false);

  // Initialize call logs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('call_logs');
    if (saved) {
      try {
        setCallLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse call logs", e);
      }
    }
  }, []);

  const addCallLog = useCallback((log: Omit<CallLog, 'id' | 'timestamp'>) => {
    const newLog: CallLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    setCallLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem('call_logs', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
        setPendingHollers(data);
        setPendingHollersCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching pending hollers:", err);
    }
  }, []);

  const [presence, setPresence] = useState<Record<string, any>>({});
  
  // Example: Listen for missed calls or incoming signals to increment callsCount
  // For now, we'll keep it as a placeholder that can be updated by services

  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to local SSE realtime
    const subscription = LocalRealtimeService.subscribe((eventName, data) => {
      switch(eventName) {
        case 'message:new': {
          setConversations(current => {
            const index = current.findIndex(c => c.id === data.conversationId);
            if (index === -1) {
                const now = Date.now();
                const lastFetch = (window as any)._lastConvoFetch || 0;
                if (now - lastFetch > 2000) {
                   (window as any)._lastConvoFetch = now;
                   fetchConversations();
                }
                return current;
            }

            // Clear typing status for this user when message arrives
            setPresence(prev => {
              const newState = { ...prev };
              if (newState[data.senderId]) {
                delete newState[data.senderId];
              }
              return newState;
            });

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

            chat.messages = [{ 
              ...data, 
              sender,
              replyTo: data.replyTo
            }];
            
            if (currentUser && data.senderId !== currentUser.id && chat.members) {
              const myMemberIndex = chat.members.findIndex((m: any) => m.userId === currentUser.id);
              if (myMemberIndex !== -1) {
                // Ensure we create a new members array to trigger re-renders
                const newMembers = [...chat.members];
                newMembers[myMemberIndex] = { ...newMembers[myMemberIndex], hasSeenLatest: false };
                chat.members = newMembers;
              }
            }
            
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
        case 'holler:new': {
          fetchPendingHollers();
          break;
        }
        case 'conversation:new': {
          fetchConversations();
          break;
        }
        case 'conversation:update': {
          if (data.deleted) {
            // Community was deleted — remove it from the list
            setConversations(current => current.filter(c => c.id !== data.id));
          } else {
            setConversations(current => {
              return current.map(c => {
                if (c.id === data.id) {
                  const updatedChat = { ...c, ...data };
                  if (data.unblocked) {
                    updatedChat.blockStatus = null;
                  }
                  return updatedChat;
                }
                return c;
              });
            });
          }
          break;
        }
        case 'user:update': {
          setConversations(current => {
            return current.map(c => {
              const updatedMembers = c.members?.map((m: any) => {
                if (m.userId === data.id) {
                  return {
                    ...m,
                    user: { ...m.user, username: data.username, image: data.image }
                  };
                }
                return m;
              });

              let chatName = c.name;
              let chatImageUrl = c.imageUrl;
              if (!c.isGroup) {
                const otherMember = updatedMembers?.find((m: any) => m.userId !== currentUser?.id);
                if (otherMember && otherMember.userId === data.id) {
                  chatName = data.username;
                  chatImageUrl = data.image;
                }
              }

              return { ...c, members: updatedMembers, name: chatName, imageUrl: chatImageUrl };
            });
          });
          break;
        }
      }
    });

    // Broadcast presence every 20s
    LocalRealtimeService.setPresence('online');
    const pingInterval = setInterval(() => {
      LocalRealtimeService.setPresence('online');
    }, 20000);

    // Prune stale presence (1 min) every 30s
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      setPresence(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [userId, timestamp] of Object.entries(next)) {
          if (now - (timestamp as number) > 60000) {
            delete next[userId];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 30000);

    return () => {
      subscription.cleanup();
      clearInterval(pingInterval);
      clearInterval(pruneInterval);
    };
  }, [currentUser, fetchConversations, fetchPendingHollers]);

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
    pendingHollers,
    callsCount,
    callLogs,
    refreshConversations: fetchConversations,
    refreshPendingHollers: fetchPendingHollers,
    markAsSeen,
    addCallLog
  }), [conversations, currentUser, presence, loading, totalUnreadCount, pendingHollersCount, pendingHollers, callsCount, callLogs, fetchConversations, fetchPendingHollers, markAsSeen, addCallLog]);

  return (
    <ChatStoreContext.Provider value={value}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore() {
  return useContext(ChatStoreContext);
}
