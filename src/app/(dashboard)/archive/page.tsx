'use client';

import { useState, useEffect } from 'react';
import { 
  RotateCcw, Trash2, Search, Loader2, 
  ShieldAlert, Box, ArrowLeft 
} from 'lucide-react'; // Removed unused 'Users'
import Link from 'next/link';

// 1. Define the Interface to replace 'any'
interface ArchivedUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  archived_at: string;
}

export default function ArchiveVaultPage() {
  // 2. Apply the interface to the state
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchArchived = async () => {
    try {
      const res = await fetch('/api/admin/archive/users');
      const data = await res.json();
      if (data.success) setArchivedUsers(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchived(); }, []);

  const handleVaultAction = async (userId: number, action: 'restore' | 'permanent_delete') => {
    if (action === 'permanent_delete' && !confirm('WARNING: This action cannot be undone. Permanent delete?')) return;
    
    setProcessingId(userId);
    try {
      const res = await fetch('/api/admin/archive/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) await fetchArchived();
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <Link href="/users" className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-yellow-500 mb-4 transition-colors tracking-widest group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Team Control
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Archive Vault</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Manage restricted system records</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            type="text" 
            placeholder="SEARCH VAULT..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-yellow-400/5 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="p-10 bg-gray-50/40 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-yellow-500 shadow-sm border border-gray-100">
              <Box className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Archived User Records</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Status: Restricted Access</p>
            </div>
          </div>
          <div className="px-6 py-2 bg-yellow-400 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-yellow-100">
            {archivedUsers.length} Entries
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50/20 border-b border-gray-50">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Identity</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Original Role</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Archived Date</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Vault Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {archivedUsers
              .filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(user => (
              <tr key={user.id} className="hover:bg-gray-50/30 transition-all group">
                <td className="px-10 py-7">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{user.first_name} {user.last_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">{user.email}</p>
                </td>
                <td className="px-10 py-7">
                  <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                    {user.role_name}
                  </span>
                </td>
                <td className="px-10 py-7">
                   <p className="text-[10px] font-bold text-gray-500 uppercase">
                     {new Date(user.archived_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                   </p>
                </td>
                <td className="px-10 py-7 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => handleVaultAction(user.id, 'restore')}
                      disabled={processingId === user.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-green-100/50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                    
                    <button 
                      onClick={() => handleVaultAction(user.id, 'permanent_delete')}
                      disabled={processingId === user.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-red-100/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Purge
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {archivedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <ShieldAlert className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-300 font-black uppercase text-xs tracking-widest">The Vault is currently empty</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}