import mysql from 'mysql2/promise';
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

// Create a connection pool for better performance and connection management
const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: config.connectionLimit,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: config.timeout,
  allowLoadLocalInfile: false,
});

// Test database connection
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

// Get a database connection from the pool
export async function getConnection() {
  return await pool.getConnection();
}

// Execute a query with the pool
export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get next ID using MAX+1 strategy via database procedure
export async function getNextId(tableName: string): Promise<number> {
  try {
    const [result]: any = await query('CALL get_next_id(?, @next_id)', [tableName]);
    const [rows]: any = await query('SELECT @next_id as id');
    return rows[0].id;
  } catch (error) {
    console.error(`Error getting next ID for table ${tableName}:`, error);
    throw error;
  }
}

// Transaction helper
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

// Helper to format database results with camelCase keys
export function formatResults<T extends Record<string, any>>(rows: any[]): T[] {
  return rows.map((row) => {
    const formatted: any = {};

    for (const [key, value] of Object.entries(row)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      formatted[camelKey] = value;
    }

    return formatted as T;
  });
}

// Safely parse JSON fields
export function parseJson<T>(value: string | null, defaultValue: T = [] as T): T {
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Helper to convert JS Date to MySQL DATETIME
export function toMySqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Close pool on application exit
process.on('SIGTERM', async () => {
  await pool.end();
});

process.on('SIGINT', async () => {
  await pool.end();
});

export default pool;