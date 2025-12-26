'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Save, Loader2, UserPlus, 
  CheckCircle2, Mail, Calendar, Trash2, Edit2, Search, User as UserIcon 
} from 'lucide-react';
import { AccessConfirmationModal } from './ConfirmationModal';
import { EditUserModal } from './EditUserModal';
import { ArchiveConfirmationModal } from './ArchiveConfirmationModal';

export interface User {
  token: string; // Changed from id to token
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role_name: string;
  is_active: number;
  last_login: string | null;
}

export interface NavItem { 
  id: number; 
  label: string; 
  key: string; 
}

export default function UsersAndAccessPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'access'>('list');
  const [users, setUsers] = useState<User[]>();
  const [navigations, setNavigations] = useState<NavItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState<User | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    navId: number | null;
    navLabel: string;
    action: 'grant' | 'revoke';
  }>({ isOpen: false, navId: null, navLabel: '', action: 'grant' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  const handleConfirmArchive = async () => {
    if (!userToArchive) return;
    setIsArchiving(true);
    
    try {
      // Logic Fix: Use token instead of id
      const res = await fetch(`/api/admin/users/${userToArchive.token}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchUsers();
        setIsArchiveModalOpen(false);
        setUserToArchive(null);
      }
    } catch (error) {
      console.error("Archive error:", error);
    } finally {
      setIsArchiving(false);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const navsRes = await fetch('/api/admin/modules');
        const navsData = await navsRes.json();
        if (navsData.success) setNavigations(navsData.data);
        await fetchUsers();
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [fetchUsers]);

  useEffect(() => {
    const fetchUserPerms = async () => {
      if (!selectedUser) return;
      // Logic Fix: Use token instead of id
      const res = await fetch(`/api/admin/permissions?userId=${selectedUser.token}`);
      const data = await res.json();
      if (data.success) setUserPermissions(data.data);
    };
    if (activeTab === 'access') fetchUserPerms();
  }, [selectedUser, activeTab]);

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!userToEdit) return;
    try {
      // Logic Fix: Use token instead of id
      const res = await fetch(`/api/admin/users/${userToEdit.token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await fetchUsers();
        alert('User updated successfully!');
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleTogglePermission = (navId: number) => {
    setUserPermissions(prev => 
      prev.includes(navId) ? prev.filter(id => id !== navId) : [...prev, navId]
    );
  };

  const confirmTogglePermission = () => {
    if (modalConfig.navId !== null) {
      handleTogglePermission(modalConfig.navId);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Logic Fix: Use token instead of id
        body: JSON.stringify({ userId: selectedUser.token, navigationIds: userPermissions })
      });
      if (res.ok) alert('User access updated!');
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  // Kept handleSoftDelete as per your request but updated to use 'token' to avoid confusion
  const handleSoftDelete = async (token: string, name: string) => {
    if (!confirm(`ARE YOU SURE YOU WANT TO ARCHIVE ${name.toUpperCase()}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${token}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev?.filter(u => u.token !== token));
        alert(`${name} has been moved to the Archive.`);
      }
    } catch (error) {
      console.error("Archive error:", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      <AccessConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmTogglePermission}
        userName={selectedUser?.first_name || 'User'}
        pageName={modalConfig.navLabel}
        action={modalConfig.action}
      />

      <EditUserModal 
        key={userToEdit?.token} // Logic Fix: Use token
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateUser}
        user={userToEdit}
      />
      
      <ArchiveConfirmationModal 
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleConfirmArchive}
        userName={userToArchive ? `${userToArchive.first_name} ${userToArchive.last_name}` : ''}
        isSubmitting={isArchiving}
      />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-tight">Team Control</h1>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-yellow-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </header>

      <div className="flex gap-2 bg-white border border-gray-100 p-1.5 rounded-2xl w-fit mb-10 shadow-sm">
        <button 
          onClick={() => setActiveTab('list')} 
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
            activeTab === 'list' 
              ? 'bg-yellow-400 text-white shadow-md shadow-yellow-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          Users List
        </button>
        <button 
          onClick={() => setActiveTab('access')} 
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
            activeTab === 'access' 
              ? 'bg-yellow-400 text-white shadow-md shadow-yellow-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          User Access
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Full Details</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Primary Role</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Activity</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map(user => (
                <tr key={user.token} className="hover:bg-gray-50/50 transition-all duration-200 group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 flex items-center justify-center font-black text-sm border border-yellow-200 shadow-sm">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tighter">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                          <Mail className="w-3 h-3 text-yellow-500" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.role_id === 1 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{user.role_name}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-gray-600 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-300" /> 
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'New Account'}
                      </p>
                      <p className="text-[10px] text-gray-300 font-bold uppercase mt-1 tracking-tighter">Last Active</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => { setSelectedUser(user); setActiveTab('access'); }} className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 border border-transparent transition-all duration-300 cursor-pointer" title="Manage Access">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => { setUserToEdit(user); setIsEditModalOpen(true); }} className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-transparent transition-all duration-300 cursor-pointer">
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => { setUserToArchive(user); setIsArchiveModalOpen(true); }}
                        className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all duration-300 cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm h-fit">
            <div className="relative mb-6">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
               <input type="text" placeholder="Find user..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl text-xs border-none outline-none font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users?.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                <button key={u.token} onClick={() => setSelectedUser(u)} className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${selectedUser?.token === u.token ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 'text-gray-500 hover:bg-gray-50 border border-transparent'}`}>
                  <span>{u.first_name} {u.last_name}</span>
                  {selectedUser?.token === u.token && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold text-sm">Select a user to modify access</p>
              </div>
            ) : (
              <>
                <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-yellow-500 shadow-sm border border-gray-100">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedUser.first_name} {selectedUser.last_name}</h3>
                      <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-yellow-100">{selectedUser.role_name}</span>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left flex-1">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-yellow-500 text-left">User Role: {selectedUser.role_name}</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Access Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {navigations.map(nav => {
                      const isGranted = userPermissions.includes(nav.id);
                      return (
                        <tr key={nav.id} className="hover:bg-gray-50/20 transition-colors group/row">
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-gray-900 uppercase tracking-tighter text-left">{nav.label}</p>
                            <p className="text-[10px] text-gray-300 font-bold uppercase mt-0.5 text-left">Key: {nav.key}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end items-center">
                              {isGranted ? (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, navId: nav.id, navLabel: nav.label, action: 'revoke' })}
                                  className="flex items-center gap-3 pl-1.5 pr-5 py-1.5 bg-gray-100/50 hover:bg-gray-200/50 border border-gray-200/30 rounded-full transition-all cursor-pointer group/btn shadow-inner"
                                >
                                  <div className="w-6 h-6 bg-green-500 rounded-full shadow-lg shadow-green-200/50" />
                                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.15em]">Access Granted</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, navId: nav.id, navLabel: nav.label, action: 'grant' })}
                                  className="flex items-center gap-3 pl-5 pr-1.5 py-1.5 bg-gray-100/50 hover:bg-gray-200/50 border border-gray-200/30 rounded-full transition-all cursor-pointer group/btn shadow-inner"
                                >
                                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.15em]">Access Denied</span>
                                  <div className="w-6 h-6 bg-red-500 rounded-full shadow-lg shadow-red-200/50" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setSelectedUser(null)} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 cursor-pointer uppercase tracking-widest">Cancel</button>
                  <button onClick={saveUserPermissions} disabled={saving} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all flex items-center gap-2 cursor-pointer">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Commit Access for {selectedUser.role_name}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}