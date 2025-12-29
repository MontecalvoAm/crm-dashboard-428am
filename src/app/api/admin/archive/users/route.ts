import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    // SELECT token, NEVER id
    const archivedUsers = await query(`
      SELECT u.token, u.first_name, u.last_name, u.email, r.role_name, u.updated_at as archived_at
      FROM M_Users u
      JOIN M_Roles r ON u.role_id = r.id
      WHERE u.is_deleted = 1
      ORDER BY u.updated_at DESC
    `);
    return NextResponse.json({ success: true, data: archivedUsers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (action === 'restore') {
      await query('UPDATE M_Users SET is_deleted = 0, is_active = 1 WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'User restored.' });
    } 

    if (action === 'permanent_delete') {
      await query('DELETE FROM M_Users WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'User purged.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}