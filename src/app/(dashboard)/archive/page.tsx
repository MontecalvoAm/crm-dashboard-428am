'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, Trash2, Search, Loader2, 
  ShieldAlert, ArrowLeft, Users, 
  Target, Building2, Mail, Calendar 
} from 'lucide-react';
import Link from 'next/link';

// --- Interfaces (IDs are excluded to ensure they aren't used) ---
interface ArchivedUser {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  archived_at: string;
}

interface ArchivedLead {
  token: string;
  LeadName: string;
  Email: string;
  StatusName: string;
  archived_at: string;
}

interface ArchivedCompany {
  token: string;
  CompanyName: string;
  Industry: string;
  Email: string;
  archived_at: string;
}

type ArchiveTab = 'users' | 'leads' | 'companies';
type ArchivedItem = ArchivedUser | ArchivedLead | ArchivedCompany;

export default function ArchiveVaultPage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('users');
  const [data, setData] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingToken, setProcessingToken] = useState<string | null>(null);

  const fetchArchived = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/archive/${activeTab}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(`Failed to fetch archived ${activeTab}`, err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);

  const handleVaultAction = async (token: string, action: 'restore' | 'permanent_delete') => {
    if (action === 'permanent_delete' && !confirm('CRITICAL WARNING: This action cannot be undone. Purge record?')) return;
    
    setProcessingToken(token);
    try {
      const res = await fetch(`/api/admin/archive/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }) // SENDING TOKEN ONLY
      });
      if (res.ok) await fetchArchived();
    } finally {
      setProcessingToken(null);
    }
  };

  const getDisplayDetails = (item: ArchivedItem) => {
    if (activeTab === 'users') {
      const u = item as ArchivedUser;
      return { name: `${u.first_name} ${u.last_name}`, sub: u.email, meta: u.role_name };
    } else if (activeTab === 'leads') {
      const l = item as ArchivedLead;
      return { name: l.LeadName, sub: l.Email, meta: l.StatusName };
    } else {
      const c = item as ArchivedCompany;
      return { name: c.CompanyName, sub: c.Email, meta: c.Industry };
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
       <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-yellow-500 mb-4 transition-colors tracking-widest group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Archive Vault</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Restricted Access Management</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            type="text" 
            placeholder={`SEARCH ${activeTab.toUpperCase()}...`} 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-yellow-400/5 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex gap-2 bg-white border border-gray-100 p-1.5 rounded-2xl w-fit mb-10 shadow-sm">
        {(['users', 'leads', 'companies'] as ArchiveTab[]).map((tab) => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab); setData([]); }} 
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-yellow-400 text-white shadow-md shadow-yellow-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/20 border-b border-gray-50">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categorization</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Archived On</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Vault Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data
              .filter(item => getDisplayDetails(item).name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item) => {
                const { name, sub, meta } = getDisplayDetails(item);
                return (
                  <tr key={item.token} className="hover:bg-gray-50/30 transition-all group">
                    <td className="px-10 py-7">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{name}</p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5"><Mail className="w-3 h-3 inline mr-1 text-yellow-500" /> {sub}</p>
                    </td>
                    <td className="px-10 py-7">
                      <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-400 tracking-tighter">{meta}</span>
                    </td>
                    <td className="px-10 py-7">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <p className="text-[10px] font-bold uppercase">{new Date(item.archived_at).toLocaleDateString()}</p>
                        </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleVaultAction(item.token, 'restore')}
                          disabled={processingToken === item.token}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button 
                          onClick={() => handleVaultAction(item.token, 'permanent_delete')}
                          disabled={processingToken === item.token}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}