import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- Interfaces for Type Safety ---
interface LeadRow extends RowDataPacket {
  LeadID: number;
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  Interest: string; 
  StatusID: number;
  company_id: number;
  company_token: string; // From joined table
  DateAdded: string;
  assigned_first: string | null;
  assigned_last: string | null;
}

interface StatusCheckRow extends RowDataPacket { id: number; }

const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

// GET: Fetch Single Lead
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: leadToken } = await params;
    const companyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!companyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN; 

    const leads = await query<LeadRow[]>(`
      SELECT 
        l.*, 
        c.token as company_token,
        u.first_name as assigned_first, 
        u.last_name as assigned_last
      FROM T_Leads l
      LEFT JOIN M_Users u ON l.assigned_to = u.id
      LEFT JOIN T_Companies c ON l.company_id = c.id
      WHERE l.token = ? 
      AND l.is_deleted = 0 
      AND (? = 1 OR l.company_id = (SELECT id FROM T_Companies WHERE token = ? LIMIT 1))
    `, [leadToken, isSuperAdmin ? 1 : 0, companyToken]);

    if (!leads[0]) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { lead: leads[0] } });
  } catch (error) {
    console.error('Fetch lead error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH: Update Lead Details
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: leadToken } = await params;
    const body = await request.json();
    const { LeadName, Email, Phone, StatusID, Interest, company_token } = body;
    
    const sessionCompanyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!sessionCompanyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    const statusCheck = await query<StatusCheckRow[]>('SELECT id FROM M_Status WHERE id = ?', [StatusID]);
    if (statusCheck.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid status selected' }, { status: 400 });
    }

    const result = await query<ResultSetHeader>(`
      UPDATE T_Leads
      SET 
        LeadName = ?, 
        Email = ?, 
        Phone = ?, 
        StatusID = ?, 
        Interest = ?,
        company_id = IF(? = 1 AND ? IS NOT NULL AND ? != '', (SELECT id FROM T_Companies WHERE token = ? LIMIT 1), company_id)
      WHERE token = ? 
      AND is_deleted = 0 
      AND (? = 1 OR company_id = (SELECT id FROM T_Companies WHERE token = ? LIMIT 1))
    `, [
      LeadName, Email, Phone, StatusID, Interest, 
      isSuperAdmin ? 1 : 0, company_token, company_token, company_token, 
      leadToken, 
      isSuperAdmin ? 1 : 0, 
      sessionCompanyToken
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft Delete
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: leadToken } = await params;
    const companyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!companyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    const leadCheck = await query<LeadRow[]>(`
      SELECT LeadID FROM T_Leads
      WHERE token = ? AND is_deleted = 0 AND (? = 1 OR company_id = (SELECT id FROM T_Companies WHERE token = ? LIMIT 1))
    `, [leadToken, isSuperAdmin ? 1 : 0, companyToken]);

    if (leadCheck.length === 0) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 404 });
    }

    await query<ResultSetHeader>(
      'UPDATE T_Leads SET is_active = 0, is_deleted = 1, archived_at = NOW() WHERE LeadID = ?',
      [leadCheck[0].LeadID]
    );

    return NextResponse.json({ success: true, message: 'Lead successfully archived' });
  } catch (error) {
    console.error('Archive failed:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}