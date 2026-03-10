import pool from '@/lib/db';

export default async function DashboardPage() {
  // All queries are independent — use Promise.all (AI Bug #4: O(n²) Sneak)
  const [
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    avgTTR,
    severityBreakdown,
    staleIncidents,
    arrivalRate,
  ] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'Open'"),
    pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'In Progress'"),
    pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'Resolved'"),
    pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'Closed'"),
    pool.query(`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 1) as avg_hours
      FROM incidents WHERE resolved_at IS NOT NULL
    `),
    pool.query(`
      SELECT severity, COUNT(*) as count
      FROM incidents WHERE status IN ('Open', 'In Progress')
      GROUP BY severity ORDER BY severity
    `),
    pool.query(`
      SELECT * FROM incidents
      WHERE status IN ('Open', 'In Progress')
      AND created_at < NOW() - INTERVAL '48 hours'
      ORDER BY severity ASC, created_at ASC
    `),
    pool.query(`
      SELECT COUNT(*) as total,
        EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 86400 as days_span
      FROM incidents
    `),
  ]);

  const open = parseInt(openCount.rows[0].count);
  const inProgress = parseInt(inProgressCount.rows[0].count);
  const resolved = parseInt(resolvedCount.rows[0].count);
  const closed = parseInt(closedCount.rows[0].count);
  const avgHours = avgTTR.rows[0].avg_hours || 0;
  const stale = staleIncidents.rows;

  // Little's Law: L = λW
  const L = open + inProgress; // average queue depth
  const totalIncidents = parseInt(arrivalRate.rows[0].total);
  const daysSpan = parseFloat(arrivalRate.rows[0].days_span) || 1;
  const lambda = totalIncidents / daysSpan; // arrival rate (incidents per day)
  const W = avgHours / 24; // average wait time in days
  const predictedL = (lambda * W).toFixed(1);

  const severityColor: Record<string, string> = {
    P1: '#dc2626', P2: '#f59e0b', P3: '#2563eb', P4: '#6b7280',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Open', value: open, color: '#dc2626' },
          { label: 'In Progress', value: inProgress, color: '#f59e0b' },
          { label: 'Resolved', value: resolved, color: '#22c55e' },
          { label: 'Closed', value: closed, color: '#6b7280' },
          { label: 'Avg TTR', value: `${avgHours}h`, color: '#2563eb' },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: 20, borderRadius: 8, backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Little's Law */}
      <div style={{
        marginBottom: 32, padding: 20, borderRadius: 8,
        backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
      }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, color: '#1e40af' }}>
          Queue Health (Little&apos;s Law)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Queue Depth (L)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{L}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Arrival Rate (λ)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{lambda.toFixed(1)}/day</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Wait (W)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{avgHours}h</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Predicted L (λW)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: Math.abs(L - parseFloat(predictedL)) > 3 ? '#dc2626' : '#22c55e' }}>
              {predictedL}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>
          {Math.abs(L - parseFloat(predictedL)) > 3
            ? 'Queue depth diverges from predicted — capacity may be mismatched.'
            : 'Queue is in steady state — throughput matches demand.'}
        </p>
      </div>

      {/* Severity Breakdown */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Active Incidents by Severity</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {severityBreakdown.rows.map((row: { severity: string; count: string }) => (
            <div key={row.severity} style={{
              flex: 1, padding: 16, borderRadius: 8, textAlign: 'center',
              backgroundColor: severityColor[row.severity] || '#6b7280',
              color: 'white',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{row.count}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{row.severity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stale Incidents — Story #17 */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>
          Stale Incidents ({stale.length})
          <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
            Open or In Progress for 48+ hours
          </span>
        </h3>
        {stale.length === 0 ? (
          <p style={{ color: '#22c55e', fontSize: 14 }}>No stale incidents. Queue is healthy.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Ticket</th>
                <th style={{ padding: '8px' }}>Title</th>
                <th style={{ padding: '8px' }}>Severity</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {stale.map((incident: any) => {
                const age = Math.floor(
                  (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
                );
                const ageDisplay = age < 24 ? `${age}h` : `${Math.floor(age / 24)}d`;
                return (
                  <tr key={incident.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 14 }}>
                      {incident.ticket_number}
                    </td>
                    <td style={{ padding: '8px' }}>{incident.title}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        backgroundColor: severityColor[incident.severity] || '#6b7280',
                        color: 'white', padding: '2px 10px', borderRadius: 12,
                        fontSize: 13, fontWeight: 600,
                      }}>
                        {incident.severity}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: 14 }}>{incident.status}</td>
                    <td style={{ padding: '8px', fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
                      {ageDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}