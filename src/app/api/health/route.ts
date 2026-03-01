import pool from '@/lib/db';
export async function GET() {
  try {
    const test = await pool.query('SELECT NOW()');
    return Response.json({ status: 'ok', time: test.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
