import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateTokenPair } from '@/lib/auth/encryption';
import { query } from '@/lib/db/updated-connection';
import { createSession } from '@/lib/auth/session';
import { z } from 'zod';

interface LoginUserRecord {
  id: number;
  token: string; // Added token
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

    // 1. Find user with role - Added u.token to SELECT
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

    // 3. Metadata for session
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role_name,
      groupRoles: (() => {
        try {
          return typeof user.group_roles === 'string' ? JSON.parse(user.group_roles) : (user.group_roles || []);
        } catch { return []; }
      })(),
      permissions: (() => {
        try {
          return typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || []);
        } catch { return []; }
      })(),
    };

    const tokens = generateTokenPair(tokenPayload);

    // 5. Create session
    await createSession({
      userId: user.id,
      sessionToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ip,
      userAgent: userAgent,
    });

    // 6. Update last login
    await query(`
      UPDATE M_Users
      SET last_login = NOW()
      WHERE id = ?
    `, [user.id]);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          token: user.token, // Included token for public use
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          roleId: user.role_id,
          roleName: user.role_name,
        },
        tokens,
      },
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}