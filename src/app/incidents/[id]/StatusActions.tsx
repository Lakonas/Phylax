'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

/**
 * StatusActions — client component for incident updates
 * Handles assignment, severity changes, and status transitions
 * Hidden for submitter role and closed incidents
 * All updates go through PATCH /api/incidents/[id] with JWT auth
 */

const SEVERITIES = ['P1', 'P2', 'P3', 'P4'];
const TEAM_MEMBERS = ['Sarah Chen', 'James Park', 'Alex Rivera', 'Unassigned'];

// Transition button colors — semantic: green for resolve, amber for reopen, grey for close
const transitionStyle: Record<string, string> = {
  'Resolved': 'bg-green-600 hover:bg-green-700',
  'In Progress': 'bg-amber-500 hover:bg-amber-600',
  'Closed': 'bg-gray-500 hover:bg-gray-600',
};

export default function StatusActions({
  incidentId,
  currentStatus,
  currentSeverity,
  currentAssignee,
  allowedTransitions,
}: {
  incidentId: string;
  currentStatus: string;
  currentSeverity: string;
  currentAssignee: string | null;
  allowedTransitions: string[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (body: Record<string, string | null>) => {
    setError('');
    setLoading(true);

    try {
      const response = await authFetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update');
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch (err) {
      setError('Failed to update incident');
      setLoading(false);
    }
  };

  const handleTransition = async (newStatus: string) => {
    const body: Record<string, string> = { status: newStatus };

    if (newStatus === 'Resolved') {
      if (!resolutionNotes.trim()) {
        setError('Resolution notes are required');
        return;
      }
      body.resolution_notes = resolutionNotes;
    }

    await handleUpdate(body);
  };

  const handleSeverityChange = async (newSeverity: string) => {
    if (newSeverity !== currentSeverity) {
      await handleUpdate({ severity: newSeverity });
    }
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    const value = newAssignee === 'Unassigned' ? null : newAssignee;
    if (value !== currentAssignee) {
      await handleUpdate({ assigned_to: value });
    }
  };

  // Hide for closed incidents and submitter role (read-only)
  if (currentStatus === 'Closed' || user?.role === 'submitter') {
    return null;
  }

  const needsResolutionNotes = allowedTransitions.includes('Resolved');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions</h3>

      {/* Assignment and severity dropdowns */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
          <select
            value={currentAssignee || 'Unassigned'}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            {TEAM_MEMBERS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
          <select
            value={currentSeverity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            {SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resolution notes — required when resolving */}
      {needsResolutionNotes && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Resolution Notes {currentStatus === 'In Progress' && '(required to resolve)'}
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="What was the root cause? How was it fixed? What prevents recurrence?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mb-3">{error}</p>
      )}

      {/* Status transition buttons — color-coded by target state */}
      {allowedTransitions.length > 0 && (
        <div className="flex gap-2">
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleTransition(status)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${transitionStyle[status] || 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Updating...' : `Move to ${status}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
