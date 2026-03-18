import React, { useState } from 'react';
import styles from './ChatList.module.css';
import { Search, Plus, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useChatStore } from '@/hooks/useChatStore';

interface ChatListProps {
  activeChatId: string | null;
  onSelectChat: (id: string, chat: any) => void;
  onNewChat: () => void;
  isMobileListVisible: boolean;
}

export default function ChatList({ activeChatId, onSelectChat, onNewChat, isMobileListVisible }: ChatListProps) {
  const [mounted, setMounted] = useState(false);
  const { conversations, presence, currentUser, loading } = useChatStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={clsx(styles.container, !isMobileListVisible && styles.hiddenOnMobile)}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Messages</h2>
          <div className={styles.actions}>
            <button onClick={onNewChat} className={styles.iconBtn} aria-label="New Chat"><Plus size={20} /></button>
            <button className={styles.iconBtn} aria-label="More options"><MoreVertical size={20} /></button>
          </div>
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Search chats" className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium">Loading chats...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-40 px-8 text-center">
            <p className="text-sm font-bold mb-1">No messages yet</p>
            <p className="text-xs">Start a conversation or create a group to get started!</p>
          </div>
        ) : conversations.map(chat => {
          const lastMessage = chat.messages?.[0];
          const myMember = chat.members?.find((m: any) => m.userId === currentUser?.id);
          const unreadCount = myMember?.hasSeenLatest === false ? 1 : 0;
          
          // Basic online check for 1-on-1 chats
          let isOnline = false;
          if (!chat.isGroup) {
            const otherMember = chat.members?.find((m: any) => m.userId !== currentUser?.id);
            if (otherMember && presence[otherMember.userId]) {
              isOnline = true;
            }
          }
          
          return (
            <div 
              key={chat.id} 
              className={clsx(styles.chatItem, activeChatId === chat.id && styles.active)}
              onClick={() => onSelectChat(chat.id, chat)}
            >
              <div className={styles.avatarWrapper}>
                <img 
                  src={chat.imageUrl || `https://ui-avatars.com/api/?name=${chat.name || 'Group'}&background=random`} 
                  alt={chat.name} 
                  className={styles.avatar} 
                />
                {isOnline && <span className={styles.onlineIndicator}></span>}
              </div>
              
              <div className={styles.chatInfo}>
                <div className={styles.chatTopLine}>
                  <span className={styles.name}>{chat.name || 'Unnamed Group'}</span>
                  <span className={styles.time}>
                    {mounted && lastMessage ? format(new Date(lastMessage.createdAt), 'HH:mm') : '--:--'}
                  </span>
                </div>
                <div className={styles.chatBottomLine}>
                  <span className={styles.lastMessage}>
                    {lastMessage ? lastMessage.body : 'No messages yet'}
                  </span>
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
