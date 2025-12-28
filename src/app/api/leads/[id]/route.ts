import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// Define the interface for database modification results (UPDATE/DELETE/INSERT)
interface ResultSetHeader {
  affectedRows: number;
  insertId?: number;
  warningStatus?: number;
}

interface LeadRow {
  LeadID: number;
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  StatusID: number;
  DateAdded: string;
  assigned_first: string | null;
  assigned_last: string | null;
}

interface ActivityRow {
  id: number;
  activity_type: string;
  activity_details: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

// GET: Fetch Single Lead and Activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;

    const rows = (await query(`
      SELECT l.*, u.first_name as assigned_first, u.last_name as assigned_last
      FROM T_Leads l
      LEFT JOIN M_Users u ON l.assigned_to = u.id
      WHERE l.token = ? AND l.is_deleted = 0
    `, [leadToken])) as LeadRow[];

    if (!rows[0]) {
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
      data: { lead: rows[0], activities: activities || [] },
    });
  } catch (err) {
    console.error('Fetch lead error:', err);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH: Update Lead Details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    const body = await request.json();
    const { LeadName, Email, Phone, StatusID } = body;

    await query(`
      UPDATE T_Leads 
      SET LeadName = ?, Email = ?, Phone = ?, StatusID = ?
      WHERE token = ? AND is_deleted = 0
    `, [LeadName, Email, Phone, StatusID, leadToken]);

    return NextResponse.json({ success: true, message: 'Lead updated successfully' });
  } catch (err) {
    console.error('Update lead error:', err);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Soft Delete (Archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    
    // FIX: Replaced 'any' with the 'ResultSetHeader' interface
    const result = (await query(
      'UPDATE T_Leads SET is_active = 0, is_deleted = 1, archived_at = NOW() WHERE token = ?', 
      [leadToken]
    )) as ResultSetHeader;

    // Logic: If no rows were changed, the token might be invalid
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Lead not found or already archived' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Lead successfully archived' });
  } catch (err) {
    console.error('Archive failed:', err);
    return NextResponse.json({ success: false, error: 'Archive failed' }, { status: 500 });
  }
}