import React from 'react';
import styles from './Sidebar.module.css';
import { MessageSquare, Users, Phone, Settings, CircleDashed, User } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, toggleTheme }: SidebarProps) {
  const { currentUser, totalUnreadCount, pendingHollersCount } = useChatStore();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <CircleDashed size={32} />
      </div>

      <nav className={styles.nav}>
        <button
          className={clsx(styles.navItem, activeTab === 'chats' && styles.active)}
          onClick={() => setActiveTab('chats')}
          aria-label="Chats"
        >
          <div className="relative">
            <MessageSquare size={24} />
            {totalUnreadCount > 0 && (
              <span className={styles.notificationBadge}>{totalUnreadCount}</span>
            )}
          </div>
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'status' && styles.active)}
          onClick={() => setActiveTab('status')}
          aria-label="Discover"
        >
          <CircleDashed size={24} />
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'calls' && styles.active)}
          onClick={() => setActiveTab('calls')}
          aria-label="Calls"
        >
          <Phone size={24} />
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'groups' && styles.active)}
          onClick={() => setActiveTab('groups')}
          aria-label="Groups"
        >
          <Users size={24} />
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'hollers' && styles.active)}
          onClick={() => setActiveTab('hollers')}
          aria-label="Hollers"
        >
          <div className="relative">
             <User size={24} />
             {pendingHollersCount > 0 && (
               <span className={styles.notificationBadge}>{pendingHollersCount}</span>
             )}
          </div>
        </button>
      </nav>

      <div className={styles.bottomNav}>
        <button className={styles.navItem} onClick={toggleTheme} aria-label="Settings">
          <Settings size={24} />
        </button>
        {/* Profile picture — clickable to open profile tab */}
        <img
          src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.email || 'U'}&background=random`}
          alt="Profile"
          className={styles.profilePic}
          onClick={() => setActiveTab('profile')}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </aside>
  );
}
