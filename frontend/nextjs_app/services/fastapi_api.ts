/**
 * FastAPI AI service client for Next.js frontend.
 */
import axios from 'axios';

const FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001';

const fastapiClient = axios.create({
  baseURL: `${FASTAPI_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
fastapiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RecommendationItem {
  content_id: string;
  content_type: string;
  title: string;
  description?: string;
  score: number;
  reason?: string;
}

export interface RecommendationResponse {
  user_id: number;
  recommendations: RecommendationItem[];
  total: number;
}

export interface EmbeddingItem {
  text: string;
  embedding: number[];
}

export interface EmbeddingResponse {
  embeddings: EmbeddingItem[];
  model: string;
  dimension: number;
}

export interface PersonalityTrait {
  name: string;
  score: number;
  description?: string;
}

export interface PersonalityAnalysisResponse {
  user_id: number;
  traits: PersonalityTrait[];
  summary?: string;
  recommendations?: string[];
}

export const fastapiApi = {
  // Recommendations
  async getRecommendations(
    userId: number,
    contentType?: string,
    limit: number = 10
  ): Promise<RecommendationResponse> {
    const response = await fastapiClient.post('/recommendations', {
      user_id: userId,
      content_type: contentType,
      limit,
    });
    return response.data;
  },

  // Embeddings
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
    const response = await fastapiClient.post('/embeddings', { texts });
    return response.data;
  },

  async storeEmbeddings(
    texts: string[],
    contentType: string,
    contentId: string
  ): Promise<{ status: string; stored_count: number; ids: string[] }> {
    const response = await fastapiClient.post('/embeddings/store', {
      texts,
      content_type: contentType,
      content_id: contentId,
    });
    return response.data;
  },

  // Personality Analysis
  async analyzePersonality(
    userId: number,
    progressData?: any[]
  ): Promise<PersonalityAnalysisResponse> {
    const response = await fastapiClient.post('/personality/analyze', {
      user_id: userId,
      progress_data: progressData,
    });
    return response.data;
  },

  async getPersonality(userId: number): Promise<PersonalityAnalysisResponse> {
    const response = await fastapiClient.get(`/personality/${userId}`);
    return response.data;
  },
};

export default fastapiApi;


