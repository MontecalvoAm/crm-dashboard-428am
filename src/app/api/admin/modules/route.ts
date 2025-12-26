import { NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function GET() {
  try {
    // Fetch all possible pages from the database
    const allModules = await query(`
      SELECT id, label, \`key\` FROM M_Navigations ORDER BY sort_order ASC
    `);
    
    return NextResponse.json({ success: true, data: allModules });
  } catch (error) {
    console.error('Fetch modules error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load modules' }, { status: 500 });
  }
}