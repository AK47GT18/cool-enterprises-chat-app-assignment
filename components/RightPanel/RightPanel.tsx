import React from 'react';
import styles from './RightPanel.module.css';
import { ChevronRight, FileText, FolderArchive, X, Edit2, Check, Users, Shield, MoreHorizontal, UserMinus, ShieldAlert, ShieldCheck, Globe, Copy, Key } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/hooks/useChatStore';

interface RightPanelProps {
  chat: { id: string; name: string; avatar: string; description?: string; isGroup?: boolean } | null;
  onClose: () => void;
  isVisible: boolean;
}

export default function RightPanel({ chat, onClose, isVisible }: RightPanelProps) {
  const { currentUser } = useChatStore();
  const [activeView, setActiveView] = React.useState<'files' | 'profile' | 'members'>('profile');
  const [fullChat, setFullChat] = React.useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState('');
  const [editedDesc, setEditedDesc] = React.useState('');
  const [activeMenuUser, setActiveMenuUser] = React.useState<string | null>(null);
  const [currentUserMember, setCurrentUserMember] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);

  const fetchFullChat = React.useCallback(async () => {
    if (!chat?.id) return;
    try {
      const response = await fetch(`/api/conversations/${chat.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullChat(data);
        setEditedName(data.name || '');
        setEditedDesc(data.description || '');

        const me = data.members.find((m: any) => m.userId === currentUser?.id);
        setCurrentUserMember(me);
      }
    } catch (error) {
      console.error("Error fetching full chat:", error);
    }
  }, [chat?.id, currentUser?.id]);

  React.useEffect(() => {
    if (isVisible && chat?.id && (!fullChat || fullChat.id !== chat.id)) {
      fetchFullChat();
    }
  }, [isVisible, chat?.id, fullChat, fetchFullChat]);

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

  const handleCopyInviteCode = () => {
    if (fullChat?.inviteCode) {
      navigator.clipboard.writeText(fullChat.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!chat || !isVisible) {
    return null;
  }

  const isAdmin = currentUserMember?.role === 'ADMIN' || currentUserMember?.role === 'SUPER_ADMIN';
  const totalMembers = fullChat?.members?.length || 0;
  const adminCount = fullChat?.members?.filter((m: any) => m.role !== 'MEMBER').length || 0;

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
            {/* Clickable avatar/profile area to trigger editing */}
            <div 
              className="relative group/avatar mb-4 cursor-pointer"
              onClick={() => isAdmin && setIsEditing(true)}
            >
              <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`} alt={chat.name} className={styles.avatarLarge} />
              {isAdmin && !isEditing && (
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Edit2 size={20} className="text-white" />
                </div>
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
                  placeholder="Group description..."
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
                {chat.isGroup && (
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    <span className={clsx(styles.badge, styles.memberBadge)}>
                      <Users size={12} /> {totalMembers} Members
                    </span>
                    <span className={clsx(styles.badge, styles.adminBadge)}>
                      <Shield size={12} /> {adminCount} Admins
                    </span>
                    <span className={clsx(styles.badge, fullChat?.isPublicGroup ? styles.publicBadge : styles.privateBadge)}>
                      {fullChat?.isPublicGroup ? <Globe size={12} /> : <ShieldCheck size={12} />}
                      {fullChat?.isPublicGroup ? 'Public' : 'Private'}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* Invite Code for Admins */}
            {!isEditing && isAdmin && !fullChat?.isPublicGroup && fullChat?.inviteCode && (
              <div className="w-full mt-6 p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Key size={12} /> Invite Code (Admin Only)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg truncate">
                    {fullChat.inviteCode}
                  </code>
                  <button 
                    onClick={handleCopyInviteCode}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-bold"
                  >
                    {copied ? '✓' : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className={styles.profileActions}>
                <button className={styles.actionBtn}>Message</button>
                <button onClick={() => isAdmin && setIsEditing(true)} className={clsx(styles.actionBtn, styles.secondary)}>
                  {isAdmin ? 'Edit Group' : 'More'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'members' && (
          <div className="space-y-6">
            <div className={styles.sectionHeader}>
              <h3>Members ({totalMembers})</h3>
            </div>
            
            <div className="space-y-6">
              {/* Admins Section */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Admins — {adminCount}</span>
                {fullChat?.members?.filter((m: any) => m.role !== 'MEMBER').map((member: any) => (
                  <MemberCard 
                    key={member.userId}
                    member={member}
                    isAdmin={isAdmin}
                    currentUserMember={currentUserMember}
                    activeMenuUser={activeMenuUser}
                    setActiveMenuUser={setActiveMenuUser}
                    handleUpdateRole={handleUpdateRole}
                    handleRemoveMember={handleRemoveMember}
                  />
                ))}
              </div>

              {/* Members Section */}
              {fullChat?.members?.filter((m: any) => m.role === 'MEMBER').length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Participants — {fullChat?.members?.filter((m: any) => m.role === 'MEMBER').length}</span>
                  {fullChat?.members?.filter((m: any) => m.role === 'MEMBER').map((member: any) => (
                    <MemberCard 
                      key={member.userId}
                      member={member}
                      isAdmin={isAdmin}
                      currentUserMember={currentUserMember}
                      activeMenuUser={activeMenuUser}
                      setActiveMenuUser={setActiveMenuUser}
                      handleUpdateRole={handleUpdateRole}
                      handleRemoveMember={handleRemoveMember}
                    />
                  ))}
                </div>
              )}
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
                  <span className={styles.statValue}>
                    {fullChat?.messages?.filter((m: any) => m.imageUrl || m.videoUrl).length || 0}
                  </span>
                </div>
              </div>
              <div className={clsx(styles.statCard, styles.linksCard)}>
                <FileText size={20} className={styles.statIcon} />
                <div>
                  <span className={styles.statLabel}>Docs</span>
                  <span className={styles.statValue}>
                    {fullChat?.messages?.filter((m: any) => m.documentUrl).length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.mediaGridSection}>
              <div className={styles.sectionHeader}>
                <h3>Shared Media</h3>
              </div>
              <div className={styles.mediaGrid}>
                {fullChat?.messages?.filter((m: any) => m.imageUrl).slice(0, 9).map((msg: any) => (
                  <div key={msg.id} className={styles.mediaItem} onClick={() => window.open(msg.imageUrl, '_blank')}>
                    <img src={msg.imageUrl} alt="Shared" />
                  </div>
                ))}
                {(!fullChat?.messages?.some((m: any) => m.imageUrl)) && (
                  <p className="text-xs text-slate-400 text-center col-span-3 py-4 italic">No media shared yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className={styles.sectionHeader}>
                <h3>Documents</h3>
              </div>
              <div className="space-y-2">
                {fullChat?.messages?.filter((m: any) => m.documentUrl).map((msg: any) => (
                  <a 
                    key={msg.id} 
                    href={msg.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">Document</p>
                      <p className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </a>
                ))}
                {(!fullChat?.messages?.some((m: any) => m.documentUrl)) && (
                  <p className="text-xs text-slate-400 italic">No documents shared.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, isAdmin, currentUserMember, activeMenuUser, setActiveMenuUser, handleUpdateRole, handleRemoveMember }: any) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl relative group">
      <img src={member.user?.image || `https://ui-avatars.com/api/?name=${member.user?.username}&background=random`} alt={member.user?.username} className="w-10 h-10 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#111827] truncate">{member.user?.username}</span>
          {member.role === 'SUPER_ADMIN' && <ShieldAlert size={14} className="text-red-500" aria-label="Super Admin" />}
          {member.role === 'ADMIN' && <ShieldCheck size={14} className="text-blue-500" aria-label="Admin" />}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{member.role.replace('_', ' ')}</span>
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
        <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] p-2 overflow-hidden">
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
  );
}
