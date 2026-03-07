import pool from '@/lib/db';

// Server component — no 'use client' needed, data fetched on the server
export default async function QueuePage() {
  const settingsResult = await pool.query(
    "SELECT value FROM settings WHERE key = 'queue_strategy'"
  );
  const strategy = settingsResult.rows[0]?.value || 'slap';

  const orderBy = strategy === 'fifo'
    ? 'ORDER BY created_at ASC'
    : 'ORDER BY severity ASC, created_at ASC';

  const result = await pool.query(`SELECT * FROM incidents ${orderBy}`);
  const incidents = result.rows;

  const severityColor: Record<string, string> = {
    P1: '#dc2626',
    P2: '#f59e0b',
    P3: '#2563eb',
    P4: '#6b7280',
  };

  const statusColor: Record<string, string> = {
    'Open': '#dc2626',
    'In Progress': '#f59e0b',
    'Resolved': '#22c55e',
    'Closed': '#6b7280',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Triage Queue</h1>
        <span style={{ fontSize: 14, color: '#6b7280' }}>
          Mode: <strong>{strategy.toUpperCase()}</strong>
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '12px 8px' }}>Ticket</th>
            <th style={{ padding: '12px 8px' }}>Title</th>
            <th style={{ padding: '12px 8px' }}>Severity</th>
            <th style={{ padding: '12px 8px' }}>Category</th>
            <th style={{ padding: '12px 8px' }}>Status</th>
            <th style={{ padding: '12px 8px' }}>Assigned To</th>
            <th style={{ padding: '12px 8px' }}>Age</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const age = Math.floor(
              (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
            );
            const ageDisplay = age < 24 ? `${age}h` : `${Math.floor(age / 24)}d`;

            return (
              <tr
                key={incident.id}
                style={{ borderBottom: '1px solid #f3f4f6' }}
              >
                <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 14 }}>
                  {incident.ticket_number}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {incident.title}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    backgroundColor: severityColor[incident.severity] || '#6b7280',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {incident.severity}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14 }}>
                  {incident.category}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    color: statusColor[incident.status] || '#6b7280',
                    fontWeight: 600,
                    fontSize: 14,
                  }}>
                    {incident.status}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14 }}>
                  {incident.assigned_to || (
                    <span style={{ color: '#dc2626', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#6b7280' }}>
                  {ageDisplay}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}