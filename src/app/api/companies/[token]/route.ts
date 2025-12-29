import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Specific token used across your system to identify the Super Admin
const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

// GET: Fetch Single Company Detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: targetToken } = await params;
    const sessionCompanyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    // Ensure auth headers are present
    if (!sessionCompanyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    // UPDATED: Strict check using the Super Admin Token constant
    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    // Security: If not Super Admin, users can only view their own organization
    if (!isSuperAdmin && targetToken !== sessionCompanyToken) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const companies = await query<RowDataPacket[]>(`
      SELECT 
        id, token, CompanyName, CompanyInfo, CompanyProfile, 
        Industry, Email, Phone, Address, WebsiteURL, SocialURL
      FROM T_Companies
      WHERE token = ? AND is_deleted = 0
    `, [targetToken]);

    if (!companies || companies.length === 0) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: companies[0] });

  } catch (error) {
    console.error('Fetch company detail error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// PATCH: Update Company Details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: companyToken } = await params;
    const sessionCompanyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!sessionCompanyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    // Security: Only Super Admin or a user from that specific company can edit it
    if (!isSuperAdmin && companyToken !== sessionCompanyToken) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      CompanyName, CompanyInfo, CompanyProfile, 
      Industry, Email, Phone, Address, 
      WebsiteURL, SocialURL 
    } = body;

    const result = await query<ResultSetHeader>(`
      UPDATE T_Companies 
      SET 
        CompanyName = ?, CompanyInfo = ?, CompanyProfile = ?, 
        Industry = ?, Email = ?, Phone = ?, Address = ?, 
        WebsiteURL = ?, SocialURL = ? 
      WHERE token = ? AND is_deleted = 0
    `, [
      CompanyName, CompanyInfo, CompanyProfile, 
      Industry, Email, Phone, Address, 
      WebsiteURL, SocialURL, companyToken
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Company not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Archive Company (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: companyToken } = await params;
    const roleToken = request.headers.get('x-user-role-token');

    // Security: Usually only Super Admins should be allowed to delete/archive companies
    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Only Super Admins can archive companies' }, { status: 403 });
    }

    const result = await query<ResultSetHeader>(
      'UPDATE T_Companies SET is_deleted = 1, archived_at = NOW() WHERE token = ?', 
      [companyToken]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Company archived' });
  } catch (error) {
    console.error('Archive company error:', error);
    return NextResponse.json({ success: false, error: 'Deletion failed' }, { status: 500 });
  }
}