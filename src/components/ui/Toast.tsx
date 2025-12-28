'use client';

import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessToast({ message, isOpen, onClose }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000); // Auto-hide after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-gray-900 border-l-8 border-yellow-400 rounded-[2rem] px-8 py-6 shadow-2xl flex items-center gap-6 min-w-[350px]">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">System Action</p>
          <p className="text-xs font-bold text-white uppercase tracking-widest">{message}</p>
        </div>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-gray-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}