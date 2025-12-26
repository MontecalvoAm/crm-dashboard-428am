import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// 1. Fetch all soft-deleted users
export async function GET() {
  try {
    const archivedUsers = await query(`
      SELECT u.id, u.first_name, u.last_name, u.email, r.role_name, u.updated_at as archived_at
      FROM M_Users u
      JOIN M_Roles r ON u.role_id = r.id
      WHERE u.is_deleted = 1
      ORDER BY u.updated_at DESC
    `);
    return NextResponse.json({ success: true, data: archivedUsers });
  } catch (error) {
    console.error('Fetch archive error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// 2. Restore or Hard Delete
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (action === 'restore') {
      // Restore: Set flags back to active
      await query(
        'UPDATE M_Users SET is_deleted = 0, is_active = 1 WHERE id = ?', 
        [userId]
      );
      return NextResponse.json({ success: true, message: 'User restored to active list.' });
    } 

    if (action === 'permanent_delete') {
      // Hard Delete: Physically remove from DB
      await query('DELETE FROM M_Users WHERE id = ?', [userId]);
      return NextResponse.json({ success: true, message: 'User permanently removed.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}