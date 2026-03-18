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
                className="group relative flex flex-col gap-3 p-5 rounded-[24px] bg-white border border-[#E2E8F0] hover:border-[#2C6BED] hover:shadow-[0_12px_30px_rgba(44,107,237,0.08)] transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Subtle Glow */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex items-start justify-between gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2C6BED] to-[#60A5FA] flex items-center justify-center overflow-hidden shadow-[0_8px_20px_rgba(44,107,237,0.15)] shrink-0">
                    {group.imageUrl ? (
                      <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-white w-7 h-7" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    {group.isPublicGroup ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-[10px] font-black text-green-600 uppercase tracking-wider">
                        <Globe size={10} /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                        <Shield size={10} /> Private
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-[#111827] truncate group-hover:text-[#2C6BED] transition-colors">{group.name}</h3>
                  <p className="text-xs font-semibold text-[#6B7280] line-clamp-2 mt-1 leading-relaxed">
                    {group.description || 'No description provided for this community.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                        U
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[8px] font-black text-blue-600">
                      +{Math.max(0, (group.members?.length || 0) - 3)}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {group.members?.length || 0} Members
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
