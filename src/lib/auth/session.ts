import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

interface JWTPayload {
  userToken: string;
  roleToken: string; // Changed from roleId: number
  email: string;
  companyToken: string; // Changed from companyId: number
  [key: string]: unknown;
}

const secretKey = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-this';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Updated to accept Tokens instead of IDs
 */
export async function createSession(userData: { token: string; roleToken: string; email: string; companyToken: string }) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({
    userToken: userData.token,
    roleToken: userData.roleToken,
    email: userData.email,
    companyToken: userData.companyToken
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

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Returns Token-based context
 */
export async function getCompanyContext(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return null;

    const payload = await decrypt(sessionCookie.value);
    if (!payload) return null;

    return {
      companyToken: payload.companyToken, // Token-based
      userToken: payload.userToken,
      roleToken: payload.roleToken, // Token-based
      email: payload.email
    };
  } catch (error) {
    console.error('Error getting company context:', error);
    return null;
  }
}