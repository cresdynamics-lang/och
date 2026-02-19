'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MessageCircle, Send, Target, Award, BookOpen,
  Zap, CheckCircle2, AlertCircle, Sparkles, Brain, Trophy
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
  const [showChat, setShowChat] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 p-6">
      {loadingProgress && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Loading your AI Coach...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Brain className="w-10 h-10 text-indigo-400" />
              AI Coach
            </h1>
            <p className="text-slate-400 mt-2">Your personal cybersecurity learning companion</p>
          </div>
          <Badge variant="gold" className="text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by AI
          </Badge>
        </div>

        {!loadingProgress && progress && (
          <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Your Progress</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-slate-400">Missions</p>
                </div>
                <p className="text-2xl font-bold text-white">{progress.missions_completed}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-slate-400">Recipes</p>
                </div>
                <p className="text-2xl font-bold text-white">{progress.recipes_completed}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-slate-400">Avg Score</p>
                </div>
                <p className="text-2xl font-bold text-white">{Number(progress.average_score).toFixed(0)}%</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <p className="text-xs text-slate-400">Streak</p>
                </div>
                <p className="text-2xl font-bold text-white">{progress.current_streak} days</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
              <p className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                {initialMessage}
              </p>
              {!showChat && (
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => setShowChat(true)}
                    disabled={!canSendMessage()}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with AI Coach
                  </Button>
                  <Button
                    onClick={getRecommendation}
                    disabled={!canSendMessage()}
                    variant="outline"
                    className="border-purple-500/50 hover:bg-purple-500/10"
                  >
                    Get My Recommendation
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {progress && (progress.weak_areas.length > 0 || progress.next_goals.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {progress.weak_areas.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {progress.weak_areas.slice(0, 3).map((area, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            
            {progress.next_goals.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Recommended Next Steps
                </h3>
                <ul className="space-y-2">
                  {progress.next_goals.slice(0, 3).map((goal, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </Card>
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
                    onClick={() => {
                      setShowRecommendation(false);
                      setShowChat(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with AI Coach
                  </Button>
                  <Button
                    onClick={() => setShowRecommendation(false)}
                    variant="outline"
                    className="border-slate-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {showChat && (
          <Card className="bg-slate-900/80 border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-400" />
                    Chat with Your AI Coach
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Get personalized guidance and honest feedback</p>
                </div>
                {dailyLimit !== null && (
                  <Badge variant={getRemainingMessages() > 0 ? 'mint' : 'orange'} className="text-sm">
                    {getRemainingMessages() === Infinity ? 'Unlimited' : `${getRemainingMessages()}/${dailyLimit} left`}
                  </Badge>
                )}
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Start a conversation with your AI Coach!</p>
                  <p className="text-slate-500 text-sm mt-2">Ask about your progress, get study tips, or discuss your goals</p>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
              {!canSendMessage() && (
                <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-300 text-sm font-semibold">Daily limit reached</p>
                  <p className="text-orange-400 text-xs mt-1">
                    Come back tomorrow or <Link href="/dashboard/student/subscription" className="underline">upgrade</Link> for more messages
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={canSendMessage() ? "Ask your AI Coach anything..." : "Daily limit reached"}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  disabled={loading || !canSendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || !canSendMessage()}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Ready for Hands-On Practice?</h3>
              <p className="text-slate-400 text-sm">Explore our recipe library and start building real cybersecurity skills</p>
            </div>
            <Link href="/dashboard/student/coaching/recipes">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 whitespace-nowrap">
                <BookOpen className="w-4 h-4 mr-2" />
                Continue to Recipes
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
