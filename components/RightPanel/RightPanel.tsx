import React from 'react';
import styles from './RightPanel.module.css';
import { ChevronRight, FileText, Image as ImageIcon, Video, FolderArchive, X, Edit2, Check, Users, Shield, MoreHorizontal, UserMinus, ShieldAlert, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@/utils/supabase/client';

interface RightPanelProps {
  chat: { id: string; name: string; avatar: string; description?: string; isGroup?: boolean } | null;
  onClose: () => void;
  isVisible: boolean;
}

export default function RightPanel({ chat, onClose, isVisible }: RightPanelProps) {
  const [activeView, setActiveView] = React.useState<'files' | 'profile' | 'members'>('profile');
  const [fullChat, setFullChat] = React.useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState('');
  const [editedDesc, setEditedDesc] = React.useState('');
  const [activeMenuUser, setActiveMenuUser] = React.useState<string | null>(null);
  const [currentUserMember, setCurrentUserMember] = React.useState<any>(null);

  const fetchFullChat = React.useCallback(async () => {
    if (!chat?.id) return;
    try {
      const response = await fetch(`/api/conversations/${chat.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullChat(data);
        setEditedName(data.name || '');
        setEditedDesc(data.description || '');

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const me = data.members.find((m: any) => m.userId === user?.id);
        setCurrentUserMember(me);
      }
    } catch (error) {
      console.error("Error fetching full chat:", error);
    }
  }, [chat?.id]);

  React.useEffect(() => {
    if (isVisible && chat?.id) {
      fetchFullChat();
    }
  }, [isVisible, chat?.id, fetchFullChat]);

  const handleUpdateGroup = async () => {
    try {
      const response = await fetch(`/api/conversations/${chat?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName, description: editedDesc })
      });
      if (response.ok) {
        setIsEditing(false);
        fetchFullChat();
      }
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/conversations/${chat?.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        setActiveMenuUser(null);
        fetchFullChat();
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/conversations/${chat?.id}/members/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setActiveMenuUser(null);
        fetchFullChat();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  if (!chat || !isVisible) {
    return null;
  }

  const isAdmin = currentUserMember?.role === 'ADMIN' || currentUserMember?.role === 'SUPER_ADMIN';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTabs}>
            <button 
              className={clsx(styles.tabBtn, activeView === 'profile' && styles.activeTab)}
              onClick={() => setActiveView('profile')}
            >
              Profile
            </button>
            <button 
              className={clsx(styles.tabBtn, activeView === 'members' && styles.activeTab)}
              onClick={() => setActiveView('members')}
            >
              Members
            </button>
            <button 
              className={clsx(styles.tabBtn, activeView === 'files' && styles.activeTab)}
              onClick={() => setActiveView('files')}
            >
              Shared
            </button>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close Info">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className={styles.viewContent}>
        {activeView === 'profile' && (
          <div className={styles.profileSection}>
            <div className="relative group/avatar mb-4">
              <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`} alt={chat.name} className={styles.avatarLarge} />
              {isAdmin && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-4 px-2">
                <input 
                  value={editedName} 
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-[#f3f4f6] text-[#111827] font-bold text-center py-2 rounded-lg border-2 border-blue-500 outline-none"
                  placeholder="Group Name"
                />
                <textarea 
                  value={editedDesc} 
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className="w-full bg-[#f3f4f6] text-[#111827] text-sm text-center py-2 rounded-lg border-none outline-none resize-none"
                  placeholder="Description"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdateGroup} className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                    <Check size={16} /> Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className={styles.profileName}>{fullChat?.name || chat.name}</h2>
                <p className={styles.profileBio}>{fullChat?.description || 'No description provided.'}</p>
                {chat.isGroup && <span className={styles.memberCount}>{fullChat?.members?.length || 0} Members</span>}
              </>
            )}
            
            {!isEditing && (
              <div className={styles.profileActions}>
                <button className={styles.actionBtn}>Message</button>
                <button className={clsx(styles.actionBtn, styles.secondary)}>More</button>
              </div>
            )}
          </div>
        )}

        {activeView === 'members' && (
          <div className="space-y-6">
            <div className={styles.sectionHeader}>
              <h3>Members ({fullChat?.members?.length || 0})</h3>
            </div>
            <div className="space-y-4">
              {fullChat?.members?.map((member: any) => (
                <div key={member.userId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl relative group">
                  <img src={member.user.image || `https://ui-avatars.com/api/?name=${member.user.username}&background=random`} alt={member.user.username} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#111827] truncate">{member.user.username}</span>
                      {member.role === 'SUPER_ADMIN' && <ShieldAlert size={14} className="text-red-500" aria-label="Super Admin" />}
                      {member.role === 'ADMIN' && <ShieldCheck size={14} className="text-blue-500" aria-label="Admin" />}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{member.role}</span>
                  </div>
                  
                  {isAdmin && member.userId !== currentUserMember?.userId && member.role !== 'SUPER_ADMIN' && (
                    <button 
                      onClick={() => setActiveMenuUser(activeMenuUser === member.userId ? null : member.userId)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  )}

                  {activeMenuUser === member.userId && (
                    <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                      {member.role === 'MEMBER' ? (
                        <button 
                          onClick={() => handleUpdateRole(member.userId, 'ADMIN')}
                          className="w-full flex items-center gap-3 p-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <ShieldCheck size={16} /> Make Admin
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateRole(member.userId, 'MEMBER')}
                          className="w-full flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Users size={16} /> Remove Admin
                        </button>
                      )}
                      <div className="h-px bg-slate-100 my-1" />
                      <button 
                        onClick={() => handleRemoveMember(member.userId)}
                        className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <UserMinus size={16} /> Remove from group
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'files' && (
          <div className="space-y-8">
            <div className={styles.statsRow}>
              <div className={clsx(styles.statCard, styles.filesCard)}>
                <FolderArchive size={20} className={styles.statIcon} />
                <div>
                  <span className={styles.statLabel}>Media</span>
                  <span className={styles.statValue}>12</span>
                </div>
              </div>
              <div className={clsx(styles.statCard, styles.linksCard)}>
                <FileText size={20} className={styles.statIcon} />
                <div>
                  <span className={styles.statLabel}>Documents</span>
                  <span className={styles.statValue}>5</span>
                </div>
              </div>
            </div>

            <div className={styles.mediaGridSection}>
              <div className={styles.sectionHeader}>
                <h3>Shared Media</h3>
              </div>
              <div className={styles.mediaGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={styles.mediaItem}>
                    <img src={`https://picsum.photos/seed/${chat.id + i}/200`} alt="Media" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ icon, title, sub, color, bg }: { icon: React.ReactNode, title: string, sub: string, color: string, bg: string }) {
  return (
    <div className={styles.fileItem}>
      <div className={styles.fileIconWrapper} style={{ color, backgroundColor: bg }}>
        {icon}
      </div>
      <div className={styles.fileInfo}>
        <span className={styles.fileTitle}>{title}</span>
        <span className={styles.fileSub}>{sub}</span>
      </div>
      <ChevronRight size={16} className={styles.chevron} />
    </div>
  );
}

function MoreVerticalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
