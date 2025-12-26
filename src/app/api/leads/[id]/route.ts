import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// 1. Define specific interfaces for your database rows
interface LeadRow {
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  DateAdded: string;
  assigned_first: string | null;
  assigned_last: string | null;
}

interface ActivityRow {
  id: number;
  lead_id: number;
  user_id: number;
  activity_type: string;
  activity_details: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;

    // 2. Cast the result to the specific interface array instead of any[]
    const rows = (await query(`
      SELECT l.*, u.first_name as assigned_first, u.last_name as assigned_last
      FROM T_Leads l
      LEFT JOIN M_Users u ON l.assigned_to = u.id
      WHERE l.token = ? AND l.is_active = 1
    `, [leadToken])) as LeadRow[];

    const leadRow = rows[0];

    if (!leadRow) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const activities = (await query(`
      SELECT a.*, u.first_name, u.last_name 
      FROM M_LeadActivities a
      JOIN M_Users u ON a.user_id = u.id
      JOIN T_Leads l ON a.lead_id = l.LeadID
      WHERE l.token = ?
      ORDER BY a.created_at DESC
    `, [leadToken])) as ActivityRow[];

    return NextResponse.json({
      success: true,
      data: { 
        lead: leadRow, 
        activities: activities || [] 
      },
    });
  } catch (err) {
    console.error('Fetch lead error:', err);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    
    await query(
      'UPDATE T_Leads SET is_active = 0, is_deleted = 1 WHERE token = ?', 
      [leadToken]
    );
    
    return NextResponse.json({ success: true, message: 'Lead archived' });
  } catch (err) {
    console.error('Archive lead error:', err);
    return NextResponse.json({ success: false, error: 'Archive failed' }, { status: 500 });
  }
}