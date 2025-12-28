import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// Interface for TS safety
interface ResultSetHeader {
  affectedRows: number;
}

// 1. Fetch all soft-deleted leads
export async function GET() {
  try {
    const archivedLeads = await query(`
      SELECT 
        l.token, 
        l.LeadName, 
        l.Email, 
        s.status_name, 
        l.archived_at
      FROM T_Leads l
      LEFT JOIN M_Status s ON l.StatusID = s.id
      WHERE l.is_deleted = 1
      ORDER BY l.archived_at DESC
    `);
    
    return NextResponse.json({ success: true, data: archivedLeads });
  } catch (error) {
    console.error('Fetch leads archive error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// 2. Restore or Hard Delete a Lead
export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    if (action === 'restore') {
      // Restore: Set is_deleted back to 0 and clear archived_at
      const result = await query(
        'UPDATE T_Leads SET is_deleted = 0, is_active = 1, archived_at = NULL WHERE token = ?', 
        [token]
      ) as ResultSetHeader;

      if (result.affectedRows === 0) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Lead restored to active pipeline.' });
    } 

    if (action === 'permanent_delete') {
      // Hard Delete: Physically remove from DB
      const result = await query('DELETE FROM T_Leads WHERE token = ?', [token]) as ResultSetHeader;

      if (result.affectedRows === 0) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Lead purged from the vault forever.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Archive operation failed:', error);
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}