"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InstallToast.module.css';
import { X } from 'lucide-react';

export default function InstallToast() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify user that app can be installed
      setIsVisible(true);
      console.log('[PWA] beforeinstallprompt event fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={styles.toastContainer}>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={styles.toast}
          >
            <div className={styles.iconWrapper}>
              <img src="/icon.png" alt="Circle Icon" className={styles.icon} />
            </div>
            
            <div className={styles.content}>
              <h3 className={styles.title}>Install The Circle Chat App</h3>
              <p className={styles.description}>
                Get the full experience on your home screen for faster access and push notifications.
              </p>
              
              <div className={styles.actions}>
                <button 
                  onClick={handleInstallClick}
                  className={styles.installBtn}
                >
                  Install Now
                </button>
                <button 
                  onClick={handleDismiss}
                  className={styles.dismissBtn}
                >
                  Maybe Later
                </button>
              </div>
            </div>

            <button 
              onClick={handleDismiss}
              className={styles.closeBtnIcon}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
