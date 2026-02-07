/**
 * OCH Recipe Engine Notification Service
 * Handles recipe-related notifications and reminders
 */

import { Recipe, RecipeNotification } from '@/lib/types/recipes';
import { apiGateway } from '@/services/apiGateway';

export interface NotificationPayload {
  title: string;
  message: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Notification Service
export class RecipeNotificationService {
  /**
   * Send recipe recommendation notification
   */
  static async sendRecipeRecommendation(
    userId: string,
    recipe: Recipe,
    reason: string = 'skill_gap'
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: `New Recipe: ${recipe.title}`,
        message: `We recommend this ${recipe.expected_duration_minutes}-minute recipe to strengthen your ${recipe.skill_code} skills.`,
        action_url: `/recipes/${recipe.id}`,
        metadata: {
          recipe_id: recipe.id,
          skill_code: recipe.skill_code,
          level: recipe.level,
          reason,
        },
      };

      await this.createNotification(userId, recipe.id, 'recommendation', payload);
    } catch (error) {
      console.error('Failed to send recipe recommendation:', error);
    }
  }

  /**
   * Send progress reminder notification
   */
  static async sendProgressReminder(
    userId: string,
    recipe: Recipe,
    daysInactive: number
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: `Continue: ${recipe.title}`,
        message: `It's been ${daysInactive} days since you started this recipe. Ready to pick up where you left off?`,
        action_url: `/recipes/${recipe.id}`,
        metadata: {
          recipe_id: recipe.id,
          days_inactive: daysInactive,
        },
      };

      await this.createNotification(userId, recipe.id, 'reminder', payload);
    } catch (error) {
      console.error('Failed to send progress reminder:', error);
    }
  }

  /**
   * Send completion congratulation notification
   */
  static async sendCompletionCongrats(
    userId: string,
    recipe: Recipe
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: `🎉 Recipe Complete: ${recipe.title}`,
        message: `Congratulations! You've mastered ${recipe.skill_code} with this hands-on recipe. Great job!`,
        action_url: `/recipes/${recipe.id}`,
        metadata: {
          recipe_id: recipe.id,
          skill_code: recipe.skill_code,
          completed_at: new Date().toISOString(),
        },
      };

      await this.createNotification(userId, recipe.id, 'completion', payload);

      // Also suggest next recipe
      await this.suggestNextRecipe(userId, recipe);
    } catch (error) {
      console.error('Failed to send completion congrats:', error);
    }
  }

  /**
   * Suggest next recipe based on completion
   */
  private static async suggestNextRecipe(
    userId: string,
    completedRecipe: Recipe
  ): Promise<void> {
    try {
      // Get user's next recommended recipes
      const response = await apiGateway.get(`/api/users/${userId}/recipes/recommendations`);
      const recommendations = response.data?.recipes || [];

      if (recommendations.length > 0) {
        const nextRecipe = recommendations[0];
        await this.sendRecipeRecommendation(userId, nextRecipe, 'follow_up');
      }
    } catch (error) {
      console.error('Failed to suggest next recipe:', error);
    }
  }

  /**
   * Create notification in database
   */
  private static async createNotification(
    userId: string,
    recipeId: string,
    type: 'reminder' | 'recommendation' | 'follow_up' | 'completion',
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const notificationData = {
        user_id: userId,
        recipe_id: recipeId,
        type,
        payload,
        sent_at: new Date().toISOString(),
      };

      await apiGateway.post('/api/recipe-notifications', notificationData);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * Get user's unread notifications
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 20
  ): Promise<RecipeNotification[]> {
    try {
      const response = await apiGateway.get(`/api/users/${userId}/recipe-notifications`, {
        params: { limit, unread: true },
      });
      return response.data?.notifications || [];
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await apiGateway.patch(`/api/recipe-notifications/${notificationId}`, {
        read: true,
      });
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  }
}

// Cron job helpers (would be called by a scheduled task)
export class RecipeNotificationScheduler {
  /**
   * Send reminders for inactive recipe progress
   * This would typically be called by a cron job daily
   */
  static async sendInactiveReminders(): Promise<void> {
    try {
      // Get users with inactive recipe progress (7+ days)
      const response = await apiGateway.get('/api/recipe-progress/inactive', {
        params: { days: 7 },
      });

      const inactiveProgress = response.data?.progress || [];

      for (const progress of inactiveProgress) {
        await RecipeNotificationService.sendProgressReminder(
          progress.user_id,
          progress.recipe,
          progress.days_inactive
        );
      }
    } catch (error) {
      console.error('Failed to send inactive reminders:', error);
    }
  }

  /**
   * Send weekly recipe recommendations
   * This would typically be called by a cron job weekly
   */
  static async sendWeeklyRecommendations(): Promise<void> {
    try {
      // Get all active users
      const response = await apiGateway.get('/api/users', {
        params: { active: true, limit: 1000 },
      });

      const users = response.data?.users || [];

      for (const user of users) {
        // Get personalized recommendations for this user
        const recResponse = await apiGateway.get(`/api/users/${user.id}/recipes/recommendations`);
        const recommendations = recResponse.data?.recipes || [];

        // Send top 2 recommendations
        for (const recipe of recommendations.slice(0, 2)) {
          await RecipeNotificationService.sendRecipeRecommendation(
            user.id,
            recipe,
            'weekly_digest'
          );
        }
      }
    } catch (error) {
      console.error('Failed to send weekly recommendations:', error);
    }
  }
}

// Export the main service
export const recipeNotificationService = RecipeNotificationService;
