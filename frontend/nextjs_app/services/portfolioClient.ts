/**
 * Portfolio Service Client
 * Handles portfolio item endpoints
 */

import { apiGateway } from './apiGateway'
import type { PortfolioItem, PortfolioCounts } from './types/portfolio'

export const portfolioClient = {
  /**
   * Get latest portfolio item
   */
  async getLatestItem(menteeId: string): Promise<PortfolioItem | null> {
    return apiGateway.get(`/portfolio/mentees/${menteeId}/latest-item`)
  },

  /**
   * Get portfolio counts
   */
  async getCounts(menteeId: string): Promise<PortfolioCounts> {
    return apiGateway.get(`/portfolio/mentees/${menteeId}/counts`)
  },

  /**
   * Add portfolio item
   */
  async addItem(menteeId: string, data: {
    title: string
    description: string
    skills: string[]
    mission_id?: string
    file?: File
  }): Promise<PortfolioItem> {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('skills', JSON.stringify(data.skills))
    if (data.mission_id) formData.append('mission_id', data.mission_id)
    if (data.file) formData.append('file', data.file)

    return apiGateway.post(`/portfolio/mentees/${menteeId}/items`, formData)
  },
}
