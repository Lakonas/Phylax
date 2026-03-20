import pool from '@/lib/db';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

/**
 * Triage Queue — server component, queries database directly
 * Reads queue strategy from settings to determine sort order
 * Filters to active incidents only (Open, In Progress)
 * Resolved/Closed tickets live in /archive
 */
export default async function QueuePage() {
  const settingsResult = await pool.query(
    "SELECT value FROM settings WHERE key = 'queue_strategy'"
  );
  const strategy = settingsResult.rows[0]?.value || 'slap';

  const orderBy = strategy === 'fifo'
    ? 'ORDER BY created_at ASC'
    : 'ORDER BY severity ASC, created_at ASC';

  const result = await pool.query(
    `SELECT * FROM incidents WHERE status IN ('Open', 'In Progress') ${orderBy}`
  );
  const incidents = result.rows;

  // Severity badge color mapping — Tailwind classes per level
  const severityStyle: Record<string, string> = {
    P1: 'bg-red-600 text-white',
    P2: 'bg-amber-500 text-white',
    P3: 'bg-blue-600 text-white',
    P4: 'bg-gray-500 text-white',
  };

  // Status text color mapping
  const statusStyle: Record<string, string> = {
    'Open': 'text-red-600',
    'In Progress': 'text-amber-500',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header row — title and active queue strategy indicator */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Triage Queue</h1>
        <span className="text-sm text-gray-500">
        Mode: <strong className="text-blue-600">{strategy === 'slap' ? 'SLA/P' : 'FIFO'}</strong>
        </span>
      </div>

      {/* Incident table — sorted by FIFO or SLAP based on settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Age</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => {
              const ageHours = Math.floor(
                (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
              );
              const ageDisplay = ageHours < 24 ? `${ageHours}h` : `${Math.floor(ageHours / 24)}d`;

              return (
                <tr
                  key={incident.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Ticket number — clickable link to detail page */}
                  <td className="px-4 py-3 font-mono text-sm">
                    <Link href={`/incidents/${incident.id}`} className="text-blue-600 hover:text-blue-800 underline">
                      {incident.ticket_number}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">{incident.title}</td>

                  {/* Severity badge — color-coded pill */}
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityStyle[incident.severity] || 'bg-gray-500 text-white'}`}>
                      {incident.severity}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">{incident.category}</td>

                  {/* Status — color-coded text */}
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${statusStyle[incident.status] || 'text-gray-500'}`}>
                      {incident.status}
                    </span>
                  </td>

                  {/* Unassigned flagged in red to draw attention */}
                  <td className="px-4 py-3 text-sm">
                    {incident.assigned_to || (
                      <span className="text-red-500 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-500">{ageDisplay}</td>
                </tr>
                
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}