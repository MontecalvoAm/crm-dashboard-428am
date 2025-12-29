import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { RowDataPacket } from 'mysql2';

interface LeadRow extends RowDataPacket {
  LeadID: number;
  token: string;
  LeadName: string;
  Email: string;
  Phone: string;
  MessageContent: string;
  Interest: string;
  DateAdded: string;
  StatusID: number;
  StatusName: string;
  CompanyName: string;
  company_token: string; // ADDED THIS
}

interface UserDataRow extends RowDataPacket { id: number; }
interface MaxIdResult extends RowDataPacket { nextId: number; }

const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

// GET: All Leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const companyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token'); 

    if (!roleToken) {
      return NextResponse.json({ success: false, error: 'Auth context missing' }, { status: 401 });
    }

    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;
    const effectiveCompanyToken = companyToken || '';

    const leads = await query<LeadRow[]>(`
      SELECT 
        l.LeadID, l.token, l.LeadName, l.Email, l.Phone, 
        l.MessageContent, l.Interest, l.DateAdded, l.StatusID, 
        l.company_id, s.status_name as StatusName, 
        c.CompanyName, c.token as company_token
      FROM T_Leads l
      JOIN M_Status s ON l.StatusID = s.id
      LEFT JOIN T_Companies c ON l.company_id = c.id
      WHERE (l.LeadName LIKE ? OR l.Email LIKE ? OR l.MessageContent LIKE ? OR l.Interest LIKE ?)
      AND l.is_deleted = 0
      AND (? = 1 OR l.company_id = (SELECT id FROM T_Companies WHERE token = ? LIMIT 1))
      ORDER BY l.DateAdded DESC
    `, [
      `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, 
      isSuperAdmin ? 1 : 0, 
      effectiveCompanyToken
    ]);

    return NextResponse.json({ success: true, data: { leads } });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// POST: Create Lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      LeadName, 
      Email, 
      Phone, 
      MessageContent, 
      StatusID, 
      Interest, 
      company_id, 
      company_token: bodyCompanyToken 
    } = body;
    
    const sessionCompanyToken = request.headers.get('x-company-token');
    const roleToken = request.headers.get('x-user-role-token');
    const isSuperAdmin = roleToken === SUPER_ADMIN_TOKEN;

    if (!LeadName || !Email) {
      return NextResponse.json({ success: false, error: 'Name and Email required' }, { status: 400 });
    }

    const maxLeadResult = await query<MaxIdResult[]>('SELECT COALESCE(MAX(LeadID), 0) + 1 as nextId FROM T_Leads');
    const nextLeadId = maxLeadResult[0].nextId;
    const leadToken = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let companyLookupSql = '(SELECT id FROM T_Companies WHERE token = ? LIMIT 1)';
    let companyLookupParam: string | number | null = (isSuperAdmin && bodyCompanyToken) 
      ? bodyCompanyToken 
      : sessionCompanyToken;

    if (isSuperAdmin && company_id) {
      companyLookupSql = '?';
      companyLookupParam = company_id;
    }

    await query(`
      INSERT INTO T_Leads (LeadID, token, LeadName, Email, Phone, MessageContent, StatusID, company_id, Interest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ${companyLookupSql}, ?)
    `, [
      nextLeadId, 
      leadToken, 
      LeadName, 
      Email, 
      Phone || null, 
      MessageContent || '', 
      StatusID || 3, 
      companyLookupParam, 
      Interest || ''
    ]);

    const userToken = request.headers.get('x-user-token');
    if (userToken) {
      const userData = await query<UserDataRow[]>('SELECT id FROM M_Users WHERE token = ?', [userToken]);
      if (userData[0]?.id) {
        const maxActivityResult = await query<RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) + 1 as nextActivityId FROM M_LeadActivities');
        await query(`
          INSERT INTO M_LeadActivities (id, lead_id, user_id, activity_type, activity_details)
          VALUES (?, ?, ?, 'create', '{"action": "Lead created manually"}')
        `, [maxActivityResult[0].nextActivityId, nextLeadId, userData[0].id]);
      }
    }

    return NextResponse.json({ success: true, data: { token: leadToken, LeadID: nextLeadId } });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ success: false, error: 'Internal Database Error' }, { status: 500 });
  }
}