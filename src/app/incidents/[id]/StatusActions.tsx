'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SEVERITIES = ['P1', 'P2', 'P3', 'P4'];
const TEAM_MEMBERS = ['Sarah Chen', 'James Park', 'Alex Rivera', 'Unassigned'];

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
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (body: Record<string, string | null>) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  // Hide actions section entirely for closed incidents
  if (currentStatus === 'Closed') {
    return null;
  }

  const needsResolutionNotes = allowedTransitions.includes('Resolved');

  return (
    <div style={{
      marginBottom: 32, padding: 16, borderRadius: 8,
      border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
    }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Actions</h3>

      {/* Assignment and Severity — Story #9, #10 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>
            Assigned To
          </label>
          <select
            value={currentAssignee || 'Unassigned'}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 14 }}
          >
            {TEAM_MEMBERS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>
            Severity
          </label>
          <select
            value={currentSeverity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 14 }}
          >
            {SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resolution Notes */}
      {needsResolutionNotes && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>
            Resolution Notes {currentStatus === 'In Progress' && '(required to resolve)'}
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="What was the root cause? How was it fixed? What prevents recurrence?"
            rows={4}
            style={{ width: '100%', padding: 10, fontSize: 14 }}
          />
        </div>
      )}

      {error && (
        <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      {/* Status Transitions */}
      {allowedTransitions.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleTransition(status)}
              disabled={loading}
              style={{
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: 6, border: 'none',
                backgroundColor: status === 'Resolved' ? '#22c55e'
                  : status === 'In Progress' ? '#f59e0b'
                  : status === 'Closed' ? '#6b7280'
                  : '#2563eb',
                color: 'white',
              }}
            >
              {loading ? 'Updating...' : `Move to ${status}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}