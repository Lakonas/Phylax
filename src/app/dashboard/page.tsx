import pool from '@/lib/db';
export const dynamic = 'force-dynamic';
/**
 * Dashboard — server component with operational metrics
 * All 8 queries run in parallel via Promise.all (AI Bug #4: O(n²) Sneak)
 * Little's Law panel: L = λW with divergence detection
 * Stale incidents always sorted by severity regardless of queue strategy
 */
export default async function DashboardPage() {
  const [
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    avgTTR,
    severityBreakdown,
    arrivalRate,
    thresholdResult,
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
      SELECT COUNT(*) as total,
        EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 86400 as days_span
      FROM incidents
    `),
    pool.query("SELECT value FROM settings WHERE key = 'stale_threshold_hours'"),
  ]);

  // Stale query uses configurable threshold — can't run in Promise.all since it depends on settings
  const threshold = parseInt(thresholdResult.rows[0]?.value) || 48;
  const staleIncidents = await pool.query(
    `SELECT * FROM incidents
     WHERE status IN ('Open', 'In Progress')
     AND created_at < NOW() - INTERVAL '1 hour' * $1
     ORDER BY severity ASC, created_at ASC`,
    [threshold]
  );

  const open = parseInt(openCount.rows[0].count);
  const inProgress = parseInt(inProgressCount.rows[0].count);
  const resolved = parseInt(resolvedCount.rows[0].count);
  const closed = parseInt(closedCount.rows[0].count);
  const avgHours = avgTTR.rows[0].avg_hours || 0;
  const stale = staleIncidents.rows;
  const staleHours = threshold;

  // Little's Law: L = λW
  const L = open + inProgress;
  const totalIncidents = parseInt(arrivalRate.rows[0].total);
  const daysSpan = parseFloat(arrivalRate.rows[0].days_span) || 1;
  const lambda = totalIncidents / daysSpan;
  const W = avgHours / 24;
  const predictedL = (lambda * W).toFixed(1);
  const isDiverging = Math.abs(L - parseFloat(predictedL)) > 3;

  // Severity badge Tailwind classes
  const severityStyle: Record<string, string> = {
    P1: 'bg-red-600', P2: 'bg-amber-500', P3: 'bg-blue-600', P4: 'bg-gray-500',
  };

  // Stat card color classes
  const statCards = [
    { label: 'Open', value: open, color: 'text-red-600' },
    { label: 'In Progress', value: inProgress, color: 'text-amber-500' },
    { label: 'Resolved', value: resolved, color: 'text-green-600' },
    { label: 'Closed', value: closed, color: 'text-gray-500' },
    { label: 'Avg TTR', value: `${avgHours}h`, color: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stat cards — status counts and average TTR */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-5 text-center shadow-sm">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Little's Law — queue health diagnostics */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5 mb-8 shadow-sm">
          <h3 className="text-sm font-semibold text-blue-800 mb-4">
            Queue Health (Little&apos;s Law)
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500">Queue Depth (L)</div>
              <div className="text-2xl font-bold text-gray-900">{L}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Arrival Rate (λ)</div>
              <div className="text-2xl font-bold text-gray-900">{lambda.toFixed(1)}/day</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Avg Wait (W)</div>
              <div className="text-2xl font-bold text-gray-900">{avgHours}h</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Predicted L (λW)</div>
              <div className={`text-2xl font-bold ${isDiverging ? 'text-red-600' : 'text-green-600'}`}>
                {predictedL}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {isDiverging
              ? 'Queue depth diverges from predicted — capacity may be mismatched.'
              : 'Queue is in steady state — throughput matches demand.'}
          </p>
        </div>

        {/* Severity breakdown — color-coded cards for active incidents */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Incidents by Severity</h3>
          <div className="flex gap-3">
            {severityBreakdown.rows.map((row: { severity: string; count: string }) => (
              <div
                key={row.severity}
                className={`flex-1 rounded-lg p-4 text-center text-white ${severityStyle[row.severity] || 'bg-gray-500'}`}
              >
                <div className="text-2xl font-bold">{row.count}</div>
                <div className="text-sm mt-1 opacity-90">{row.severity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stale incidents — tickets past the configurable threshold */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              Stale Incidents ({stale.length})
              <span className="font-normal text-gray-400 ml-2">
              Open or In Progress for {staleHours}+ hours
              </span>
            </h3>
          </div>

          {stale.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-green-600">No stale incidents. Queue is healthy.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Age</th>
                </tr>
              </thead>
              <tbody>
                {stale.map((incident: any) => {
                  const ageHours = Math.floor(
                    (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)
                  );
                  const ageDisplay = ageHours < 24 ? `${ageHours}h` : `${Math.floor(ageHours / 24)}d`;
                  return (
                    <tr key={incident.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm">{incident.ticket_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{incident.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${severityStyle[incident.severity] || 'bg-gray-500'}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{incident.status}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">{ageDisplay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}