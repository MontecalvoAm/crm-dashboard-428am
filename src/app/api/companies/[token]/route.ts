import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // Added ResultSetHeader here

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: targetToken } = await params;
    const sessionCompanyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!sessionCompanyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken.includes('admin');

    if (!isSuperAdmin && targetToken !== sessionCompanyToken) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const companies = await query<RowDataPacket[]>(`
      SELECT id, token, CompanyName, CompanyInfo, Industry, Email, Phone, Address
      FROM T_Companies
      WHERE token = ? AND is_deleted = 0
    `, [targetToken]);

    return NextResponse.json({ success: true, data: companies[0] });

  } catch (error) {
    console.error('Fetch company detail error:', error); // Using 'error' to satisfy ESLint
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// PATCH: Update company details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: companyToken } = await params;
    const body = await request.json();
    const { 
      CompanyName, CompanyInfo, CompanyProfile, 
      Industry, Email, Phone, Address, 
      WebsiteURL, SocialURL 
    } = body;

    const result = (await query<ResultSetHeader>(`
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
    ]));

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Company not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Update company error:', error); // Using 'error' to satisfy ESLint
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Archive (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: companyToken } = await params;

    const result = (await query<ResultSetHeader>(
      'UPDATE T_Companies SET is_deleted = 1, archived_at = NOW() WHERE token = ?', 
      [companyToken]
    ));

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Company archived' });
  } catch (error) {
    console.error('Archive company error:', error); // Using 'error' to satisfy ESLint
    return NextResponse.json({ success: false, error: 'Deletion failed' }, { status: 500 });
  }
}