'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, X, RefreshCw, ArrowRight } from 'lucide-react';
// RecipePill requires full recipe object, so we'll show recipe IDs as badges for now
import { useAuth } from '@/hooks/useAuth';

interface CoachingPriority {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  recipes?: string[];
  deadline?: string;
}

interface CoachingAdvice {
  greeting: string;
  diagnosis: string;
  priorities: CoachingPriority[];
  encouragement: string;
  actions?: any[];
}

interface CoachingNudgeProps {
  userId?: string;
  autoLoad?: boolean;
  onActionClick?: (action: any) => void;
}

export function CoachingNudge({ userId, autoLoad = true, onActionClick }: CoachingNudgeProps) {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<CoachingAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const getCoaching = async () => {
    const targetUserId = userId || user?.id?.toString();
    if (!targetUserId) {
      setError('User ID required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coaching/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: targetUserId,
          context: 'dashboard',
          trigger: 'daily'
        })
      });

      if (!response.ok) {
        throw new Error(`Coaching failed: ${response.status}`);
      }

      const { advice } = await response.json();
      setNudge(advice);
      setIsVisible(true);
    } catch (err: any) {
      console.error('Failed to fetch coaching:', err);
      setError(err.message || 'Failed to load coaching advice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && (userId || user?.id)) {
      // Delay coaching load by 2 seconds to prioritize main content
      const timer = setTimeout(() => {
        getCoaching();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, user?.id, autoLoad]);

  const executeAction = (action: any) => {
    if (onActionClick) {
      onActionClick(action);
    } else {
      // Default action handling
      console.log('Executing action:', action);
      if (action.type === 'send_nudge' && action.target) {
        // Navigate to target or show notification
        const element = document.getElementById(action.target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  if (!isVisible || (!nudge && !loading && !error)) {
    return null;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 right-6 w-96 bg-red-500/95 border-2 border-red-400/50 backdrop-blur-xl shadow-2xl rounded-3xl p-6 z-50"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Coaching Error</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/20 text-white"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-red-100 text-sm mb-4">{error}</p>
        <Button
          size="sm"
          className="w-full bg-white/20 hover:bg-white/30 text-white"
          onClick={getCoaching}
        >
          Retry
        </Button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-emerald-500/95 to-teal-500/95 border-2 border-emerald-400/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/30 rounded-3xl p-6 z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Loading Coaching...</h3>
            <p className="text-emerald-100 text-sm">Analyzing your progress</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!nudge) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-emerald-500/95 to-teal-500/95 border-2 border-emerald-400/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/30 rounded-3xl p-6 z-50 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg mb-1">{nudge.greeting}</h3>
              <p className="text-emerald-100 text-sm mb-2">{nudge.diagnosis}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-white/20 text-white flex-shrink-0"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {nudge.priorities && nudge.priorities.length > 0 && (
            <div className="space-y-3 mb-6">
              {nudge.priorities.slice(0, 3).map((priority, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => {
                    if (nudge.actions && nudge.actions[i]) {
                      executeAction(nudge.actions[i]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={`text-xs font-mono ${
                        priority.priority === 'high'
                          ? 'bg-red-500/80 text-white'
                          : priority.priority === 'medium'
                          ? 'bg-amber-500/80 text-white'
                          : 'bg-blue-500/80 text-white'
                      }`}
                    >
                      {priority.priority}
                    </Badge>
                    <span className="font-semibold text-white text-sm flex-1">
                      {priority.action}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-emerald-50 text-xs mb-2">{priority.reason}</p>
                  {priority.recipes && priority.recipes.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {priority.recipes.map((recipeId: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-white/10 rounded-md text-emerald-100"
                        >
                          {recipeId}
                        </span>
                      ))}
                    </div>
                  )}
                  {priority.deadline && (
                    <p className="text-emerald-200/80 text-xs mt-2">
                      Deadline: {new Date(priority.deadline).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {nudge.encouragement && (
            <div className="mb-6 p-3 bg-white/10 rounded-xl border border-white/20">
              <p className="text-emerald-50 text-sm italic">"{nudge.encouragement}"</p>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-white/20">
            {nudge.actions && nudge.actions.length > 0 && (
              <Button
                size="sm"
                className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                onClick={() => executeAction(nudge.actions[0])}
              >
                🚀 Do This Now
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 p-0 hover:bg-white/20 text-white"
              onClick={getCoaching}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
