import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireRole, AuthUser } from '@/lib/auth';

// Valid state transitions — Story #11, #12
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Open': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': ['Closed', 'In Progress'],
  'Closed': [],
};

const VALID_SEVERITIES = ['P1', 'P2', 'P3', 'P4'];
const VALID_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

// GET /api/incidents/[id] — Story #4 (view single incident)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

// PATCH /api/incidents/[id] — Stories #10, #11, #12, #14, #15
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const authResult = requireRole(request, ['admin', 'agent']);
  if (authResult instanceof Response) return authResult;
  const user = authResult as AuthUser;

  try {
    const body = await request.json();
    const { status, severity, category, assigned_to, resolution_notes, changed_by } = body;

    // Fetch current incident
    const current = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    const incident = current.rows[0];

    // Story #11: Enforce state machine transitions
    if (status && status !== incident.status) {
      const allowed = VALID_TRANSITIONS[incident.status];
      if (!allowed || !allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${incident.status} to ${status}. Allowed: ${allowed?.join(', ') || 'none'}` },
          { status: 400 }
        );
      }
    }

    // OWASP #1: Validate severity if provided
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Story #14: Require resolution notes when resolving
    if (status === 'Resolved' && !resolution_notes && !incident.resolution_notes) {
      return NextResponse.json(
        { error: 'Resolution notes are required when resolving an incident' },
        { status: 400 }
      );
    }

    // Build dynamic update
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const trackChange = async (field: string, oldVal: string | null, newVal: string) => {
      if (oldVal !== newVal) {
        await pool.query(
          `INSERT INTO incident_history (incident_id, field_changed, old_value, new_value, changed_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, field, oldVal, newVal, user.id]
        );
      }
    };

    if (status && status !== incident.status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      await trackChange('status', incident.status, status);

      // Set resolved_at timestamp
      if (status === 'Resolved') {
        updates.push(`resolved_at = NOW()`);
      }
      // Set closed_at timestamp
      if (status === 'Closed') {
        updates.push(`closed_at = NOW()`);
      }
    }

    if (severity && severity !== incident.severity) {
      updates.push(`severity = $${paramCount++}`);
      values.push(severity);
      await trackChange('severity', incident.severity, severity);
    }

    if (category && category !== incident.category) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
      await trackChange('category', incident.category, category);
    }

    if (assigned_to !== undefined && assigned_to !== incident.assigned_to) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assigned_to);
      await trackChange('assigned_to', incident.assigned_to, assigned_to);
    }

    if (resolution_notes) {
      updates.push(`resolution_notes = $${paramCount++}`);
      values.push(resolution_notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No changes provided' },
        { status: 400 }
      );
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');

    values.push(id);
    const result = await pool.query(
      `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}