import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Define the structure of the data we store in the JWT
interface JWTPayload {
  userToken: string;
  roleId: number;
  email: string;
  [key: string]: unknown; // Allows for standard JWT claims like 'iat' and 'exp'
}

const secretKey = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-this';
const encodedKey = new TextEncoder().encode(secretKey);

/**
 * Encrypt/Sign a JWT Token
 */
export async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

/**
 * Decrypt/Verify a JWT Token
 */
export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

/**
 * Create a Session Cookie (Stateless)
 */
export async function createSession(userData: { token: string; roleId: number; email: string }) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ 
    userToken: userData.token, 
    roleId: userData.roleId, 
    email: userData.email 
  });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Standard logout - deletes the cookie
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}