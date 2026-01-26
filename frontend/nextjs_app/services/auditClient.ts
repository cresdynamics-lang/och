/**
 * Audit Log API Client
 * Handles audit log retrieval for director actions
 */

import { apiGateway } from './apiGateway'

export interface AuditLog {
  id: string
  actor_type: string
  actor_identifier: string
  action: 'create' | 'update' | 'delete' | 'read' | string
  resource_type: string
  resource_id: string | null
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  result: 'success' | 'failure' | 'partial'
  changes?: Record<string, { old: any; new: any }>
}

export interface AuditLogFilters {
  resource_type?: string
  resource_types?: string
  action?: string
  range?: 'today' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
  actor?: string
  user_id?: number
  result?: 'success' | 'failure' | 'partial'
}

class AuditClient {
  /**
   * Get audit logs with optional filters
   * Handles both paginated and non-paginated responses
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const params = new URLSearchParams()
    
    if (filters?.resource_type) {
      params.append('resource_type', filters.resource_type)
    }
    if (filters?.resource_types) {
      params.append('resource_types', filters.resource_types)
    }
    if (filters?.action) {
      params.append('action', filters.action)
    }
    if (filters?.range) {
      params.append('range', filters.range)
    }
    if (filters?.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date)
    }
    if (filters?.actor) {
      params.append('actor', filters.actor)
    }
    if (filters?.user_id) {
      params.append('user_id', String(filters.user_id))
    }
    if (filters?.result) {
      params.append('result', filters.result)
    }
    
    const queryString = params.toString()
    const url = queryString ? `/audit-logs/?${queryString}` : '/audit-logs/'
    
    const response = await apiGateway.get<any>(url)
    
    // Handle paginated response (DRF default pagination)
    if (response && typeof response === 'object' && 'results' in response) {
      return Array.isArray(response.results) ? response.results : []
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      return response
    }
    
    // Fallback to empty array
    return []
  }

  /**
   * Get director-specific actions (programs, cohorts, tracks)
   * Fetches logs for all director-related resource types and combines them
   */
  async getDirectorActions(filters?: Omit<AuditLogFilters, 'resource_type'> & { resource_type?: string }): Promise<AuditLog[]> {
    // Prefer a single backend call with resource_types for accuracy + performance.
    const defaultTypes = ['program', 'cohort', 'track', 'milestone', 'module', 'enrollment', 'mentor_assignment', 'mission']
    const resourceTypes = filters?.resource_type ? [filters.resource_type] : defaultTypes

    return this.getAuditLogs({
      ...(filters || {}),
      resource_type: undefined,
      resource_types: resourceTypes.join(','),
    })
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(filters?: AuditLogFilters): Promise<{
    total: number
    success: number
    failure: number
    action_counts: Record<string, number>
  }> {
    const params = new URLSearchParams()
    
    if (filters?.resource_type) {
      params.append('resource_type', filters.resource_type)
    }
    if (filters?.action) {
      params.append('action', filters.action)
    }
    if (filters?.range) {
      params.append('range', filters.range)
    }
    
    const queryString = params.toString()
    const url = queryString ? `/audit-logs/stats/?${queryString}` : '/audit-logs/stats/'
    
    return apiGateway.get(url)
  }
}

export const auditClient = new AuditClient()

