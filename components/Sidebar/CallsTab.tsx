"use client";

import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react';
import styles from './SidebarTab.module.css';
import { useChatStore } from '@/hooks/useChatStore';
import clsx from 'clsx';

export default function CallsTab() {
  const { callLogs } = useChatStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Calls</h2>
      </div>

      <div className={styles.list}>
        {callLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <div className={styles.emptyIconBg}></div>
              <Phone size={64} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>No recent calls</h3>
            <p className={styles.emptySubtitle}>Your voice and video calls will appear here once you start reaching out.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className={styles.sectionTitle}>Recent Calls</p>
            {callLogs.map((log) => (
              <div key={log.id} className={clsx(styles.contactItem, "group")}>
                <div className={styles.contactInfo}>
                  <div className="relative">
                    <img 
                      src={log.avatar || `https://ui-avatars.com/api/?name=${log.name}&background=random`} 
                      className={styles.avatar} 
                      alt="" 
                    />
                    <div className={clsx(
                      "absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white dark:border-slate-900",
                      log.type === 'missed' ? "bg-red-500" : "bg-slate-500"
                    )}>
                      {log.type === 'incoming' && <PhoneIncoming size={8} className="text-white" />}
                      {log.type === 'outgoing' && <PhoneOutgoing size={8} className="text-white" />}
                      {log.type === 'missed' && <PhoneMissed size={8} className="text-white" />}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className={styles.username}>{log.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>{log.callType === 'video' ? 'Video' : 'Voice'}</span>
                      <span>•</span>
                      <span>{formatDate(log.timestamp)}, {formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                     {log.callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
