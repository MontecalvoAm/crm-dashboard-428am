import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// Updated interface to include hierarchy fields
interface NavRow {
  id: number;
  key: string;
  label: string;
  path: string;
  icon_name: string;
  sort_order: number;
  parent_id: number | null; // Added
  is_parent: number;        // Added
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get('userToken');

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 });
    }

    // 1. Get the user's Role ID using the token
    const users = (await query(
      'SELECT role_id FROM M_Users WHERE token = ?', 
      [userToken]
    )) as { role_id: number }[];

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userRole = users[0].role_id;
    let navigations: NavRow[] = [];

    // 2. Logic: If Super Admin (ID: 1), get EVERYTHING. 
    // Otherwise, get only assigned navigations.
    if (userRole === 1) {
      navigations = (await query(`
        SELECT id, \`key\`, label, path, icon_name, sort_order, parent_id, is_parent
        FROM M_Navigations
        ORDER BY sort_order ASC
      `)) as NavRow[];
    } else {
      navigations = (await query(`
        SELECT DISTINCT n.id, n.key, n.label, n.path, n.icon_name, n.sort_order, n.parent_id, n.is_parent
        FROM M_Navigations n
        JOIN M_NavigationUsers nu ON n.id = nu.navigation_id
        JOIN M_Users u ON nu.user_id = u.id 
        WHERE u.token = ? 
        ORDER BY n.sort_order ASC
      `, [userToken])) as NavRow[];
    }

    return NextResponse.json({
      success: true,
      data: { menu: navigations }
    });
  } catch (err) {
    console.error('Navigation fetch error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}