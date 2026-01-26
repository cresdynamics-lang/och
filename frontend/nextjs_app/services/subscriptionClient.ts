/**
 * Subscription Service Client
 * Handles subscription status, limits, and upgrades
 */

import { apiGateway } from './apiGateway'
import type {
  Subscription,
  Usage,
} from './types/subscription'

export const subscriptionClient = {
  /**
   * Get subscription details
   */
  async getSubscription(menteeId: string): Promise<Subscription> {
    return apiGateway.get(`/subscriptions/mentees/${menteeId}`)
  },

  /**
   * Get usage statistics
   */
  async getUsage(menteeId: string): Promise<Usage> {
    return apiGateway.get(`/subscriptions/mentees/${menteeId}/usage`)
  },

  /**
   * Upgrade subscription
   */
  async upgrade(menteeId: string, tier: 'premium' | 'enterprise'): Promise<{
    checkout_url: string
    subscription: Subscription
  }> {
    return apiGateway.post(`/subscriptions/upgrade`, { mentee_id: menteeId, tier })
  },

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/invoices/${invoiceId}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    )
    return response.blob()
  },
}

