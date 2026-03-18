import { useEffect, useRef, useState } from 'react';
import { VoIPService } from '@/services/voip.service';
import { useChatStore } from '@/hooks/useChatStore';

export const useWebRTC = (conversationId: string | null) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<any>(null);
  const { currentUser } = useChatStore();
  const currentUserId = currentUser?.id;

  const cleanup = () => {
    setIsCalling(false);
    setIsIncoming(false);
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pc.current?.close();
    pc.current = null;
  };

  const createPC = (signaling: any) => {
    const pcInstance = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pcInstance.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.sendIceCandidate(event.candidate);
      }
    };

    pcInstance.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.current = pcInstance;
    return pcInstance;
  };

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const signaling = VoIPService.createSignalingChannel(conversationId, currentUserId, {
      onIncomingCall: async (callerId, offer) => {
        if (!isCalling) {
          setIsIncoming(true);
          const instance = createPC(signaling);
          await instance.setRemoteDescription(new RTCSessionDescription(offer));
        }
      },
      onCallAnswered: async (answer) => {
        await pc.current?.setRemoteDescription(new RTCSessionDescription(answer));
      },
      onIceCandidate: async (candidate) => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      },
      onHangup: () => {
        cleanup();
      }
    });

    signalingRef.current = signaling;

    return () => {
      signaling.cleanup();
      cleanup();
    };
  }, [conversationId, currentUserId]);

  const startCall = async () => {
    if (!signalingRef.current) return;
    setIsCalling(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    const instance = createPC(signalingRef.current);
    stream.getTracks().forEach(track => instance.addTrack(track, stream));

    const offer = await instance.createOffer();
    await instance.setLocalDescription(offer);
    await signalingRef.current.sendOffer(offer);
  };

  const acceptCall = async () => {
    if (!pc.current || !signalingRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    stream.getTracks().forEach(track => pc.current?.addTrack(track, stream));
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);
    
    await signalingRef.current.sendAnswer(answer);
    setIsIncoming(false);
    setIsCalling(true);
  };

  const hangup = () => {
    signalingRef.current?.sendHangup();
    cleanup();
  };

  return { isCalling, isIncoming, startCall, acceptCall, hangup, localStream, remoteStream };
};
