"use client";

import React from 'react';
import { Search } from 'lucide-react';
import styles from './SidebarTab.module.css';

export default function ContactList() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${searchQuery}`);
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
             <p className={styles.sectionTitle}>Search Results</p>
             {results.map((user) => (
               <div key={user.id} className={styles.contactItem}>
                  <div className={styles.contactInfo}>
                    <img src={user.image || '/default-avatar.png'} alt="" className={styles.avatar} />
                    <div className={styles.username}>@{user.username}</div>
                  </div>
                  <button 
                    onClick={() => handleHoller(user.id)}
                    className={styles.hollerBtn}
                  >
                    Holler
                  </button>
               </div>
             ))}
           </>
         )}

         {!isSearching && searchQuery.length < 2 && (
           <div className={styles.statusMsg}>
             Start typing to find and connect with people.
           </div>
         )}
      </div>
    </div>
  );
}
