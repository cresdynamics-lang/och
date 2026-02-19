'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MessageCircle, Send, Target, BookOpen,
  CheckCircle2, AlertCircle, Sparkles, Brain
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiGateway } from '@/services/apiGateway';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StudentProgress {
  missions_completed: number;
  recipes_completed: number;
  average_score: number;
  current_streak: number;
  weak_areas: string[];
  strengths: string[];
  next_goals: string[];
  readiness_score: number;
}

export default function AICoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [usageToday, setUsageToday] = useState(0);
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStudentProgress();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStudentProgress = async () => {
    try {
      const [analyticsData, subData, usageData] = await Promise.all([
        apiGateway.get('/coaching/student-analytics'),
        apiGateway.get('/subscription/status'),
        apiGateway.get('/coaching/ai-coach/usage').catch(() => ({ usage_today: 0 }))
      ]);

      const progressData = {
        missions_completed: analyticsData.total_missions_completed || 0,
        recipes_completed: analyticsData.recipes_completed || 0,
        average_score: Number(analyticsData.average_score) || 0,
        current_streak: analyticsData.current_streak || 0,
        weak_areas: analyticsData.weak_areas || [],
        strengths: analyticsData.profiler?.strengths || [],
        next_goals: analyticsData.next_goals || [],
        readiness_score: analyticsData.profiler?.scores?.overall || 0,
      };

      setProgress(progressData);
      setDailyLimit(subData.ai_coach_daily_limit);
      setUsageToday(usageData.usage_today || 0);

      try {
        const welcomeRes = await apiGateway.post('/coaching/ai-coach/welcome', {
          progress: progressData
        });
        setInitialMessage(welcomeRes.message);
      } catch (err) {
        setInitialMessage(getMotivationalMessage(progressData));
      }

      try {
        const historyData = await apiGateway.get('/coaching/ai-coach/history?limit=20');
        if (historyData && historyData.length > 0) {
          const lastSession = historyData[0];
          if (lastSession.messages) {
            const msgs = lastSession.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
            }));
            setMessages(msgs);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const getMotivationalMessage = (data: any) => {
    if (data.missions_completed === 0) return "Welcome! Let's start your cybersecurity journey together. I'm here to guide you every step of the way!";
    if (data.average_score >= 80) return "Outstanding performance! You're on track to become a cybersecurity expert. Keep up the amazing work!";
    if (data.current_streak >= 7) return `Incredible ${data.current_streak}-day streak! Your consistency is impressive. Let's keep this momentum going!`;
    if (data.recipes_completed > 5) return "Great progress on your hands-on skills! You're building a solid foundation in cybersecurity.";
    return "You're making steady progress! Every step forward brings you closer to your cybersecurity goals. Keep pushing!";
  };

  const getRemainingMessages = () => {
    if (dailyLimit === null) return Infinity;
    return Math.max(0, dailyLimit - usageToday);
  };

  const canSendMessage = () => {
    const remaining = getRemainingMessages();
    return remaining > 0 || remaining === Infinity;
  };

  const getRecommendation = async () => {
    if (!canSendMessage()) return;
    
    setLoadingRecommendation(true);
    setShowRecommendation(true);
    
    try {
      const response = await apiGateway.post('/coaching/ai-coach/recommendation', {
        progress: progress,
      });
      
      setRecommendation(response.recommendation);
      setUsageToday(prev => prev + 1);
    } catch (err: any) {
      setRecommendation('Unable to generate recommendation. Please try again later.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !canSendMessage()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiGateway.post('/coaching/ai-coach/chat', {
        message: input,
        context: 'general',
        progress: progress,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || response.message || 'I understand. How can I help you further?',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUsageToday(prev => prev + 1);
    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: err?.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {loadingProgress && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium">Loading your AI Coach...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col flex-1 min-h-0">
        <header className="flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-8 h-8 text-indigo-400 shrink-0" aria-hidden />
              AI Coach
            </h1>
            <p className="text-slate-400 text-sm mt-1">Your personal cybersecurity learning companion</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dailyLimit !== null && !loadingProgress && (
              <span className="text-xs text-slate-500 tabular-nums">
                {getRemainingMessages() === Infinity ? 'Unlimited' : `${getRemainingMessages()}/${dailyLimit} messages`}
              </span>
            )}
            <Badge variant="gold" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" aria-hidden />
              AI
            </Badge>
          </div>
        </header>

        {progress && (progress.weak_areas.length > 0 || progress.next_goals.length > 0) && (
          <div className="grid grid-cols-2 gap-3 shrink-0 max-h-28 overflow-hidden">
            {progress.weak_areas.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 min-w-0">
                <h3 className="text-xs font-semibold text-orange-400 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Areas to improve
                </h3>
                <ul className="space-y-0.5 overflow-y-auto max-h-14">
                  {progress.weak_areas.slice(0, 3).map((area, i) => (
                    <li key={i} className="text-slate-400 text-xs truncate">• {area}</li>
                  ))}
                </ul>
              </div>
            )}
            {progress.next_goals.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 min-w-0">
                <h3 className="text-xs font-semibold text-green-400 flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  Next steps
                </h3>
                <ul className="space-y-0.5 overflow-y-auto max-h-14">
                  {progress.next_goals.slice(0, 3).map((goal, i) => (
                    <li key={i} className="text-slate-400 text-xs flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                      <span className="truncate">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommendation Modal */}
        {showRecommendation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full bg-slate-900 border-purple-500/30">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    Your Personalized Recommendation
                  </h2>
                  <button
                    onClick={() => setShowRecommendation(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {loadingRecommendation ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Analyzing your progress...</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg p-6">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{recommendation}</p>
                  </div>
                )}
                
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => setShowRecommendation(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden" aria-label="Chat with AI Coach">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-5 h-5 text-indigo-400 shrink-0" aria-hidden />
              <span className="font-semibold text-white truncate">Chat with your AI Coach</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!loadingProgress && progress && canSendMessage() && (
                <Button
                  onClick={getRecommendation}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Get recommendation
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-12 h-12 text-slate-600 mb-3" aria-hidden />
                <p className="text-slate-400 text-sm">Start a conversation with your AI Coach.</p>
                <p className="text-slate-500 text-xs mt-1">Ask about your progress, study tips, or goals.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/50'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 shrink-0">
            {!canSendMessage() && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-200 text-xs font-medium">Daily limit reached.</p>
                <p className="text-amber-300/80 text-xs mt-0.5">
                  <Link href="/dashboard/student/subscription" className="underline hover:no-underline">Upgrade</Link> or come back tomorrow.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canSendMessage() ? 'Ask your AI Coach anything...' : 'Daily limit reached'}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={2}
                disabled={loading || !canSendMessage()}
                aria-label="Message input"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !canSendMessage()}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 shrink-0"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        <footer className="shrink-0 pt-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            <div>
              <h3 className="font-semibold text-white text-sm">Hands-on practice</h3>
              <p className="text-slate-400 text-xs mt-0.5">Explore recipes and build real skills.</p>
            </div>
            <Link href="/dashboard/student/coaching/recipes" className="shrink-0">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                <BookOpen className="w-4 h-4 mr-2" aria-hidden />
                Recipes
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
