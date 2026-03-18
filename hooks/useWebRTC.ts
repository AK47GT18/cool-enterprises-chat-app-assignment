import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export const useWebRTC = (conversationId: string | null) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const supabase = createClient();

  const cleanup = () => {
    setIsCalling(false);
    setIsIncoming(false);
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pc.current?.close();
    pc.current = null;
  };

  const createPC = (channel: any) => {
    const pcInstance = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pcInstance.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({ type: 'broadcast', event: 'ice-candidate', payload: event.candidate });
      }
    };

    pcInstance.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.current = pcInstance;
    return pcInstance;
  };

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`call:${conversationId}`);

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (!isCalling) {
          setIsIncoming(true);
          const instance = createPC(channel);
          await instance.setRemoteDescription(new RTCSessionDescription(payload));
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        await pc.current?.setRemoteDescription(new RTCSessionDescription(payload));
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        await pc.current?.addIceCandidate(new RTCIceCandidate(payload));
      })
      .on('broadcast', { event: 'hangup' }, () => {
        cleanup();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cleanup();
    };
  }, [conversationId]);

  const startCall = async () => {
    setIsCalling(true);
    const channel = supabase.channel(`call:${conversationId}`);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    const instance = createPC(channel);
    stream.getTracks().forEach(track => instance.addTrack(track, stream));

    const offer = await instance.createOffer();
    await instance.setLocalDescription(offer);
    channel.send({ type: 'broadcast', event: 'offer', payload: offer });
  };

  const acceptCall = async () => {
    const channel = supabase.channel(`call:${conversationId}`);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    localStream?.getTracks().forEach(track => pc.current?.addTrack(track, stream));
    const answer = await pc.current!.createAnswer();
    await pc.current!.setLocalDescription(answer);
    channel.send({ type: 'broadcast', event: 'answer', payload: answer });
    setIsIncoming(false);
    setIsCalling(true);
  };

  const hangup = () => {
    supabase.channel(`call:${conversationId}`).send({ type: 'broadcast', event: 'hangup' });
    cleanup();
  };

  return { isCalling, isIncoming, startCall, acceptCall, hangup, localStream, remoteStream };
};
