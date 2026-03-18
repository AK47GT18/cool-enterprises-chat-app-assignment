"use client";

import React from 'react';
import { X, Users, Shield, Globe, Loader2, ArrowRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description.trim() || undefined,
          isGroup: true,
          isPublicGroup: isPublic,
          memberIds: []
        })
      });

      if (response.ok) {
        onClose();
        setName('');
        setDescription('');
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      console.error("Failed to create group:", err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] w-full max-w-xl overflow-hidden"
          >
            {/* Subtle Top Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#2C6BED] to-transparent opacity-40" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2C6BED] to-[#60A5FA] rounded-[14px] flex items-center justify-center shadow-[0_8px_20px_rgba(44,107,237,0.2)]">
                  <Users className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#111827] tracking-tight">Create Group</h2>
                  <p className="text-sm text-[#6B7280] font-medium">Start a new community</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F1F5F9] rounded-full transition-all duration-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-lg text-sm font-semibold flex items-center gap-3 overflow-hidden mb-6"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              {/* Group Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Group Name</label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <input
                    type="text"
                    placeholder="Enter a unique group name..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] py-4 pl-12 pr-5 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2C6BED] focus:bg-white transition-all duration-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Description (Optional) */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">
                  Description <span className="text-[#9CA3AF] font-bold normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 text-[#9CA3AF] w-5 h-5 group-focus-within:text-[#2C6BED] transition-all duration-300" />
                  <textarea
                    placeholder="What's this group about?"
                    rows={3}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] py-4 pl-12 pr-5 text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2C6BED] focus:bg-white transition-all duration-300 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-[#111827] uppercase tracking-[0.05em] ml-0.5 opacity-60">Privacy Settings</label>

                <div className="grid gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`group w-full flex items-center gap-3 p-4 rounded-[14px] border transition-all duration-300 ${!isPublic
                        ? 'bg-[#E8F0FD] border-[#2C6BED]/30'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                  >
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${!isPublic ? 'bg-[#2C6BED]' : 'bg-[#E2E8F0]'}`}>
                      <Shield size={16} className={!isPublic ? 'text-white' : 'text-[#6B7280]'} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[13px] font-bold tracking-tight ${!isPublic ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Private Group</p>
                      <p className="text-[11px] text-[#9CA3AF] font-medium leading-tight">Requires invitation to join</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`group w-full flex items-center gap-3 p-4 rounded-[14px] border transition-all duration-300 ${isPublic
                        ? 'bg-[#E8F0FD] border-[#2C6BED]/30'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                  >
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${isPublic ? 'bg-[#2C6BED]' : 'bg-[#E2E8F0]'}`}>
                      <Globe size={16} className={isPublic ? 'text-white' : 'text-[#6B7280]'} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[13px] font-bold tracking-tight ${isPublic ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Public Group</p>
                      <p className="text-[11px] text-[#9CA3AF] font-medium leading-tight">Open for anyone to join</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-4 rounded-[14px] font-bold text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F5F9] transition-all duration-300 active:scale-95 text-base"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim() || loading}
                onClick={handleCreate}
                className="flex-[1.5] px-5 py-4 rounded-[14px] font-black text-white bg-[#2C6BED] hover:bg-[#1A56D6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5 active:scale-[0.98] group"
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
