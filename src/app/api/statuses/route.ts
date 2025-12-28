import { NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    const statuses = await query(`
      SELECT id, status_name 
      FROM M_Status 
      ORDER BY id ASC
    `);

    return NextResponse.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}