"use client";

import React from 'react';
import { Users, Plus } from 'lucide-react';
import styles from './SidebarTab.module.css';

interface GroupsTabProps {
  onOpenCreateModal: () => void;
}

export default function GroupsTab({ onOpenCreateModal }: GroupsTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Groups</h2>
        <p className={styles.sectionTitle} style={{ margin: 0, textTransform: 'none' }}>
          Discover and join public or private groups.
        </p>
        <button 
          onClick={onOpenCreateModal}
          className={styles.actionBtn}
        >
          <Plus size={20} />
          Create New Group
        </button>
      </div>

      <div className={styles.list}>
        <div className={styles.emptyState}>
          <Users size={64} className={styles.emptyIcon} />
          <p>You haven't joined any groups yet.</p>
        </div>
      </div>
    </div>
  );
}
