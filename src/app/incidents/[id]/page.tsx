import pool from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusActions from './StatusActions';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Open': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': ['Closed', 'In Progress'],
  'Closed': [],
};

const STATUS_STEPS = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await pool.query(
    'SELECT * FROM incidents WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    notFound();
  }

  const incident = result.rows[0];

  const historyResult = await pool.query(
    'SELECT * FROM incident_history WHERE incident_id = $1 ORDER BY changed_at ASC',
    [id]
  );
  const history = historyResult.rows;

  const allowedTransitions = VALID_TRANSITIONS[incident.status] || [];
  const currentStepIndex = STATUS_STEPS.indexOf(incident.status);

  const severityColor: Record<string, string> = {
    P1: '#dc2626', P2: '#f59e0b', P3: '#2563eb', P4: '#6b7280',
  };

  const age = Math.floor(
    (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
  );
  const ageDisplay = age < 24 ? `${age}h` : `${Math.floor(age / 24)}d`;

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 24 }}>
      <Link href="/queue" style={{ color: '#2563eb', fontSize: 14 }}>
        &larr; Back to Queue
      </Link>

      {/* Header */}
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#6b7280' }}>
            {incident.ticket_number}
          </span>
          <span style={{
            backgroundColor: severityColor[incident.severity] || '#6b7280',
            color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          }}>
            {incident.severity}
          </span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            {incident.category}
          </span>
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{incident.title}</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Reported by {incident.reported_by} &middot; {ageDisplay} ago
          {incident.assigned_to && <> &middot; Assigned to <strong>{incident.assigned_to}</strong></>}
        </p>
      </div>

      {/* Status Flow Bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 32, padding: 16,
        backgroundColor: '#f9fafb', borderRadius: 8,
      }}>
        {STATUS_STEPS.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = step === incident.status;
          return (
            <div key={step} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                display: 'inline-block', width: 32, height: 32, borderRadius: '50%',
                backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
                color: isActive ? 'white' : '#9ca3af',
                lineHeight: '32px', fontSize: 14, fontWeight: 600,
              }}>
                {index + 1}
              </div>
              <div style={{
                fontSize: 13, marginTop: 4,
                fontWeight: isCurrent ? 700 : 400,
                color: isCurrent ? '#2563eb' : '#6b7280',
              }}>
                {step}
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Description</h3>
        <p style={{ lineHeight: 1.6, color: '#374151' }}>{incident.description}</p>
      </div>

      {/* Resolution Notes */}
      {incident.resolution_notes && (
        <div style={{
          marginBottom: 32, padding: 16, borderRadius: 8,
          border: '1px solid #86efac', backgroundColor: '#f0fdf4',
        }}>
          <h3 style={{ fontSize: 16, marginBottom: 8, color: '#166534' }}>Resolution Notes</h3>
          <p style={{ lineHeight: 1.6, color: '#374151' }}>{incident.resolution_notes}</p>
        </div>
      )}

      {/* Status Actions */}
      <StatusActions
        incidentId={incident.id}
        currentStatus={incident.status}
        currentSeverity={incident.severity}
        currentAssignee={incident.assigned_to}
        allowedTransitions={allowedTransitions}
      />

      {/* Metadata Sidebar */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
        marginBottom: 32, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
          <div style={{ fontWeight: 600 }}>{incident.status}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Created</div>
          <div>{new Date(incident.created_at).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Last Updated</div>
          <div>{new Date(incident.updated_at).toLocaleString()}</div>
        </div>
        {incident.resolved_at && (
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Resolved At</div>
            <div>{new Date(incident.resolved_at).toLocaleString()}</div>
          </div>
        )}
        {incident.closed_at && (
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Closed At</div>
            <div>{new Date(incident.closed_at).toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Activity Log</h3>
        {history.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No changes recorded yet.</p>
        ) : (
          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: 20 }}>
            {history.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 16, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -27, top: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  backgroundColor: '#2563eb', border: '2px solid white',
                }} />
                <div style={{ fontSize: 14 }}>
                  <strong>{entry.field_changed}</strong> changed
                  from <span style={{ color: '#dc2626' }}>{entry.old_value || 'none'}</span>
                  {' '}to <span style={{ color: '#22c55e' }}>{entry.new_value}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {new Date(entry.changed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
