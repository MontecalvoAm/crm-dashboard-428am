'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Save, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { AccessConfirmationModal } from '../ConfirmationModal';

// MISSING INTERFACES FIXED
interface User {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role_name: string;
}

interface NavItem { 
  id: number; 
  label: string; 
  key: string; 
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [navigations, setNavigations] = useState<NavItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    navId: number | null;
    navLabel: string;
    action: 'grant' | 'revoke';
  }>({ isOpen: false, navId: null, navLabel: '', action: 'grant' });

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, navsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/modules')
      ]);
      const usersData = await usersRes.json();
      const navsData = await navsRes.json();
      
      if (usersData.success) setUsers(usersData.data);
      if (navsData.success) setNavigations(navsData.data);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchUserPerms = async () => {
      if (!selectedUser) return;
      const res = await fetch(`/api/admin/permissions?userId=${selectedUser.token}`);
      const data = await res.json();
      if (data.success) setUserPermissions(data.data);
    };
    fetchUserPerms();
  }, [selectedUser]);

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.token, navigationIds: userPermissions })
      });
      if (res.ok) alert('Access level updated successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    if (modalConfig.navId === null) return;
    const navId = modalConfig.navId;
    setUserPermissions(prev => 
      prev.includes(navId) ? prev.filter(id => id !== navId) : [...prev, navId]
    );
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      <AccessConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleToggle}
        userName={selectedUser?.first_name || ''}
        pageName={modalConfig.navLabel}
        action={modalConfig.action}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-tight">Access Control</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure individual module permissions</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
          <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
             <input type="text" placeholder="Find user..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl text-xs outline-none font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {users.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <button key={u.token} onClick={() => setSelectedUser(u)} className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${selectedUser?.token === u.token ? 'bg-yellow-400 text-white shadow-lg' : 'text-gray-500 hover:bg-yellow-50/50'}`}>
                <span>{u.first_name} {u.last_name}</span>
                {selectedUser?.token === u.token && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {!selectedUser ? (
             <div className="flex-1 flex flex-col items-center justify-center py-20">
               <ShieldCheck className="w-12 h-12 text-gray-100 mb-4" />
               <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Select a user to modify access</p>
             </div>
          ) : (
             <>
               <table className="w-full text-left border-collapse flex-1">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module Name</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {navigations.map(nav => (
                      <tr key={nav.id} className="hover:bg-gray-50/20 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{nav.label}</p>
                          <p className="text-[10px] text-gray-300 font-bold uppercase">Key: {nav.key}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => setModalConfig({ isOpen: true, navId: nav.id, navLabel: nav.label, action: userPermissions.includes(nav.id) ? 'revoke' : 'grant' })}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${userPermissions.includes(nav.id) ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}
                          >
                            {userPermissions.includes(nav.id) ? 'Access Granted' : 'Access Denied'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                  <button onClick={saveUserPermissions} disabled={saving} className="bg-yellow-400 hover:bg-yellow-500 text-white px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Commit Changes
                  </button>
               </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}