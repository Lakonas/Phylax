import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/incidents — User Story #1 (submit form), #3 (ticket number)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, severity, reported_by } = body;

    // OWASP #1: Input validation — reject missing required fields
    if (!title || !description || !reported_by) {
      return NextResponse.json(
        { error: 'Title, description, and reported_by are required' },
        { status: 400 }
      );
    }

    // OWASP #1: Input validation — reject oversized input
    if (title.length > 255 || description.length > 5000) {
      return NextResponse.json(
        { error: 'Title must be under 255 characters, description under 5000' },
        { status: 400 }
      );
    }

    // OWASP #3: Parameterized query — no SQL injection
    const result = await pool.query(
      `INSERT INTO incidents (title, description, category, severity, reported_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        description,
        category || 'Other',
        severity || 'P4',
        reported_by
      ]
    );

    // Story #3: Return the created incident with ticket number
    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    // AI Bug #10: Don't swallow errors — log server-side, send safe message to client
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// GET /api/incidents — User Story #6 (triage queue), #4 (view status)
export async function GET(request: NextRequest) {
  try {
    // Read queue strategy from settings table — Story #7
    const settingsResult = await pool.query(
      "SELECT value FROM settings WHERE key = 'queue_strategy'"
    );
    const strategy = settingsResult.rows[0]?.value || 'slap';

    // FIFO: oldest first. SLAP: severity first, then oldest.
    const orderBy = strategy === 'fifo'
      ? 'ORDER BY created_at ASC'
      : 'ORDER BY severity ASC, created_at ASC';

    const result = await pool.query(
      `SELECT * FROM incidents ${orderBy}`
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}