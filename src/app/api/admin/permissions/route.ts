import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/connection';

// 1. Define the interface to replace 'any'
interface NavUserRow {
  navigation_id: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  try {
    const permissions = (await query(
      'SELECT navigation_id FROM M_NavigationUsers WHERE user_id = ?',
      [userId]
    )) as unknown as NavUserRow[];
    
    // 2. Map the IDs safely
    return NextResponse.json({ 
      success: true, 
      data: permissions.map(p => p.navigation_id) 
    });
  } catch (error) {
    // 3. Log the error to fix 'error is defined but never used'
    console.error('Fetch permissions error:', error);
    return NextResponse.json({ success: false, error: 'Fetch error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, navigationIds } = body;

    if (!userId) {
       return NextResponse.json({ success: false, error: 'userId is missing in request' }, { status: 400 });
    }

    await transaction(async (connection) => {
      await connection.execute(
        'DELETE FROM M_NavigationUsers WHERE user_id = ?',
        [userId]
      );

      if (navigationIds && navigationIds.length > 0) {
        const values = navigationIds.map((navId: number) => [userId, navId]);
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