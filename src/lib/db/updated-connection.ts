import mysql from 'mysql2/promise';

// Updated database configuration matching your schema
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '6603'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'crm',
  connectionLimit: 20,
  timeout: 60000,
  charset: 'utf8mb4',
};

const pool = mysql.createPool(config);

// Test database connection
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

// Get database connection
export async function getConnection() {
  return await pool.getConnection();
}

// Execute queries
export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Execute transaction
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

// Database setup function for your new schema
export async function setupDatabase() {
  try {
    // Test basic connectivity
    await testConnection();

    // Verify required tables exist
    const tables = [
      'M_ID_SEQUENCE',
      'M_Status',
      'M_Roles',
      'M_Users',
      'M_GroupRoles',
      'M_NavigationRoles',
      'M_UserSessions'
    ];

    for (const table of tables) {
      const [row] = await query(`SHOW TABLES LIKE ?`, [table]);
      if (!row) {
        console.warn(`⚠️ ${table} does not exist. Please run the SQL script.`);
      }
    }

    console.log('✅ Database setup verification complete');
  } catch (error) {
    console.error('🎃 Database setup error:', error);
  }
}

export default pool;