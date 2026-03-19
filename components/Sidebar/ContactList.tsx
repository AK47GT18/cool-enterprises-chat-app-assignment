"use client";

import React from 'react';
import { Search } from 'lucide-react';
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
  const { conversations, currentUser } = useChatStore();

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
      // TODO: Show success toast
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Contacts</h2>
        
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
      </div>

      <div className={styles.list}>
         {isSearching && <p className={styles.statusMsg}>Searching for matches...</p>}
         
         {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
           <p className={styles.statusMsg}>No users found with that name.</p>
         )}

         {results.length > 0 && (
           <>
             {/* Friends Section */}
             {results.some(u => u.hollerStatus === 'ACCEPTED') && (
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
             {results.some(u => u.hollerStatus !== 'ACCEPTED') && (
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

         {!isSearching && results.length === 0 && (
            <div className={styles.statusMsg}>
              {searchQuery.length >= 2 ? "No users found with that name." : "No public users found yet."}
            </div>
         )}
      </div>
    </div>
  );
}
