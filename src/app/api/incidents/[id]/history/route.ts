import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/incidents/[id]/history — Story #15 (audit trail)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      `SELECT * FROM incident_history 
       WHERE incident_id = $1 
       ORDER BY changed_at ASC`,
      [id]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching incident history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident history' },
      { status: 500 }
    );
  }
}