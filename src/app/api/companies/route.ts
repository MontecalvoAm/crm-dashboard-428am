import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { v4 as uuidv4 } from 'uuid';

// Define interface for the MAX + 1 result to avoid 'any'
interface MaxIdResult {
  nextId: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const companies = await query(`
      SELECT 
        token, CompanyName, CompanyInfo, CompanyProfile, 
        Industry, Email, Phone, WebsiteURL, SocialURL, 
        LogoURL, Address
      FROM T_Companies 
      WHERE (CompanyName LIKE ? OR Industry LIKE ? OR CompanyInfo LIKE ?)
      AND is_deleted = 0
      ORDER BY CompanyName ASC
    `, [`%${search}%`, `%${search}%`, `%${search}%`]);

    return NextResponse.json({ success: true, data: { companies } });
  } catch (_error) {
    // Removed unused 'error' variable to fix ESLint warning
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

    // MAX + 1 Strategy with proper typing
    const maxResult = (await query(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM T_Companies'
    )) as MaxIdResult[];
    
    const nextId = maxResult[0].nextId;

    // Generate Unique Token for system uniformity
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