'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; 
  leadName: string;
  leadToken: string;
}

export default function DeleteLeadModal({ isOpen, onClose, onConfirm, leadName, leadToken }: DeleteLeadModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // Get context from localStorage for the API bypass logic
      const companyId = localStorage.getItem('company_id') || "";
      const roleId = localStorage.getItem('user_role_id') || "";

      const response = await fetch(`/api/leads/${leadToken}`, {
        method: 'DELETE',
        headers: {
          'x-company-id': companyId,
          'x-user-role-id': roleId
        }
      });

      const data = await response.json();

      if (data.success) {
        onConfirm(); // This calls fetchLeads() and shows the Toast in parent
        onClose();   // Close modal
      } else {
        alert(data.error || 'Failed to delete lead');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-inner">
          <Trash2 className="w-10 h-10 text-red-500" />
        </div>
        
        <h3 className="text-2xl font-black text-gray-900 text-center uppercase tracking-tight mb-3">Archive Lead?</h3>
        <p className="text-gray-400 text-center text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-10 px-4">
          You are about to move <span className="text-red-500">{leadName}</span> to the archives. This record will be hidden from the pipeline.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Archive'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-5 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all cursor-pointer disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}