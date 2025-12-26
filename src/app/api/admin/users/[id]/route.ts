import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params; // This is the 32-char token
    const { first_name, last_name, email, role_id } = await request.json();

    const result = await query(
      `UPDATE M_Users 
       SET first_name = ?, last_name = ?, email = ?, role_id = ? 
       WHERE token = ?`,
      [first_name, last_name, email, role_id, token]
    );

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params;

    // Use token for the archive logic
    await query(
      `UPDATE M_Users SET is_deleted = 1, is_active = 0 WHERE token = ?`,
      [token]
    );

    return NextResponse.json({ success: true, message: 'User archived' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Archive failed' }, { status: 500 });
  }
}