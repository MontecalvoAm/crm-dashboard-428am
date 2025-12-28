import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/connection';
import { RowDataPacket } from 'mysql2/promise';

interface NavUserRow {
  navigation_id: number;
}

interface UserLookupRow extends RowDataPacket {
  id: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // We expect a token here now, but we'll name the variable userToken for clarity
  const userToken = searchParams.get('userId'); 

  if (!userToken) return NextResponse.json({ success: false, error: 'User Token required' }, { status: 400 });

  try {
    // 1. TRANSLATION: Find real numeric ID from the Token
    const userRows = await query<UserLookupRow[]>(
      'SELECT id FROM M_Users WHERE token = ?',
      [userToken]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const realId = userRows[0].id;

    // 2. Fetch permissions using the real numeric ID
    const permissions = (await query(
      'SELECT navigation_id FROM M_NavigationUsers WHERE user_id = ?',
      [realId]
    )) as unknown as NavUserRow[];
    
    return NextResponse.json({ 
      success: true, 
      data: permissions.map(p => p.navigation_id) 
    });
  } catch (error) {
    console.error('Fetch permissions error:', error);
    return NextResponse.json({ success: false, error: 'Fetch error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: userToken, navigationIds } = body;

    if (!userToken) {
       return NextResponse.json({ success: false, error: 'userToken is missing' }, { status: 400 });
    }

    await transaction(async (connection) => {
      // 1. TRANSLATION: Find real numeric ID from the Token
      const [userRows] = await connection.execute<UserLookupRow[]>(
        'SELECT id FROM M_Users WHERE token = ?',
        [userToken]
      );

      if (userRows.length === 0) {
        throw new Error('User not found with provided token');
      }

      const realId = userRows[0].id;

      // 2. Clear old permissions using the real numeric ID
      await connection.execute(
        'DELETE FROM M_NavigationUsers WHERE user_id = ?',
        [realId]
      );

      // 3. Insert new permissions using the real numeric ID
      if (navigationIds && navigationIds.length > 0) {
        const values = navigationIds.map((navId: number) => [realId, navId]);
        await connection.query(
          'INSERT INTO M_NavigationUsers (user_id, navigation_id) VALUES ?',
          [values]
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permission update error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}