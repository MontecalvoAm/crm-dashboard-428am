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
  DateAdded: string;
  assigned_first: string | null;
  assigned_last: string | null;
}

interface StatusCheckRow extends RowDataPacket {
  id: number;
}

// GET: Fetch Single Lead with company_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    const companyId = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id');

    if (!companyId || !roleId) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleId === '1';

    // Resolved 'no-explicit-any' by using LeadRow interface
    const leads = await query<LeadRow[]>(`
      SELECT l.LeadID, l.company_id, l.*, u.first_name as assigned_first, u.last_name as assigned_last
      FROM T_Leads l
      LEFT JOIN M_Users u ON l.assigned_to = u.id
      WHERE l.token = ? 
      AND l.is_deleted = 0 
      AND (? = 1 OR l.company_id = ?)
    `, [leadToken, isSuperAdmin ? 1 : 0, companyId]);

    if (!leads[0]) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { lead: leads[0] },
    });
  } catch (error) {
    console.error('Fetch lead error:', error); // Resolved 'unused err'
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

// PATCH: Update Lead Details & Handle Company Reassignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    const body = await request.json();
    const { LeadName, Email, Phone, StatusID, Interest, company_id } = body;
    
    const contextCompanyId = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id');

    if (!contextCompanyId || !roleId) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleId === '1';

    // 1. Verify Status exists
    const statusCheck = await query<StatusCheckRow[]>('SELECT id FROM M_Status WHERE id = ?', [StatusID]);
    if (statusCheck.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid status selected' }, { status: 400 });
    }

    // 2. Update with Admin logic for company_id reassignment
    const result = await query<ResultSetHeader>(`
      UPDATE T_Leads
      SET 
        LeadName = ?, 
        Email = ?, 
        Phone = ?, 
        StatusID = ?, 
        Interest = ?,
        company_id = IF(? = 1 AND ? IS NOT NULL, ?, company_id)
      WHERE token = ? 
      AND is_deleted = 0 
      AND (? = 1 OR company_id = ?)
    `, [
      LeadName, Email, Phone, StatusID, Interest, 
      isSuperAdmin ? 1 : 0, company_id, company_id, 
      leadToken, 
      isSuperAdmin ? 1 : 0, 
      contextCompanyId
    ]);

    // Resolved 'unused result' by validating affectedRows
    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Update failed. Record may not exist or permission denied.' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Update lead error:', error); // Resolved 'unused err'
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft Delete (Archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadToken } = await params;
    const companyId = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id');

    if (!companyId || !roleId) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleId === '1';

    const leadCheck = await query<LeadRow[]>(`
      SELECT LeadID FROM T_Leads
      WHERE token = ? AND is_deleted = 0 AND (? = 1 OR company_id = ?)
    `, [leadToken, isSuperAdmin ? 1 : 0, companyId]);

    if (leadCheck.length === 0) {
      return NextResponse.json({ success: false, error: 'Lead not found or permission denied' }, { status: 404 });
    }

    const leadId = leadCheck[0].LeadID;

    await query<ResultSetHeader>(
      'UPDATE T_Leads SET is_active = 0, is_deleted = 1, archived_at = NOW() WHERE LeadID = ?',
      [leadId]
    );

    return NextResponse.json({ success: true, message: 'Lead successfully archived' });
  } catch (error) {
    console.error('Archive failed:', error); // Resolved 'unused err'
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}