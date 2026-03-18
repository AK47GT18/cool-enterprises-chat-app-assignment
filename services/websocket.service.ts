import { createClient } from '@/utils/supabase/client';

/**
 * Client-side Realtime Service for Supabase WebSockets.
 * Handles Presence, Typing Indicators, and Realtime messaging efficiently.
 */
export const WebSocketService = {
  createChatChannel(conversationId: string, userId: string, callbacks: {
    onMessage?: (payload: any) => void;
    onReaction?: (payload: any) => void;
    onMessageUpdate?: (payload: any) => void;
    onTypingStateChange?: (typingUsers: string[]) => void;
  }) {
    const supabase = createClient();
    const channel = supabase.channel(`chat:${conversationId}`);

    // DB Changes
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message', filter: `conversationId=eq.${conversationId}` }, payload => {
        callbacks.onMessage?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Message', filter: `conversationId=eq.${conversationId}` }, payload => {
        callbacks.onMessageUpdate?.(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Reaction' }, payload => {
        callbacks.onReaction?.(payload);
      });

    // Presence Sync for Typing Status
    let isCurrentlyTyping = false;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingIds = Object.values(state).flatMap((presences: any) => 
          presences.filter((p: any) => p.typing && p.userId !== userId).map((p: any) => p.userId)
        );
        callbacks.onTypingStateChange?.(Array.from(new Set(typingIds)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, typing: false, onlineAt: new Date().toISOString() });
        }
      });

    return {
      channel,
      supabase,
      setTyping: async (isTyping: boolean) => {
        if (isCurrentlyTyping === isTyping) return;
        isCurrentlyTyping = isTyping;
        await channel.track({ userId, typing: isTyping, onlineAt: new Date().toISOString() });
      },
      cleanup: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
