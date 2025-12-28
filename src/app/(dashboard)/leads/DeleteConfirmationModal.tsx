'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // This will trigger the refresh in page.tsx
  leadName: string;
  leadToken: string; // Added token to identify which lead to delete
}

export default function DeleteLeadModal({ isOpen, onClose, onConfirm, leadName, leadToken }: DeleteLeadModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${leadToken}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onConfirm(); // Refresh the list
        onClose();   // Close modal
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        
        <h3 className="text-xl font-black text-gray-900 text-center uppercase tracking-tight mb-2">Delete Lead?</h3>
        <p className="text-gray-500 text-center text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
          Are you sure you want to delete <span className="text-red-500">{leadName}</span>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}