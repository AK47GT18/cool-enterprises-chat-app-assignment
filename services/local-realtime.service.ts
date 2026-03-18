/**
 * Local Realtime Service using Server-Sent Events (SSE).
 * 100% Local, no Cloud dependencies.
 */
export const LocalRealtimeService = {
  subscribe(onEvent: (event: string, data: any) => void) {
    const eventSource = new EventSource('/api/realtime');

    eventSource.onmessage = (event) => {
      // Handle generic message if needed
    };

    const listeners = ['message:new', 'message:seen', 'typing:start', 'typing:stop'];
    
    listeners.forEach(eventName => {
      eventSource.addEventListener(eventName, (e: any) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(eventName, data);
        } catch (err) {
          console.error(`Error parsing SSE data for ${eventName}:`, err);
        }
      });
    });

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      // EventSource will automatically attempt to reconnect
    };

    return {
      cleanup: () => {
        eventSource.close();
      }
    };
  },

  async setTyping(conversationId: string, isTyping: boolean) {
    try {
      await fetch('/api/realtime/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isTyping })
      });
    } catch (err) {
      console.error("Error setting typing status:", err);
    }
  }
};
