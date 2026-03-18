"use client";

import React from 'react';
import { UserCheck, UserX, UserPlus } from 'lucide-react';
import clsx from 'clsx';

interface Holler {
  id: string;
  sender: {
    username: string;
    image: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function HollersTab() {
  const [hollers, setHollers] = React.useState<Holler[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchHollers = async () => {
    try {
      const res = await fetch('/api/contact-requests');
      const data = await res.json();
      setHollers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHollers();
  }, []);

  const handleAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await fetch('/api/contact-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      fetchHollers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white border-r min-w-[320px]">
      <div className="p-6 border-bottom">
        <h2 className="text-2xl font-bold text-slate-900">Hollers</h2>
        <p className="text-sm text-slate-500">Respond to incoming connect requests.</p>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center py-10 text-slate-400">Loading...</p>
        ) : hollers.length === 0 ? (
          <div className="text-center py-10">
            <UserPlus size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">No pending requests.</p>
          </div>
        ) : (
          hollers.map((holler) => (
            <div key={holler.id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50">
              <div className="flex items-center gap-3">
                <img src={holler.sender.image || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                <span className="font-semibold text-slate-700">@{holler.sender.username}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(holler.id, 'ACCEPTED')}
                  className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  <UserCheck size={18} />
                </button>
                <button 
                  onClick={() => handleAction(holler.id, 'REJECTED')}
                  className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                >
                  <UserX size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
