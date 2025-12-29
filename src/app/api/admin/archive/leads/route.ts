import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    const archivedLeads = await query(`
      SELECT l.token, l.LeadName, l.Email, s.status_name as StatusName, l.archived_at
      FROM T_Leads l
      LEFT JOIN M_Status s ON l.StatusID = s.id
      WHERE l.is_deleted = 1
      ORDER BY l.archived_at DESC
    `);
    return NextResponse.json({ success: true, data: archivedLeads });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (action === 'restore') {
      await query('UPDATE T_Leads SET is_deleted = 0, is_active = 1, archived_at = NULL WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'Lead restored.' });
    } 

    if (action === 'permanent_delete') {
      await query('DELETE FROM T_Leads WHERE token = ?', [token]);
      return NextResponse.json({ success: true, message: 'Lead purged.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}