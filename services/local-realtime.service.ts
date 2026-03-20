let sharedEventSource: EventSource | null = null;
const subscribers = new Set<(event: string, data: any) => void>();

const LISTENERS = [
  'message:new', 'message:update', 'message:delete', 'message:seen', 'typing:start', 'typing:stop', 
  'recording:start', 'recording:stop', 'presence:update', 'user:update',
  'conversation:new', 'conversation:update',
  'call:initiate', 'call:offer', 'call:answer', 'call:ice-candidate', 
  'call:reject', 'call:end', 'call:busy'
];

function getEventSource() {
  if (sharedEventSource) return sharedEventSource;
  
  sharedEventSource = new EventSource('/api/realtime');
  
  LISTENERS.forEach(eventName => {
    sharedEventSource!.addEventListener(eventName, (e: any) => {
      try {
        const data = JSON.parse(e.data);
        subscribers.forEach(cb => cb(eventName, data));
      } catch (err) {
        console.error(`Error parsing SSE data for ${eventName}:`, err);
      }
    });
  });

  sharedEventSource.onerror = (err) => {
    console.error("SSE Connection Error:", err);
    // Browser automatically reconnects
  };

  return sharedEventSource;
}

export const LocalRealtimeService = {
  subscribe(onEvent: (event: string, data: any) => void) {
    getEventSource();
    subscribers.add(onEvent);

    return {
      cleanup: () => {
        subscribers.delete(onEvent);
        // Removed aggressive close to prevent flickering during component transitions
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
  },

  async setRecording(conversationId: string, isRecording: boolean) {
    try {
      await fetch('/api/realtime/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isRecording })
      });
    } catch (err) {
      console.error("Error setting recording status:", err);
    }
  },

  async setPresence(status: string) {
    try {
      await fetch('/api/realtime/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error("Error setting presence status:", err);
    }
  }
};
