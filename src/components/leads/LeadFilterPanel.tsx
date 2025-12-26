'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { LeadFilters } from '@/types/leads';

interface LeadFilterPanelProps {
  onFilterChange: (filters: LeadFilters) => void;
  currentFilters: LeadFilters;
}

export default function LeadFilterPanel({ onFilterChange, currentFilters }: LeadFilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

  const priorityOptions = ['cold', 'warm', 'hot'];
  const pipelineOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...currentFilters, search });
  };

  const handleStatusChange = (status: string[]) => {
    onFilterChange({ ...currentFilters, status: status.map(s => parseInt(s)) });
  };

  const handlePriorityChange = (priority: string[]) => {
    onFilterChange({ ...currentFilters, priority: priority as LeadFilters['priority'] });
  };

  const clearFilters = () => {
    onFilterChange({});
    setShowFilters(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, or company..."
            value={currentFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="space-y-2">
              {priorityOptions.map(option => (
                <label key={option} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={currentFilters.priority?.includes(option as any) || false}
                    onChange={(e) => {
                      const newPriority = e.target.checked
                        ? [...(currentFilters.priority || []), option]
                        : (currentFilters.priority || []).filter(p => p !== option);
                      handlePriorityChange(newPriority);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pipeline Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline Stage</label>
            <div className="space-y-2">
              {pipelineOptions.map(option => (
                <label key={option} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={currentFilters.pipelineStage?.includes(option as any) || false}
                    onChange={(e) => {
                      const newStages = e.target.checked
                        ? [...(currentFilters.pipelineStage || []), option]
                        : (currentFilters.pipelineStage || []).filter(p => p !== option);
                      handlePipelineChange(newStages);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2 capitalize"
                  />
                  {option.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="space-y-2">
              <input
                type="date"
                className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary-500"
                onChange={(e) => handleDateChange('from', e.target.value)}
              />
              <input
                type="date"
                className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary-500"
                onChange={(e) => handleDateChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          Results: <span className="font-semibold">{getActiveFiltersCount()} filters</span>
        </div>
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition"
        >
          <X className="w-3 h-3" />
          Clear All
        </button>
      </div>
    </div>
  );
}

// Helper functions
function handlePipelineChange(stages: string[]) {
  // Implementation would go here based on your pipeline integration
}

function handleDateChange(type: 'from' | 'to', value: string) {
  // Implementation would go here
}

function getActiveFiltersCount() {
  // Count active filters
  return 0;
}