'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Download, Grid, List, 
  Users, Loader2, Mail, Phone, Edit2, 
  ChevronLeft, ChevronRight, Calendar, X 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Lead {
  token: string; // Changed from LeadID
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  StatusName: string; 
  StatusID: number;
  DateAdded: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const itemsPerPage = 5;
  const router = useRouter();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/leads', window.location.origin);
      if (searchTerm) url.searchParams.set('search', searchTerm);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setLeads(data.data.leads);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const currentLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return leads.slice(start, start + itemsPerPage);
  }, [leads, currentPage]);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Message', 'Status', 'Date Added'];
    const rows = leads.map(l => [
      l.LeadName, l.Email, l.Phone, 
      l.MessageContent.replace(/,/g, " "), 
      l.StatusName, l.DateAdded
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight uppercase">Leads Management</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Track and convert your customer pipeline</p>
        </div>
        <button
          onClick={() => router.push('/leads/new')}
          className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-4 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="SEARCH BY NAME, EMAIL OR MESSAGE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-yellow-400/5 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={handleExport} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition text-gray-400 cursor-pointer"><Download className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-[3rem] py-24 text-center">
            <Users className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No leads found</h3>
            <button onClick={() => setSearchTerm('')} className="mt-4 text-yellow-500 font-black text-[10px] uppercase tracking-widest hover:underline">Clear search</button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm mb-8">
            {viewMode === 'list' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Captured On</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentLeads.map((lead) => (
                    <tr 
                      key={lead.token} 
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-yellow-50/50 transition-all group cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black text-xs border border-yellow-100 uppercase">
                            {lead.LeadName[0]}
                          </div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{lead.LeadName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tight">
                          <Mail className="w-3.5 h-3.5 text-yellow-500" /> {lead.Email}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase mt-1 tracking-widest">
                          <Phone className="w-3.5 h-3.5 text-gray-300" /> {lead.Phone}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5 text-gray-300" />
                           <p className="text-[10px] font-black text-gray-500 uppercase">
                             {new Date(lead.DateAdded).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                           </p>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-yellow-50 text-yellow-600 border-yellow-100">
                          {lead.StatusName}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/leads/edit/${lead.token}`); }}
                            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentLeads.map(lead => (
                  <div 
                    key={lead.token} 
                    onClick={() => setSelectedLead(lead)}
                    className="border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl transition-all bg-white relative overflow-hidden cursor-pointer hover:border-yellow-200"
                  >
                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-2">{lead.StatusName}</p>
                    <p className="font-black text-gray-900 uppercase tracking-tight">{lead.LeadName}</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-[11px] text-gray-500 italic">
                      &quot;{lead.MessageContent.substring(0, 80)}...&quot;
                    </div>
                    <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Calendar className="w-3 h-3" /> {new Date(lead.DateAdded).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, leads.length)}</span> of <span className="text-gray-900">{leads.length}</span> Records
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-400 disabled:opacity-20 cursor-pointer shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 'bg-white border border-gray-100 text-gray-400 hover:border-yellow-200'}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-400 disabled:opacity-20 cursor-pointer shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="px-10 pt-10 pb-6 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">Lead Details</p>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedLead.LeadName}
                </h2>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-10 pb-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-yellow-500" /> Email
                  </p>
                  <p className="text-xs font-bold text-gray-800 break-all">{selectedLead.Email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-yellow-500" /> Phone
                  </p>
                  <p className="text-xs font-bold text-gray-800">{selectedLead.Phone}</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Full Message Content</p>
                <div className="p-6 bg-yellow-50/30 border border-yellow-100 rounded-3xl text-sm text-gray-700 leading-relaxed font-medium italic">
                  &quot;{selectedLead.MessageContent}&quot;
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Captured On</p>
                  <div className="flex items-center gap-2 text-gray-600 font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedLead.DateAdded).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-yellow-400 text-white shadow-md shadow-yellow-100">
                    {selectedLead.StatusName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}