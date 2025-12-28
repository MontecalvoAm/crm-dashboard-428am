'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Loader2, Save } from 'lucide-react';

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

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onUpdate: () => void;
}

export default function EditCompanyModal({ isOpen, onClose, company, onUpdate }: EditCompanyModalProps) {
  const [formData, setFormData] = useState({
    CompanyName: '',
    Industry: '',
    Email: '',
    Phone: '',
    Address: '',
    CompanyProfile: '',
    CompanyInfo: '',
    WebsiteURL: '',
    SocialURL: ''
  });
  const [loading, setLoading] = useState(false);

  // Sync form data when company prop changes
  useEffect(() => {
    if (company) {
      setFormData({
        CompanyName: company.CompanyName || '',
        Industry: company.Industry || '',
        Email: company.Email || '',
        Phone: company.Phone || '',
        Address: company.Address || '',
        CompanyProfile: company.CompanyProfile || '',
        CompanyInfo: company.CompanyInfo || '',
        WebsiteURL: company.WebsiteURL || '',
        SocialURL: company.SocialURL || ''
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${company.token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        onUpdate(); // Refresh the detail page
        onClose();   // Close the modal
      } else {
        alert(json.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex justify-between items-start border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">Administrative Action</p>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Modify Corporate Profile</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Essential Identity */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Identity & Categorization</h3>
              
              <FormInput label="Company Name" value={formData.CompanyName} 
                onChange={(v) => setFormData({...formData, CompanyName: v})} required />
              
              <FormInput label="Industry Sector" value={formData.Industry} 
                onChange={(v) => setFormData({...formData, Industry: v})} required />
              
              <FormInput label="Corporate Tagline" value={formData.CompanyProfile} 
                onChange={(v) => setFormData({...formData, CompanyProfile: v})} placeholder="Brief motto or mission..." />
            </div>

            {/* Contact & Digital */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Contact & Connectivity</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Official Email" value={formData.Email} 
                  onChange={(v) => setFormData({...formData, Email: v})} required />
                <FormInput label="Contact Number" value={formData.Phone} 
                  onChange={(v) => setFormData({...formData, Phone: v})} required />
              </div>

              <FormInput label="Website URL" value={formData.WebsiteURL} 
                onChange={(v) => setFormData({...formData, WebsiteURL: v})} placeholder="https://..." />
              
              <FormInput label="Social Network" value={formData.SocialURL} 
                onChange={(v) => setFormData({...formData, SocialURL: v})} placeholder="LinkedIn/Facebook..." />
            </div>

            {/* Full Width Fields */}
            <div className="md:col-span-2 space-y-6 pt-4">
              <FormInput label="Headquarters Address" value={formData.Address} 
                onChange={(v) => setFormData({...formData, Address: v})} required />
              
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Corporate Narrative (Deep Description)</label>
                <textarea 
                  value={formData.CompanyInfo}
                  onChange={(e) => setFormData({...formData, CompanyInfo: e.target.value})}
                  className="w-full p-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-yellow-400/5 transition-all outline-none min-h-[120px] italic"
                  placeholder="Detailed history and information..."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">
            Discard
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-4 bg-gray-900 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 shadow-xl shadow-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Synchronizing..." : "Commit Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Internal Helper Component for Forms
function FormInput({ label, value, onChange, required = false, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, required?: boolean, placeholder?: string }) {
  return (
    <div>
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-yellow-400/5 transition-all outline-none"
      />
    </div>
  );
}