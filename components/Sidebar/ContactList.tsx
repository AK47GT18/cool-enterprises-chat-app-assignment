"use client";

import React from 'react';
import { Search, UserPlus } from 'lucide-react';

export default function ContactList() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${searchQuery}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleHoller = async (userId: string) => {
    try {
      await fetch('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      });
      // TODO: Show success toast
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white border-r min-w-[320px] flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Contacts</h2>
        
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search public users..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-4">
           {isSearching && <p className="text-center py-4 text-slate-400 animate-pulse text-sm">Searching...</p>}
           
           {results.length > 0 && (
             <>
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results</p>
               {results.map((user) => (
                 <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img src={user.image || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-sm">@{user.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleHoller(user.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-600"
                    >
                      Holler
                    </button>
                 </div>
               ))}
             </>
           )}

           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6">Suggested</p>
           {/* ... existing mock user ... */}
           <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">JD</div>
                <div>
                  <p className="font-semibold text-sm">John Doe</p>
                  <p className="text-xs text-slate-500">@johndoe</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-600">
                Holler
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
