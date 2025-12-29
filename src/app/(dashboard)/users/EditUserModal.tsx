'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Loader2 } from 'lucide-react';
import { User as UserType } from './page';

interface Role {
  id: number;
  role_name: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<UserType>) => Promise<void>;
  user: UserType | null;
}

export const EditUserModal = ({ isOpen, onClose, onSave, user }: EditUserModalProps) => {
  // 1. Initialize state directly from the user prop.
  // The 'key' prop in page.tsx will handle resetting this state when the user changes.
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role_id: user?.role_id || 0
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // 2. Fetch Dynamic Roles from your API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/admin/roles');
        const data = await res.json();
        if (data.success) {
          setRoles(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={onClose} />
      
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white border border-gray-100 p-10 rounded-[3rem] shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300"
      >
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit Profile</h2>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
              Update system credentials for {user.first_name}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text" 
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-yellow-200 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Last Name</label>
              <input 
                type="text" 
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-yellow-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-yellow-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Dynamic Role Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Primary Role</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <select 
                value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})}
                disabled={isLoadingRoles}
                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold appearance-none focus:bg-white focus:border-yellow-200 outline-none transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingRoles ? (
                  <option>Loading roles...</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full mt-10 bg-yellow-400 hover:bg-yellow-500 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-yellow-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};