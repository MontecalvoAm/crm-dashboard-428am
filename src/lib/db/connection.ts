import mysql, { PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { DatabaseConfig } from '@/types/db';

// Database configuration
const config: DatabaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '6603'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'crm',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
};

// Fixed PoolOptions: acquireTimeout is moved to the connectTimeout or managed by the pool
const poolOptions: PoolOptions = {
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: config.connectionLimit,
  queueLimit: 0,
  connectTimeout: 60000, // This replaces acquireTimeout in mysql2/promise
  enableKeepAlive: true,
};

const pool = mysql.createPool(poolOptions);

export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  return await pool.getConnection();
}

// Fixed 'any' by using mysql2 types
export async function query<T = RowDataPacket[] | ResultSetHeader>(
  sql: string, 
  params?: unknown[]
): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Note: This logic is still here for your other tables, 
// but we removed the session table requirement
export async function getNextId(tableName: string): Promise<number> {
  try {
    await query('CALL get_next_id(?, @next_id)', [tableName]);
    const rows = await query<RowDataPacket[]>('SELECT @next_id as id');
    return rows[0].id as number;
  } catch (error) {
    console.error(`Error getting next ID for table ${tableName}:`, error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export function formatResults<T extends Record<string, unknown>>(rows: RowDataPacket[]): T[] {
  return rows.map((row) => {
    const formatted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      formatted[camelKey] = value;
    }

    return formatted as T;
  });
}

// Utility functions
export function parseJson<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

export function toMySqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export default pool;