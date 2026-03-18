import pool from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusActions from './StatusActions';
import Comments from './Comments';
import Postmortem from './Postmortem';

/**
 * Incident Detail — server component with embedded client components
 * Fetches incident data and history directly from database
 * StatusActions, Comments, and Postmortem are client components for interactivity
 * Status flow bar visualizes the incident lifecycle position
 */

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

  // Severity badge styles — same mapping used across queue and detail pages
  const severityStyle: Record<string, string> = {
    P1: 'bg-red-600 text-white',
    P2: 'bg-amber-500 text-white',
    P3: 'bg-blue-600 text-white',
    P4: 'bg-gray-500 text-white',
  };

  const age = Math.floor(
    (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
  );
  const ageDisplay = age < 24 ? `${age}h` : `${Math.floor(age / 24)}d`;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Back navigation */}
        <Link href="/queue" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          &larr; Back to Queue
        </Link>

        {/* Header — ticket metadata and title */}
        <div className="mt-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-gray-500">{incident.ticket_number}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityStyle[incident.severity] || 'bg-gray-500 text-white'}`}>
              {incident.severity}
            </span>
            <span className="text-sm text-gray-500">{incident.category}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{incident.title}</h1>
          <p className="text-sm text-gray-500">
            Reported by {incident.reported_by} &middot; {ageDisplay} ago
            {incident.assigned_to && <> &middot; Assigned to <strong className="text-gray-700">{incident.assigned_to}</strong></>}
          </p>
        </div>

        {/* Status flow bar — visualizes lifecycle position */}
        <div className="flex mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          {STATUS_STEPS.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = step === incident.status;
            return (
              <div key={step} className="flex-1 text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {index + 1}
                </div>
                <div className={`text-xs mt-1 ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>

        {/* Description card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{incident.description}</p>
        </div>

        {/* Resolution notes — green card, only shown when resolved */}
        {incident.resolution_notes && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Resolution Notes</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{incident.resolution_notes}</p>
          </div>
        )}

        {/* AI Postmortem — only for Resolved/Closed incidents */}
        {(incident.status === 'Resolved' || incident.status === 'Closed') && (
          <Postmortem incidentId={incident.id} />
        )}

        {/* Status actions — assignment, severity, transitions (client component) */}
        <StatusActions
          incidentId={incident.id}
          currentStatus={incident.status}
          currentSeverity={incident.severity}
          currentAssignee={incident.assigned_to}
          allowedTransitions={allowedTransitions}
        />

        {/* Metadata grid — timestamps and status at a glance */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div>
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className="text-sm font-semibold text-gray-900">{incident.status}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Created</div>
            <div className="text-sm text-gray-700">{new Date(incident.created_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Last Updated</div>
            <div className="text-sm text-gray-700">{new Date(incident.updated_at).toLocaleString()}</div>
          </div>
          {incident.resolved_at && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Resolved At</div>
              <div className="text-sm text-gray-700">{new Date(incident.resolved_at).toLocaleString()}</div>
            </div>
          )}
          {incident.closed_at && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Closed At</div>
              <div className="text-sm text-gray-700">{new Date(incident.closed_at).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Comments — threaded discussion with internal notes (client component) */}
        <Comments incidentId={incident.id} />

        {/* Audit trail — chronological change log */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Log</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded yet.</p>
          ) : (
            <div className="border-l-2 border-gray-200 pl-5">
              {history.map((entry) => (
                <div key={entry.id} className="mb-4 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                  <div className="text-sm">
                    <strong className="text-gray-700">{entry.field_changed}</strong> changed
                    from <span className="text-red-600">{entry.old_value || 'none'}</span>
                    {' '}to <span className="text-green-600">{entry.new_value}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.changed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}