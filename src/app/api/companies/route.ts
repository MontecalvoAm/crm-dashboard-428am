import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { v4 as uuidv4 } from 'uuid';

interface MaxIdResult {
  nextId: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const companyHeader = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id');

    // 1. Check if headers exist
    if (companyHeader === null || roleId === null) {
      return NextResponse.json({ success: false, error: 'User context missing' }, { status: 401 });
    }

    const companyId = parseInt(companyHeader);

    // 2. Logic: If NOT Super Admin AND has no company, return empty list immediately
    if (roleId !== '1' && companyId === -1) {
      return NextResponse.json({ 
        success: true, 
        data: { companies: [] }, 
        message: 'No company assigned to this account' 
      });
    }

    // --- FIX: Added 'id' to the SELECT statement ---
    let sql = `
      SELECT id, token, CompanyName, CompanyInfo, Industry, Email, Phone, Address
      FROM T_Companies
      WHERE is_deleted = 0
    `;
    
    const params: (string | number | null)[] = [];

    // 3. Filter by company only if NOT a Super Admin
    if (roleId !== '1') {
      sql += ` AND id = ?`;
      params.push(companyId);
    }

    if (search) {
      sql += ` AND (CompanyName LIKE ? OR Industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const companies = await query(sql, params);
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

    // MAX + 1 Strategy for Company ID
    const maxResult = (await query(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM T_Companies'
    )) as MaxIdResult[];
    
    const nextId = maxResult[0].nextId;

    // Generate Unique Token
    const token = `comp_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

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