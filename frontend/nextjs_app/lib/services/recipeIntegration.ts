/**
 * OCH Recipe Engine Integration Service
 * Connects Recipe Engine with other platform components
 */

import { Recipe, RecipeQueryParams } from '@/lib/types/recipes';
import { apiGateway } from '@/services/apiGateway';

// Curriculum Engine Integration
export class CurriculumEngineIntegration {
  /**
   * Get recipes recommended for a specific module
   */
  static async getRecipesForModule(moduleId: string): Promise<Recipe[]> {
    try {
      // Get module details from Curriculum Engine
      const moduleResponse = await apiGateway.get(`/api/curriculum/modules/${moduleId}`);
      const module = moduleResponse.data || moduleResponse;

      if (!module.skill_codes || module.skill_codes.length === 0) {
        return [];
      }

      // Find recipes that match the module's skill codes
      const queryParams: RecipeQueryParams = {
        skill_code: module.skill_codes,
        level: module.level || undefined,
        limit: 10,
      };

      const recipesResponse = await apiGateway.get('/api/recipes', { params: queryParams });
      return recipesResponse.data?.recipes || [];
    } catch (error) {
      console.error('Failed to get recipes for module:', error);
      return [];
    }
  }

  /**
   * Get recipes for specific skill codes
   */
  static async getRecipesForSkillCodes(
    skillCodes: string[],
    level?: 'beginner' | 'intermediate' | 'advanced' | 'mastery',
    limit: number = 20
  ): Promise<Recipe[]> {
    try {
      const queryParams: RecipeQueryParams = {
        skill_code: skillCodes,
        level,
        limit,
      };

      const response = await apiGateway.get('/api/recipes', { params: queryParams });
      return response.data?.recipes || [];
    } catch (error) {
      console.error('Failed to get recipes for skill codes:', error);
      return [];
    }
  }
}

// Missions Engine Integration
export class MissionsEngineIntegration {
  /**
   * Get recommended recipes for a mission based on required skills
   */
  static async getRecommendedRecipesForMission(missionId: string): Promise<Recipe[]> {
    try {
      // Get mission details from Missions Engine
      const missionResponse = await apiGateway.get(`/api/missions/${missionId}`);
      const mission = missionResponse.data || missionResponse;

      if (!mission.required_skills || mission.required_skills.length === 0) {
        return [];
      }

      // Get recipes that match required skills
      return await CurriculumEngineIntegration.getRecipesForSkillCodes(
        mission.required_skills,
        mission.level,
        5
      );
    } catch (error) {
      console.error('Failed to get recommended recipes for mission:', error);
      return [];
    }
  }

  /**
   * Link recipe to mission context
   */
  static async linkRecipeToMission(
    recipeId: string,
    missionId: string,
    isRequired: boolean = false
  ): Promise<void> {
    try {
      await apiGateway.post(`/api/missions/${missionId}/recipes`, {
        recipe_id: recipeId,
        is_required: isRequired,
      });
    } catch (error) {
      console.error('Failed to link recipe to mission:', error);
    }
  }
}

// Coaching OS Integration
export class CoachingOSIntegration {
  /**
   * Get next-best-step recipe recommendations for a user
   */
  static async getNextBestRecipes(userId: string): Promise<{
    recommendations: Recipe[];
    gapAnalysis: Record<string, any>;
  }> {
    try {
      // Get user's current progress and skill gaps from Coaching OS
      const progressResponse = await apiGateway.get(`/api/coaching/users/${userId}/progress`);
      const progress = progressResponse.data || progressResponse;

      // Identify skill gaps
      const skillGaps = this.identifySkillGaps(progress);

      // Get recipes for skill gaps
      const recommendations: Recipe[] = [];
      for (const [skillCode, gap] of Object.entries(skillGaps)) {
        const recipes = await CurriculumEngineIntegration.getRecipesForSkillCodes(
          [skillCode],
          gap.level,
          3
        );
        recommendations.push(...recipes);
      }

      return {
        recommendations: recommendations.slice(0, 10), // Limit to top 10
        gapAnalysis: skillGaps,
      };
    } catch (error) {
      console.error('Failed to get next best recipes:', error);
      return { recommendations: [], gapAnalysis: {} };
    }
  }

  /**
   * Identify skill gaps from user progress data
   */
  private static identifySkillGaps(progress: any): Record<string, { level: string; priority: number }> {
    const gaps: Record<string, { level: string; priority: number }> = {};

    // Analyze progress data to identify weak areas
    // This is a simplified implementation - in production, this would be more sophisticated
    if (progress.skill_assessments) {
      Object.entries(progress.skill_assessments).forEach(([skillCode, assessment]: [string, any]) => {
        if (assessment.score < 70) { // Below 70% is considered a gap
          gaps[skillCode] = {
            level: assessment.level || 'beginner',
            priority: Math.max(1, 10 - Math.floor(assessment.score / 10)),
          };
        }
      });
    }

    return gaps;
  }
}

// TalentScope Integration
export class TalentScopeIntegration {
  /**
   * Emit skill signal when user completes a recipe
   */
  static async emitSkillSignalFromRecipeCompletion(
    userId: string,
    recipe: Recipe
  ): Promise<void> {
    try {
      const skillSignal = {
        user_id: userId,
        skill_code: recipe.skill_code,
        source: 'recipe_completed',
        strength_delta: 0.1, // Small boost for recipe completion
        metadata: {
          recipe_id: recipe.id,
          recipe_title: recipe.title,
          level: recipe.level,
          track_code: recipe.track_code,
          completed_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await apiGateway.post('/api/talentscope/signals', skillSignal);
    } catch (error) {
      console.error('Failed to emit skill signal:', error);
    }
  }

  /**
   * Get user's skill heatmap with recipe contributions
   */
  static async getUserSkillHeatmap(userId: string): Promise<Record<string, number>> {
    try {
      const response = await apiGateway.get(`/api/talentscope/users/${userId}/heatmap`);
      return response.data || {};
    } catch (error) {
      console.error('Failed to get skill heatmap:', error);
      return {};
    }
  }
}

// Export integration helpers
export const RecipeIntegrations = {
  Curriculum: CurriculumEngineIntegration,
  Missions: MissionsEngineIntegration,
  Coaching: CoachingOSIntegration,
  TalentScope: TalentScopeIntegration,
} as const;
