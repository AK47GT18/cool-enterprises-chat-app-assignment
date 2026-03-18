"use client";

import React from 'react';
import { Phone, PhoneOutgoing, PhoneIncoming } from 'lucide-react';

export default function CallsTab() {
  return (
    <div className="flex-1 overflow-y-auto bg-white border-r min-w-[320px]">
      <div className="p-6 border-bottom">
        <h2 className="text-2xl font-bold text-slate-900">Calls</h2>
        <p className="text-sm text-slate-500">Your recent voice and video calls.</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center py-10">
          <Phone size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400">No recent calls.</p>
        </div>
        
        {/* Example entry */}
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div>
              <p className="font-semibold text-sm text-slate-700">Jane Smith</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <PhoneOutgoing size={12} className="text-emerald-500" />
                <span>Outgoing • 2m ago</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-blue-600">
            <Phone size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
