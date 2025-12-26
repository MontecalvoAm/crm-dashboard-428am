'use client';

import React, { useState } from 'react';
import { X, User, Mail, Shield, Loader2 } from 'lucide-react';
import { User as UserType } from './page';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<UserType>) => Promise<void>;
  user: UserType | null;
}

export const EditUserModal = ({ isOpen, onClose, onSave, user }: EditUserModalProps) => {
  // Initialize state directly from the prop. 
  // Because we will use a 'key' in the parent, this will reset automatically.
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role_id: user?.role_id || 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={onClose} />
      
      <form onSubmit={handleSubmit} className="relative bg-white border border-gray-100 p-10 rounded-[3rem] shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit Profile</h2>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Update system credentials</p>
          </div>
          <button type="button" onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Primary Role</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <select 
                value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})}
                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold appearance-none focus:bg-white focus:border-yellow-200 outline-none transition-all cursor-pointer"
              >
                <option value={1}>Super Admin</option>
                <option value={2}>Admin</option>
                <option value={3}>Sales Manager</option>
                <option value={4}>Sales Rep</option>
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