import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/updated-connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Define typed interface for the sub-menu check to replace 'any'
interface ChildCheck extends RowDataPacket {
  id: number;
}

const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

// PATCH: Update specific navigation item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleToken = request.headers.get('x-user-role-token');

    // Strict security check matching project standards
    if (roleToken !== SUPER_ADMIN_TOKEN) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { label, key, path, icon_name, sort_order, parent_id, is_parent } = body;

    // Fixed: Used the 'result' variable to check if update actually occurred
    const result = await query<ResultSetHeader>(`
      UPDATE M_Navigations 
      SET label = ?, \`key\` = ?, path = ?, icon_name = ?, sort_order = ?, parent_id = ?, is_parent = ?
      WHERE id = ?
    `, [label, key, path, icon_name, sort_order, parent_id === '' ? null : parent_id, is_parent, id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Navigation item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Navigation updated' });
  } catch (error) {
    console.error('Update navigation error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// DELETE: Remove navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleToken = request.headers.get('x-user-role-token');

    if (roleToken !== SUPER_ADMIN_TOKEN) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Fixed: Used Typed Interface instead of 'any[]'
    const children = await query<ChildCheck[]>('SELECT id FROM M_Navigations WHERE parent_id = ?', [id]);
    
    if (children.length > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete item with active sub-menus' }, { status: 400 });
    }

    await query<ResultSetHeader>('DELETE FROM M_Navigations WHERE id = ?', [id]);
    
    // Clean up permission mapping tables
    await query('DELETE FROM M_NavigationUsers WHERE navigation_id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Navigation deleted' });
  } catch (error) {
    console.error('Delete navigation error:', error);
    return NextResponse.json({ success: false, error: 'Deletion failed' }, { status: 500 });
  }
}