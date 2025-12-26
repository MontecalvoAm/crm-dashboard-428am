import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    const users = await query(`
      SELECT 
        u.token, -- We ONLY select the token, NOT the id
        u.first_name, u.last_name, u.email, u.role_id, u.is_active, u.last_login,
        r.role_name
      FROM M_Users u
      JOIN M_Roles r ON u.role_id = r.id
      WHERE u.is_deleted = 0
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}