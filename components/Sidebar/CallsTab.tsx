"use client";

import React from 'react';
import { Phone } from 'lucide-react';
import styles from './SidebarTab.module.css';

export default function CallsTab() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Calls</h2>
        <p className={styles.sectionTitle} style={{ margin: 0, textTransform: 'none' }}>
          Your recent voice and video calls.
        </p>
      </div>

      <div className={styles.list}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <div className={styles.emptyIconBg}></div>
            <Phone size={64} className={styles.emptyIcon} />
          </div>
          <h3 className={styles.emptyTitle}>No recent calls</h3>
          <p className={styles.emptySubtitle}>Your voice and video calls will appear here once you start reaching out.</p>
        </div>
      </div>
    </div>
  );
}
