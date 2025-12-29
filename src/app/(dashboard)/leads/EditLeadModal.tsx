'use client';

import { useState, useEffect } from 'react';
import { 
  X, Loader2, Save, ChevronDown, User, 
  Mail, Phone, Target, Star, ShieldCheck, Building2 
} from 'lucide-react';

interface Status { id: number; status_name: string; }
interface Company { id: number; CompanyName: string; token: string; }

interface Lead {
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  Interest: string;
  StatusName: string; 
  StatusID: number;
  CompanyName: string; 
  company_token?: string; // Crucial for dropdown matching
  DateAdded: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    LeadName: '',
    Email: '',
    Phone: '',
    Interest: '',
    StatusID: 0,
    company_token: '' 
  });

  const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

  // 1. Fetching logic (Admin check and Dropdown data)
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        const storedUser = localStorage.getItem('user');
        const xRoleToken = localStorage.getItem('x-user-role-token');
        const xCompanyToken = localStorage.getItem('x-company-token');
        
        let adminStatus = false;
        let activeRoleToken = xRoleToken || '';
        let activeCompanyToken = xCompanyToken || '';

        // --- FIXED ADMIN DETECTION LOGIC ---
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Check roleToken from stored user object
          const userRoleToken = parsed.roleToken || parsed.role_token;
          const userCompanyToken = parsed.companyToken || parsed.company_token;
          
          if (userRoleToken === SUPER_ADMIN_TOKEN) {
            adminStatus = true;
            activeRoleToken = userRoleToken;
          }
          if (userCompanyToken && !activeCompanyToken) {
            activeCompanyToken = userCompanyToken;
          }
        }

        // Fallback for direct header token check
        if (!adminStatus && xRoleToken === SUPER_ADMIN_TOKEN) {
          adminStatus = true;
        }

        setIsSuperAdmin(adminStatus);

        const headers = {
          'x-user-role-token': activeRoleToken,
          'x-company-token': activeCompanyToken
        };

        const [statusRes, companyRes] = await Promise.all([
          fetch('/api/statuses'),
          adminStatus ? fetch('/api/companies', { headers }) : Promise.resolve(null)
        ]);

        const statusJson = await statusRes.json();
        if (statusJson.success) setStatuses(statusJson.data);

        if (companyRes) {
          const companyJson = await companyRes.json();
          // Adjust based on your API response structure for companies
          const companyList = companyJson.data?.companies || companyJson.data || [];
          if (companyJson.success) setCompanies(companyList);
        }
      } catch (err) {
        console.error("Failed to fetch edit modal data", err);
      }
    };

    fetchData();
  }, [isOpen]);

  // 2. FORM INITIALIZATION LOGIC
  // This ensures the dropdown displays the current company of the lead
  useEffect(() => {
    if (lead) {
      setFormData({
        LeadName: lead.LeadName || '',
        Email: lead.Email || '',
        Phone: lead.Phone || '',
        Interest: lead.Interest || '',
        StatusID: lead.StatusID || 0,
        // Match the lead's company token to the dropdown options
        company_token: lead.company_token || '' 
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      let roleToken = localStorage.getItem('x-user-role-token') || "";
      let companyToken = localStorage.getItem('x-company-token') || "";

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (!roleToken) roleToken = parsed.roleToken || "";
        if (!companyToken) companyToken = parsed.companyToken || "";
      }

      const response = await fetch(`/api/leads/${lead.token}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-company-token': companyToken,
          'x-user-role-token': roleToken
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onUpdate(); 
        onClose();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert("Failed to reach server.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 pb-6 flex justify-between items-center border-b border-zinc-50 bg-zinc-50/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Modify Lead</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Refining data for {lead.LeadName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-zinc-300 hover:text-zinc-900 transition-all cursor-pointer shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
          {!isSuperAdmin && process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
               <p className="text-[10px] text-red-500 font-bold uppercase text-center">Admin access not detected. Check Console for DEBUG AUTH.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><User className="w-3 h-3 text-yellow-500" /> Full Identity</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.LeadName} onChange={(e) => setFormData({...formData, LeadName: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Mail className="w-3 h-3 text-yellow-500" /> Email Address</label>
              <input type="email" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Phone className="w-3 h-3 text-yellow-500" /> Phone</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Phone} onChange={(e) => setFormData({...formData, Phone: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Star className="w-3 h-3 text-yellow-500" /> Lead Interest</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.Interest} placeholder="E.G. REAL ESTATE" onChange={(e) => setFormData({...formData, Interest: e.target.value})} />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="space-y-2 pt-4 border-t border-zinc-50 animate-in slide-in-from-top-2 duration-500">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Building2 className="w-3 h-3 text-yellow-500" /> Reassign to Organization
              </label>
              <div className="relative group">
                <select 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-yellow-400/10 transition-all"
                  value={formData.company_token}
                  onChange={(e) => setFormData({...formData, company_token: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a Company</option>
                  {companies.map((comp) => (
                    <option key={comp.token} value={comp.token}>{comp.CompanyName}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Target className="w-3 h-3 text-yellow-500" /> Pipeline Progression</label>
            <div className="relative group">
              <select 
                className="w-full px-6 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-yellow-400/20 transition-all"
                value={formData.StatusID}
                onChange={(e) => setFormData({...formData, StatusID: parseInt(e.target.value)})}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>{status.status_name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-6 bg-yellow-400 hover:bg-yellow-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-yellow-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Save Profile Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}