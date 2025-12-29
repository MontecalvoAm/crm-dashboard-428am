'use client';

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, 
  Globe, Share2, Edit2, Trash2, Loader2, Info
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import EditCompanyModal from './EditCompanyModal';

interface Company {
  token: string;
  CompanyName: string;
  CompanyInfo: string;
  CompanyProfile: string;
  Industry: string;
  Email: string;
  Phone: string;
  Address: string;
  WebsiteURL: string | null;
  SocialURL: string | null;
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanyDetails = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Ensure you pass the required headers if your API checks for them
      const res = await fetch(`/api/companies/${token}`, {
        headers: {
          'x-company-token': token, // Example mapping
          'x-user-role-token': 'admin' // Example mapping
        }
      });
      
      if (!res.ok) {
        setCompany(null);
        return;
      }

      const json = await res.json();
      if (json.success) {
        // FIXED: API returns company object directly in data
        setCompany(json.data); 
      } else {
        setCompany(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  const handleDeleteEntity = async () => {
    const confirmed = confirm(`CRITICAL: Are you sure you want to archive ${company?.CompanyName}?`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/companies/${token}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        router.push('/companies');
      } else {
        alert(json.error || "Failed to archive company");
      }
    } catch (err) {
      console.error("Delete Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      <p className="mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Loading Entity...</p>
    </div>
  );

  if (!company) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Company Not Found</h2>
      <button 
        onClick={() => router.push('/companies')} 
        className="mt-4 text-yellow-500 font-black uppercase text-[9px] tracking-widest hover:underline"
      >
        Return to Directory
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700 pb-24 px-10">
      
      <button 
        onClick={() => router.push('/companies')}
        className="group flex items-center gap-2.5 mb-12 text-gray-400 hover:text-yellow-500 transition-all cursor-pointer bg-transparent border-none"
      >
        <div className="p-2 rounded-xl bg-white border border-gray-100 group-hover:border-yellow-200 shadow-sm transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">Back</span>
      </button>

      <div className="flex flex-col items-center text-center mb-16">
        <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
          <div className="w-28 h-28 rounded-[2.5rem] bg-yellow-400 flex items-center justify-center text-white shadow-xl shadow-yellow-100 border-8 border-white transition-transform group-hover:scale-105">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-black text-gray-900 uppercase tracking-tight">{company.CompanyName}</h1>
        <div className="mt-2.5 inline-flex items-center bg-yellow-50 px-5 py-1.5 rounded-full border border-yellow-100">
          <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.3em]">{company.Industry}</span>
        </div>
        <p className="mt-5 text-sm text-gray-400 italic font-medium max-w-lg leading-relaxed px-6">
          &quot;{company.CompanyProfile || 'No tagline provided'}&quot;
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-[3rem] p-14 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
          <div className="space-y-10">
            <DetailItem icon={<Mail className="w-4 h-4" />} label="Official Email" value={company.Email} />
            <DetailItem icon={<Phone className="w-4 h-4" />} label="Contact Number" value={company.Phone} />
            <DetailItem icon={<MapPin className="w-4 h-4" />} label="Headquarters" value={company.Address} />
          </div>
          <div className="space-y-10">
            <DetailItem icon={<Globe className="w-4 h-4" />} label="Website" value={company.WebsiteURL} isLink />
            <DetailItem icon={<Share2 className="w-4 h-4" />} label="Social Network" value={company.SocialURL} isLink />
            <DetailItem icon={<Info className="w-4 h-4" />} label="Token ID" value={company.token} />
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-gray-50">
          <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4 block ml-1">
            Corporate Narrative
          </label>
          <div className="p-8 bg-gray-50/40 border border-gray-100 rounded-[2rem] text-[13px] text-gray-600 leading-relaxed font-medium italic">
            {company.CompanyInfo || 'No detailed corporate description has been recorded.'}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-12">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-gray-900 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg cursor-pointer active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5" /> Modify Profile
          </button>
          <button 
            onClick={handleDeleteEntity}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-red-50 text-red-500 border border-red-100 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {isDeleting ? "Archiving..." : "Delete Entity"}
          </button>
        </div>
      </div>
      
      <EditCompanyModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        company={company} 
        onUpdate={fetchCompanyDetails} 
      />
    </div>
  );
}

function DetailItem({ icon, label, value, isLink = false }: { icon: ReactElement, label: string, value: string | null, isLink?: boolean }) {
  return (
    <div className="flex items-start gap-5 group">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-yellow-500 border border-gray-100 group-hover:bg-yellow-400 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">{label}</p>
        {isLink && value ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-blue-600 hover:underline break-all transition-all">
            {value}
          </a>
        ) : (
          <p className="text-[13px] font-bold text-gray-900 break-all">{value || 'Not Registered'}</p>
        )}
      </div>
    </div>
  );
}