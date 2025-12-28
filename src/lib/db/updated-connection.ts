import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const config: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '6603'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'crm',
  connectionLimit: 20,
  connectTimeout: 60000,
  charset: 'utf8mb4',
};

const pool = mysql.createPool(config);

export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Updated schema database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  return await pool.getConnection();
}

// Fixed the [rows] iterator error and removed 'any'
export async function query<T = RowDataPacket[] | ResultSetHeader>(
  sql: string, 
  params?: unknown[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
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
    throw error;
  } finally {
    connection.release();
  }
}

export async function setupDatabase(): Promise<void> {
  try {
    await testConnection();

    const tables = [
      'M_Status',
      'M_Roles',
      'M_Users',

    ];

    for (const table of tables) {
      const rows = await query<RowDataPacket[]>(`SHOW TABLES LIKE ?`, [table]);
      if (rows.length === 0) {
        console.warn(`⚠️ ${table} does not exist. Please run the SQL script.`);
      }
    }

    console.log('✅ Database setup verification complete');
  } catch (error) {
    console.error('🎃 Database setup error:', error);
  }
}

export default pool;