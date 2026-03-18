"use client";

import React, { useState } from 'react';
import styles from '../ChatList/ChatList.module.css';
import { Search, Plus, Users, Shield, Key } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface GroupsTabProps {
  onOpenCreateModal: () => void;
  activeGroupId?: string | null;
  onSelectGroup: (id: string, group: any) => void;
}

export default function GroupsTab({ onOpenCreateModal, activeGroupId, onSelectGroup }: GroupsTabProps) {
  const { conversations, loading } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  // Only show groups the user is a member of (private groups from others are hidden)
  const groups = conversations.filter((c: any) => c.isGroup);

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    } catch {
      setJoinError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Communities</h2>
          <div className={styles.actions}>
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
            placeholder="Search communities..." 
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
            <p className="text-xs font-medium">Loading...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 rounded-2xl mx-4">
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
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
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
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowJoinModal(false)}>
          <div 
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Key size={28} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-[#111827]">Join a Private Group</h3>
              <p className="text-sm text-slate-500 mt-1">Enter the invite code shared by the group admin</p>
            </div>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite code..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
            />

            {joinError && (
              <p className="text-red-500 text-xs font-bold text-center">{joinError}</p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm"
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
