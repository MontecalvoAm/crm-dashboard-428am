'use client';

import { X, Mail, Phone, Building2, MessageSquare, Calendar, Star } from 'lucide-react';

interface Lead {
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  Interest: string; // Added
  StatusName: string;
  StatusID: number;
  CompanyName: string;
  DateAdded: string;
}

interface ProfileCardProps {
  lead: Lead;
  onClose: () => void;
}

export default function ProfileCard({ lead, onClose }: ProfileCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col">
        
        {/* Header Section */}
        <div className="px-10 pt-10 pb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-yellow-100">
              {lead.LeadName[0]}
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">Lead Identity</p>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{lead.LeadName}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="px-10 pb-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* New Interest Badge at Top */}
          <div className="flex items-center gap-2 px-5 py-3 bg-yellow-50 border border-yellow-100 rounded-2xl">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Interested In: {lead.Interest || 'General'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Building2 className="w-3 h-3 text-yellow-500" /> Organization</p>
              <p className="text-xs font-bold text-gray-800 uppercase truncate">{lead.CompanyName}</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3 text-yellow-500" /> Email</p>
              <p className="text-xs font-bold text-gray-800 truncate">{lead.Email}</p>
            </div>
          </div>

          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3 text-yellow-500" /> Phone Contact</p>
            <p className="text-xs font-bold text-gray-800">{lead.Phone}</p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-4 h-4 text-yellow-500" />
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inquiry Details</p>
            </div>
            <div className="p-6 bg-yellow-50/30 border border-yellow-100 rounded-3xl text-sm text-gray-700 leading-relaxed font-medium italic">
              &quot;{lead.MessageContent}&quot;
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Captured On</p>
              <div className="flex items-center gap-2 text-gray-600 font-bold text-xs"><Calendar className="w-3.5 h-3.5" /> {new Date(lead.DateAdded).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-yellow-400 text-white shadow-lg shadow-yellow-100">{lead.StatusName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}