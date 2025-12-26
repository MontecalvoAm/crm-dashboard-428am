import { query, transaction } from '@/lib/db/connection';
import { DatabaseUserSessions } from '@/types/db';

/**
 * Interfaces for Database Results
 */
interface IdSequenceResult {
  next_id: number;
}

interface AffectedRowsResult {
  affectedRows: number;
}

interface CountResult {
  session_count: number;
}

interface StatsResult {
  active?: number;
  expired?: number;
}

export interface CreateSessionData {
  userId: number;
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new user session in the database
 */
export async function createSession(data: CreateSessionData): Promise<number> {
  try {
    return await transaction(async (connection) => {
      const [idRows] = (await connection.execute(`
        SELECT current_id + 1 as next_id FROM M_ID_SEQUENCE WHERE table_name = 'M_UserSessions'
      `)) as unknown as [IdSequenceResult[]];

      const nextId = idRows[0]?.next_id || 1;

      await connection.execute(`
        INSERT INTO M_UserSessions (id, user_id, session_token, refresh_token, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [nextId, data.userId, data.sessionToken, data.refreshToken, data.expiresAt, data.ipAddress || null, data.userAgent || null]);

      await connection.execute(`
        UPDATE M_ID_SEQUENCE SET current_id = ? WHERE table_name = 'M_UserSessions'
      `, [nextId]);

      return nextId;
    });
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get active user sessions
 */
export async function getUserSessions(userId: number): Promise<DatabaseUserSessions[]> {
  try {
    const [rows] = await query(`
      SELECT * FROM M_UserSessions
      WHERE user_id = ? AND expires_at > NOW()
      ORDER BY created_at DESC
    `, [userId]);

    return (rows as DatabaseUserSessions[]) || [];
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
}

/**
 * Validate if a session token is active
 */
export async function validateSession(token: string): Promise<DatabaseUserSessions | null> {
  try {
    const [rows] = (await query(`
      SELECT * FROM M_UserSessions
      WHERE session_token = ? AND expires_at > NOW()
      LIMIT 1
    `, [token])) as unknown as DatabaseUserSessions[][];

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Update session expiry
 */
export async function updateSessionExpiry(token: string, newExpiry: Date): Promise<boolean> {
  try {
    const [result] = (await query(`
      UPDATE M_UserSessions
      SET expires_at = ?
      WHERE session_token = ?
    `, [newExpiry, token])) as unknown as [AffectedRowsResult];

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating session expiry:', error);
    return false;
  }
}

/**
 * Invalidate/destroy a session
 */
export async function destroySession(token: string): Promise<boolean> {
  try {
    const [result] = (await query(`
      DELETE FROM M_UserSessions WHERE session_token = ?
    `, [token])) as unknown as [AffectedRowsResult];

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error destroying session:', error);
    return false;
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const [result] = (await query(`
      DELETE FROM M_UserSessions WHERE expires_at <= NOW()
    `)) as unknown as [AffectedRowsResult];

    return result.affectedRows || 0;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Destroy all sessions for a user
 */
// Fix: Prefixed userId with _ to satisfy ESLint
export async function destroyUserSessions(_userId: number): Promise<number> {
  try {
    const [result] = (await query(`
      DELETE FROM M_UserSessions WHERE user_id = ?
    `, [_userId])) as unknown as [AffectedRowsResult];

    return result.affectedRows || 0;
  } catch (error) {
    console.error('Error destroying user sessions:', error);
    return 0;
  }
}

/**
 * Get session count for monitoring
 */
export async function getSessionStats(): Promise<{
  totalActive: number;
  totalExpired: number;
}> {
  try {
    const [activeSessions] = (await query(`
      SELECT COUNT(*) as active FROM M_UserSessions WHERE expires_at > NOW()
    `)) as unknown as [StatsResult[]];

    const [expiredSessions] = (await query(`
      SELECT COUNT(*) as expired FROM M_UserSessions WHERE expires_at <= NOW()
    `)) as unknown as [StatsResult[]];

    return {
      totalActive: activeSessions[0]?.active || 0,
      totalExpired: expiredSessions[0]?.expired || 0,
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return { totalActive: 0, totalExpired: 0 };
  }
}

/**
 * Destroy session by user ID and refresh token
 */
// Fix: Prefixed userId and refreshToken with _ to satisfy ESLint
export async function destroySessionByRefreshToken(_userId: number, _refreshToken: string): Promise<boolean> {
  try {
    const [result] = (await query(`
      DELETE FROM M_UserSessions
      WHERE user_id = ? AND refresh_token = ?
    `, [_userId, _refreshToken])) as unknown as [AffectedRowsResult];

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error destroying session by refresh token:', error);
    return false;
  }
}

/**
 * Get user session count (for rate limiting)
 */
// Fix: Prefixed userId with _ to satisfy ESLint
export async function countUserSessions(_userId: number): Promise<number> {
  try {
    const [rows] = (await query(`
      SELECT COUNT(*) as session_count
      FROM M_UserSessions
      WHERE user_id = ? AND expires_at > NOW()
    `, [_userId])) as unknown as [CountResult[]];

    return rows[0]?.session_count || 0;
  } catch (error) {
    console.error('Error counting user sessions:', error);
    return 0;
  }
}