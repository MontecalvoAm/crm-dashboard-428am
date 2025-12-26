// Lead management types for CRM dashboard

export type LeadSource = 'facebook_messenger' | 'crewai' | 'manual' | 'website';
export type LeadPriority = 'cold' | 'warm' | 'hot';
export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TimelineUrgency = 'immediate' | 'within_month' | 'quarterly' | 'yearly';
export type LeadActivityType = 'status_change' | 'note' | 'call' | 'email' | 'meeting' | 'facebook_message' | 'crewai_interaction';

// Core lead interface matching database
export interface Lead {
  id: number;
  externalId: string | null;
  source: LeadSource;
  sourceDetails: Record<string, any>;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  statusId: number;
  statusName: string;
  statusColor: string | null;
  priority: LeadPriority;
  assignedTo: number | null;
  assignedUser: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  leadScore: number;
  lastContact: Date | null;
  facebookPsid: string | null;
  crewaiThreadId: string | null;
  budgetScore: number;
  timelineUrgency: TimelineUrgency;
  requirements: string | null;
  pipelineStage: PipelineStage;
  estimatedValue: number | null;
  sourceCampaign: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  activities: LeadActivity[];
}

// Lead activity interface
export interface LeadActivity {
  id: number;
  leadId: number;
  userId: number;
  activityType: LeadActivityType;
  activityDetails: {
    note?: string;
    callDuration?: number;
    emailSubject?: string;
    meetingDate?: string;
    statusFrom?: string;
    statusTo?: string;
    [key: string]: any;
  };
  source: 'web_ui' | 'facebook' | 'crewai' | 'api';
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}

// Lead creation form
export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  priority?: LeadPriority;
  assignedTo?: number;
  source?: LeadSource;
  estimatedValue?: number;
  requirements?: string;
  timelineUrgency?: TimelineUrgency;
  tags?: string[];
  facebookPsid?: string;
  crewaiThreadId?: string;
}

// Lead update form
export interface UpdateLeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  statusId?: number;
  priority?: LeadPriority;
  assignedTo?: number | null;
  leadScore?: number;
  requirements?: string;
  budgetScore?: number;
  timelineUrgency?: TimelineUrgency;
  pipelineStage?: PipelineStage;
  estimatedValue?: number;
  sourceCampaign?: string;
  tags?: string[];
}

// Lead filtering and searching
export interface LeadFilters {
  status?: number[];
  priority?: LeadPriority[];
  assignedTo?: number[];
  source?: LeadSource[];
  pipelineStage?: PipelineStage[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  leadScoreMin?: number;
  leadScoreMax?: number;
  budgetMin?: number;
  budgetMax?: number;
}

// Lead statistics
export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  closedWon: number;
  lostLeads: number;
  pipelineValue: number;
  averageLeadScore: number;
  byPriority: {
    cold: number;
    warm: number;
    hot: number;
  };
  bySource: {
    [key in LeadSource]: number;
  };
  byStage: {
    [key in PipelineStage]: number;
  };
}

// Webhook payload types
export interface FacebookLeadWebhookPayload {
  object: string;
  entry: {
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: { url: string };
        }>;
      };
    }>;
  }[];
}

export interface CrewAIWebhookPayload {
  crew_id: string;
  thread_id: string;
  user_data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    interest_level: string;
    budget_range: string;
    timeline: string;
  };
  conversation_data: {
    transcript: string[];
    key_insights: string[];
    follow_up_actions: string[];
  };
}

// Lead performance metrics
export interface LeadPerformance {
  leadId: number;
  conversionTime: number; // days from lead to customer
  leadScore: number;
  activitiesCount: number;
  lastActivity: Date | null;
}

// Pagination and query types
export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: keyof Lead;
  sortOrder?: 'asc' | 'desc';
  filters?: LeadFilters;
}

export interface PaginatedLeadsResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: LeadFilters;
  stats: LeadStats;
}