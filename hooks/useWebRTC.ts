import { useEffect, useRef, useState, useCallback } from 'react';
import { VoIPService } from '@/services/voip.service';
import { useChatStore } from '@/hooks/useChatStore';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  conversationId: string;
  callType: 'audio' | 'video';
}

interface UseWebRTCReturn {
  callState: CallState;
  incomingCall: IncomingCallData | null;
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  callDuration: number;
  startCall: (recipientId: string, conversationId: string, callerName: string, callerAvatar: string, callType?: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
};

const CALL_TIMEOUT_MS = 30000;

export const useWebRTC = (): UseWebRTCReturn => {
  const { currentUser, addCallLog } = useChatStore();
  const [callState, setCallState] = useState<CallState>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pc = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<any>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSet = useRef(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallRef = useRef<{
    recipientId?: string;
    callerId?: string;
    conversationId: string;
    callType: 'audio' | 'video';
  } | null>(null);

  const callStateRef = useRef<CallState>('idle');
  const pendingAcceptRef = useRef(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setCallStateWithRef = useCallback((newState: CallState) => {
    console.log('[WebRTC] State transition:', callStateRef.current, '->', newState);
    callStateRef.current = newState;
    setCallState(newState);
  }, []);

  const cleanup = useCallback(() => {
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
    if (durationIntervalRef.current) { clearInterval(durationIntervalRef.current); durationIntervalRef.current = null; }
    if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }

    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);

    pc.current?.close();
    pc.current = null;

    iceCandidateQueue.current = [];
    remoteDescriptionSet.current = false;
    currentCallRef.current = null;
    pendingAcceptRef.current = false;

    setIsMuted(false);
    setCallDuration(0);
    setError(null);
    callStateRef.current = 'idle';
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    // Close any existing PC before creating a new one
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && currentCallRef.current) {
        const targetId = currentCallRef.current.recipientId || currentCallRef.current.callerId;
        console.log('[WebRTC] Sending ICE Candidate to:', targetId);
        signalingRef.current?.sendIceCandidate({
          targetUserId: targetId,
          candidate: event.candidate.toJSON(),
          conversationId: currentCallRef.current.conversationId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('[WebRTC] Connection state change:', state);

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      if (state === 'connected') {
        if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
        setCallStateWithRef('connected');
        if (!durationIntervalRef.current) {
          const start = Date.now();
          durationIntervalRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - start) / 1000));
          }, 1000);
        }
      } else if (state === 'failed' || state === 'disconnected') {
        setError('Connection lost.');
        setCallStateWithRef('ended');
        cleanup();
      } else if (state === 'connecting') {
        // Fallback for mobile: force connected if ICE is connected but RTCPeerConnection lags
        fallbackTimerRef.current = setTimeout(() => {
          if (pc.current &&
            pc.current.connectionState === 'connecting' &&
            pc.current.iceConnectionState === 'connected') {
            console.log('[WebRTC] Fallback: forcing connected state');
            setCallStateWithRef('connected');
            if (!durationIntervalRef.current) {
              const start = Date.now();
              durationIntervalRef.current = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - start) / 1000));
              }, 1000);
            }
          }
        }, 5000);
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  }, [cleanup, setCallStateWithRef]);

  const flushIceCandidates = useCallback(async () => {
    if (!pc.current || !remoteDescriptionSet.current) return;
    console.log('[WebRTC] Flushing', iceCandidateQueue.current.length, 'queued ICE candidates');
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding queued ICE candidate:', err);
      }
    }
    iceCandidateQueue.current = [];
  }, []);

  const getUserMedia = useCallback(async (callType: 'audio' | 'video') => {
    const constraints = { audio: true, video: callType === 'video' };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (
    recipientId: string,
    conversationId: string,
    callerName: string,
    callerAvatar: string,
    callType: 'audio' | 'video' = 'audio'
  ) => {
    if (!currentUser?.id) return;
    setError(null);
    setCallStateWithRef('calling');
    currentCallRef.current = { recipientId, conversationId, callType };

    try {
      const stream = await getUserMedia(callType);
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      signalingRef.current?.sendInitiate({
        callerId: currentUser.id,
        callerName,
        callerAvatar,
        recipientId,
        targetUserId: recipientId,
        conversationId,
        callType,
        offer,
      });

      addCallLog({
        type: 'outgoing',
        callType,
        name: callerName || 'Unknown',
        avatar: callerAvatar || '',
      });

      signalingRef.current?.sendOffer({
        targetUserId: recipientId,
        offer,
        conversationId,
      });

      callTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === 'calling') {
          setError('No answer.');
          endCall();
        }
      }, CALL_TIMEOUT_MS);
    } catch (err: any) {
      console.error('[WebRTC] startCall failed:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'NotFoundError'
        ? 'Microphone access denied. On mobile, HTTPS is required.'
        : (err.message || 'Failed to start call');
      setError(msg);
      setCallStateWithRef('ended');
      cleanup();
      setTimeout(() => setCallStateWithRef('idle'), 3000);
    }
  }, [currentUser?.id, createPeerConnection, getUserMedia, cleanup, setCallStateWithRef, addCallLog]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    if (!pc.current) {
      console.log('[WebRTC] Accepting call before offer arrived. Flagging pending accept.');
      pendingAcceptRef.current = true;
      setCallStateWithRef('connecting');
      return;
    }

    setError(null);
    setCallStateWithRef('connecting');
    try {
      const stream = await getUserMedia(incomingCall.callType);
      stream.getTracks().forEach((track) => pc.current?.addTrack(track, stream));

      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      signalingRef.current?.sendAnswer({
        targetUserId: incomingCall.callerId,
        answer,
        conversationId: incomingCall.conversationId,
      });

      addCallLog({
        type: 'incoming',
        callType: incomingCall.callType,
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      });

      setIncomingCall(null);
    } catch (err: any) {
      console.error('[WebRTC] acceptCall failed:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'NotFoundError'
        ? 'Microphone access denied. On mobile, HTTPS is required.'
        : (err.message || 'Failed to accept call');
      setError(msg);
      setCallStateWithRef('ended');
      cleanup();
      setTimeout(() => setCallStateWithRef('idle'), 3000);
    }
  }, [incomingCall, getUserMedia, cleanup, setCallStateWithRef, addCallLog]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    addCallLog({
      type: 'missed',
      callType: incomingCall.callType,
      name: incomingCall.callerName,
      avatar: incomingCall.callerAvatar,
    });
    signalingRef.current?.sendReject({
      callerId: incomingCall.callerId,
      conversationId: incomingCall.conversationId,
    });
    setIncomingCall(null);
    setCallStateWithRef('idle');
    cleanup();
  }, [incomingCall, cleanup, addCallLog, setCallStateWithRef]);

  const endCall = useCallback(() => {
    if (currentCallRef.current) {
      const targetId = currentCallRef.current.recipientId || currentCallRef.current.callerId;
      signalingRef.current?.sendEnd({
        targetUserId: targetId,
        conversationId: currentCallRef.current.conversationId,
      });
    }
    setCallStateWithRef('ended');
    cleanup();
    setTimeout(() => setCallStateWithRef('idle'), 1500);
  }, [cleanup, setCallStateWithRef]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => { track.enabled = !track.enabled; });
      setIsMuted((prev) => !prev);
    }
  }, [localStream]);

  const callbacksRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    const signaling = VoIPService.createSignalingChannel('calls', currentUser.id, {
      onIncomingCall: (data) => callbacksRef.current?.onIncomingCall(data),
      onCallOffer: (data) => callbacksRef.current?.onCallOffer(data),
      onCallAnswered: (data) => callbacksRef.current?.onCallAnswered(data),
      onIceCandidate: (data) => callbacksRef.current?.onIceCandidate(data),
      onReject: (data) => callbacksRef.current?.onReject(data),
      onHangup: (data) => callbacksRef.current?.onHangup(data),
      onBusy: (data) => callbacksRef.current?.onBusy(data),
    });
    signalingRef.current = signaling;
    return () => { signaling.cleanup(); signalingRef.current = null; };
  }, [currentUser?.id]);

  useEffect(() => {
    callbacksRef.current = {
      onIncomingCall: (data: any) => {
        console.log('[WebRTC] Incoming call signal received:', data);
        if (callStateRef.current !== 'idle') {
          signalingRef.current?.sendBusy({ targetUserId: data.callerId, callerId: currentUser?.id });
          return;
        }
        currentCallRef.current = {
          callerId: data.callerId,
          conversationId: data.conversationId,
          callType: data.callType
        };

        // FIXED: Always create the peer connection immediately so ICE candidates
        // can be queued against a real RTCPeerConnection from the start
        const peerConnection = createPeerConnection();

        if (data.offer) {
          console.log('[WebRTC] Offer in INITIATE — setting remote description now');
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => {
              remoteDescriptionSet.current = true;
              return flushIceCandidates();
            })
            .catch((err) => console.error('[WebRTC] Error processing offer from INITIATE:', err));
        }

        setIncomingCall(data);
        setCallStateWithRef('ringing');
      },

      onCallOffer: async (data: any) => {
        console.log('[WebRTC] Offer received via CALL_OFFER:', data);
        // Skip if already processed via INITIATE
        if (pc.current && remoteDescriptionSet.current) {
          console.log('[WebRTC] Offer already processed, skipping duplicate');
          return;
        }
        // Create PC if it doesn't exist (fallback for late INITIATE)
        const peerConnection = pc.current || createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        remoteDescriptionSet.current = true;
        await flushIceCandidates();

        if (pendingAcceptRef.current) {
          console.log('[WebRTC] Offer arrived after early accept — processing now');
          pendingAcceptRef.current = false;
          acceptCall();
        }
      },

      onCallAnswered: async (data: any) => {
        console.log('[WebRTC] Answer received:', data);
        if (pc.current) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          remoteDescriptionSet.current = true;
          await flushIceCandidates();
        }
      },

      onIceCandidate: async (data: any) => {
        console.log('[WebRTC] ICE Candidate received:', data.candidate ? 'exists' : 'null');
        if (remoteDescriptionSet.current && pc.current) {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => {
            console.error('[WebRTC] Error adding ICE candidate:', e);
          });
        } else {
          console.log('[WebRTC] Queuing ICE candidate (no remote description yet)');
          iceCandidateQueue.current.push(data.candidate);
        }
      },

      onReject: (data: any) => {
        console.log('[WebRTC] Call rejected by remote:', data);
        setError('Call declined.');
        setCallStateWithRef('ended');
        cleanup();
        setTimeout(() => setCallStateWithRef('idle'), 2000);
      },

      onHangup: (data: any) => {
        console.log('[WebRTC] Call ended by remote:', data);
        setCallStateWithRef('ended');
        cleanup();
        setTimeout(() => setCallStateWithRef('idle'), 1500);
      },

      onBusy: (data: any) => {
        console.log('[WebRTC] Remote user is busy:', data);
        setError('User is busy.');
        setCallStateWithRef('ended');
        cleanup();
        setTimeout(() => setCallStateWithRef('idle'), 2000);
      }
    };
  }, [currentUser?.id, createPeerConnection, flushIceCandidates, cleanup, acceptCall, setCallStateWithRef]);

  return { callState, incomingCall, error, localStream, remoteStream, isMuted, callDuration, startCall, acceptCall, rejectCall, endCall, toggleMute };
};