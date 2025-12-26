import { query } from '../connection';

/**
 * MAX+1 ID Generation Strategy
 * This implements the no AUTO_INCREMENT requirement by manually managing IDs
 */

// List of tables that use MAX+1 strategy
export type MaxPlusOneTable =
  | 'M_Users'
  | 'M_Roles'
  | 'M_Group_Roles'
  | 'M_Navigation_Roles'
  | 'M_Leads'
  | 'M_Lead_Activities'
  | 'M_User_Sessions'
  | 'M_Rate_Limits'
  | 'M_Lead_Webhook_Queue';

/**
 * Get the maximum current ID for a table
 * This helps track what the next ID should be
 */
export async function getMaxId(tableName: MaxPlusOneTable): Promise<number> {
  try {
    const [rows]: any = await query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tableName}`);
    return rows[0]?.max_id || 0;
  } catch (error) {
    console.error(`Error getting max ID for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get the next available ID for a table using MAX+1 strategy
 * This uses the stored procedure created in SQL
 */
export async function getNextId(tableName: MaxPlusOneTable): Promise<number> {
  try {
    // Execute the stored procedure to get next ID
    await query(`CALL get_next_id('${tableName}', @next_id)`);

    // Get the result from the session variable
    const [rows]: any = await query('SELECT @next_id as next_id');

    return rows[0]?.next_id || 1;
  } catch (error) {
    console.error(`Error getting next ID for ${tableName}:`, error);
    // Fallback to manual MAX+1 calculation
    return await getMaxId(tableName) + 1;
  }
}

/**
 * Batch process for getting multiple IDs
 * Useful for bulk inserts
 */
export async function getNextIds<T extends MaxPlusOneTable>(
  tableName: T,
  count: number
): Promise<number[]> {
  if (count <= 0) return [];

  const ids: number[] = [];

  try {
    for (let i = 0; i < count; i++) {
      const nextId = await getNextId(tableName);
      ids.push(nextId);
    }

    return ids;
  } catch (error) {
    console.error(`Error getting batch IDs for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Reserve a block of IDs (for performance optimization)
 * This is used for bulk operations
 */
export async function reserveIdBlock(
  tableName: MaxPlusOneTable,
  blockSize: number = 100
): Promise<{ startId: number; endId: number }> {
  try {
    // Get current max ID
    const currentMax = await getMaxId(tableName);
    const startId = currentMax + 1;
    const endId = currentMax + blockSize;

    // Update the sequence to reserve this block
    await query(
      `INSERT INTO M_ID_SEQUENCE (table_name, current_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE current_id = ?`,
      [tableName, endId, endId]
    );

    return { startId, endId };
  } catch (error) {
    console.error(`Error reserving ID block for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Validate ID availability and uniqueness
 */
export async function validateIdsAvailable(tableName: MaxPlusOneTable, ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;

  try {
    const idList = ids.join(',');
    const [existing]: any = await query(
      `SELECT COUNT(id) as count FROM ${tableName} WHERE id IN (${idList})`
    );

    return existing[0].count === 0;
  } catch (error) {
    console.error(`Error validating IDs for ${tableName}:`, error);
    return false;
  }
}

/**
 * Check the current ID pool status for monitoring
 */
export async function getIdStatus(tableName: MaxPlusOneTable): Promise<{
  tableName: string;
  currentMaxId: number;
  sequenceCurrent: number;
  nextAvailable: number;
}> {
  const currentMax = await getMaxId(tableName);

  try {
    const [sequence]: any = await query(
      'SELECT current_id FROM M_ID_SEQUENCE WHERE table_name = ?',
      [tableName]
    );

    return {
      tableName,
      currentMaxId: currentMax,
      sequenceCurrent: sequence[0]?.current_id || 0,
      nextAvailable: Math.max(currentMax + 1, sequence[0]?.current_id + 1 || 1),
    };
  } catch (error) {
    console.error(`Error getting ID status for ${tableName}:`, error);
    return {
      tableName,
      currentMaxId: currentMax,
      sequenceCurrent: 0,
      nextAvailable: currentMax + 1,
    };
  }
}

/**
 * Safely get next ID with retry logic (for high concurrency)
 */
export async function getNextIdSafe(
  tableName: MaxPlusOneTable,
  maxRetries: number = 3
): Promise<number> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    try {
      return await getNextId(tableName);
    } catch (error) {
      attempts++;
      lastError = error as Error;

      if (attempts < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
  }

  throw new Error(`Failed to get next ID after ${maxRetries} attempts: ${lastError?.message}`);
}