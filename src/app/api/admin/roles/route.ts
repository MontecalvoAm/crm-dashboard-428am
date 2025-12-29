import { NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    const roles = await query(`SELECT id, role_name FROM M_Roles ORDER BY id ASC`);
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}