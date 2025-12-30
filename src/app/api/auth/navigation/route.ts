import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// --- Interfaces ---
interface NavRow extends RowDataPacket {
  id: number;
  key: string;
  label: string;
  path: string;
  icon_name: string;
  sort_order: number;
  parent_id: number | null;
  is_parent: number;
}

interface MaxIdResult extends RowDataPacket {
  nextId: number;
}

// GET: Fetch Navigation Menu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get('userToken');

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 });
    }

    const users = (await query(
      'SELECT role_id FROM M_Users WHERE token = ?', 
      [userToken]
    )) as { role_id: number }[];

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userRole = users[0].role_id;
    let navigations: NavRow[] = [];

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

    return NextResponse.json({ success: true, data: { menu: navigations } });
  } catch (err) {
    console.error('Navigation fetch error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST: Add New Navigation Item using MAX+1 Strategy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, key, path, icon_name, sort_order, parent_id, is_parent } = body;

    if (!label || !key || !path) {
      return NextResponse.json({ success: false, error: 'Label, Key, and Path are required' }, { status: 400 });
    }

    // 1. MAX+1 Strategy: Get the next ID manually
    const maxIdResult = await query<MaxIdResult[]>(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM M_Navigations'
    );
    const nextId = maxIdResult[0].nextId;

    // 2. Handle empty strings for parent_id as NULL
    const finalParentId = parent_id === '' || parent_id === null ? null : parent_id;

    // 3. Insert into M_Navigations including the manual ID
    const result = await query<ResultSetHeader>(`
      INSERT INTO M_Navigations (id, label, \`key\`, path, icon_name, sort_order, parent_id, is_parent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextId, 
      label, 
      key, 
      path, 
      icon_name || 'Layout', 
      sort_order || 1, 
      finalParentId, 
      is_parent || 0
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Failed to insert navigation' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Navigation item created successfully',
      data: { id: nextId }
    });

  } catch (err) {
    console.error('Navigation create error:', err);
    return NextResponse.json({ success: false, error: 'Internal Database Error' }, { status: 500 });
  }
}