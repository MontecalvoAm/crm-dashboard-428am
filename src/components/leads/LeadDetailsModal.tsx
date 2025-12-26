'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, Building, MapPin, Calendar, Edit } from 'lucide-react';
import { Lead } from '@/types/leads';

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailsModal({ lead, onClose, onUpdate }: LeadDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedLead, setUpdatedLead] = useState(lead);

  const handleSave = async () => {
    // Implementation for saving lead updates
    onUpdate();
    onClose();
  };

  const handleAssign = (userId: number) => {
    // Implementation for assigning lead
    setUpdatedLead(prev => ({ ...prev, assignedTo: userId }));
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Lead Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-500">Full Name</p>
                    </div>
                  </div>

                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{lead.email}</p>
                        <p className="text-xs text-gray-500">Email</p>
                      </div>
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{lead.phone}</p>
                        <p className="text-xs text-gray-500">Phone</p>
                      </div>
                    </div>
                  )}

                  {lead.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{lead.company}</p>
                        <p className="text-xs text-gray-500">Company</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.pipelineStage)}`}>
                        {lead.pipelineStage.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className="capitalize text-sm font-medium text-gray-900">{lead.priority}</span>
                  </div>

                  {lead.assignedUser && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{lead.assignedUser.firstName} {lead.assignedUser.lastName}</p>
                        <p className="text-xs text-gray-500">Assigned To</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
                      <p className="text-xs text-gray-500">Created Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Score & Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Lead Score</h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">{lead.leadScore}</span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: lead.leadScore + '%' }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Source</h4>
                <p className="text-sm text-gray-900 capitalize">{lead.source}</p>
              </div>

              {lead.estimatedValue && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Estimated Value</h4>
                  <p className="text-lg font-bold text-green-600">${lead.estimatedValue.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Notes & Requirements */}
            {lead.requirements && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h4>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {lead.requirements}
                </p>
              </div>
            )}

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Edit
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
                onClick={() => {
                  /* Contact action */
                }}
              >
                Contact Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}