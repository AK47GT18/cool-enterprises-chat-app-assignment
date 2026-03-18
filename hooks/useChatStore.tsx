"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { decryptMessage } from '@/lib/encryption';

interface ChatStore {
  conversations: any[];
  currentUser: any;
  loading: boolean;
  refreshConversations: () => Promise<void>;
}

const ChatStoreContext = createContext<ChatStore>({
  conversations: [],
  currentUser: null,
  loading: true,
  refreshConversations: async () => {},
});

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const supabase = createClient();

    // Fetch current user once via profile API
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user) setCurrentUser(user);
      });

    // Fetch conversations once
    fetchConversations();

    // Realtime: only update on actual changes
    const channel = supabase
      .channel('global_store')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload: any) => {
          const decryptedBody = payload.new.body ? decryptMessage(payload.new.body) : payload.new.body;
          
          setConversations(current => {
            const index = current.findIndex(c => c.id === payload.new.conversationId);
            if (index === -1) {
               fetchConversations();
               return current;
            }
            const updated = [...current];
            const chat = { ...updated[index] };
            
            // Just update the latest message block for the ChatList preview
            chat.messages = [{ 
              ...payload.new, 
              body: decryptedBody,
              sender: { username: 'Someone', image: null } // Mocked sender for preview
            }];
            
            updated[index] = chat;
            // Move conversation to top
            const [moved] = updated.splice(index, 1);
            return [moved, ...updated];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Conversation' },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'UserConversation' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return (
    <ChatStoreContext.Provider value={{ conversations, currentUser, loading, refreshConversations: fetchConversations }}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore() {
  return useContext(ChatStoreContext);
}
