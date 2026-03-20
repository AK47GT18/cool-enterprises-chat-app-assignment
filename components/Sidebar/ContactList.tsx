"use client";

import React from 'react';
import { Search, Filter, Check, X, ShieldOff } from 'lucide-react';
import styles from './SidebarTab.module.css';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface ContactListProps {
  activeChatId?: string | null;
  onSelectChat?: (id: string, chat: any) => void;
}

export default function ContactList({ activeChatId, onSelectChat }: ContactListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'friends' | 'requests' | 'discover' | 'blocked'>('all');
  const [blockedUsers, setBlockedUsers] = React.useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = React.useState(false);
  const { conversations, currentUser, pendingHollers, refreshPendingHollers, refreshConversations } = useChatStore();

  React.useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const url = searchQuery.length >= 2 
          ? `/api/users/search?q=${searchQuery}`
          : `/api/users/search`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch blocked users when tab is selected
  React.useEffect(() => {
    if (filter === 'blocked') {
      setLoadingBlocked(true);
      fetch('/api/users/block')
        .then(res => res.json())
        .then(data => setBlockedUsers(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingBlocked(false));
    }
  }, [filter]);

  const handleHoller = async (userId: string) => {
    try {
      const response = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send holler:", errorData.error);
        return;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/contact-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        if (status === 'ACCEPTED') {
          const req = pendingHollers.find(r => r.id === requestId);
          if (req) {
            setResults(prev => {
              const exists = prev.find(u => u.id === req.senderId);
              if (exists) {
                return prev.map(u => u.id === req.senderId ? { ...u, hollerStatus: 'ACCEPTED' } : u);
              }
              return prev;
            });
          }
        }
        refreshPendingHollers();
        refreshConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const res = await fetch('/api/users/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        refreshConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center justify-between mb-2">
          <h2>Contacts</h2>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <Filter size={18} />
          </button>
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search public users..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'friends', 'requests', 'discover', 'blocked'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
                filter === f 
                  ? f === 'blocked'
                    ? "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500"
                    : "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              )}
            >
              {f[0].toUpperCase() + f.slice(1)}
              {f === 'requests' && pendingHollers.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">
                  {pendingHollers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
         {isSearching && <p className={styles.statusMsg}>Searching for matches...</p>}
         
         {!isSearching && searchQuery.length >= 2 && results.length === 0 && filter !== 'blocked' && (
           <p className={styles.statusMsg}>No users found with that name.</p>
         )}

         {/* Blocked Section */}
         {filter === 'blocked' && (
           <>
             <p className={styles.sectionTitle}>Blocked Users</p>
             {loadingBlocked ? (
               <div className="flex flex-col items-center justify-center h-20 opacity-50">
                 <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
               </div>
             ) : blockedUsers.length === 0 ? (
               <p className={styles.statusMsg}>No blocked users.</p>
             ) : (
               blockedUsers.map((user) => (
                 <div key={user.id} className={styles.contactItem}>
                   <div className={styles.contactInfo}>
                     <img src={user.image || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="" className={styles.avatar} />
                     <div className="flex flex-col">
                       <div className={styles.username}>@{user.username}</div>
                       <span className="text-[10px] text-red-500 font-bold">Blocked</span>
                     </div>
                   </div>
                   <button 
                     onClick={() => handleUnblock(user.id)}
                     className="px-3 py-1.5 bg-green-500 text-white text-[11px] font-bold rounded-xl hover:bg-green-600 transition-colors flex items-center gap-1"
                   >
                     <ShieldOff size={12} /> Unblock
                   </button>
                 </div>
               ))
             )}
           </>
         )}

         {/* Requests Section */}
         {filter !== 'blocked' && (filter === 'all' || filter === 'requests') && pendingHollers.length > 0 && searchQuery.length === 0 && (
            <>
              <p className={styles.sectionTitle}>Friend Requests</p>
              {pendingHollers.map((req) => (
                <div key={req.id} className={styles.contactItem}>
                  <div className={styles.contactInfo}>
                    <img 
                      src={req.sender.image || `https://ui-avatars.com/api/?name=${req.sender.username}&background=random`} 
                      alt="" 
                      className={styles.avatar} 
                    />
                    <div className="flex flex-col">
                      <div className={styles.username}>@{req.sender.username}</div>
                      <span className="text-[10px] text-slate-500">wants to connect</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRequestAction(req.id, 'ACCEPTED')}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'REJECTED')}
                      className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
         )}

         {filter !== 'blocked' && results.length > 0 && (
           <>
             {/* Friends Section */}
             {(filter === 'all' || filter === 'friends') && results.some(u => u.hollerStatus === 'ACCEPTED') && (
               <>
                 <p className={styles.sectionTitle}>Friends</p>
                 {results.filter(u => u.hollerStatus === 'ACCEPTED').map((user) => {
                   const conversation = conversations.find((c: any) => 
                     !c.isGroup && c.members?.some((m: any) => m.userId === user.id)
                   );
                   return (
                     <div 
                      key={user.id} 
                      className={clsx(styles.contactItem, activeChatId === conversation?.id && styles.activeContact)}
                      onClick={() => conversation && onSelectChat?.(conversation.id, conversation)}
                     >
                        <div className={styles.contactInfo}>
                          <img src={user.image || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="" className={styles.avatar} />
                          <div className={styles.username}>@{user.username}</div>
                        </div>
                        <div className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">Friend</div>
                     </div>
                   );
                 })}
               </>
             )}

             {/* Discover Section */}
             {(filter === 'all' || filter === 'discover') && results.some(u => u.hollerStatus !== 'ACCEPTED') && (
               <>
                 <p className={styles.sectionTitle}>
                   {searchQuery.length >= 2 ? 'Search Results' : 'Discover People'}
                 </p>
                 {results.filter(u => u.hollerStatus !== 'ACCEPTED').map((user) => (
                   <div key={user.id} className={styles.contactItem}>
                      <div className={styles.contactInfo}>
                        <img src={user.image || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="" className={styles.avatar} />
                        <div className={styles.username}>@{user.username}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleHoller(user.id); }}
                        className={clsx(
                          styles.hollerBtn,
                          user.hollerStatus === 'PENDING' && "opacity-50 pointer-events-none"
                        )}
                        disabled={user.hollerStatus === 'PENDING'}
                      >
                        {user.hollerStatus === 'PENDING' ? 'Requested' : 'Holler'}
                      </button>
                   </div>
                 ))}
               </>
             )}
           </>
         )}

         {filter !== 'blocked' && !isSearching && results.length === 0 && (
            <div className={styles.statusMsg}>
              {searchQuery.length >= 2 ? "No users found with that name." : "No public users found yet."}
            </div>
         )}
      </div>
    </div>
  );
}
