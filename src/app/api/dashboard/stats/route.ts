import { NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// Define the interface for the count result
interface CountRow {
  total: number;
}

export async function GET() {
  try {
    // We cast the results as Promise<CountRow[]> to tell TypeScript 
    // these specific queries return an array of rows.
    const [leadsCount, activeCount, usersCount] = await Promise.all([
      query('SELECT COUNT(*) as total FROM T_Leads WHERE is_deleted = 0') as Promise<CountRow[]>,
      query(`
        SELECT COUNT(*) as total 
        FROM T_Leads l
        JOIN M_Status s ON l.StatusID = s.id
        WHERE s.status_name = 'Active' AND l.is_deleted = 0
      `) as Promise<CountRow[]>,
      query('SELECT COUNT(*) as total FROM M_Users') as Promise<CountRow[]>
    ]);

    return NextResponse.json({
      success: true,
      data: {
        // Now TypeScript knows that [0] and .total exist
        totalLeads: leadsCount[0]?.total || 0,
        activeDeals: activeCount[0]?.total || 0,
        totalUsers: usersCount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}