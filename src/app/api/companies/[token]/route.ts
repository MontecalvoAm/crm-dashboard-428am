import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

interface ResultSetHeader {
  affectedRows: number;
}

interface CompanyRow {
  token: string;
  CompanyName: string;
  CompanyInfo: string;
  CompanyProfile: string;
  Industry: string;
  Email: string;
  Phone: string;
  Address: string;
  WebsiteURL: string | null;
  SocialURL: string | null;
  LogoURL: string | null;
}

// GET: Fetch single company by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> } // MUST match folder name [token]
) {
  try {
    // Await params as required by newer Next.js versions
    const { token: companyToken } = await params;

    const rows = (await query(`
      SELECT 
        token, CompanyName, CompanyInfo, CompanyProfile, 
        Industry, Email, Phone, Address, WebsiteURL, 
        SocialURL, LogoURL
      FROM T_Companies 
      WHERE token = ? AND is_deleted = 0
    `, [companyToken])) as CompanyRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Company not found in DB' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { company: rows[0] }
    });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
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

    await query(`
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

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
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

    const result = (await query(
      'UPDATE T_Companies SET is_deleted = 1, archived_at = NOW() WHERE token = ?', 
      [companyToken]
    )) as ResultSetHeader;

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Company archived' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Deletion failed' }, { status: 500 });
  }
}