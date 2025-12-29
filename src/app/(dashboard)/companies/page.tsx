'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Building2, Globe, Share2, 
  Mail, Loader2, X, Info, Phone, MapPin, 
  ChevronRight, MoreHorizontal 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import SuccessToast from '@/components/ui/Toast';

// --- Interfaces ---
interface Company {
  token: string;
  CompanyName: string;
  CompanyInfo: string;
  CompanyProfile: string;
  Industry: string;
  Email: string;
  Phone: string;
  WebsiteURL: string | null;
  SocialURL: string | null;
}

// --- AddCompanyModal Component ---
interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CompanyName: '',
    CompanyProfile: '',
    CompanyInfo: '',
    Industry: '',
    Email: '',
    Phone: '',
    Address: '',
    WebsiteURL: '',
    SocialURL: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
        onClose();
        setFormData({
          CompanyName: '', CompanyProfile: '', CompanyInfo: '',
          Industry: '', Email: '', Phone: '', Address: '',
          WebsiteURL: '', SocialURL: ''
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="px-12 pt-12 pb-6 flex justify-between items-start sticky top-0 bg-white z-10 border-b border-gray-50/50">
          <div>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">New Registration</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Add New Company</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-12 pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Building2 className="w-3 h-3 text-yellow-500" /> Company Name
              </label>
              <input 
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                value={formData.CompanyName}
                onChange={(e) => setFormData({...formData, CompanyName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Info className="w-3 h-3 text-yellow-500" /> Industry
              </label>
              <input 
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                placeholder="E.G. TECHNOLOGY"
                value={formData.Industry}
                onChange={(e) => setFormData({...formData, Industry: e.target.value})}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-yellow-400 hover:bg-yellow-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-yellow-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Register Company</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Auth State
  const router = useRouter();

  // Define the Super Admin token constant used throughout your project
  const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies?search=${searchTerm}`);
      const json = await res.json();
      if (json.success) setCompanies(json.data.companies);
    } catch (err) {
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  }, [searchTerm]);

  useEffect(() => {
    // 1. Check for Super Admin Token on mount
    const xRoleToken = localStorage.getItem('x-user-role-token');
    const storedUser = localStorage.getItem('user');

    let isAdmin = false;

    // Check direct token
    if (xRoleToken === SUPER_ADMIN_TOKEN) {
      isAdmin = true;
    } 
    // Fallback: check inside the JSON 'user' object if that's where you keep it
    else if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if ((parsed.roleToken || parsed.role_token) === SUPER_ADMIN_TOKEN) {
        isAdmin = true;
      }
    }

    setIsSuperAdmin(isAdmin);
    
    // 2. Fetch data
    fetchCompanies(); 
  }, [fetchCompanies]);

  const handleSuccess = () => {
    fetchCompanies();
    setToast({ show: true, message: 'Company Registered Successfully' });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight uppercase">Companies</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Enterprise Directory & Partnership Management</p>
        </div>
        
        {/* Only show the Add Company button if user is the Super Admin */}
        {isSuperAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 inline mr-2" /> Add Company
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-4 mb-8 shadow-sm flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="SEARCH BY COMPANY NAME OR INDUSTRY..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-yellow-400/5 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((company) => (
                <tr 
                  key={company.token} 
                  onClick={() => router.push(`/companies/${company.token}`)}
                  className="hover:bg-yellow-50/50 transition-all group cursor-pointer relative"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black text-sm border border-yellow-100 uppercase transition-transform group-hover:scale-110">
                        {company.CompanyName?.[0] || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{company.CompanyName}</p>
                        <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-1">
                          {company.Industry} — <span className="text-gray-400 italic font-bold">Click for more info</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tight">
                        <Mail className="w-3.5 h-3.5 text-yellow-500" /> {company.Email || 'NO EMAIL REGISTERED'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                        <Phone className="w-3.5 h-3.5 text-gray-300" /> {company.Phone || 'NO CONTACT'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {company.WebsiteURL && (
                        <a 
                          href={company.WebsiteURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-xl bg-gray-900 text-white hover:bg-yellow-500 transition-all"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 group-hover:text-yellow-600 group-hover:bg-yellow-100 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <div className="py-24 text-center">
               <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No companies found in directory</p>
            </div>
          )}
        </div>
      )}

      {/* Modals & Feedback */}
      <AddCompanyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess} 
      />

      <SuccessToast 
        isOpen={toast.show} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}