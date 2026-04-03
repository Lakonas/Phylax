import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import pool from '@/lib/db';
import { requireRole, AuthUser } from '@/lib/auth';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/ai/postmortem — Story #18
export async function POST(request: NextRequest) {
  try {
    // AUTH: admin or agent only
    const authResult = requireRole(request, ['admin', 'agent']);
    if (authResult instanceof Response) return authResult;
    const user = authResult as AuthUser;

    const { incident_id } = await request.json();

    if (!incident_id) {
      return NextResponse.json(
        { error: 'incident_id is required' },
        { status: 400 }
      );
    }

    // SECURITY: scope incident lookup by role — admins see all, agents see only assigned
    const incidentQuery = user.role === 'admin'
      ? pool.query('SELECT * FROM incidents WHERE id = $1', [incident_id])
      : pool.query(
          'SELECT * FROM incidents WHERE id = $1 AND assigned_to = $2',
          [incident_id, user.name]
        );

    const [incidentResult, historyResult, commentsResult] = await Promise.all([
      incidentQuery,
      pool.query('SELECT * FROM incident_history WHERE incident_id = $1 ORDER BY changed_at ASC', [incident_id]),
      pool.query('SELECT * FROM comments WHERE incident_id = $1 ORDER BY created_at ASC', [incident_id]),
    ]);

    if (incidentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const incident = incidentResult.rows[0];
    const history = historyResult.rows;
    const comments = commentsResult.rows;

    const historyText = history.map((h: any) =>
      `${h.field_changed}: ${h.old_value || 'none'} → ${h.new_value} (${new Date(h.changed_at).toLocaleString()})`
    ).join('\n');

    const commentsText = comments.map((c: any) =>
      `[${c.author}] ${c.body} (${new Date(c.created_at).toLocaleString()})`
    ).join('\n');

    const ttr = incident.resolved_at
      ? ((new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60)).toFixed(1)
      : 'N/A';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `You are an ITSM postmortem analyst. Generate a concise incident postmortem report based on the data provided. Structure your response as:

**Summary**: 1-2 sentence overview of what happened.
**Timeline**: Key events in chronological order.
**Root Cause**: What caused the incident based on available evidence.
**Impact**: Who and what was affected.
**Resolution**: How it was fixed.
**Recommendations**: 2-3 actionable steps to prevent recurrence.

Be direct and specific. Use the actual data provided, don't invent details.`,
      messages: [
        {
          role: 'user',
          content: `Incident: ${incident.ticket_number} - ${incident.title}
Severity: ${incident.severity}
Category: ${incident.category}
Status: ${incident.status}
Reported by: ${incident.reported_by}
Assigned to: ${incident.assigned_to || 'Unassigned'}
Time to Resolve: ${ttr} hours

Description:
${incident.description}

Resolution Notes:
${incident.resolution_notes || 'None'}

Change History:
${historyText || 'No changes recorded'}

Comments:
${commentsText || 'No comments'}`,
        },
      ],
    });

    const postmortem = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ postmortem });

  } catch (error) {
    console.error('AI postmortem error:', error);
    return NextResponse.json(
      { error: 'Failed to generate postmortem' },
      { status: 500 }
    );
  }
}