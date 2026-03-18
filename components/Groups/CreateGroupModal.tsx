"use client";

import React from 'react';
import { X, Users, Shield, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isGroup: true,
          isPublicGroup: isPublic,
          memberIds: [] // TODO: Add member selection UI later
        })
      });

      if (response.ok) {
        onClose();
        setName('');
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Create Group</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Project Phoenix"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Privacy Settings</label>
                
                <button
                  onClick={() => setIsPublic(false)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all ${!isPublic ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <Shield className={!isPublic ? 'text-blue-600' : 'text-slate-400'} />
                  <div className="text-left">
                    <p className={`font-semibold ${!isPublic ? 'text-blue-900' : 'text-slate-700'}`}>Private Group</p>
                    <p className="text-xs text-slate-500">Only invited members can find and join this group.</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsPublic(true)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all ${isPublic ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <Globe className={isPublic ? 'text-blue-600' : 'text-slate-400'} />
                  <div className="text-left">
                    <p className={`font-semibold ${isPublic ? 'text-blue-900' : 'text-slate-700'}`}>Public Group</p>
                    <p className="text-xs text-slate-500">Anyone can search for and join this group.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim() || loading}
                onClick={handleCreate}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Group'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
