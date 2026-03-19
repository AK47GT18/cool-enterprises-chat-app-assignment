import { LocalRealtimeService } from './local-realtime.service';
import { REALTIME_EVENTS } from '@/lib/realtime-constants';

/**
 * WebRTC VoIP Signaling Service using Local SSE.
 */
export const VoIPService = {
  createSignalingChannel(chatId: string, currentUserId: string, callbacks: {
    onIncomingCall?: (data: { callerId: string; callerName: string; callerAvatar: string; conversationId: string; callType: 'audio' | 'video'; offer?: RTCSessionDescriptionInit }) => void;
    onCallOffer?: (data: { offer: RTCSessionDescriptionInit; conversationId: string }) => void;
    onCallAnswered?: (data: { answer: RTCSessionDescriptionInit; conversationId: string }) => void;
    onIceCandidate?: (data: { candidate: RTCIceCandidateInit; conversationId: string }) => void;
    onHangup?: (data: { conversationId: string }) => void;
    onReject?: (data: { conversationId: string }) => void;
    onBusy?: (data: { recipientId: string }) => void;
  }) {
    const subscription = LocalRealtimeService.subscribe((eventName, data) => {
      // Ignore events not meant for this user/conversation
      if (data.targetUserId && data.targetUserId !== currentUserId) return;
      if (data.senderId === currentUserId) return;

      switch (eventName) {
        case REALTIME_EVENTS.CALL_INITIATE:
          if (data.recipientId === currentUserId) {
            callbacks.onIncomingCall?.(data);
          }
          break;
        case REALTIME_EVENTS.CALL_OFFER:
          if (data.targetUserId === currentUserId) {
            callbacks.onCallOffer?.(data);
          }
          break;
        case REALTIME_EVENTS.CALL_ANSWER:
          if (data.targetUserId === currentUserId) {
            callbacks.onCallAnswered?.(data);
          }
          break;
        case REALTIME_EVENTS.CALL_ICE_CANDIDATE:
          if (data.targetUserId === currentUserId) {
            callbacks.onIceCandidate?.(data);
          }
          break;
        case REALTIME_EVENTS.CALL_REJECT:
          callbacks.onReject?.(data);
          break;
        case REALTIME_EVENTS.CALL_END:
          callbacks.onHangup?.(data);
          break;
        case REALTIME_EVENTS.CALL_BUSY:
          callbacks.onBusy?.(data);
          break;
      }
    });

    const sendSignal = async (event: string, data: any) => {
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            data: { ...data, senderId: currentUserId }
          })
        });
      } catch (err) {
        console.error(`Error sending signal ${event}:`, err);
      }
    };

    return {
      sendInitiate: (data: any) => sendSignal(REALTIME_EVENTS.CALL_INITIATE, data),
      sendOffer: (data: any) => sendSignal(REALTIME_EVENTS.CALL_OFFER, data),
      sendAnswer: (data: any) => sendSignal(REALTIME_EVENTS.CALL_ANSWER, data),
      sendIceCandidate: (data: any) => sendSignal(REALTIME_EVENTS.CALL_ICE_CANDIDATE, data),
      sendReject: (data: any) => sendSignal(REALTIME_EVENTS.CALL_REJECT, data),
      sendEnd: (data: any) => sendSignal(REALTIME_EVENTS.CALL_END, data),
      sendBusy: (data: any) => sendSignal(REALTIME_EVENTS.CALL_BUSY, data),
      cleanup: () => subscription.cleanup()
    };
  }
};
