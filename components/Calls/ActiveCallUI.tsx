"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CallUI.module.css';
import clsx from 'clsx';
import type { CallState } from '@/hooks/useWebRTC';

interface ActiveCallUIProps {
  callState: CallState;
  callerName: string;
  callerAvatar: string;
  callDuration: number;
  isMuted: boolean;
  error: string | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  audioBlocked?: boolean;
  onUnmuteAudio?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveCallUI({
  callState,
  callerName,
  callerAvatar,
  callDuration,
  isMuted,
  error,
  onEndCall,
  onToggleMute,
  audioBlocked = false,
  onUnmuteAudio,
}: ActiveCallUIProps) {
  // Exclude 'ringing' — that state belongs to IncomingCallModal on the receiver side
  const isVisible = ['calling', 'connecting', 'connected', 'ended'].includes(callState);

  const avatarUrl = callerAvatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName || 'U')}&background=random&size=256`;

  const statusText = callState === 'calling'
    ? 'Calling...'
    : callState === 'connecting'
      ? 'Connecting...'
      : callState === 'connected'
        ? 'Connected'
        : 'Call Ended';

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.callCard}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.avatarWrapper}>
              {callState === 'calling' && (
                <>
                  <div className={styles.avatarPulse} />
                  <div className={styles.avatarPulseOuter} />
                </>
              )}
              <img src={avatarUrl} alt={callerName} className={styles.avatar} />
            </div>

            <h2 className={styles.callerName}>{callerName}</h2>

            {error && <p className={styles.errorText}>{error}</p>}

            <p className={clsx(styles.callStatus, callState === 'connected' && styles.callStatusConnected)}>
              {statusText}
            </p>

            {callState === 'connected' && (
              <p className={styles.callTimer}>{formatDuration(callDuration)}</p>
            )}

            {/* Audio blocked banner — shows when Chrome silently blocks autoplay */}
            {audioBlocked && callState === 'connected' && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onUnmuteAudio}
                className={clsx(styles.unmuteAudioBtn)}
                style={{
                  marginBottom: '12px',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <VolumeX size={16} />
                Tap to hear audio
              </motion.button>
            )}

            <div className={styles.connectedActions}>
              <button
                onClick={onToggleMute}
                className={clsx(styles.actionBtn, styles.btnMd, isMuted ? styles.btnMuted : styles.btnMute)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                onClick={onEndCall}
                className={clsx(styles.actionBtn, styles.btnLg, styles.btnEnd)}
                aria-label="End call"
              >
                <PhoneOff size={28} />
              </button>

              <button
                className={clsx(styles.actionBtn, styles.btnMd, styles.btnSpeaker)}
                aria-label="Speaker"
              >
                <Volume2 size={22} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}