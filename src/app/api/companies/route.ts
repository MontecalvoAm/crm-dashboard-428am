import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

// THE SPECIFIC SUPER ADMIN TOKEN
const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const companyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');

    if (!companyToken || !roleToken) {
      return NextResponse.json({ success: false, error: 'User context missing' }, { status: 401 });
    }

    // FIXED: Strictly matching your Super Admin token string
    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    let sql = `
      SELECT id, token, CompanyName, CompanyInfo, Industry, Email, Phone, Address
      FROM T_Companies
      WHERE is_deleted = 0
    `;
    
    const params: (string | number | null)[] = [];

    // LOGIC PRESERVED: Only filter if NOT a Super Admin
    if (!isSuperAdmin) {
      sql += ` AND token = ?`;
      params.push(companyToken);
    }

    if (search) {
      sql += ` AND (CompanyName LIKE ? OR Industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const companies = await query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ success: true, data: { companies } });

  } catch (error) {
    console.error('Fetch companies error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      CompanyName, CompanyInfo, CompanyProfile, Industry, 
      Email, Phone, Address, WebsiteURL, SocialURL 
    } = body;

    // Use a specific type for the MaxId query to satisfy TypeScript
    const maxResult = await query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM T_Companies'
    );
    
    const nextId = maxResult[0].nextId;
    const token = `comp_${uuidv4().replace(/-/g, '').substring(0, 32)}`;

    await query(`
      INSERT INTO T_Companies (
        id, token, CompanyName, CompanyInfo, CompanyProfile, 
        Industry, Email, Phone, Address, WebsiteURL, SocialURL
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId, token, CompanyName, CompanyInfo, CompanyProfile, 
      Industry, Email, Phone, Address, WebsiteURL, SocialURL
    ]);

    return NextResponse.json({ success: true, message: 'Company created successfully' });
  } catch (error) {
    console.error('Company creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create company' }, { status: 500 });
  }
}