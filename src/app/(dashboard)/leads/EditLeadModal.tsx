'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, ChevronDown, User, Mail, Phone, Target } from 'lucide-react';

interface Status {
  id: number;
  status_name: string;
}

interface Lead {
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  StatusID: number;
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdate: () => void;
}

export default function EditLeadModal({ isOpen, onClose, lead, onUpdate }: EditLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [formData, setFormData] = useState({
    LeadName: '',
    Email: '',
    Phone: '',
    StatusID: 1
  });

  // Fetch Statuses from API
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/statuses');
        const json = await res.json();
        if (json.success) setStatuses(json.data);
      } catch (err) {
        console.error("Failed to fetch statuses", err);
      }
    };
    fetchStatuses();
  }, []);

  // Sync form data when the lead prop changes
  useEffect(() => {
    if (lead) {
      setFormData({
        LeadName: lead.LeadName,
        Email: lead.Email,
        Phone: lead.Phone,
        StatusID: lead.StatusID
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${lead.token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-12 pt-12 pb-8 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">Update Information</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Edit Lead Profile</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-12 space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <User className="w-3 h-3 text-yellow-500" /> Lead Name
            </label>
            <input 
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 focus:ring-4 focus:ring-yellow-400/5 transition-all"
              value={formData.LeadName}
              onChange={(e) => setFormData({...formData, LeadName: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Mail className="w-3 h-3 text-yellow-500" /> Email Address
              </label>
              <input 
                type="email"
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 focus:ring-4 focus:ring-yellow-400/5 transition-all"
                value={formData.Email}
                onChange={(e) => setFormData({...formData, Email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Phone className="w-3 h-3 text-yellow-500" /> Contact Number
              </label>
              <input 
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 focus:ring-4 focus:ring-yellow-400/5 transition-all"
                value={formData.Phone}
                onChange={(e) => setFormData({...formData, Phone: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Dynamic Pipeline Status Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <Target className="w-3 h-3 text-yellow-500" /> Pipeline Status
            </label>
            <div className="relative group">
              <select 
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 focus:ring-4 focus:ring-yellow-400/5 transition-all appearance-none cursor-pointer"
                value={formData.StatusID}
                onChange={(e) => setFormData({...formData, StatusID: parseInt(e.target.value)})}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.status_name.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-yellow-500 transition-colors">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-yellow-400 hover:bg-yellow-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-yellow-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Update Lead Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}