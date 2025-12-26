import { query as dbQuery } from '@/lib/db/updated-connection';
import { Lead, LeadFilters, PaginatedResponse } from '@/types/leads';

/**
 * T_Leads Integration Bridge
 * Connects to your existing leads database while providing our CRM features
 * This acts as a layer over T_Leads for lead management
 */

export interface TLead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: string;
  priority: 'cold' | 'warm' | 'hot';
  assigned_to?: number;
  source?: string;
  lead_score?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Query T_Leads database directly
 */
export async function getAllLeads(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Lead>> {
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const [countRows] = await dbQuery('SELECT COUNT(*) as total FROM T_Leads WHERE is_active = 1');
    const total = (countRows as any)[0].total;

    // Get leads with pagination
    const [leadsRows] = await dbQuery(`
      SELECT l.*, '' as status_name, '' as status_color, '' as additional_details
      FROM T_Leads l
      WHERE l.is_active = 1
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return {
      data: convertToCRMFormat(leadsRows as any[], true),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching T_Leads:', error);
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
}

/**
 * Convert T_Leads format to CRM Lead format
 */
export function convertToCRMFormat(tLeads: any[], includePermissions = false): Lead[] {
  return tLeads.map((tlead: TLead) => ({
    id: tlead.id,
    externalId: null,
    source: tlead.source ? 'manual' : 'website',
    sourceDetails: {
      originalTable: 'T_Leads',
      lead_id: tlead.id,
      additionalInfo: tlead,
    },
    firstName: tlead.first_name || '',
    lastName: tlead.last_name || '',
    email: tlead.email || null,
    phone: tlead.phone || null,
    company: tlead.company || null,
    jobTitle: tlead.job_title || null,
    statusId: mapStatusToId(tlead.status),
    statusName: tlead.status || 'New',
    statusColor: getStatusColor(tlead.status),
    priority: tlead.priority || 'cold',
    assignedTo: tlead.assigned_to || null,
    assignedUser: null,
    leadScore: tlead.lead_score || 0,
    lastContact: null,
    facebookPsid: null,
    crewaiThreadId: null,
    budgetScore: 0,
    timelineUrgency: 'quarterly',
    requirements: null,
    pipelineStage: 'new',
    estimatedValue: null,
    sourceCampaign: null,
    tags: [],
    isActive: true,
    createdAt: tlead.created_at,
    updatedAt: tlead.updated_at,
    createdBy: null,
    updatedBy: null,
    activities: [],
  }));
}

/**
 * Map T_Leads status to CRM status ID
 */
function mapStatusToId(status: string): number {
  const statusMap: Record<string, number> = {
    'new': 3,      // Lead
    'qualified': 4,// Qualified
    'customer': 5, // Customer
    'lost': 6,     // Lost
  };

  return statusMap[status?.toLowerCase() || ''] || 3; // Default to 'Lead'
}

/**
 * Get status color based on T_Leads status
 */
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'new': '#F59E0B',
    'qualified': '#3B82F6',
    'customer': '#10B981',
    'lost': '#EF4444',
  };

  return colorMap[status?.toLowerCase() || ''] || '#6B7280';
}

/**
 * Add a new lead activity
 */
export async function addLeadActivity(
  leadId: number,
  userId: number,
  activityType: string,
  details: any
): Promise<boolean> {
  const activityId = await getNextLeadIdSafe();

  try {
    await dbQuery(`
      INSERT INTO M_LeadActivities (id, lead_id, user_id, activity_type, activity_details)
      VALUES (?, ?, ?, ?, ?)
    `, [activityId, leadId, userId, activityType, JSON.stringify(details)]);

    return true;
  } catch (error) {
    console.error('Error adding lead activity:', error);
    return false;
  }
}

/**
 * Get lead activities
 */
export async function getLeadActivities(leadId: number): Promise<any[]> {
  try {
    const [activities] = await dbQuery(`
      SELECT a.*, u.first_name, u.last_name
      FROM M_LeadActivities a
      JOIN M_Users u ON a.user_id = u.id
      WHERE a.lead_id = ?
      ORDER BY a.created_at DESC
    `, [leadId]);

    return activities || [];
  } catch (error) {
    console.error('Error getting lead activities:', error);
    return [];
  }
}

/**
 * Get next activity ID using MAX+1 strategy
 */
async function getNextLeadIdSafe(): Promise<number> {
  const [existing] = await dbQuery('SELECT MAX(id) as max_id FROM M_LeadActivities');
  return ((existing as any)[0]?.max_id || 0) + 1;
}

export { getAllLeads, getNextLeadIdSafe, convertToCRMFormat };