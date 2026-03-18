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
          <Phone size={64} className={styles.emptyIcon} />
          <p>No recent calls found.</p>
        </div>
      </div>
    </div>
  );
}
