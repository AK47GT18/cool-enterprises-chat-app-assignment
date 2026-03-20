"use client";

import React, { useState, useEffect } from 'react';
import styles from '../ChatList/ChatList.module.css';
import { Search, Plus, Users, Shield, Key, Globe, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface GroupsTabProps {
  onOpenCreateModal: () => void;
  activeGroupId?: string | null;
  onSelectGroup: (id: string, group: any) => void;
}

export default function GroupsTab({ onOpenCreateModal, activeGroupId, onSelectGroup }: GroupsTabProps) {
  const { conversations, loading, refreshConversations } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);

  const groups = conversations.filter((c: any) => c.isGroup);

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch public groups for discovery
  const fetchPublicGroups = async () => {
    setLoadingPublic(true);
    try {
      const res = await fetch('/api/groups/public');
      if (res.ok) {
        const data = await res.json();
        setPublicGroups(data);
      }
    } catch {
      console.error("Error fetching public groups");
    } finally {
      setLoadingPublic(false);
    }
  };

  useEffect(() => {
    if (showDiscover) fetchPublicGroups();
  }, [showDiscover]);

  const handleJoinPublic = async (invCode: string) => {
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: invCode })
      });
      if (res.ok) {
        await refreshConversations();
        fetchPublicGroups();
      }
    } catch {
      console.error("Error joining public group");
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setJoinError('');

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setJoinError(data.error || 'Failed to join group');
        return;
      }

      setShowJoinModal(false);
      setInviteCode('');
      await refreshConversations();
    } catch {
      setJoinError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const filteredPublicGroups = publicGroups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Communities</h2>
          <div className={styles.actions}>
            <button 
              className={clsx(styles.iconBtn, showDiscover && 'text-blue-500')} 
              onClick={() => setShowDiscover(!showDiscover)} 
              aria-label="Discover Public Groups"
              title="Discover"
            >
              <Globe size={20} />
            </button>
            <button className={styles.iconBtn} onClick={() => setShowJoinModal(true)} aria-label="Join Group">
              <Key size={20} />
            </button>
            <button className={styles.iconBtn} onClick={onOpenCreateModal} aria-label="Create Group">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={showDiscover ? "Search public communities..." : "Search communities..."} 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {/* Discover Mode */}
        {showDiscover ? (
          <>
            <div className="px-4 py-2">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Discover Public Communities
              </p>
            </div>
            {loadingPublic ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-medium">Loading...</p>
              </div>
            ) : filteredPublicGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl mx-4">
                 <Globe size={32} className="mb-2 opacity-20" />
                 <p className="text-xs font-bold">No public communities found</p>
              </div>
            ) : (
              filteredPublicGroups.map((group: any) => (
                <div 
                  key={group.id} 
                  className={clsx(styles.chatItem, "group")}
                >
                  <div className={styles.avatarWrapper}>
                    <img 
                      src={group.imageUrl || `https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                      alt={group.name} 
                      className={styles.avatar} 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                      <Globe size={8} />
                    </div>
                  </div>
                  
                  <div className={styles.chatInfo}>
                    <div className={styles.chatTopLine}>
                      <span className={styles.name}>{group.name}</span>
                    </div>
                    <div className={styles.chatBottomLine}>
                      <p className={styles.lastMessage}>
                        {group.description || 'Public community'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {group.memberCount} members
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinPublic(group.inviteCode);
                    }}
                    className="ml-2 px-3 py-1.5 bg-blue-500 text-white text-[11px] font-bold rounded-xl hover:bg-blue-600 transition-colors shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {/* My Communities */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-medium">Loading...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl mx-4">
                 <Users size={32} className="mb-2 opacity-20" />
                 <p className="text-xs font-bold">No communities found</p>
              </div>
            ) : (
              filteredGroups.map((group: any) => (
                <div 
                  key={group.id} 
                  className={clsx(styles.chatItem, activeGroupId === group.id && styles.active)}
                  onClick={() => onSelectGroup(group.id, group)}
                >
                  <div className={styles.avatarWrapper}>
                    <img 
                      src={group.imageUrl || `https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                      alt={group.name} 
                      className={styles.avatar} 
                    />
                    {!group.isPublicGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                        <Shield size={8} />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.chatInfo}>
                    <div className={styles.chatTopLine}>
                      <span className={styles.name}>{group.name}</span>
                    </div>
                    <div className={styles.chatBottomLine}>
                      <p className={styles.lastMessage}>
                        {group.description || 'Community chat'}
                      </p>
                      <span className={styles.unreadBadge}>
                        {group.members?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setShowJoinModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Key size={28} className="text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-[#111827] dark:text-white">Join a Community</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the invite code shared by the group admin</p>
            </div>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite code..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:border-blue-500 dark:text-white transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
            />

            {joinError && (
              <p className="text-red-500 text-xs font-bold text-center">{joinError}</p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinGroup}
                disabled={joining || !inviteCode.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
