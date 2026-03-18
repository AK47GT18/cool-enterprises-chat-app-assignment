"use client";

import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, Globe } from 'lucide-react';
import styles from './SidebarTab.module.css';
import { createClient } from '@/utils/supabase/client';

interface GroupsTabProps {
  onOpenCreateModal: () => void;
}

export default function GroupsTab({ onOpenCreateModal }: GroupsTabProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        // Filter for groups only
        setGroups(data.filter((c: any) => c.isGroup));
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    const supabase = createClient();
    const channel = supabase
      .channel('groups_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Conversation' },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Groups</h2>
        <p className={styles.sectionTitle} style={{ margin: 0, textTransform: 'none' }}>
          Discover and join public or private groups.
        </p>
        <button 
          onClick={onOpenCreateModal}
          className={styles.actionBtn}
        >
          <Plus size={20} />
          Create New Group
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={64} className={styles.emptyIcon} />
            <p>You haven't joined any groups yet.</p>
          </div>
        ) : (
          <div className="space-y-3 px-4">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center overflow-hidden border border-white/5">
                  {group.imageUrl ? (
                    <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="text-blue-400 w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{group.name}</h3>
                    {group.isPublicGroup ? (
                      <Globe size={12} className="text-slate-500" />
                    ) : (
                      <Shield size={12} className="text-blue-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {group.description || 'No description'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
