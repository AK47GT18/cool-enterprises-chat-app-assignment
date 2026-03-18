"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useChatStore } from '@/hooks/useChatStore';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

export default function NewChatModal({ isOpen, onClose, onSelectUser }: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useChatStore();

  useEffect(() => {
    if (!isOpen) return;
    
    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current user
          setUsers(data.filter((u: any) => u.id !== currentUser?.id));
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, isOpen, currentUser?.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Conversation</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search by username or email..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
              {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <p className="text-sm font-medium">Searching for users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-8">
                  <p className="text-sm font-bold text-slate-600 mb-1">No users found</p>
                  <p className="text-xs">Try searching for public users by their name or email address.</p>
                </div>
              ) : (
                users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group"
                  >
                    <div className="relative">
                      <img 
                        src={user.image || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                        alt="" 
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-900 leading-tight">@{user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageSquare size={18} />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 text-[11px] text-slate-400 text-center font-medium">
              Only public profiles are searchable here.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
