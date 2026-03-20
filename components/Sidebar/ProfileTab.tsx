"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '../ChatList/ChatList.module.css';
import { Camera, Save, X, Users, Shield, Globe, Mail, User as UserIcon, LogOut } from 'lucide-react';
import { useChatStore } from '@/hooks/useChatStore';
import clsx from 'clsx';

export default function ProfileTab() {
  const { currentUser, conversations, refreshConversations } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedIsPrivate, setEditedIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passValidationErrors, setPassValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setEditedName(data.username || '');
          setEditedBio(data.bio || '');
          setEditedIsPrivate(data.isPrivate || false);
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
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editedName,
          bio: editedBio,
          isPrivate: editedIsPrivate
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
        setIsEditing(false);
        setSuccessMsg("Profile updated successfully!");
        refreshConversations();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (name: string, value: string) => {
    let err = "";
    if (name === "new") {
      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value)) {
        err = "Min 8 chars, needs 1 letter & 1 number.";
      }
    } else if (name === "confirm") {
      if (value !== passwords.new) {
        err = "Passwords do not match.";
      }
    }
    setPassValidationErrors(prev => ({ ...prev, [name]: err }));
    return err === "";
  };

  const handleChangePassword = async () => {
    const isNewValid = validatePassword("new", passwords.new);
    const isConfirmValid = validatePassword("confirm", passwords.confirm);

    if (!isNewValid || !isConfirmValid || !passwords.current) {
      if (!passwords.current) setPassValidationErrors(p => ({ ...p, current: "Current password required." }));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("Password updated successfully!");
        setPasswords({ current: '', new: '', confirm: '' });
        setIsChangingPassword(false);
      } else {
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setSaving(false);
    }
  };

   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile((prev: any) => ({ ...prev, ...updated }));
        // Refresh global store to update sidebar etc.
        refreshConversations();
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
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-blue-500 text-center outline-none resize-none min-h-[80px] text-sm"
                placeholder="Brief bio..."
               />
              {error && (
                <p className="text-xs text-red-500 font-bold mt-1 text-center bg-red-50 p-2 rounded-lg border border-red-100 italic">
                   {error}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-green-500 font-bold mt-1 text-center bg-green-50 p-2 rounded-lg border border-green-100 italic">
                  {successMsg}
                </p>
              )}

              {/* Password Section */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  {isChangingPassword ? "Cancel Password Change" : "Change Password"}
                </button>

                {isChangingPassword && (
                  <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <input
                        type="password"
                        placeholder="Current Password"
                        className={`w-full px-4 py-2 rounded-xl bg-slate-50 border text-sm outline-none ${passValidationErrors.current ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                        value={passwords.current}
                        onChange={(e) => {
                          setPasswords({ ...passwords, current: e.target.value });
                          setPassValidationErrors(p => ({ ...p, current: '' }));
                        }}
                      />
                      {passValidationErrors.current && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{passValidationErrors.current}</p>}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="New Password"
                        className={`w-full px-4 py-2 rounded-xl bg-slate-50 border text-sm outline-none ${passValidationErrors.new ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                        value={passwords.new}
                        onChange={(e) => {
                          setPasswords({ ...passwords, new: e.target.value });
                          validatePassword("new", e.target.value);
                        }}
                      />
                      {passValidationErrors.new && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{passValidationErrors.new}</p>}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className={`w-full px-4 py-2 rounded-xl bg-slate-50 border text-sm outline-none ${passValidationErrors.confirm ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                        value={passwords.confirm}
                        onChange={(e) => {
                          setPasswords({ ...passwords, confirm: e.target.value });
                          validatePassword("confirm", e.target.value);
                        }}
                      />
                      {passValidationErrors.confirm && <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">{passValidationErrors.confirm}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-black transition-colors"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setEditedIsPrivate(!editedIsPrivate)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  editedIsPrivate ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {editedIsPrivate ? <Shield size={16} className="text-slate-500" /> : <Globe size={16} className="text-blue-500" />}
                  <span className="text-sm font-bold">{editedIsPrivate ? "Private Profile" : "Public Profile"}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${editedIsPrivate ? "bg-slate-300" : "bg-blue-500"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editedIsPrivate ? "left-1" : "left-6"}`} />
                </div>
              </button>
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
              <h3 className="text-xl font-black text-[#111827]">{profile?.username || 'Username Not Set'}</h3>
              <p className={clsx("text-sm mt-2 px-6 max-w-sm line-clamp-3", !profile?.bio ? "text-slate-400 italic" : "text-slate-600")}>
                {profile?.bio || 'Click edit to add a bio about yourself!'}
              </p>
              <p className="text-xs text-slate-400 mt-2">{profile?.email}</p>
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
