'use client';

import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ArchiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  isSubmitting: boolean;
}

export const ArchiveConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  isSubmitting 
}: ArchiveConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center animate-in fade-in duration-300">
      {/* Blurred glass background */}
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-md" 
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white border border-gray-100 p-10 rounded-[3rem] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-sm">
          <Trash2 className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-tight">
          ARCHIVE <span className="text-red-500">{userName}</span>?
        </h2>
        
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl mb-8">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-widest leading-relaxed">
            The user will lose access immediately. You can restore them later from the Archive Vault.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-red-500 shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}