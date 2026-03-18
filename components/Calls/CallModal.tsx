"use client";

import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIncoming: boolean;
  onAccept: () => void;
  callerName: string;
  callerAvatar: string;
}

export default function CallModal({ isOpen, onClose, isIncoming, onAccept, callerName, callerAvatar }: CallModalProps) {
  const [isMuted, setIsMuted] = React.useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center p-12 max-w-sm w-full"
          >
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
               <img src={callerAvatar || '/default-avatar.png'} alt="" className="w-32 h-32 rounded-full relative z-10 border-4 border-blue-500/30" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>
            <p className="text-blue-400 font-medium mb-12">
               {isIncoming ? 'Incoming Signal Call...' : 'Calling via Signal...'}
            </p>

            <div className="flex items-center gap-6">
              {isIncoming ? (
                <>
                  <button 
                    onClick={onClose}
                    className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                  >
                    <PhoneOff size={28} />
                  </button>
                  <button 
                    onClick={onAccept}
                    className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 animate-bounce"
                  >
                    <Phone size={32} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/40"
                  >
                    <PhoneOff size={32} />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700">
                    <Volume2 size={22} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
