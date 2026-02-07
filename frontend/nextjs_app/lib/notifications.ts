import { toast } from 'react-hot-toast';

export interface NotificationData {
  user_id: string;
  title: string;
  body: string;
  type: 'ai_coach' | 'mentor_message' | 'mission_due' | 'quiz_ready' | 'video_next' | 'community_mention' | 'track_progress' | 'assessment_blocked';
  track_slug?: string;
  level_slug?: string;
  source_id?: string;
  action_url?: string;
  priority?: number;
  expires_in_days?: number;
}

/**
 * Emit a notification for a user
 * In production, this would create a record in the user_notifications table
 * For now, it shows a toast and logs the notification
 */
export async function emitNotification(notification: NotificationData): Promise<void> {
  try {
    console.log('Emitting notification:', notification);

    // Calculate expiration date
    const expires_at = notification.expires_in_days
      ? new Date(Date.now() + notification.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    // In production, this would insert into user_notifications table
    const notificationPayload = {
      ...notification,
      priority: notification.priority || 3,
      is_read: false,
      expires_at
    };

    // Mock API call to create notification
    const response = await fetch(`/api/users/${notification.user_id}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!response.ok) {
      console.error('Failed to create notification:', await response.text());
      return;
    }

    const result = await response.json();
    console.log('Notification created:', result);

    // Show toast for immediate feedback (optional)
    showNotificationToast(notification);

  } catch (error) {
    console.error('Failed to emit notification:', error);
  }
}

/**
 * Show a toast notification for immediate user feedback
 */
function showNotificationToast(notification: NotificationData): void {
  const getToastConfig = () => {
    switch (notification.type) {
      case 'ai_coach':
        return {
          icon: '🤖',
          duration: 4000,
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #eab308' }
        };
      case 'mentor_message':
        return {
          icon: '👨‍🏫',
          duration: 5000,
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #3b82f6' }
        };
      case 'mission_due':
        return {
          icon: '⏰',
          duration: 6000,
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #ef4444' }
        };
      case 'quiz_ready':
        return {
          icon: '📝',
          duration: 4000,
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #10b981' }
        };
      default:
        return {
          icon: '🔔',
          duration: 4000,
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #6b7280' }
        };
    }
  };

  const config = getToastConfig();

  toast(notification.title, {
    description: notification.body,
    ...config
  });
}

/**
 * AI Coach notification emitters
 */
export const aiCoachNotifications = {
  /**
   * Notify when next video is ready
   */
  async nextVideoReady(userId: string, trackSlug: string, levelSlug: string, moduleSlug: string, videoTitle: string, videoSlug: string) {
    await emitNotification({
      user_id: userId,
      title: 'AI Coach: Next Video Ready',
      body: `${videoTitle} - Continue your learning journey`,
      type: 'ai_coach',
      track_slug: trackSlug,
      level_slug: levelSlug,
      action_url: `/curriculum/${trackSlug}/${levelSlug}/${moduleSlug}/${videoSlug}`,
      priority: 3,
      expires_in_days: 7
    });
  },

  /**
   * Notify when quiz is ready
   */
  async quizReady(userId: string, trackSlug: string, levelSlug: string, moduleSlug: string, quizTitle: string, quizSlug: string, passRate: number) {
    await emitNotification({
      user_id: userId,
      title: 'AI Coach: Quiz Ready',
      body: `${quizTitle} - Class average: ${passRate}%. You're ready!`,
      type: 'ai_coach',
      track_slug: trackSlug,
      level_slug: levelSlug,
      action_url: `/curriculum/${trackSlug}/${levelSlug}/${moduleSlug}/quiz/${quizSlug}`,
      priority: 2,
      expires_in_days: 3
    });
  },

  /**
   * Notify about progress milestone
   */
  async progressMilestone(userId: string, trackSlug: string, milestone: string, completionPercent: number) {
    await emitNotification({
      user_id: userId,
      title: 'AI Coach: Progress Milestone!',
      body: `${milestone} - ${completionPercent}% complete on ${trackSlug} track`,
      type: 'ai_coach',
      track_slug: trackSlug,
      priority: 3,
      expires_in_days: 7
    });
  },

  /**
   * Notify about recommended break or next steps
   */
  async learningRecommendation(userId: string, trackSlug: string, recommendation: string, actionUrl?: string) {
    await emitNotification({
      user_id: userId,
      title: 'AI Coach: Learning Recommendation',
      body: recommendation,
      type: 'ai_coach',
      track_slug: trackSlug,
      action_url: actionUrl,
      priority: 4,
      expires_in_days: 3
    });
  }
};

/**
 * Mission notification emitters
 */
export const missionNotifications = {
  /**
   * Notify when mission is due soon (24h warning)
   */
  async missionDueSoon(userId: string, missionTitle: string, missionSlug: string, hoursLeft: number, cohortCompletionRate: number) {
    await emitNotification({
      user_id: userId,
      title: 'Mission Due Soon',
      body: `${missionTitle} due in ${hoursLeft}h. ${cohortCompletionRate}% cohort completion.`,
      type: 'mission_due',
      action_url: `/missions/${missionSlug}`,
      priority: hoursLeft <= 24 ? 1 : 2,
      expires_in_days: 1
    });
  },

  /**
   * Notify when mission feedback is available
   */
  async missionFeedbackReady(userId: string, missionTitle: string, missionSlug: string, feedbackType: 'ai' | 'mentor') {
    await emitNotification({
      user_id: userId,
      title: `${feedbackType === 'mentor' ? 'Mentor' : 'AI'} Feedback Ready`,
      body: `Review feedback on "${missionTitle}"`,
      type: 'mission_due',
      action_url: `/missions/${missionSlug}`,
      priority: feedbackType === 'mentor' ? 2 : 3,
      expires_in_days: 7
    });
  },

  /**
   * Notify about mission deadline extension
   */
  async missionDeadlineExtended(userId: string, missionTitle: string, missionSlug: string, newDeadline: string) {
    await emitNotification({
      user_id: userId,
      title: 'Mission Deadline Extended',
      body: `"${missionTitle}" now due ${newDeadline}`,
      type: 'mission_due',
      action_url: `/missions/${missionSlug}`,
      priority: 3,
      expires_in_days: 3
    });
  }
};

/**
 * Mentor notification emitters
 */
export const mentorNotifications = {
  /**
   * Notify about new mentor message
   */
  async newMessage(userId: string, mentorName: string, messagePreview: string, conversationId: string) {
    await emitNotification({
      user_id: userId,
      title: `New message from ${mentorName}`,
      body: messagePreview,
      type: 'mentor_message',
      source_id: conversationId,
      action_url: `/messages/${conversationId}`,
      priority: 2,
      expires_in_days: 7
    });
  },

  /**
   * Notify about mentor feedback on mission
   */
  async missionFeedback(userId: string, mentorName: string, missionTitle: string, missionSlug: string, feedbackSummary: string) {
    await emitNotification({
      user_id: userId,
      title: `Feedback from ${mentorName}`,
      body: `Review on "${missionTitle}": ${feedbackSummary}`,
      type: 'mentor_message',
      action_url: `/missions/${missionSlug}`,
      priority: 2,
      expires_in_days: 7
    });
  },

  /**
   * Notify about scheduled mentorship session
   */
  async sessionScheduled(userId: string, mentorName: string, sessionDate: string, sessionType: string) {
    await emitNotification({
      user_id: userId,
      title: `Mentorship Session Scheduled`,
      body: `${sessionType} with ${mentorName} on ${sessionDate}`,
      type: 'mentor_message',
      priority: 2,
      expires_in_days: 1
    });
  }
};

/**
 * Curriculum notification emitters
 */
export const curriculumNotifications = {
  /**
   * Notify when quiz becomes available (prerequisites met)
   */
  async quizUnlocked(userId: string, trackSlug: string, levelSlug: string, moduleSlug: string, quizTitle: string, prerequisiteScore: number) {
    await emitNotification({
      user_id: userId,
      title: 'Quiz Unlocked!',
      body: `${quizTitle} - You scored ${prerequisiteScore}% on prerequisites`,
      type: 'quiz_ready',
      track_slug: trackSlug,
      level_slug: levelSlug,
      action_url: `/curriculum/${trackSlug}/${levelSlug}/${moduleSlug}/quiz/${quizTitle.toLowerCase().replace(/\s+/g, '-')}`,
      priority: 2,
      expires_in_days: 7
    });
  },

  /**
   * Notify when assessment is blocked (missing prerequisites)
   */
  async assessmentBlocked(userId: string, trackSlug: string, levelSlug: string, assessmentTitle: string, missingPrerequisites: string[]) {
    await emitNotification({
      user_id: userId,
      title: 'Assessment Blocked',
      body: `${assessmentTitle} requires: ${missingPrerequisites.join(', ')}`,
      type: 'assessment_blocked',
      track_slug: trackSlug,
      level_slug: levelSlug,
      action_url: `/curriculum/${trackSlug}/${levelSlug}`,
      priority: 1,
      expires_in_days: 3
    });
  },

  /**
   * Notify about track progress milestone
   */
  async trackMilestone(userId: string, trackSlug: string, milestone: string, completionPercent: number) {
    await emitNotification({
      user_id: userId,
      title: `${trackSlug} Track Milestone!`,
      body: `${milestone} - ${completionPercent}% complete`,
      type: 'track_progress',
      track_slug: trackSlug,
      priority: 3,
      expires_in_days: 7
    });
  },

  /**
   * Notify about recommended learning break
   */
  async learningBreak(userId: string, trackSlug: string, nextContent: string, breakReason: string) {
    await emitNotification({
      user_id: userId,
      title: 'Time for a Learning Break',
      body: `${breakReason}. Next: ${nextContent}`,
      type: 'ai_coach',
      track_slug: trackSlug,
      priority: 4,
      expires_in_days: 1
    });
  }
};

/**
 * Community notification emitters
 */
export const communityNotifications = {
  /**
   * Notify about @mentions in community posts
   */
  async mentionReceived(userId: string, mentionerName: string, postTitle: string, communitySlug: string, postId: string) {
    await emitNotification({
      user_id: userId,
      title: `Mentioned by ${mentionerName}`,
      body: `in "${postTitle}"`,
      type: 'community_mention',
      source_id: postId,
      action_url: `/community/${communitySlug}/thread/${postId}`,
      priority: 3,
      expires_in_days: 3
    });
  },

  /**
   * Notify about replies to user's posts
   */
  async replyReceived(userId: string, replierName: string, originalPostTitle: string, communitySlug: string, postId: string) {
    await emitNotification({
      user_id: userId,
      title: `Reply from ${replierName}`,
      body: `to "${originalPostTitle}"`,
      type: 'community_mention',
      source_id: postId,
      action_url: `/community/${communitySlug}/thread/${postId}`,
      priority: 3,
      expires_in_days: 3
    });
  },

  /**
   * Notify about trending community discussions
   */
  async trendingDiscussion(userId: string, discussionTitle: string, communitySlug: string, discussionId: string, participantCount: number) {
    await emitNotification({
      user_id: userId,
      title: 'Trending Discussion',
      body: `"${discussionTitle}" - ${participantCount} participants`,
      type: 'community_mention',
      source_id: discussionId,
      action_url: `/community/${communitySlug}/thread/${discussionId}`,
      priority: 4,
      expires_in_days: 1
    });
  }
};

/**
 * Batch notification operations
 */
export const notificationUtils = {
  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    try {
      const response = await fetch(`/api/users/${userId}/control-center/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Dismiss multiple notifications
   */
  async batchDismiss(userId: string, notificationIds: string[]) {
    try {
      const response = await fetch(`/api/users/${userId}/control-center/notifications/batch-dismiss`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_ids: notificationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification preferences for user
   */
  async getPreferences(userId: string) {
    // Mock preferences - in production this would be stored in user profile
    return {
      ai_coach: true,
      mentor_messages: true,
      mission_deadlines: true,
      community_mentions: true,
      track_progress: true,
      email_notifications: false,
      push_notifications: true
    };
  }
};
