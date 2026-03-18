"use client";

import React from 'react';
import { X, Users, Shield, Globe, Loader2, ArrowRight } from 'lucide-react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden relative"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Users className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Group</h2>
                  <p className="text-sm text-slate-400 font-medium tracking-wide">Start a new community</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-0.5 space-y-6">
              {/* Group Name Input Group */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-300 ml-0.5 uppercase tracking-[0.05em] opacity-60">Group Name</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter a unique group name..."
                    className="w-full bg-slate-950/50 border border-white/5 rounded-[12px] py-3.5 px-5 text-base font-medium text-white placeholder:text-slate-600 focus:outline-none focus:bg-slate-950/80 focus:border-blue-500/40 transition-all duration-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-300 ml-0.5 uppercase tracking-[0.05em] opacity-60">Privacy Settings</label>

                <div className="grid gap-2.5">
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`group w-full flex items-center gap-4 p-4 rounded-[16px] border transition-all duration-300 ${!isPublic
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/5 bg-slate-950/30 hover:bg-slate-950/50'
                      }`}
                  >
                    <div className={`p-3 rounded-lg transition-all duration-300 ${!isPublic ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'}`}>
                      <Shield size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[15px] font-bold tracking-tight ${!isPublic ? 'text-white' : 'text-slate-400'}`}>Private Group</p>
                      <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0">Requires invitation to join</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsPublic(true)}
                    className={`group w-full flex items-center gap-4 p-4 rounded-[16px] border transition-all duration-300 ${isPublic
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/5 bg-slate-950/30 hover:bg-slate-950/50'
                      }`}
                  >
                    <div className={`p-3 rounded-lg transition-all duration-300 ${isPublic ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'}`}>
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[15px] font-bold tracking-tight ${isPublic ? 'text-white' : 'text-slate-400'}`}>Public Group</p>
                      <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0">Open for anyone to join</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 mt-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 active:scale-95 text-base"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim() || loading}
                onClick={handleCreate}
                className="flex-[1.5] px-5 py-3.5 rounded-[12px] font-black text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5 active:scale-[0.98] group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="text-base tracking-tight">Create Group</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
