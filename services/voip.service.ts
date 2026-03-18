import { createClient } from '@/utils/supabase/client';

/**
 * WebRTC VoIP Signaling Service backed by WebSockets (Supabase Realtime).
 */
export const VoIPService = {
  createSignalingChannel(chatId: string, currentUserId: string, callbacks: {
    onIncomingCall?: (callerId: string, offer: RTCSessionDescriptionInit) => void;
    onCallAnswered?: (answer: RTCSessionDescriptionInit) => void;
    onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
    onHangup?: () => void;
  }) {
    const supabase = createClient();
    const channel = supabase.channel(`voip:${chatId}`);

    channel.on('broadcast', { event: 'webrtc_signal' }, (payload) => {
      const { type, candidate, offer, answer, senderId } = payload.payload;
      if (senderId === currentUserId) return; // ignore self

      if (type === 'offer' && offer) {
        callbacks.onIncomingCall?.(senderId, offer);
      } else if (type === 'answer' && answer) {
        callbacks.onCallAnswered?.(answer);
      } else if (type === 'ice-candidate' && candidate) {
        callbacks.onIceCandidate?.(candidate);
      } else if (type === 'hangup') {
        callbacks.onHangup?.();
      }
    });

    channel.subscribe();

    return {
      channel,
      sendOffer: async (offer: RTCSessionDescriptionInit) => {
        await channel.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'offer', offer, senderId: currentUserId } });
      },
      sendAnswer: async (answer: RTCSessionDescriptionInit) => {
        await channel.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'answer', answer, senderId: currentUserId } });
      },
      sendIceCandidate: async (candidate: RTCIceCandidateInit) => {
        await channel.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'ice-candidate', candidate, senderId: currentUserId } });
      },
      sendHangup: async () => {
        await channel.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'hangup', senderId: currentUserId } });
      },
      cleanup: () => supabase.removeChannel(channel)
    };
  }
};
