import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

// Interface to satisfy the linter
interface NavRow {
  id: number;
  key: string;
  label: string;
  path: string;
  icon_name: string;
  sort_order: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // 1. Switch from userId to userToken
    const userToken = searchParams.get('userToken');

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'User Token is required' }, { status: 400 });
    }

    // 2. Updated Query: We join with M_Users (u) so we can filter by u.token
    // nu.user_id is the internal ID, u.token is the public obfuscated ID
    const navigations = (await query(`
      SELECT n.id, n.key, n.label, n.path, n.icon_name, n.sort_order
      FROM M_Navigations n
      JOIN M_NavigationUsers nu ON n.id = nu.navigation_id
      JOIN M_Users u ON nu.user_id = u.id
      WHERE u.token = ? AND u.is_deleted = 0
      ORDER BY n.sort_order ASC
    `, [userToken])) as NavRow[];

    return NextResponse.json({
      success: true,
      data: { menu: navigations }
    });
  } catch (err) {
    console.error('Navigation fetch error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}