"use client";

import React from 'react';
import { UserCheck, UserX, UserPlus } from 'lucide-react';
import styles from './SidebarTab.module.css';

interface Holler {
  id: string;
  sender: {
    username: string;
    image: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function HollersTab() {
  const [hollers, setHollers] = React.useState<Holler[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchHollers = async () => {
    try {
      const res = await fetch('/api/contact-requests');
      if (!res.ok) return;
      const data = await res.json();
      setHollers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHollers();
  }, []);

  const handleAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/contact-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        fetchHollers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Hollers</h2>
        <p className={styles.sectionTitle} style={{ margin: 0, textTransform: 'none' }}>
          Respond to incoming connect requests.
        </p>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.statusMsg}>Fetching your hollers...</p>
        ) : hollers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <div className={styles.emptyIconBg}></div>
              <UserPlus size={64} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>No pending hollers</h3>
            <p className={styles.emptySubtitle}>When people request to connect with you, they'll show up here for your approval.</p>
          </div>
        ) : (
          <>
            <p className={styles.sectionTitle}>Pending Requests</p>
            {hollers.map((holler) => (
              <div key={holler.id} className={styles.contactItem}>
                <div className={styles.contactInfo}>
                  <img src={holler.sender.image || '/default-avatar.png'} alt="" className={styles.avatar} />
                  <div className={styles.username}>@{holler.sender.username}</div>
                </div>
                <div className={styles.itemActions}>
                  <button 
                    onClick={() => handleAction(holler.id, 'ACCEPTED')}
                    className={`${styles.iconActionBtn} ${styles.acceptBtn}`}
                    title="Accept"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button 
                    onClick={() => handleAction(holler.id, 'REJECTED')}
                    className={`${styles.iconActionBtn} ${styles.rejectBtn}`}
                    title="Decline"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
