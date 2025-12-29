import { NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Define specific interfaces for your DB results
interface CountRow {
  total: number;
}

interface CompanyCheckRow {
  is_deleted: number;
}

export async function GET(request: Request) {
  try {
    const companyId = request.headers.get('x-company-id');
    
    // 2. Use the interface instead of 'any'
    if (companyId && companyId !== '-1') {
      const companyCheck = await query<CompanyCheckRow[]>(
        'SELECT is_deleted FROM T_Companies WHERE id = ?',
        [companyId]
      );

      if (companyCheck.length === 0 || companyCheck[0].is_deleted === 1) {
        return NextResponse.json(
          { success: false, error: 'Company access denied or deleted' },
          { status: 403 }
        );
      }
    }

    const [leadsCount, activeCount, usersCount] = await Promise.all([
      query<CountRow[]>('SELECT COUNT(*) as total FROM T_Leads WHERE is_deleted = 0'),
      query<CountRow[]>(`
        SELECT COUNT(*) as total 
        FROM T_Leads l
        JOIN M_Status s ON l.StatusID = s.id
        WHERE s.status_name = 'Active' AND l.is_deleted = 0
      `),
      query<CountRow[]>('SELECT COUNT(*) as total FROM M_Users')
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalLeads: leadsCount[0]?.total || 0,
        activeDeals: activeCount[0]?.total || 0,
        totalUsers: usersCount[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 500 }
    );
  }
}