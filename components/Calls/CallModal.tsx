"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CallUI.module.css';
import clsx from 'clsx';
import type { IncomingCallData } from '@/hooks/useWebRTC';

interface IncomingCallModalProps {
  incomingCall: IncomingCallData | null;
  onAccept: () => void;
  onReject: () => void;
}

// Web Audio API ringtone — generates a simple phone ring pattern
function useRingtone(isRinging: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRinging) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const playRingTone = () => {
      if (ctx.state === 'closed') return;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      gain.gain.value = 0.15;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    };

    playRingTone();
    intervalRef.current = setInterval(playRingTone, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (ctx.state !== 'closed') {
        ctx.close().catch(err => console.error('[Audio] Error closing context:', err));
      }
      audioCtxRef.current = null;
    };
  }, [isRinging]);
}

export default function IncomingCallModal({ incomingCall, onAccept, onReject }: IncomingCallModalProps) {
  useRingtone(!!incomingCall);

  const avatarUrl = incomingCall?.callerAvatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall?.callerName || 'U')}&background=random&size=256`;

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {incomingCall && (
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
              <div className={styles.avatarPulse} />
              <div className={styles.avatarPulseOuter} />
              <img
                src={avatarUrl}
                alt={incomingCall.callerName}
                className={styles.avatar}
              />
            </div>

            <h2 className={styles.callerName}>{incomingCall.callerName}</h2>
            <p className={styles.callStatus}>
              Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>

            <div className={styles.actions}>
              <button
                onClick={onReject}
                className={clsx(styles.actionBtn, styles.btnLg, styles.btnReject)}
                aria-label="Decline call"
              >
                <PhoneOff size={28} />
              </button>
              <button
                onClick={onAccept}
                className={clsx(styles.actionBtn, styles.btnLg, styles.btnAccept)}
                aria-label="Accept call"
              >
                <Phone size={28} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
