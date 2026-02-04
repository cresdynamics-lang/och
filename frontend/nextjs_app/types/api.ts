// API Types and Interfaces for Student Management Platform

// Base Entity Interface
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Program → Track → Specialization → Cohort → Calendar/Milestones Hierarchy

// 1. Cohort Creation
export interface CreateCohortPayload {
  track: string; // track ID
  name: string;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  mode: 'onsite' | 'virtual' | 'hybrid';
  seat_cap: number;
  mentor_ratio: number;
  calendar_template_id?: string;
  coordinator?: string; // coordinator user ID
  seat_pool?: {
    paid?: number;
    scholarship?: number;
    sponsored?: number;
  };
}

export interface CohortResponse extends BaseEntity {
  track: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
    };
  };
  name: string;
  start_date: string;
  end_date: string;
  mode: 'onsite' | 'virtual' | 'hybrid';
  seat_cap: number;
  mentor_ratio: number;
  calendar_template_id?: string;
  coordinator?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  seat_pool: {
    paid: number;
    scholarship: number;
    sponsored: number;
  };
  enrollment_count: number;
  status: 'draft' | 'active' | 'running' | 'closing' | 'closed';
  seat_utilization: number;
  completion_rate: number;
}

// 2. Module Creation
export interface CreateModulePayload {
  milestone: string; // milestone ID
  name: string;
  description: string;
  content_type: 'video' | 'article' | 'quiz' | 'assignment' | 'lab' | 'workshop';
  content_url?: string;
  order: number;
  estimated_hours?: number;
  skills?: string[];
  applicable_tracks?: string[]; // track IDs for cross-track content
}

export interface ModuleResponse extends BaseEntity {
  milestone: {
    id: string;
    name: string;
    track: {
      id: string;
      name: string;
      program: {
        id: string;
        name: string;
      };
    };
  };
  name: string;
  description: string;
  content_type: 'video' | 'article' | 'quiz' | 'assignment' | 'lab' | 'workshop';
  content_url?: string;
  order: number;
  estimated_hours?: number;
  skills: string[];
  applicable_tracks: Array<{
    id: string;
    name: string;
  }>;
}

// 3. Milestone Creation
export interface CreateMilestonePayload {
  track: string; // track ID
  name: string;
  description: string;
  order: number;
  duration_weeks?: number;
}

export interface MilestoneResponse extends BaseEntity {
  track: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
    };
  };
  name: string;
  description: string;
  order: number;
  duration_weeks?: number;
  modules: ModuleResponse[];
}

// 4. Specialization Creation
export interface CreateSpecializationPayload {
  track: string; // track ID
  name: string;
  description: string;
  missions?: string[];
  duration_weeks: number;
}

export interface SpecializationResponse extends BaseEntity {
  track: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
    };
  };
  name: string;
  description: string;
  missions: string[];
  duration_weeks: number;
}

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Cohort Management
  cohorts: {
    create: '/api/cohorts',
    list: '/api/cohorts',
    get: (id: string) => `/api/cohorts/${id}`,
    update: (id: string) => `/api/cohorts/${id}`,
    delete: (id: string) => `/api/cohorts/${id}`,
    byProgram: (programId: string) => `/api/programs/${programId}/cohorts`,
    byTrack: (trackId: string) => `/api/tracks/${trackId}/cohorts`,
  },
  
  // Module Management
  modules: {
    create: '/api/modules',
    list: '/api/modules',
    get: (id: string) => `/api/modules/${id}`,
    update: (id: string) => `/api/modules/${id}`,
    delete: (id: string) => `/api/modules/${id}`,
    byMilestone: (milestoneId: string) => `/api/milestones/${milestoneId}/modules`,
  },
  
  // Milestone Management
  milestones: {
    create: '/api/milestones',
    list: '/api/milestones',
    get: (id: string) => `/api/milestones/${id}`,
    update: (id: string) => `/api/milestones/${id}`,
    delete: (id: string) => `/api/milestones/${id}`,
    byTrack: (trackId: string) => `/api/tracks/${trackId}/milestones`,
  },
  
  // Specialization Management
  specializations: {
    create: '/api/specializations',
    list: '/api/specializations',
    get: (id: string) => `/api/specializations/${id}`,
    update: (id: string) => `/api/specializations/${id}`,
    delete: (id: string) => `/api/specializations/${id}`,
    byTrack: (trackId: string) => `/api/tracks/${trackId}/specializations`,
  },
} as const;

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}