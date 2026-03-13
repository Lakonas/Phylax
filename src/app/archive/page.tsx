import pool from '@/lib/db';
import Link from 'next/link';

export default async function ArchivePage() {
  const result = await pool.query(
    `SELECT * FROM incidents WHERE status IN ('Resolved', 'Closed') ORDER BY resolved_at DESC NULLS LAST`
  );
  const incidents = result.rows;

  const severityColor: Record<string, string> = {
    P1: '#dc2626', P2: '#f59e0b', P3: '#2563eb', P4: '#6b7280',
  };

  const statusColor: Record<string, string> = {
    'Resolved': '#22c55e',
    'Closed': '#6b7280',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Archive</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '12px 8px' }}>Ticket</th>
            <th style={{ padding: '12px 8px' }}>Title</th>
            <th style={{ padding: '12px 8px' }}>Severity</th>
            <th style={{ padding: '12px 8px' }}>Status</th>
            <th style={{ padding: '12px 8px' }}>Resolved By</th>
            <th style={{ padding: '12px 8px' }}>TTR</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const ttr = incident.resolved_at
              ? ((new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)).toFixed(1)
              : 'N/A';

            return (
              <tr key={incident.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 14 }}>
                  <Link href={`/incidents/${incident.id}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    {incident.ticket_number}
                  </Link>
                </td>
                <td style={{ padding: '12px 8px' }}>{incident.title}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    backgroundColor: severityColor[incident.severity] || '#6b7280',
                    color: 'white', padding: '2px 10px', borderRadius: 12,
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {incident.severity}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ color: statusColor[incident.status] || '#6b7280', fontWeight: 600, fontSize: 14 }}>
                    {incident.status}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14 }}>
                  {incident.assigned_to || 'N/A'}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#6b7280' }}>
                  {ttr}h
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}