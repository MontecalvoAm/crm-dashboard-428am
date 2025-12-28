import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/encryption';
import { query, transaction } from '@/lib/db/updated-connection';
import { z } from 'zod';
import crypto from 'crypto'; 

interface UserRecord {
  id: number;
}

interface MaxIdRow {
  new_id: number;
}

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.number().optional().default(4)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, roleId } = validation.data;

    const existingUser = (await query('SELECT id FROM M_Users WHERE email = ?', [email])) as unknown as UserRecord[];
    
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // This block calculates ID internally without using M_ID_SEQUENCE tracking table
    const userData = await transaction(async (connection) => {
      const [rows] = (await connection.execute(
        'SELECT COALESCE(MAX(id), 0) + 1 as new_id FROM M_Users'
      )) as unknown as [MaxIdRow[]];
      
      const nextId = rows[0]?.new_id || 1;
      
      const userToken = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(password);

      await connection.execute(
        'INSERT INTO M_Users (id, token, first_name, last_name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nextId, userToken, firstName, lastName, email, hashedPassword, roleId, 1]
      );

      return { nextId, userToken };
    });

    // OWASP SECURITY: We omit the 'id' property from the response data
    return NextResponse.json({
      success: true,
      data: {
        user: { 
          // id: userData.nextId, <--- REMOVED: Keep internal ID hidden
          token: userData.userToken, 
          firstName, 
          lastName, 
          email, 
          roleId 
        }
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}