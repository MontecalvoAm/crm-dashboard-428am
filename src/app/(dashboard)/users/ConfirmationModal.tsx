'use client';

import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  pageName: string;
  action: 'grant' | 'revoke';
}

export const AccessConfirmationModal = ({ isOpen, onClose, onConfirm, userName, pageName, action }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      {/* Blurred Backdrop - Slight visibility of main page */}
      <div 
        className="absolute inset-0 bg-black/10 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${action === 'grant' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
          {action === 'grant' ? <ShieldCheck className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-tight">
          ARE YOU SURE YOU WANT TO {action === 'grant' ? 'GIVE' : 'REMOVE'} <span className="text-yellow-500">{userName}</span> ACCESS TO <span className="text-yellow-500">{pageName}</span>?
        </h2>
        
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8">
          This change will be staged until you click &quot;Commit Access&quot;.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-pointer uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-widest ${action === 'grant' ? 'bg-green-500 shadow-green-100' : 'bg-red-500 shadow-red-100'}`}
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
};