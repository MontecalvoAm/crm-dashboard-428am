'use client';

import { useState } from 'react';
import { X, Loader2, Plus, Building2, Mail, Phone, Globe, Share2, MapPin, Info } from 'lucide-react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
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
        
        <div className="px-12 pt-12 pb-6 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">New Registration</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Add New Company</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-12 space-y-6">
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
              Tagline / Short Profile
            </label>
            <input 
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
              placeholder="E.G. LEADING INNOVATOR IN SOFTWARE"
              value={formData.CompanyProfile}
              onChange={(e) => setFormData({...formData, CompanyProfile: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Mail className="w-3 h-3 text-yellow-500" /> Business Email
              </label>
              <input 
                type="email"
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                value={formData.Email}
                onChange={(e) => setFormData({...formData, Email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Phone className="w-3 h-3 text-yellow-500" /> Contact Phone
              </label>
              <input 
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                value={formData.Phone}
                onChange={(e) => setFormData({...formData, Phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-yellow-500" /> Full Address
            </label>
            <input 
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
              value={formData.Address}
              onChange={(e) => setFormData({...formData, Address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Globe className="w-3 h-3 text-yellow-500" /> Website URL
              </label>
              <input 
                placeholder="HTTPS://..."
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                value={formData.WebsiteURL}
                onChange={(e) => setFormData({...formData, WebsiteURL: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Share2 className="w-3 h-3 text-yellow-500" /> Social Link
              </label>
              <input 
                placeholder="HTTPS://FACEBOOK.COM/..."
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all"
                value={formData.SocialURL}
                onChange={(e) => setFormData({...formData, SocialURL: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
              Detailed Company Information
            </label>
            <textarea 
              rows={4}
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-yellow-400/20 transition-all resize-none"
              value={formData.CompanyInfo}
              onChange={(e) => setFormData({...formData, CompanyInfo: e.target.value})}
            />
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