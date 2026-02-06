'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Play, Lock, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { VideoPlayerModal } from './VideoPlayerModal';
import { QuizWorkflow } from './QuizWorkflow';
import { LevelAdvanceModal } from './LevelAdvanceModal';
import type { AnalystContent } from '@/types/analyst-content';
import { motion, AnimatePresence } from 'framer-motion';

interface LearningContentPanelProps {
  content: AnalystContent;
  userId: string;
  onContentUpdate?: () => void;
}

export const LearningContentPanel = ({ content, userId, onContentUpdate }: LearningContentPanelProps) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [quizWorkflowOpen, setQuizWorkflowOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [levelAdvanceOpen, setLevelAdvanceOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1])); // Level 1 expanded by default

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const handleStartVideo = () => {
    if (content.pending.nextVideo) {
      setVideoModalOpen(true);
    }
  };

  const handleStartQuiz = async (quizId: string, quizTitle: string) => {
    try {
      const response = await fetch(`/api/analyst/${userId}/quiz/${quizId}/start`, {
        method: 'POST',
      });
      const quizData = await response.json();
      setSelectedQuiz({ ...quizData, title: quizTitle });
      setQuizWorkflowOpen(true);
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const handleLevelAdvance = () => {
    setLevelAdvanceOpen(true);
  };

  const { trackProgress, pending, defenderTrack } = content;
  const progressPercent = Math.round(trackProgress.percentComplete * 100);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
          <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2 mb-2">
            📚 LEARNING
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-white/80 font-medium">DEFENDER TRACK • LEVEL {trackProgress.currentLevel}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70 font-medium">{progressPercent}% Complete</span>
              <div className="flex-1">
                <Progress value={progressPercent} className="h-2" />
              </div>
              <span className="text-xs text-white/70 font-medium">
                {trackProgress.videosCompleted}/{trackProgress.videosTotal} videos,{' '}
                {trackProgress.quizzesCompleted}/{trackProgress.quizzesTotal} quizzes
              </span>
            </div>
          </div>
        </div>

        {/* Next Video Carousel */}
        {pending.nextVideo && (
          <div className="m-4 border border-och-defender-blue/20 bg-och-steel-grey/30 flex-shrink-0 rounded-lg">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-och-defender-blue/20 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-och-defender-blue" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-white">{pending.nextVideo.title}</div>
                  <div className="text-xs text-white/70">{pending.nextVideo.duration}</div>
                </div>
              </div>
              <Button
                className="w-full bg-och-defender-blue hover:bg-och-defender-blue/90 h-10"
                onClick={handleStartVideo}
              >
                <Play className="w-4 h-4 mr-2" />
                WATCH VIDEO
              </Button>
            </div>
          </div>
        )}

        {/* Quiz Urgency Section */}
        {pending.quizzes.length > 0 && (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-och-signal-orange">
              <AlertTriangle className="w-4 h-4" />
              {pending.quizzes.length} QUIZ{pending.quizzes.length > 1 ? 'ES' : ''} DUE
            </div>
          </div>
        )}

        {/* Content Scrollable Area */}
        <div className="px-4 flex-1 overflow-y-auto pb-4">
          {/* Quiz Blockers - Grid layout for 2+ quizzes, single column for 1 */}
          {pending.quizzes.length > 0 && (
            <div className={`grid ${pending.quizzes.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-3`}>
              {pending.quizzes.map((quiz) => {
                const dueDate = new Date(quiz.due);
                const hoursUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
                const isUrgent = quiz.isUrgent || hoursUntilDue < 24;

                return (
                  <div
                    key={quiz.id}
                    className={`bg-och-signal-orange/10 border ${
                      isUrgent ? 'border-och-signal-orange/50' : 'border-och-signal-orange/30'
                    } hover:bg-och-signal-orange/20 rounded-lg transition-all`}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            <span className="truncate">{quiz.title}</span>
                            {isUrgent && (
                              <Badge className="bg-red-500 text-white text-xs flex-shrink-0">URGENT</Badge>
                            )}
                          </div>
                          <div className="text-xs text-white/70 mt-1">
                            Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-xs text-white/70 ml-2 flex-shrink-0 font-medium">
                          Avg: {Math.round(quiz.classAvg * 100)}%
                        </div>
                      </div>
                      <Button
                        className="w-full h-9 text-xs bg-och-signal-orange hover:bg-och-signal-orange/90"
                        onClick={() => handleStartQuiz(quiz.id, quiz.title)}
                      >
                        START QUIZ
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Track Roadmap */}
          <div className="mt-4">
            <div className="text-sm font-bold text-och-defender-blue mb-3">TRACK ROADMAP</div>
            {defenderTrack.map((level) => (
              <div
                key={level.level}
                className="mb-2 border border-och-steel-grey/30 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleLevel(level.level)}
                  aria-expanded={expandedLevels.has(level.level)}
                  aria-controls={`level-${level.level}-recipes`}
                  className="w-full p-3 bg-och-steel-grey/20 hover:bg-och-steel-grey/30 flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                >
                  <div className="flex items-center gap-2">
                    <span id={`level-${level.level}-title`} className="font-medium text-sm text-white">
                      {level.title}
                    </span>
                    {!level.isUnlocked && (
                      <Lock className="w-4 h-4 text-white/50" />
                    )}
                  </div>
                  {expandedLevels.has(level.level) ? (
                    <ChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedLevels.has(level.level) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                      id={`level-${level.level}-recipes`}
                      role="region"
                      aria-labelledby={`level-${level.level}-title`}
                    >
                      <div className="p-3 space-y-2 bg-och-midnight-black/50">
                        {level.recipes.map((recipe) => (
                          <div
                            key={recipe.id}
                            className={`p-3 rounded-lg border ${
                              recipe.status === 'locked'
                                ? 'bg-och-steel-grey/10 border-och-steel-grey/20 opacity-50'
                                : recipe.status === 'completed'
                                ? 'bg-och-cyber-mint/10 border-och-cyber-mint/30'
                                : 'bg-och-defender-blue/10 border-och-defender-blue/30 hover:bg-och-defender-blue/20'
                            } transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {recipe.status === 'locked' && (
                                  <Lock className="w-4 h-4 text-och-steel-grey" />
                                )}
                                {recipe.status === 'completed' && (
                                  <CheckCircle2 className="w-4 h-4 text-och-cyber-mint" />
                                )}
                                <span className="text-sm text-white">{recipe.title}</span>
                              </div>
                              {recipe.status === 'available' && (
                                <div className="flex gap-2">
                                  {recipe.videoUrl && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        // Handle video play
                                        setVideoModalOpen(true);
                                      }}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Video
                                    </Button>
                                  )}
                                  {recipe.quizId && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => handleStartQuiz(recipe.quizId!, recipe.title)}
                                    >
                                      Quiz
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            {recipe.description && (
                              <div className="text-xs text-white/70 mt-1">{recipe.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Unlock Next Level */}
          {trackProgress.currentLevel < 4 && trackProgress.percentComplete >= 0.82 && (
            <div className="mt-4 p-4 bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg">
              <div className="text-sm font-medium text-och-cyber-mint mb-2">
                Ready to Advance!
              </div>
              <div className="text-xs text-white/80 mb-3">
                You've reached {Math.round(trackProgress.percentComplete * 100)}% readiness. Unlock Level {trackProgress.currentLevel + 1} to continue.
              </div>
              <Button
                className="w-full h-9 text-xs bg-och-cyber-mint hover:bg-och-cyber-mint/90 text-black"
                onClick={handleLevelAdvance}
              >
                UNLOCK NEXT LEVEL
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {pending.nextVideo && (
        <VideoPlayerModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoData={pending.nextVideo}
          onVideoComplete={(videoId) => {
            console.log('Video completed:', videoId);
            onContentUpdate?.();
          }}
          isSkippable={true}
        />
      )}

      {/* Quiz Workflow Modal */}
      {quizWorkflowOpen && selectedQuiz && (
        <QuizWorkflow
          quizData={selectedQuiz}
          onComplete={(score, total) => {
            console.log(`Quiz completed: ${score}/${total}`);
            setQuizWorkflowOpen(false);
            setSelectedQuiz(null);
            onContentUpdate?.();
          }}
          onCancel={() => {
            setQuizWorkflowOpen(false);
            setSelectedQuiz(null);
          }}
        />
      )}

      {/* Level Advance Modal */}
      <LevelAdvanceModal
        isOpen={levelAdvanceOpen}
        onClose={() => setLevelAdvanceOpen(false)}
        userId={userId}
        currentLevel={trackProgress.currentLevel}
        readiness={Math.round(trackProgress.percentComplete * 100)}
        onAdvance={() => {
          setLevelAdvanceOpen(false);
          onContentUpdate?.();
        }}
      />
    </>
  );
};

