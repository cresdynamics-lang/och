/**
 * FastAPI Client
 * Type-safe functions for FastAPI AI service endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  RecommendationRequest,
  RecommendationResponse,
  PersonalityAnalysisRequest,
  PersonalityAnalysisResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StoreEmbeddingRequest,
  StoreEmbeddingResponse,
} from './types';

/**
 * FastAPI AI Service Client
 */
export const fastapiClient = {
  /**
   * Recommendation endpoints
   */
  recommendations: {
    /**
     * Get personalized recommendations
     */
    async getRecommendations(data: RecommendationRequest): Promise<RecommendationResponse> {
      return apiGateway.post('/recommendations', data);
    },
  },

  /**
   * Personality analysis endpoints
   */
  personality: {
    /**
     * Analyze user personality
     */
    async analyzePersonality(data: PersonalityAnalysisRequest): Promise<PersonalityAnalysisResponse> {
      return apiGateway.post('/personality/analyze', data);
    },

    /**
     * Get stored personality analysis
     */
    async getPersonality(userId: number): Promise<PersonalityAnalysisResponse> {
      return apiGateway.get(`/personality/${userId}`);
    },
  },

  /**
   * Embedding endpoints
   */
  embeddings: {
    /**
     * Generate embeddings for texts
     */
    async generateEmbeddings(data: EmbeddingRequest): Promise<EmbeddingResponse> {
      return apiGateway.post('/embeddings', data);
    },

    /**
     * Store embeddings in vector database
     */
    async storeEmbeddings(data: StoreEmbeddingRequest): Promise<StoreEmbeddingResponse> {
      return apiGateway.post('/embeddings/store', data);
    },

    /**
     * Search similar embeddings
     */
    async searchSimilar(query: string, limit: number = 10): Promise<Array<{
      content_id: string;
      content_type: string;
      score: number;
      metadata?: Record<string, any>;
    }>> {
      return apiGateway.post('/embeddings/search', { query, limit });
    },
  },

  /**
   * Profiling endpoints
   */
  profiling: {
    /**
     * Check profiling status
     */
    async checkStatus(): Promise<{
      completed: boolean;
      session_id: string | null;
      has_active_session: boolean;
      progress?: any;
      completed_at?: string;
    }> {
      return apiGateway.get('/profiling/status');
    },

    /**
     * Start profiling session
     */
    async startSession(): Promise<{
      session_id: string;
      status: string;
      progress: any;
      message: string;
    }> {
      return apiGateway.post('/profiling/session/start', {});
    },

    /**
     * Get all profiling questions
     */
    async getQuestions(): Promise<any[]> {
      return apiGateway.get('/profiling/questions');
    },

    /**
     * Submit question response
     */
    async submitResponse(
      sessionId: string,
      questionId: string,
      selectedOption: string
    ): Promise<{
      success: boolean;
      progress: any;
      message: string;
    }> {
      return apiGateway.post(`/profiling/session/${sessionId}/respond`, {
        question_id: questionId,
        selected_option: selectedOption,
      });
    },

    /**
     * Get session progress
     */
    async getProgress(sessionId: string): Promise<{
      session_id: string;
      current_question: number;
      total_questions: number;
      progress_percentage: number;
      estimated_time_remaining: number;
    }> {
      return apiGateway.get(`/profiling/session/${sessionId}/progress`);
    },

    /**
     * Get per-module progress for a session
     */
    async getModuleProgress(sessionId: string): Promise<{
      modules: Record<string, { answered: number; total: number; completed: boolean }>;
      current_module: string | null;
      completed_modules: string[];
      remaining_modules: string[];
    }> {
      return apiGateway.get(`/profiling/session/${sessionId}/modules`);
    },

    /**
     * Complete profiling session
     */
    async completeSession(sessionId: string): Promise<{
      user_id: string;
      session_id: string;
      recommendations: any[];
      primary_track: any;
      assessment_summary: string;
      completed_at: string;
    }> {
      return apiGateway.post(`/profiling/session/${sessionId}/complete`, {});
    },

    /**
     * Get profiling results
     */
    async getResults(sessionId: string): Promise<{
      user_id: string;
      session_id: string;
      recommendations: any[];
      primary_track: any;
      assessment_summary: string;
      completed_at: string;
    }> {
      return apiGateway.get(`/profiling/session/${sessionId}/results`);
    },

    /**
     * Get all available OCH tracks
     */
    async getTracks(): Promise<{
      tracks: Record<string, {
        key: string;
        name: string;
        description: string;
        focus_areas: string[];
        career_paths: string[];
      }>;
      total_tracks: number;
      description: string;
    }> {
      return apiGateway.get('/profiling/tracks');
    },

    // ========================================================================
    // Enhanced Tier-0 Profiling Endpoints
    // ========================================================================

    /**
     * Get enhanced profiling questions organized by module
     */
    async getEnhancedQuestions(): Promise<{
      modules: Record<string, string>;
      questions: Record<string, any[]>;
      total_questions: number;
    }> {
      return apiGateway.get('/profiling/enhanced/questions');
    },

    /**
     * Get questions for a specific module
     */
    async getQuestionsByModule(moduleName: string): Promise<any[]> {
      return apiGateway.get(`/profiling/enhanced/module/${moduleName}/questions`);
    },

    /**
     * Submit reflection responses (Module 7)
     */
    async submitReflection(
      sessionId: string,
      whyCyber: string,
      whatAchieve: string
    ): Promise<{
      success: boolean;
      message: string;
    }> {
      return apiGateway.post(`/profiling/enhanced/session/${sessionId}/reflection`, {
        why_cyber: whyCyber,
        what_achieve: whatAchieve,
      });
    },

    /**
     * Verify difficulty selection (Module 6)
     */
    async verifyDifficulty(
      sessionId: string,
      selectedDifficulty: string
    ): Promise<{
      selected_difficulty: string;
      is_realistic: boolean;
      confidence: string;
      technical_exposure_score: number;
      suggested_difficulty: string;
      reasoning: string;
    }> {
      return apiGateway.post(`/profiling/enhanced/session/${sessionId}/verify-difficulty`, {
        selected_difficulty: selectedDifficulty,
      });
    },

    /**
     * Complete enhanced profiling session
     */
    async completeEnhancedSession(sessionId: string): Promise<{
      user_id: string;
      session_id: string;
      recommendations: any[];
      primary_track: any;
      assessment_summary: string;
      completed_at: string;
    }> {
      return apiGateway.post(`/profiling/enhanced/session/${sessionId}/complete`, {});
    },

    /**
     * Get OCH Blueprint
     */
    async getBlueprint(sessionId: string): Promise<any> {
      return apiGateway.get(`/profiling/enhanced/session/${sessionId}/blueprint`);
    },

    /**
     * Get value statement
     */
    async getValueStatement(sessionId: string): Promise<{
      value_statement: string;
      session_id: string;
      ready_for_portfolio: boolean;
    }> {
      return apiGateway.get(`/profiling/enhanced/session/${sessionId}/value-statement`);
    },
  },
};

export default fastapiClient;

