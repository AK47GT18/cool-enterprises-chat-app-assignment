"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '../ChatList/ChatList.module.css';
import { Camera, Save, X, Users, Shield, Globe, Mail, User as UserIcon, LogOut } from 'lucide-react';
import { useChatStore } from '@/hooks/useChatStore';
import { createClient } from '@/utils/supabase/client';

export default function ProfileTab() {
  const { currentUser, conversations, refreshConversations } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setEditedName(data.username || '');
          setEditedImage(data.image || '');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editedName,
          image: editedImage
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
        setIsEditing(false);
        // Refresh global store to update sidebar etc.
        refreshConversations();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `profiles/${currentUser?.id}/${Date.now()}.${fileExt}`;

    try {
      const { error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: publicUrl })
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import('@/app/auth/actions');
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.href = '/auth/login';
    }
  };

  // Public groups the user is in (private ones hidden)
  const publicGroups = conversations.filter((c: any) => c.isGroup && c.isPublicGroup);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="flex items-center justify-center h-full opacity-50">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>My Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={profile?.image || `https://ui-avatars.com/api/?name=${profile?.username}&background=random&size=120`}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover shadow-lg"
            />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={14} />
            </button>
          </div>

          {isEditing ? (
            <div className="mt-4 w-full max-w-xs space-y-3">
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-blue-500 text-center font-bold outline-none"
                placeholder="Username"
              />
              <input
                value={editedImage}
                onChange={(e) => setEditedImage(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-blue-500 text-center font-bold outline-none"
                placeholder="Avatar URL"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <h3 className="text-xl font-black text-[#111827]">{profile?.username}</h3>
              <p className="text-sm text-slate-500 mt-1">{profile?.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 px-6 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</p>
              <p className="text-sm font-bold text-[#111827]">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <UserIcon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Username</p>
              <p className="text-sm font-bold text-[#111827]">@{profile?.username}</p>
            </div>
          </div>
        </div>

        {/* Public Groups */}
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Public Communities</h4>
          <div className="space-y-2">
            {publicGroups.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No public communities joined yet.</p>
            ) : (
              publicGroups.map((group: any) => (
                <div key={group.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <img
                    src={group.imageUrl || `https://ui-avatars.com/api/?name=${group.name}&background=random`}
                    alt={group.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">{group.name}</p>
                    <p className="text-[10px] text-slate-400">{group.members?.length || 0} members</p>
                  </div>
                  <Globe size={14} className="text-green-500" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
