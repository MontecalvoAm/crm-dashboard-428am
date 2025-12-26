'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import { Lead, LeadStats } from '@/types/leads';
import { LeadFilterPanel } from '@/components/leads/LeadFilterPanel';
import { LeadCard } from '@/components/leads/LeadCard';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    closedWon: 0,
    lostLeads: 0,
    pipelineValue: 0,
    averageLeadScore: 0,
    byPriority: { cold: 0, warm: 0, hot: 0 },
    bySource: { facebook_messenger: 0, crewai: 0, manual: 0, website: 0 },
    byStage: {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignedTo: [],
    pipelineStage: [],
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads?page=1&limit=20`);
      const data = await response.json();

      if (data.success) {
        setLeads(Array.isArray(data.data.leads) ? data.data.leads : []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats (replace with actual API call)
      const mockStats: LeadStats = {
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.pipelineStage === 'new').length,
        qualifiedLeads: leads.filter(l => l.pipelineStage === 'qualified').length,
        closedWon: leads.filter(l => l.pipelineStage === 'closed_won').length,
        lostLeads: leads.filter(l => l.pipelineStage === 'closed_lost').length,
        pipelineValue: leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
        averageLeadScore: leads.reduce((sum, lead) => sum + lead.leadScore, 0) / (leads.length || 1),
        byPriority: {
          cold: leads.filter(l => l.priority === 'cold').length,
          warm: leads.filter(l => l.priority === 'warm').length,
          hot: leads.filter(l => l.priority === 'hot').length,
        },
        byStage: {
          new: leads.filter(l => l.pipelineStage === 'new').length,
          contacted: leads.filter(l => l.pipelineStage === 'contacted').length,
          qualified: leads.filter(l => l.pipelineStage === 'qualified').length,
          proposal: leads.filter(l => l.pipelineStage === 'proposal').length,
          negotiation: leads.filter(l => l.pipelineStage === 'negotiation').length,
          closed_won: leads.filter(l => l.pipelineStage === 'closed_won').length,
          closed_lost: leads.filter(l => l.pipelineStage === 'closed_lost').length,
        },
        bySource: {
          facebook_messenger: 0,
          crewai: 0,
          manual: 0,
          website: 0,
        },
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const PipelineOverview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline Overview</h3>

      <div className="space-y-2">
        {Object.entries(stats.byStage).map(([stage, count]) => (
          <div key={stage} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 capitalize">
              {stage.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${count / Math.max(stats.totalLeads, 1) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          color="bg-primary-500"
        />
        <StatCard
          title="New Leads"
          value={stats.newLeads}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Qualified"
          value={stats.qualifiedLeads}
          icon={Activity}
          color="bg-blue-500"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(stats.pipelineValue / 1000).toFixed(1)}K`}
          icon={Calendar}
          color="bg-orange-500"
        />
      </div>

      {/* Filter Panel */}
      {/* <LeadFilterPanel onFilterChange={setFilters} currentFilters={filters} /> */}

      {/* Pipeline Overview */}
      <PipelineOverview />

      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Recent Leads</h2>
          <p className="text-sm text-gray-600">Showing {leads.length} of {stats.totalLeads} leads</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/leads/new"
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition"
          >
            Add New Lead
          </Link>
          <Link
            href="/leads"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading leads...</span>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first lead or importing from existing data.</p>
          <Link
            href="/leads/new"
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition"
          >
            Add First Lead
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Render lead cards here */}
        </div>
      )}
    </div>
  );
}