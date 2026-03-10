import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/settings
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *`,
      [value, key]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}