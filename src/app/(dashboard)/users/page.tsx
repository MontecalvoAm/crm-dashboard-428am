'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, UserPlus, Trash2, Edit2, Search 
} from 'lucide-react';
import { EditUserModal } from './EditUserModal';
import { ArchiveConfirmationModal } from './ArchiveConfirmationModal';

export interface User {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role_name: string;
  is_active: number;
  last_login: string | null;
}

export default function ManageUsersPage() {
  // --- Existing State ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // --- Archive Modal State ---
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState<User | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // --- Data Fetching ---
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Action Handlers ---
  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!userToEdit) return;
    try {
      const res = await fetch(`/api/admin/users/${userToEdit.token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await fetchUsers();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleArchiveUser = async () => {
    if (!userToArchive) return;
    
    setIsArchiving(true);
    try {
      // Sending DELETE request to your API
      const res = await fetch(`/api/admin/users/${userToArchive.token}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchUsers(); // Refresh the list after deletion
        setIsArchiveModalOpen(false);
        setUserToArchive(null);
      }
    } catch (error) {
      console.error('Archive failed:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Edit Modal */}
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateUser}
        user={userToEdit}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveConfirmationModal 
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveUser}
        userName={userToArchive ? `${userToArchive.first_name} ${userToArchive.last_name}` : ''}
        isSubmitting={isArchiving}
      />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-tight">User Directory</h1>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-yellow-100 transition-all flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input 
          type="text" 
          placeholder="Search members..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
              <tr key={user.token} className="hover:bg-yellow-50/50 transition-all duration-200">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black text-sm border border-yellow-200">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tighter">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.role_id === 1 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{user.role_name}</span>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-gray-600">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => { setUserToEdit(user); setIsEditModalOpen(true); }} 
                      className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setUserToArchive(user);
                        setIsArchiveModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}