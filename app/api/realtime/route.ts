import { NextRequest } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Listener for messages
      const onNewMessage = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_NEW, data);
      const onMessageUpdate = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_UPDATE, data);
      const onMessageDelete = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_DELETE, data);
      const onSeen = (data: any) => sendEvent(REALTIME_EVENTS.MESSAGE_SEEN, data);
      const onTypingStart = (data: any) => sendEvent(REALTIME_EVENTS.TYPING_START, data);
      const onTypingStop = (data: any) => sendEvent(REALTIME_EVENTS.TYPING_STOP, data);
      const onRecordingStart = (data: any) => sendEvent(REALTIME_EVENTS.RECORDING_START, data);
      const onRecordingStop = (data: any) => sendEvent(REALTIME_EVENTS.RECORDING_STOP, data);
      const onPresenceUpdate = (data: any) => sendEvent(REALTIME_EVENTS.PRESENCE_UPDATE, data);
      const onUserUpdate = (data: any) => sendEvent(REALTIME_EVENTS.USER_UPDATE, data);
      const onCallInitiate = (data: any) => sendEvent(REALTIME_EVENTS.CALL_INITIATE, data);
      const onCallOffer = (data: any) => sendEvent(REALTIME_EVENTS.CALL_OFFER, data);
      const onCallAnswer = (data: any) => sendEvent(REALTIME_EVENTS.CALL_ANSWER, data);
      const onCallIceCandidate = (data: any) => sendEvent(REALTIME_EVENTS.CALL_ICE_CANDIDATE, data);
      const onCallReject = (data: any) => sendEvent(REALTIME_EVENTS.CALL_REJECT, data);
      const onCallEnd = (data: any) => sendEvent(REALTIME_EVENTS.CALL_END, data);
      const onCallBusy = (data: any) => sendEvent(REALTIME_EVENTS.CALL_BUSY, data);
      const onConversationNew = (data: any) => sendEvent(REALTIME_EVENTS.CONVERSATION_NEW, data);
      const onConversationUpdate = (data: any) => sendEvent(REALTIME_EVENTS.CONVERSATION_UPDATE, data);

      realtimeBus.on(REALTIME_EVENTS.MESSAGE_NEW, onNewMessage);
      realtimeBus.on(REALTIME_EVENTS.MESSAGE_UPDATE, onMessageUpdate);
      realtimeBus.on(REALTIME_EVENTS.MESSAGE_DELETE, onMessageDelete);
      realtimeBus.on(REALTIME_EVENTS.MESSAGE_SEEN, onSeen);
      realtimeBus.on(REALTIME_EVENTS.TYPING_START, onTypingStart);
      realtimeBus.on(REALTIME_EVENTS.TYPING_STOP, onTypingStop);
      realtimeBus.on(REALTIME_EVENTS.RECORDING_START, onRecordingStart);
      realtimeBus.on(REALTIME_EVENTS.RECORDING_STOP, onRecordingStop);
      realtimeBus.on(REALTIME_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);
      realtimeBus.on(REALTIME_EVENTS.USER_UPDATE, onUserUpdate);
      realtimeBus.on(REALTIME_EVENTS.CALL_INITIATE, onCallInitiate);
      realtimeBus.on(REALTIME_EVENTS.CALL_OFFER, onCallOffer);
      realtimeBus.on(REALTIME_EVENTS.CALL_ANSWER, onCallAnswer);
      realtimeBus.on(REALTIME_EVENTS.CALL_ICE_CANDIDATE, onCallIceCandidate);
      realtimeBus.on(REALTIME_EVENTS.CALL_REJECT, onCallReject);
      realtimeBus.on(REALTIME_EVENTS.CALL_END, onCallEnd);
      realtimeBus.on(REALTIME_EVENTS.CALL_BUSY, onCallBusy);
      realtimeBus.on(REALTIME_EVENTS.CONVERSATION_NEW, onConversationNew);
      realtimeBus.on(REALTIME_EVENTS.CONVERSATION_UPDATE, onConversationUpdate);
      realtimeBus.on(REALTIME_EVENTS.MESSAGE_DELETE, onMessageDelete);

      // Keep-alive heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      // Cleanup on close
      req.signal.onabort = () => {
        clearInterval(heartbeat);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_NEW, onNewMessage);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_UPDATE, onMessageUpdate);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_DELETE, onMessageDelete);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_SEEN, onSeen);
        realtimeBus.off(REALTIME_EVENTS.TYPING_START, onTypingStart);
        realtimeBus.off(REALTIME_EVENTS.TYPING_STOP, onTypingStop);
        realtimeBus.off(REALTIME_EVENTS.RECORDING_START, onRecordingStart);
        realtimeBus.off(REALTIME_EVENTS.RECORDING_STOP, onRecordingStop);
        realtimeBus.off(REALTIME_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);
        realtimeBus.off(REALTIME_EVENTS.USER_UPDATE, onUserUpdate);
        realtimeBus.off(REALTIME_EVENTS.CALL_INITIATE, onCallInitiate);
        realtimeBus.off(REALTIME_EVENTS.CALL_OFFER, onCallOffer);
        realtimeBus.off(REALTIME_EVENTS.CALL_ANSWER, onCallAnswer);
        realtimeBus.off(REALTIME_EVENTS.CALL_ICE_CANDIDATE, onCallIceCandidate);
        realtimeBus.off(REALTIME_EVENTS.CALL_REJECT, onCallReject);
        realtimeBus.off(REALTIME_EVENTS.CALL_END, onCallEnd);
        realtimeBus.off(REALTIME_EVENTS.CALL_BUSY, onCallBusy);
        realtimeBus.off(REALTIME_EVENTS.CONVERSATION_NEW, onConversationNew);
        realtimeBus.off(REALTIME_EVENTS.CONVERSATION_UPDATE, onConversationUpdate);
        realtimeBus.off(REALTIME_EVENTS.MESSAGE_DELETE, onMessageDelete);
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
