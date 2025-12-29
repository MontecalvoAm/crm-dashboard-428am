'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, User, Mail, Phone, Star, Building2, MessageSquare, ChevronDown } from 'lucide-react';

interface Status { id: number; status_name: string; }
interface Company { token: string; CompanyName: string; id: number; }

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [formData, setFormData] = useState({
    LeadName: '',
    Email: '',
    Phone: '',
    Interest: '',
    MessageContent: '',
    StatusID: 3, 
    company_id: '' 
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [resStatus, resComp] = await Promise.all([
            fetch('/api/statuses'),
            fetch('/api/companies')
          ]);
          const jsonStatus = await resStatus.json();
          const jsonComp = await resComp.json();
          if (jsonStatus.success) setStatuses(jsonStatus.data);
          if (jsonComp.success) setCompanies(jsonComp.data.companies || []);
        } catch (err) { console.error(err); }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const roleId = localStorage.getItem('user_role_id') || "";

      // Ensure we send a number or null
      const selectedId = formData.company_id ? parseInt(formData.company_id, 10) : null;

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: selectedId 
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        setFormData({ LeadName: '', Email: '', Phone: '', Interest: '', MessageContent: '', StatusID: 3, company_id: '' });
        onClose();
      } else {
        alert(data.error);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 pb-6 flex justify-between items-center border-b border-zinc-50 bg-zinc-50/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-200">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Register Lead</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">New entry for database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-300 transition-all cursor-pointer"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><User className="w-3 h-3 text-yellow-500" /> Name</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.LeadName} onChange={(e) => setFormData({...formData, LeadName: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Mail className="w-3 h-3 text-yellow-500" /> Email</label>
              <input type="email" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Phone className="w-3 h-3 text-yellow-500" /> Phone</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Phone} onChange={(e) => setFormData({...formData, Phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Star className="w-3 h-3 text-yellow-500" /> Interest</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Interest} onChange={(e) => setFormData({...formData, Interest: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Building2 className="w-3 h-3 text-yellow-500" /> Assign Organization</label>
            <div className="relative group">
              <select 
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-yellow-400/5 transition-all" 
                value={formData.company_id} 
                onChange={(e) => setFormData({...formData, company_id: e.target.value})} 
                required
              >
                <option value="">Select Organization</option>
                {companies.map(c => <option key={c.token} value={c.id}>{c.CompanyName}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><MessageSquare className="w-3 h-3 text-yellow-500" /> Notes</label>
            <textarea rows={3} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all resize-none" value={formData.MessageContent} onChange={(e) => setFormData({...formData, MessageContent: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 bg-zinc-900 hover:bg-black text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Confirm Entry</>}
          </button>
        </form>
      </div>
    </div>
  );
}