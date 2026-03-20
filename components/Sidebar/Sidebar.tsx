import React from 'react';
import styles from './Sidebar.module.css';
import { MessageSquare, Users, Phone, Sun, Moon, CircleDashed, User } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

export default function Sidebar({ activeTab, setActiveTab, toggleTheme, theme }: SidebarProps) {
  const { currentUser, pendingHollersCount, callsCount, conversations } = useChatStore();

  const chatsUnreadCount = React.useMemo(() => {
    return conversations.filter(c => {
      if (c.isGroup) return false;
      const me = c.members?.find((m: any) => m.userId === currentUser?.id);
      return me?.hasSeenLatest === false;
    }).length;
  }, [conversations, currentUser?.id]);

  const groupsUnreadCount = React.useMemo(() => {
    return conversations.filter(c => {
      if (!c.isGroup) return false;
      const me = c.members?.find((m: any) => m.userId === currentUser?.id);
      return me?.hasSeenLatest === false;
    }).length;
  }, [conversations, currentUser?.id]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} title="The Circle Chat App">
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
            {chatsUnreadCount > 0 && (
              <span className={styles.notificationBadge}>{chatsUnreadCount}</span>
            )}
          </div>
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'status' && styles.active)}
          onClick={() => setActiveTab('status')}
          aria-label="Discover"
        >
          <div className="relative">
            <CircleDashed size={24} />
            {pendingHollersCount > 0 && (
              <span className={styles.notificationBadge}>{pendingHollersCount}</span>
            )}
          </div>
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'calls' && styles.active)}
          onClick={() => setActiveTab('calls')}
          aria-label="Calls"
        >
          <div className="relative">
            <Phone size={24} />
            {callsCount > 0 && (
              <span className={styles.notificationBadge}>{callsCount}</span>
            )}
          </div>
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'groups' && styles.active)}
          onClick={() => setActiveTab('groups')}
          aria-label="Groups"
        >
          <div className="relative">
            <Users size={24} />
            {groupsUnreadCount > 0 && (
              <span className={styles.notificationBadge}>{groupsUnreadCount}</span>
            )}
          </div>
        </button>
        
        {/* Mobile-only Nav Items (hidden on desktop via CSS if needed, but here we just add them) */}
        <button
          className={clsx(styles.navItem, styles.mobileOnly, activeTab === 'profile' && styles.active)}
          onClick={() => setActiveTab('profile')}
          aria-label="Profile"
        >
          <img
            src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.email || 'U'}&background=random`}
            alt="Profile"
            className={styles.profilePicSmall}
          />
        </button>
      </nav>

      <div className={styles.bottomNav}>
        <button className={styles.navItem} onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
        <img
          src={currentUser?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.email || 'U'}&background=random`}
          alt="Profile"
          className={styles.profilePic}
          onClick={() => setActiveTab('profile')}
        />
      </div>
    </aside>
  );
}
