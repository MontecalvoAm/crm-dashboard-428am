'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building, Calendar, Stars, Circle } from 'lucide-react';
import { Lead } from '@/types/leads';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onAssign: (leadId: number, assignedTo: number | null) => void;
  currentUserRole: string;
}

export default function LeadCard({ lead, onEdit, onAssign, currentUserRole }: LeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'hot': return 'text-red-500 bg-red-50';
      case 'warm': return 'text-orange-500 bg-orange-50';
      case 'cold': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{lead.firstName} {lead.lastName}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </span>
          </div>
          <p className="text-xs text-gray-600">{lead.company || 'No Company'}</p>
        </div>

        <div className="flex items-center gap-1">
          <Circle
            className="w-3 h-3"
            fill={lead.statusColor || '#6B7280'}
            stroke="none"
          />
          <span className="text-xs text-gray-600">{lead.statusName}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        {lead.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 truncate">{lead.email}</span>
          </div>
        )}

        {lead.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">{lead.phone}</span>
          </div>
        )}

        {lead.assignedUser && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              Assigned to {lead.assignedUser.firstName} {lead.assignedUser.lastName}
            </span>
          </div>
        )}
      </div>

      {/* Lead Score */}
      <div className="mb-3">
        <div className="flex items-center gap-2 justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Lead Score</span>
          <span className="text-xs font-semibold text-primary-600">{lead.leadScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${lead.leadScore}%` }}
          />
        </div>
      </div>

      {/* Pipeline Stage */}
      <div className="mb-3 p-2 bg-primary-50 rounded-lg">
        <div className="flex items-center gap-1 text-xs">
          <Stars className="w-3 h-3 text-primary-500" />
          <span className="font-medium text-primary-700">{lead.pipelineStage}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(lead)}
          className="flex-1 px-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition"
        >
          View Details
        </button>

        {currentUserRole.includes('Sales') && (
          <button
            onClick={() => onAssign(lead.id, lead.assignedTo)}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition"
          >
            {lead.assignedTo ? 'Reassign' : 'Assign'}
          </button>
        )}
      </div>
    </div>
  );
}