import React, { useState } from 'react';
import styles from './ChatList.module.css';
import { Search, Plus, MoreVertical, CircleDashed, Camera, MessageSquare } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messageResults, setMessageResults] = useState<any[]>([]);
  const { conversations, presence, currentUser, loading } = useChatStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setMessageResults([]);
      setIsSearching(false);
      return;
    }

    const searchMessages = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/messages/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setMessageResults(data);
        }
      } catch (err) {
        console.error("Message search failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchMessages, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className={clsx(styles.container, !isMobileListVisible && styles.hiddenOnMobile)}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Cool Chat</h2>
          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="More options"><MoreVertical size={22} /></button>
          </div>
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search chats & messages" 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
        ) : (
          <>
            {/* Filtered local conversations */}
            {conversations
              .filter(c => {
                if (searchQuery) return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
                
                // Only show if:
                // 1. It has messages
                // 2. Or it's a designated group
                // 3. And it's NOT an unnamed group with no messages (noise)
                const hasMessages = c.messages && c.messages.length > 0;
                if (!hasMessages && c.isGroup && !c.name) return false;
                
                return true; // Keep others for now to satisfy "groups/friends user is part of"
              })
              .map(chat => {
                const lastMessage = chat.messages?.[0];
                const myMember = chat.members?.find((m: any) => m.userId === currentUser?.id);
                const unreadCount = myMember?.hasSeenLatest === false ? 1 : 0;
                
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
                        <span className={styles.name}>{chat.name || 'Group Chat'}</span>
                        <span className={styles.time}>
                          {mounted && lastMessage ? format(new Date(lastMessage.createdAt), 'HH:mm') : ''}
                        </span>
                      </div>
                      <div className={styles.chatBottomLine}>
                        <span className={styles.lastMessage}>
                          {lastMessage ? lastMessage.body : <span className="italic text-slate-400">Say hi!</span>}
                        </span>
                        {unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
            })}

            {/* Matching Messages */}
            {searchQuery.length >= 2 && (
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-2">
                <p className="px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">Messages</p>
                {isSearching ? (
                  <div className="flex justify-center py-4">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messageResults.length === 0 ? (
                  <p className="px-4 text-xs text-slate-500 italic">No messages found.</p>
                ) : (
                  messageResults.map(msg => (
                    <div 
                      key={msg.id} 
                      className={clsx(styles.chatItem, "opacity-80 hover:opacity-100")}
                      onClick={() => onSelectChat(msg.conversationId, msg.conversation)}
                    >
                      <div className={styles.avatarWrapper}>
                        <img 
                          src={msg.sender.image || `https://ui-avatars.com/api/?name=${msg.sender.username}&background=random`} 
                          alt="" 
                          className={styles.avatar} 
                        />
                      </div>
                      <div className={styles.chatInfo}>
                        <div className={styles.chatTopLine}>
                          <span className={styles.name}>{msg.conversationName} <span className="text-slate-400 font-normal">({msg.sender.username})</span></span>
                          <span className={styles.time}>
                            {format(new Date(msg.createdAt), 'MMM d')}
                          </span>
                        </div>
                        <div className={styles.chatBottomLine}>
                          <span className={styles.lastMessage} dangerouslySetInnerHTML={{
                            __html: msg.body?.replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-yellow-200 text-slate-900">$1</mark>') || ''
                          }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button 
        className={styles.fab} 
        onClick={onNewChat}
        aria-label="New Message"
      >
        <MessageSquare size={24} />
      </button>
    </div>
  );
}
