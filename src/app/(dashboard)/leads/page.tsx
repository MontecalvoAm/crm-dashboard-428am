'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Download, Grid, List, 
  Loader2, Mail, Phone, Edit2, 
  ChevronLeft, ChevronRight, Calendar,
  Trash2, Filter, ChevronDown, Building2, MessageSquare, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// IMPORT YOUR MODAL COMPONENTS
import EditLeadModal from './EditLeadModal';
import DeleteLeadModal from './DeleteConfirmationModal';
import ProfileCard from './ProfileCard';
import AddLeadModal from './AddLeadModal'; // NEW: Import the Add Modal
import SuccessToast from '@/components/ui/Toast';

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
  DateAdded: string;
  company_id: number; // MUST BE HERE
}

interface Company {
  token: string;
  CompanyName: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // --- NOTIFICATION STATE ---
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  // --- FILTERS STATE ---
  const [sortBy, setSortBy] = useState<'default' | 'status'>('default');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [companyFilter, setCompanyFilter] = useState<string>('All Companies');

  // --- MODAL STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // NEW: Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToAction, setLeadToAction] = useState<Lead | null>(null);

  const itemsPerPage = 5;
  const router = useRouter();

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch('/api/companies'); 
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.companies)) {
        setCompanies(data.data.companies);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  }, []);

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
    fetchCompanies();
  }, [fetchLeads, fetchCompanies]);

  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(leads.map(l => l.StatusName)));
    return ['All Status', ...statuses];
  }, [leads]);

  const filteredAndSortedLeads = useMemo(() => {
    const processed = leads.filter(lead => {
      const statusMatch = statusFilter === 'All Status' || lead.StatusName === statusFilter;
      const companyMatch = companyFilter === 'All Companies' || lead.CompanyName === companyFilter;
      return statusMatch && companyMatch;
    });
    if (sortBy === 'status') processed.sort((a, b) => a.StatusName.localeCompare(b.StatusName));
    return processed;
  }, [leads, statusFilter, companyFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const currentLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLeads.slice(start, start + itemsPerPage);
  }, [filteredAndSortedLeads, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, companyFilter, sortBy]);

  const handleExport = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Interest', 'Status', 'Date Added'];
    const rows = leads.map(l => [l.LeadName, l.CompanyName, l.Email, l.Phone, l.Interest, l.StatusName, l.DateAdded]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  // --- REAL-TIME SUCCESS HANDLERS ---
  const handleAddSuccess = () => {
    fetchLeads();
    setToast({
      isOpen: true,
      message: 'New lead successfully added to pipeline.'
    });
  };

  const handleDeleteSuccess = () => {
    fetchLeads(); 
    setToast({
      isOpen: true,
      message: `${leadToAction?.LeadName} has been archived successfully.`
    });
  };

  const handleUpdateSuccess = () => {
    fetchLeads(); 
    setToast({
      isOpen: true,
      message: `Lead profile updated successfully.`
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight uppercase">Leads Management</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Track and convert your customer pipeline</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} // UPDATED: Now opens Modal
          className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-xl shadow-yellow-100 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-4 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input type="text" placeholder="SEARCH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-yellow-400/5 outline-none transition-all" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <Building2 className="absolute left-4 w-3.5 h-3.5 text-gray-400 z-10" />
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="pl-10 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white transition-all appearance-none cursor-pointer text-gray-600 min-w-[160px]">
              <option value="All Companies">All Companies</option>
              {companies.map(comp => <option key={comp.token} value={comp.CompanyName}>{comp.CompanyName}</option>)}
            </select>
            <ChevronDown className="absolute right-4 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex items-center">
            <Filter className="absolute left-4 w-3.5 h-3.5 text-gray-400 z-10" />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSortBy(e.target.value === 'All Status' ? 'default' : 'status');
              }} 
              className="pl-10 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white transition-all appearance-none cursor-pointer text-gray-600 min-w-[160px]"
            >
              {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <ChevronDown className="absolute right-4 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
            </div>
            <button onClick={handleExport} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition text-gray-400 cursor-pointer"><Download className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm mb-8">
          {viewMode === 'list' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Interest</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentLeads.map((lead) => (
                  <tr key={lead.token} onClick={() => setSelectedLead(lead)} className="hover:bg-yellow-50/50 transition-all group cursor-pointer">
                    <td className="px-8 py-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black text-xs border border-yellow-100 uppercase">{lead.LeadName[0]}</div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{lead.LeadName}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{lead.CompanyName}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tight"><Mail className="w-3.5 h-3.5 text-yellow-500" /> {lead.Email}</p>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase mt-1 tracking-widest"><Phone className="w-3.5 h-3.5 text-gray-300" /> {lead.Phone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        <span className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[9px] font-black text-zinc-600 uppercase truncate max-w-[150px]">
                          {lead.Interest || 'General'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-yellow-50 text-yellow-600 border-yellow-100">{lead.StatusName}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setLeadToAction(lead); setIsEditModalOpen(true); }} className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setLeadToAction(lead); setIsDeleteModalOpen(true); }} className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentLeads.map(lead => (
                <div key={lead.token} onClick={() => setSelectedLead(lead)} className="border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl bg-white cursor-pointer transition-all hover:border-yellow-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{lead.StatusName}</p>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setLeadToAction(lead); setIsEditModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setLeadToAction(lead); setIsDeleteModalOpen(true); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="font-black text-gray-900 uppercase tracking-tight">{lead.LeadName}</p>
                  <p className="text-[9px] font-black text-yellow-600 uppercase mb-4">{lead.Interest}</p>
                  <div className="p-4 bg-gray-50 rounded-2xl text-[11px] text-gray-500 italic line-clamp-2">&quot;{lead.MessageContent}&quot;</div>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing <span className="text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredAndSortedLeads.length)}</span> of <span className="text-zinc-900">{filteredAndSortedLeads.length}</span> Records
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border bg-white text-gray-400 disabled:opacity-20 cursor-pointer shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 'bg-white border border-gray-100 text-gray-400 hover:border-yellow-200'}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border bg-white text-gray-400 disabled:opacity-20 cursor-pointer shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL COMPONENTS --- */}
      
      {/* NEW: Add Lead Modal */}
      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleAddSuccess} 
      />

      <EditLeadModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        lead={leadToAction} 
        onUpdate={handleUpdateSuccess} 
      />

      <DeleteLeadModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteSuccess} 
        leadName={leadToAction?.LeadName || ''} 
        leadToken={leadToAction?.token || ''} 
      />

      {selectedLead && (
        <ProfileCard 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
        />
      )}

      {/* --- NOTIFICATION TOAST --- */}
      <SuccessToast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, isOpen: false })} 
      />
    </div>
  );
}