"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { decryptMessage } from '@/lib/encryption';
import { LocalRealtimeService } from '@/services/local-realtime.service';

interface ChatStore {
  conversations: any[];
  currentUser: any;
  presence: Record<string, any>;
  loading: boolean;
  refreshConversations: () => Promise<void>;
  markAsSeen: (conversationId: string) => void;
}

const ChatStoreContext = createContext<ChatStore>({
  conversations: [],
  currentUser: null,
  presence: {},
  loading: true,
  refreshConversations: async () => {},
  markAsSeen: () => {},
});

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

            chat.messages = [{ 
              ...data, 
              body: decryptedBody,
              sender
            }];
            
            updated[index] = chat;
            // Move to top
            const [moved] = updated.splice(index, 1);
            return [moved, ...updated];
          });
          break;
        }

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
      }
    });

    return () => {
      subscription.cleanup();
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
  }, [fetchConversations]);

  const value = React.useMemo(() => ({ 
    conversations, 
    currentUser, 
    presence, 
    loading, 
    refreshConversations: fetchConversations,
    markAsSeen
  }), [conversations, currentUser, presence, loading, fetchConversations, markAsSeen]);

  return (
    <ChatStoreContext.Provider value={value}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore() {
  return useContext(ChatStoreContext);
}
