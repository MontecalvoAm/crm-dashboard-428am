import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/encryption'; 
import { query } from '@/lib/db/updated-connection';
import { createSession } from '@/lib/auth/session'; 
import { z } from 'zod';

// 1. We keep 'id' in the interface for INTERNAL database operations
interface LoginUserRecord {
  id: number; // Keep for internal SQL queries
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  is_active: number;
  role_name: string;
  permissions: string | string[];
  group_roles: string | unknown[] | null; 
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // 1. Find user - we SELECT the id so we can use it on the server
    const users = (await query(`
      SELECT u.id, u.token, u.first_name, u.last_name, u.email, u.password_hash, u.role_id, 
             u.group_roles, u.is_active, r.role_name, r.permissions
      FROM M_Users u
      JOIN M_Roles r ON u.role_id = r.id
      WHERE u.email = ? AND u.is_active = 1
    `, [email])) as unknown as LoginUserRecord[];

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 2. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Create stateless session (JWT in HttpOnly Cookie)
    await createSession({
      token: user.token,
      roleId: user.role_id,
      email: user.email,
    });

    // 4. Update last login - Using ID here is safe as it stays on the server
    await query(`
      UPDATE M_Users
      SET last_login = NOW()
      WHERE id = ?
    `, [user.id]);

    // 5. OWASP SECURITY FIX: Omit the numeric 'id' from the response.
    // The frontend only receives and stores the 'token'.
    return NextResponse.json({
      success: true,
      data: {
        user: {
          // id is NOT returned here
          token: user.token,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          roleId: user.role_id,
          roleName: user.role_name,
        }
      },
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}