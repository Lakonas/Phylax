import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/incidents/[id]/comments — Story #5
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE incident_id = $1 ORDER BY created_at ASC',
      [id]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/incidents/[id]/comments — Story #5, #13
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { author, body: commentBody, is_internal } = body;

    // OWASP #1: Input validation
    if (!author || !commentBody) {
      return NextResponse.json(
        { error: 'Author and comment body are required' },
        { status: 400 }
      );
    }

    if (commentBody.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be under 5000 characters' },
        { status: 400 }
      );
    }

    // Verify incident exists
    const incident = await pool.query(
      'SELECT id FROM incidents WHERE id = $1',
      [id]
    );

    if (incident.rows.length === 0) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO comments (incident_id, author, body, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, author, commentBody, is_internal || false]
    );

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
