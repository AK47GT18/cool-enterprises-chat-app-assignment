import React from 'react';
import styles from './Sidebar.module.css';
import { MessageSquare, Users, Phone, Settings, CircleDashed, User } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, toggleTheme }: SidebarProps) {
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
          <MessageSquare size={24} />
        </button>
        <button
          className={clsx(styles.navItem, activeTab === 'status' && styles.active)}
          onClick={() => setActiveTab('status')}
          aria-label="Status"
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
             <span className={styles.notificationBadge}></span>
          </div>
        </button>
      </nav>

      <div className={styles.bottomNav}>
        <button className={styles.navItem} onClick={toggleTheme} aria-label="Settings">
          <Settings size={24} />
        </button>
        <img
          src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
          alt="Profile"
          className={styles.profilePic}
        />
      </div>
    </aside>
  );
}
