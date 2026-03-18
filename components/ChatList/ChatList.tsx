import React, { useEffect, useState } from 'react';
import styles from './ChatList.module.css';
import { Search, Plus, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: Date;
  unread: number;
  online?: boolean;
};

const MOCK_CHATS: Chat[] = [
  { id: '1', name: 'Real estate deals', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', lastMessage: 'She creates an atmosphere of mystery 😉', time: new Date(), unread: 2, online: true },
  { id: '2', name: 'Kate Johnson', avatar: 'https://i.pravatar.cc/150?u=12', lastMessage: 'I will send the document soon.', time: new Date(Date.now() - 3600000), unread: 0 },
  { id: '3', name: 'Tamara Shevchenko', avatar: 'https://i.pravatar.cc/150?u=33', lastMessage: 'are you going to a business meeting?', time: new Date(Date.now() - 7200000), unread: 1 },
  { id: '4', name: 'Joshua Clarkson', avatar: 'https://i.pravatar.cc/150?u=44', lastMessage: 'I suggest to start, I have no idea when they will finish.', time: new Date(Date.now() - 86400000), unread: 0 },
  { id: '5', name: 'Jeroen Zoet', avatar: 'https://i.pravatar.cc/150?u=59', lastMessage: 'We need to start a new project.', time: new Date(Date.now() - 172800000), unread: 0 },
  { id: '6', name: 'Design Team', avatar: 'https://i.pravatar.cc/150?u=66', lastMessage: 'Can you check the latest Figma?', time: new Date(Date.now() - 259200000), unread: 5 },
];

interface ChatListProps {
  activeChatId: string | null;
  onSelectChat: (id: string, chat: Chat) => void;
  isMobileListVisible: boolean;
}

export default function ChatList({ activeChatId, onSelectChat, isMobileListVisible }: ChatListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={clsx(styles.container, !isMobileListVisible && styles.hiddenOnMobile)}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Messages</h2>
          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="New Chat"><Plus size={20} /></button>
            <button className={styles.iconBtn} aria-label="More options"><MoreVertical size={20} /></button>
          </div>
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Search chats" className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.list}>
        {MOCK_CHATS.map(chat => (
          <div 
            key={chat.id} 
            className={clsx(styles.chatItem, activeChatId === chat.id && styles.active)}
            onClick={() => onSelectChat(chat.id, chat)}
          >
            <div className={styles.avatarWrapper}>
              <img src={chat.avatar} alt={chat.name} className={styles.avatar} />
              {chat.online && <span className={styles.onlineIndicator}></span>}
            </div>
            
            <div className={styles.chatInfo}>
              <div className={styles.chatTopLine}>
                <span className={styles.name}>{chat.name}</span>
                <span className={styles.time}>
                  {mounted ? format(chat.time, 'HH:mm') : '--:--'}
                </span>
              </div>
              <div className={styles.chatBottomLine}>
                <span className={styles.lastMessage}>{chat.lastMessage}</span>
                {chat.unread > 0 && (
                  <span className={styles.unreadBadge}>{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
