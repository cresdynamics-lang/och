/**
 * Analyst Content Integration Engine Types
 * For Recipes/Videos/Quizzes content system
 */

export interface AnalystContent {
  trackProgress: {
    currentLevel: number;
    percentComplete: number;
    videosCompleted: number;
    videosTotal: number;
    quizzesCompleted: number;
    quizzesTotal: number;
  };
  pending: {
    nextVideo: {
      id: string;
      title: string;
      duration: string;
      url: string;
      thumbnailUrl?: string;
    } | null;
    quizzes: Array<{
      id: string;
      title: string;
      due: string; // ISO date string
      classAvg: number;
      isUrgent: boolean; // Due within 24h
    }>;
    recipes: Array<{
      level: number;
      title: string;
      status: 'locked' | 'available' | 'completed';
      videoUrl?: string;
      quizId?: string;
    }>;
  };
  defenderTrack: Array<{
    level: number; // 1-4
    title: string;
    isUnlocked: boolean;
    recipes: Array<{
      id: string;
      title: string;
      videoUrl?: string;
      quizId?: string;
      status: 'locked' | 'available' | 'completed';
      description?: string;
    }>;
  }>;
}

export interface LevelAdvanceRequest {
  userId: string;
  readiness: number;
}

export interface LevelAdvanceResponse {
  success: boolean;
  newLevel: number;
  message: string;
  unlockedRecipes?: string[];
}

export interface QuizStartRequest {
  userId: string;
  quizId: string;
}

export interface QuizStartResponse {
  sessionId: string;
  quizId: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  timeLimit: number; // minutes
  startedAt: string;
}

