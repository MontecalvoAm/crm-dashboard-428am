import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const leads = await query(`
      SELECT 
        l.token, -- Use token instead of LeadID
        l.LeadName, 
        l.Email, 
        l.Phone, 
        l.MessageContent, 
        l.DateAdded,
        s.status_name as StatusName
      FROM T_Leads l
      JOIN M_Status s ON l.StatusID = s.id
      WHERE (l.LeadName LIKE ? OR l.Email LIKE ? OR l.MessageContent LIKE ?)
      AND l.is_deleted = 0
      ORDER BY l.DateAdded DESC
    `, [`%${search}%`, `%${search}%`, `%${search}%`]);

    return NextResponse.json({
      success: true,
      data: { leads }
    });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}