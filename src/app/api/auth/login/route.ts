import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/encryption';
import { query } from '@/lib/db/updated-connection';
import { createSession } from '@/lib/auth/session';
import { z } from 'zod';

interface LoginUserRecord {
  id: number;
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_token: string;    // NEW: Fetch from M_Roles
  company_token: string; // NEW: Fetch from T_Companies
  is_active: number;
  role_name: string;
  company_is_deleted: number;
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

    // 1. UPDATED SQL: Now fetching r.token and c.token
    const users = (await query(`
      SELECT u.id, u.token, u.first_name, u.last_name, u.email, u.password_hash, 
             u.is_active, r.role_name, r.token as role_token, 
             c.token as company_token,
             COALESCE(c.is_deleted, 0) as company_is_deleted
      FROM M_Users u
      JOIN M_Roles r ON u.role_id = r.id
      LEFT JOIN T_Companies c ON u.company_id = c.id
      WHERE u.email = ? AND u.is_active = 1
      AND (u.company_id IS NULL OR c.is_deleted = 0)
    `, [email])) as unknown as LoginUserRecord[];

    const user = users[0];

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Create session using TOKENS (This fixes the empty list/401 issues)
    await createSession({
      token: user.token,
      roleToken: user.role_token,
      email: user.email,
      companyToken: user.company_token || 'public', 
    });

    // 4. Update last login (Internal ID is safe here)
    await query(`UPDATE M_Users SET last_login = NOW() WHERE id = ?`, [user.id]);

    // 5. RESPONSE: Returning only Tokens to Local Storage
    return NextResponse.json({
      success: true,
      data: {
        user: {
          token: user.token,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          roleToken: user.role_token, // NO MORE roleId
          roleName: user.role_name,
          companyToken: user.company_token, // NO MORE companyId
        }
      },
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}