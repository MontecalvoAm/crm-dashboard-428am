import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    const archivedCompanies = await query(`
      SELECT token, CompanyName, Industry, Email, archived_at
      FROM T_Companies
      WHERE is_deleted = 1
      ORDER BY archived_at DESC
    `);
    return NextResponse.json({ success: true, data: archivedCompanies });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (action === 'restore') {
      await query('UPDATE T_Companies SET is_deleted = 0, archived_at = NULL WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'Company restored.' });
    } 

    if (action === 'permanent_delete') {
      await query('DELETE FROM T_Companies WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'Company purged.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}