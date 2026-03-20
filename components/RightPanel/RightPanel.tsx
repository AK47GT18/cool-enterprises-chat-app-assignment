import React from 'react';
import styles from './RightPanel.module.css';
import { ChevronRight, FileText, FolderArchive, X, Edit2, Check, Users, Shield, MoreHorizontal, UserMinus, ShieldAlert, ShieldCheck, Globe, Copy, Key, MessageSquare, Phone, ArrowLeft, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/hooks/useChatStore';

interface RightPanelProps {
  chat: { id: string; name: string; avatar: string; description?: string; isGroup?: boolean } | null;
  onClose: () => void;
  isVisible: boolean;
  onStartCall?: (callType: 'audio') => void;
  onBack?: () => void;
  isMobile?: boolean;
  onDeleteCommunity?: () => void;
  onLeaveCommunity?: () => void;
  onClearChat?: () => void;
}

import { LocalRealtimeService } from '@/services/local-realtime.service';

export default function RightPanel({ chat, onClose, isVisible, onStartCall, onBack, isMobile, onDeleteCommunity, onLeaveCommunity, onClearChat }: RightPanelProps) {
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

  // Real-time listener for shared media/docs
  React.useEffect(() => {
    if (!chat?.id || !isVisible) return;

    const subscription = LocalRealtimeService.subscribe((eventName, data) => {
      if (data.conversationId !== chat.id) return;

      if (eventName === 'message:new') {
        // Only care if it has attachments
        if (data.imageUrl || data.videoUrl || data.voiceNoteUrl || data.documentUrl) {
          setFullChat((prev: any) => {
            if (!prev) return prev;
            // Prevent duplicates
            if (prev.messages?.some((m: any) => m.id === data.id)) return prev;
            return {
              ...prev,
              messages: [data, ...(prev.messages || [])].slice(0, 100)
            };
          });
        }
      } else if (eventName === 'message:update') {
        setFullChat((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages?.map((m: any) => m.id === data.id ? { ...m, ...data } : m)
          };
        });
      } else if (eventName === 'user:update') {
        const updatedUser = data;
        setFullChat((prev: any) => {
          if (!prev) return prev;
          // Check if any member is the updated user
          const hasMember = prev.members?.some((m: any) => m.userId === updatedUser.id);
          if (!hasMember) return prev;
          
          return {
            ...prev,
            members: prev.members.map((m: any) => 
              m.userId === updatedUser.id 
                ? { ...m, user: { ...m.user, ...updatedUser } }
                : m
            )
          };
        });
      }
    });

    return () => subscription.cleanup();
  }, [chat?.id, isVisible]);

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

  const handleLeaveConversation = async () => {
    if (!confirm("Are you sure you want to leave this conversation?")) return;
    try {
      const response = await fetch(`/api/conversations/${chat?.id}/leave`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onClose();
        onLeaveCommunity?.();
      }
    } catch (error) {
      console.error("Error leaving conversation:", error);
    }
  };

  const handleBlockUser = async () => {
    if (!chat || chat.isGroup) return;
    const otherMember = fullChat?.members?.find((m: any) => m.userId !== currentUser?.id);
    if (!otherMember) return;

    if (!confirm(`Are you sure you want to block @${otherMember.user.username}?`)) return;
    try {
      const response = await fetch(`/api/users/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otherMember.userId })
      });
      if (response.ok) {
        alert("User blocked successfully.");
        onClose();
      }
    } catch (error) {
      console.error("Error blocking user:", error);
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
          {isMobile && (
            <button 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className={styles.headerTabs}>
            <button 
              className={clsx(styles.tabBtn, activeView === 'profile' && styles.activeTab)}
              onClick={() => setActiveView('profile')}
            >
              Profile
            </button>
            {chat.isGroup && (
              <button 
                className={clsx(styles.tabBtn, activeView === 'members' && styles.activeTab)}
                onClick={() => setActiveView('members')}
              >
                Members
              </button>
            )}
            <button 
              className={clsx(styles.tabBtn, activeView === 'files' && styles.activeTab)}
              onClick={() => setActiveView('files')}
            >
              Shared
            </button>
          </div>
          {!isMobile && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close Info">
              <X size={20} />
            </button>
          )}
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
              <img 
                src={
                  (!chat.isGroup && fullChat?.members?.find((m: any) => m.userId !== currentUser?.id)?.user?.image) || 
                  chat.avatar || 
                  `https://ui-avatars.com/api/?name=${chat.name}&background=random`
                } 
                alt={chat.name} 
                className={styles.avatarLarge} 
              />
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
                <p className={styles.profileBio}>
                  {chat.isGroup 
                    ? (fullChat?.description || 'No description provided.')
                    : (fullChat?.members?.find((m: any) => m.userId !== currentUser?.id)?.user?.bio || 'No bio provided.')}
                </p>
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
              <div className={clsx(styles.actionGrid, !chat.isGroup && styles.twoCols)}>
                <div className={styles.actionItem}>
                  <button className={styles.actionCircleBtn}>
                    <MessageSquare size={20} />
                  </button>
                  <span className={styles.actionLabel}>Message</span>
                </div>
                {!chat.isGroup && (
                  <div className={styles.actionItem}>
                    <button 
                      onClick={() => onStartCall?.('audio')}
                      className={styles.actionCircleBtn}
                    >
                      <Phone size={20} />
                    </button>
                    <span className={styles.actionLabel}>Call</span>
                  </div>
                )}
                {chat.isGroup && isAdmin && (
                  <div className={styles.actionItem}>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className={clsx(styles.actionCircleBtn, styles.secondaryCircle)}
                    >
                      <Edit2 size={20} />
                    </button>
                    <span className={styles.actionLabel}>Edit</span>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="w-full mt-4 space-y-2">
                {!chat.isGroup && (
                  <button 
                    onClick={handleBlockUser}
                    className={styles.dangerActionBtn}
                  >
                    <ShieldAlert size={18} /> Block User
                  </button>
                )}
                <button 
                  onClick={async () => {
                    if (!confirm("Are you sure you want to clear this chat? This will remove all messages for you, but won't affect others.")) return;
                    try {
                      const res = await fetch(`/api/conversations/${chat.id}/clear`, { method: 'POST' });
                      if (res.ok) {
                        onClose();
                        onClearChat?.();
                      }
                    } catch (err) {
                      console.error("Failed to clear chat:", err);
                    }
                  }}
                  className={styles.dangerActionBtn}
                >
                  <Trash2 size={18} /> Clear Chat
                </button>
                <button 
                  onClick={handleLeaveConversation}
                  className={styles.dangerActionBtn}
                >
                  <UserMinus size={18} /> {chat.isGroup ? 'Leave Group' : 'Delete Chat'}
                </button>
                {chat.isGroup && isAdmin && (
                  <button 
                    onClick={async () => {
                      if (!confirm('Are you sure you want to permanently delete this community? This action cannot be undone.')) return;
                      try {
                        const res = await fetch(`/api/conversations/${chat.id}/delete`, { method: 'DELETE' });
                        if (res.ok) {
                          onClose();
                          onDeleteCommunity?.();
                        }
                      } catch (err) {
                        console.error('Error deleting community:', err);
                      }
                    }}
                    className={styles.dangerActionBtn}
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 size={18} /> Delete Community
                  </button>
                )}
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
                    {fullChat?.messages?.filter((m: any) => !m.isDeleted && (m.imageUrl || m.videoUrl || m.voiceNoteUrl)).length || 0}
                  </span>
                </div>
              </div>
              <div className={clsx(styles.statCard, styles.linksCard)}>
                <FileText size={20} className={styles.statIcon} />
                <div>
                  <span className={styles.statLabel}>Docs</span>
                  <span className={styles.statValue}>
                    {fullChat?.messages?.filter((m: any) => !m.isDeleted && m.documentUrl).length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.mediaGridSection}>
              <div className={styles.sectionHeader}>
                <h3>Shared Media</h3>
              </div>
              <div className={styles.mediaGrid}>
                {fullChat?.messages?.filter((m: any) => !m.isDeleted && (m.imageUrl || m.videoUrl || m.voiceNoteUrl)).slice(0, 9).map((msg: any) => (
                  <div key={msg.id} className={styles.mediaItem} onClick={() => window.open(msg.imageUrl || msg.videoUrl || msg.voiceNoteUrl, '_blank')}>
                    {msg.imageUrl ? (
                      <img src={msg.imageUrl} alt="Shared" />
                    ) : msg.videoUrl ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold font-mono">VID</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 text-xs font-bold font-mono">AUD</span>
                      </div>
                    )}
                  </div>
                ))}
                {(!fullChat?.messages?.some((m: any) => !m.isDeleted && (m.imageUrl || m.videoUrl || m.voiceNoteUrl))) && (
                  <p className="text-xs text-slate-400 text-center col-span-3 py-4 italic">No media shared yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className={styles.sectionHeader}>
                <h3>Documents</h3>
              </div>
              <div className="space-y-2">
                {fullChat?.messages?.filter((m: any) => !m.isDeleted && m.documentUrl).map((msg: any) => (
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
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {msg.documentUrl.split('_').slice(1).join('_') || 'Document'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {msg.documentUrl.split('.').pop()?.toUpperCase()} • {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </a>
                ))}
                {(!fullChat?.messages?.some((m: any) => !m.isDeleted && m.documentUrl)) && (
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
