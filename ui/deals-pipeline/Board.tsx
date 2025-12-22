/**
 * Pipeline Board Component
 * Example React component showing how to use the SDK
 */

import React, { useState } from 'react';
import { usePipelineBoard, useLeadMutations, useReferenceData } from '../../sdk/features/deals-pipeline/hooks';
import type { Lead } from '../../sdk/features/deals-pipeline/types';

export function PipelineBoard() {
  const { data: board, loading, error, refetch } = usePipelineBoard();
  const { createLead, moveLeadToStage, deleteLead } = useLeadMutations();
  const { statuses, sources, priorities } = useReferenceData();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading pipeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const handleCreateLead = async (formData: any) => {
    try {
      await createLead(formData);
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      alert('Failed to create lead');
    }
  };

  const handleMoveLead = async (leadId: string, newStage: string) => {
    try {
      await moveLeadToStage(leadId, newStage);
      refetch();
    } catch (err) {
      alert('Failed to move lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await deleteLead(leadId);
      refetch();
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Lead
        </button>
      </header>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full">
          {board?.stages.map(stage => (
            <div
              key={stage.key}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">{stage.label}</h3>
                <span className="text-sm text-gray-500">
                  {board.leadsByStage[stage.key]?.length || 0}
                </span>
              </div>

              {/* Leads */}
              <div className="space-y-3">
                {board.leadsByStage[stage.key]?.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    stages={board.stages}
                    onMove={handleMoveLead}
                    onDelete={handleDeleteLead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateForm && (
        <CreateLeadModal
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreateLead}
          stages={board?.stages || []}
          statuses={statuses}
          sources={sources}
          priorities={priorities}
        />
      )}
    </div>
  );
}

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  stages: any[];
  onMove: (leadId: string, stageKey: string) => void;
  onDelete: (leadId: string) => void;
}

function LeadCard({ lead, stages, onMove, onDelete }: LeadCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Lead Info */}
      <h4 className="font-medium text-gray-900 mb-1">{lead.name}</h4>
      {lead.company && (
        <p className="text-sm text-gray-600 mb-2">{lead.company}</p>
      )}
      {lead.value && (
        <p className="text-lg font-semibold text-green-600 mb-2">
          ${lead.value.toLocaleString()}
        </p>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {lead.status}
        </span>
        {lead.priority && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {lead.priority}
          </span>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-3">
          <select
            className="text-xs border rounded px-2 py-1 flex-1"
            value={lead.stage}
            onChange={(e) => onMove(lead.id, e.target.value)}
          >
            {stages.map(stage => (
              <option key={stage.key} value={stage.key}>
                Move to {stage.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onDelete(lead.id)}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Create Lead Modal
interface CreateLeadModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
  stages: any[];
  statuses: any[];
  sources: any[];
  priorities: any[];
}

function CreateLeadModal({ onClose, onCreate, stages, statuses, sources, priorities }: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    stage: 'new',
    status: 'active',
    source: '',
    priority: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create New Lead</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value ($)
            </label>
            <input
              type="number"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage
              </label>
              <select
                value={formData.stage}
                onChange={e => setFormData({ ...formData, stage: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {stages.map(stage => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {priorities.map(p => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PipelineBoard;
