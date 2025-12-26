// Database entity types matching the SQL schema

export interface DatabaseUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  group_roles: number[]; // JSON array of role IDs
  is_active: boolean;
  last_login: Date | null;
  login_attempts: number;
  locked_until: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  reference_table_status_id: number;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
}

export interface DatabaseRole {
  id: number;
  role_name: string;
  role_description: string | null;
  permissions: string[]; // JSON array of permission strings
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  is_active: boolean;
}

export interface DatabaseGroupRole {
  id: number;
  group_name: string;
  group_description: string | null;
  permissions: string[]; // JSON array of permission strings
  members: number[]; // JSON array of user IDs
  created_by: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface DatabaseNavigationRole {
  id: number;
  route_path: string;
  route_name: string;
  component_name: string | null;
  icon_name: string | null;
  parent_route: string | null;
  sort_order: number;
  visible_roles: number[]; // JSON array of role IDs
  permissions_required: string[]; // JSON array of permission strings
  is_active: boolean;
  created_at: Date;
}

export interface DatabaseLead {
  id: number;
  external_id: string | null;
  source: 'facebook_messenger' | 'crewai' | 'manual' | 'website';
  source_details: Record<string, any>; // JSON object for metadata
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status_id: number;
  priority: 'cold' | 'warm' | 'hot';
  assigned_to: number | null;
  lead_score: number;
  last_contact: Date | null;
  facebook_psid: string | null;
  crewai_thread_id: string | null;
  budget_score: number;
  timeline_urgency: 'immediate' | 'within_month' | 'quarterly' | 'yearly';
  requirements: string | null;
  pipeline_stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  estimated_value: number | null;
  source_campaign: string | null;
  tags: string[]; // JSON array of tags
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  updated_by: number | null;
}

export interface DatabaseStatus {
  id: number;
  status_name: string;
  status_type: 'user' | 'lead' | 'system';
  color_hex: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface DatabaseLeadActivity {
  id: number;
  lead_id: number;
  user_id: number;
  activity_type: 'status_change' | 'note' | 'call' | 'email' | 'meeting' | 'facebook_message' | 'crewai_interaction';
  activity_details: Record<string, any>;
  source: 'web_ui' | 'facebook' | 'crewai' | 'api';
  created_at: Date;
}

export interface DatabaseUserSessions {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface DatabaseRateLimit {
  id: number;
  identifier: string;
  endpoint: string;
  request_count: number;
  reset_time: Date;
  created_at: Date;
}

export interface DatabaseLeadWebhookQueue {
  id: number;
  webhook_type: 'facebook_messenger' | 'crewai';
  payload: string;
  processed: boolean;
  attempts: number;
  error_message: string | null;
  created_at: Date;
  processed_at: Date | null;
}

// Common types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: Record<string, any>;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  timeout: number;
}