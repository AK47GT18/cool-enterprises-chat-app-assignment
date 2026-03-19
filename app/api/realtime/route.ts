import { NextRequest } from 'next/server';
import { realtimeBus, REALTIME_EVENTS } from '@/lib/realtime-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Listener for new messages
      const onNewMessage = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_NEW, data);
      const onSeen = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_SEEN, data);
      const onTypingStart = (data: any) => sendEvent(REALTIME_EVENTS.TYPING_START, data);
      const onTypingStop = (data: any) => sendEvent(REALTIME_EVENTS.TYPING_STOP, data);
      const onRecordingStart = (data: any) => sendEvent(REALTIME_EVENTS.RECORDING_START, data);
      const onRecordingStop = (data: any) => sendEvent(REALTIME_EVENTS.RECORDING_STOP, data);
      const onPresenceUpdate = (data: any) => sendEvent(REALTIME_EVENTS.PRESENCE_UPDATE, data);

      realtimeBus.on(REALTIME_EVENTS.MESSAGE_NEW, onNewMessage);
      realtimeBus.on(REALTIME_EVENTS.MESSAGE_SEEN, onSeen);
      realtimeBus.on(REALTIME_EVENTS.TYPING_START, onTypingStart);
      realtimeBus.on(REALTIME_EVENTS.TYPING_STOP, onTypingStop);
      realtimeBus.on(REALTIME_EVENTS.RECORDING_START, onRecordingStart);
      realtimeBus.on(REALTIME_EVENTS.RECORDING_STOP, onRecordingStop);
      realtimeBus.on(REALTIME_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);

      // Keep-alive heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      // Cleanup on close
      req.signal.onabort = () => {
        clearInterval(heartbeat);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_NEW, onNewMessage);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_SEEN, onSeen);
        realtimeBus.off(REALTIME_EVENTS.TYPING_START, onTypingStart);
        realtimeBus.off(REALTIME_EVENTS.TYPING_STOP, onTypingStop);
        realtimeBus.off(REALTIME_EVENTS.RECORDING_START, onRecordingStart);
        realtimeBus.off(REALTIME_EVENTS.RECORDING_STOP, onRecordingStop);
        realtimeBus.off(REALTIME_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
