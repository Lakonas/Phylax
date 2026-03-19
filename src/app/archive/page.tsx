import pool from '@/lib/db';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

/**
 * Archive — server component showing resolved and closed incidents
 * Sorted by resolved_at descending (most recently resolved first)
 * Displays TTR (time to resolve) for each incident
 * Complements the triage queue which only shows active incidents
 */
export default async function ArchivePage() {
  const result = await pool.query(
    `SELECT * FROM incidents WHERE status IN ('Resolved', 'Closed') ORDER BY resolved_at DESC NULLS LAST`
  );
  const incidents = result.rows;

  const severityStyle: Record<string, string> = {
    P1: 'bg-red-600 text-white',
    P2: 'bg-amber-500 text-white',
    P3: 'bg-blue-600 text-white',
    P4: 'bg-gray-500 text-white',
  };

  const statusStyle: Record<string, string> = {
    'Resolved': 'text-green-600',
    'Closed': 'text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Archive</h1>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resolved By</th>
                <th className="px-4 py-3">TTR</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const ttr = incident.resolved_at
                  ? ((new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)).toFixed(1)
                  : 'N/A';
                return (
                  <tr key={incident.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm">
                      <Link href={`/incidents/${incident.id}`} className="text-blue-600 hover:text-blue-800 underline">
                        {incident.ticket_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{incident.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityStyle[incident.severity] || 'bg-gray-500 text-white'}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${statusStyle[incident.status] || 'text-gray-500'}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {incident.assigned_to || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ttr}h</td>
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