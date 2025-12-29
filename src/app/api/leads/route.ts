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
}

interface IdCheckRow extends RowDataPacket { id: number; }
interface UserDataRow extends RowDataPacket { id: number; }
interface MaxIdResult extends RowDataPacket { nextId: number; }

// GET remains secure and unchanged...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const companyId = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id'); 

    if (!companyId) return NextResponse.json({ success: true, data: { leads: [] } });

    const isSuperAdmin = roleId === '1';

    const leads = await query(`
      SELECT 
        l.LeadID, 
        l.token, 
        l.LeadName, 
        l.Email, 
        l.Phone, 
        l.MessageContent, 
        l.Interest, 
        l.DateAdded, 
        l.StatusID, 
        l.company_id, -- CRITICAL: Make sure this is here!
        s.status_name as StatusName, 
        c.CompanyName
      FROM T_Leads l
      JOIN M_Status s ON l.StatusID = s.id
      LEFT JOIN T_Companies c ON l.company_id = c.id
      WHERE (l.LeadName LIKE ? OR l.Email LIKE ? OR l.MessageContent LIKE ? OR l.Interest LIKE ?)
      AND l.is_deleted = 0
      AND (? = 1 OR l.company_id = ?)
      ORDER BY l.DateAdded DESC
    `, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, isSuperAdmin ? 1 : 0, companyId]);

    return NextResponse.json({ success: true, data: { leads } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// POST: Fixed Priority Logic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { LeadName, Email, Phone, MessageContent, StatusID, Interest, company_id: bodyCompanyId } = body;
    
    // 1. Extract what the Middleware provided
    const sessionCompanyId = request.headers.get('x-company-id');
    const roleId = request.headers.get('x-user-role-id');
    const isSuperAdmin = roleId === '1';

    // 2. PRIORITY LOGIC: 
    // If Admin: Use bodyCompanyId if provided, otherwise fallback to session.
    // If User: Always force session ID (prevents spoofing).
    let targetId;
    if (isSuperAdmin && bodyCompanyId) {
      targetId = bodyCompanyId; 
    } else {
      targetId = sessionCompanyId;
    }

    const contextCompanyId = parseInt(String(targetId), 10);

    // SERVER LOG (Check your terminal!)
    console.log(`[API POST] Role: ${roleId}, BodyID: ${bodyCompanyId}, Final: ${contextCompanyId}`);

    if (isNaN(contextCompanyId)) {
      return NextResponse.json({ success: false, error: 'Invalid Company selection.' }, { status: 400 });
    }

    if (!LeadName || !Email) {
      return NextResponse.json({ success: false, error: 'Name and Email required' }, { status: 400 });
    }

    // 3. MAX + 1 for LeadID
    const maxLeadResult = (await query('SELECT COALESCE(MAX(LeadID), 0) + 1 as nextId FROM T_Leads')) as MaxIdResult[];
    const nextLeadId = maxLeadResult[0].nextId;

    const token = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 4. Perform INSERT
    await query(`
      INSERT INTO T_Leads (LeadID, token, LeadName, Email, Phone, MessageContent, StatusID, company_id, Interest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nextLeadId, token, LeadName, Email, Phone || null, MessageContent || '', StatusID || 3, contextCompanyId, Interest || '']);

    // 5. MAX + 1 for Activity Log
    const userToken = request.headers.get('x-user-token');
    if (userToken) {
      const userData = (await query<UserDataRow[]>('SELECT id FROM M_Users WHERE token = ?', [userToken]));
      if (userData[0]?.id) {
        const maxActivityResult = (await query('SELECT COALESCE(MAX(id), 0) + 1 as nextActivityId FROM M_LeadActivities')) as { nextActivityId: number }[];
        await query(`
          INSERT INTO M_LeadActivities (id, lead_id, user_id, activity_type, activity_details)
          VALUES (?, ?, ?, 'create', '{"action": "Lead created manually"}')
        `, [maxActivityResult[0].nextActivityId, nextLeadId, userData[0].id]);
      }
    }

    return NextResponse.json({ success: true, data: { token, LeadID: nextLeadId } });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ success: false, error: 'Internal Database Error' }, { status: 500 });
  }
}