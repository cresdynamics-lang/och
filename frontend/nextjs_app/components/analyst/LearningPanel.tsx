'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { CardContent } from '@/components/ui/card-enhanced';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { VideoPlayerModal } from './VideoPlayerModal';
import { QuizWorkflow } from './QuizWorkflow';
import { Play, AlertTriangle, Lock } from 'lucide-react';

interface LearningPanelProps {
  userId: string;
}

interface LearningData {
  track: string;
  level: string;
  progress: number;
  nextVideo: {
    title: string;
    duration: string;
    id: string;
  };
  quizBlockers: Array<{
    title: string;
    classAvg: number;
    id: string;
  }>;
  assessmentPrereqs: Array<{
    title: string;
    blocker: string;
  }>;
}

// Skeleton Loader Component
const LearningSkeleton = () => (
  <div className="h-full flex flex-col overflow-hidden">
    {/* Header Skeleton */}
    <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
      <div className="h-6 bg-och-steel-grey/50 rounded w-24 mb-4 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-3 bg-och-steel-grey/50 rounded w-20 animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-och-steel-grey/50 rounded w-32 animate-pulse"></div>
          <div className="flex-1 h-2 bg-och-steel-grey/50 rounded-full animate-pulse"></div>
          <div className="h-3 bg-och-steel-grey/50 rounded w-8 animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Next Video Skeleton */}
    <div className="m-4 border border-och-defender-blue/20 bg-och-steel-grey/30 flex-shrink-0 rounded-lg">
      <div className="p-4 pt-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-och-steel-grey/50 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-och-steel-grey/50 rounded w-3/4 mb-1 animate-pulse"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 bg-och-defender-blue/50 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-4 flex-1 overflow-y-auto space-y-3">
      <div className="h-4 bg-och-steel-grey/50 rounded w-24 animate-pulse"></div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-och-steel-grey/30 rounded-lg animate-pulse">
          <div className="p-4">
            <div className="h-4 bg-och-steel-grey/50 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-2/3 mb-3 animate-pulse"></div>
            <div className="h-9 bg-och-steel-grey/50 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Empty State Component
const LearningEmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-lg font-medium text-och-cyber-mint mb-2">Learning Dashboard</h3>
    <p className="text-och-steel-grey text-sm mb-4">
      Your learning journey begins here. Complete assessments to unlock the next level.
    </p>
    <Button className="bg-och-defender-blue hover:bg-och-defender-blue/90">
      Start Learning Journey
    </Button>
  </div>
);

export const LearningPanel = ({ userId }: LearningPanelProps) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<LearningData['nextVideo'] | null>(null);
  const [quizWorkflowOpen, setQuizWorkflowOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const { data: learningData, error, isLoading, mutate } = useSWR<LearningData>(
    `/api/analyst/${userId}/learning`,
    () => ({
      track: "Defender",
      level: "Beginner → Intermediate",
      progress: 68,
      nextVideo: {
        title: "SIEM Querying Fundamentals",
        duration: "7min",
        id: "video-123"
      },
      quizBlockers: [
        {
          title: "Alert Triage Fundamentals",
          classAvg: 84,
          id: "quiz-456"
        },
        {
          title: "Log Analysis Basics",
          classAvg: 76,
          id: "quiz-789"
        }
      ],
      assessmentPrereqs: [
        {
          title: "Intermediate SIEM Assessment",
          blocker: "Complete Alert Triage Quiz first"
        }
      ]
    }),
    { refreshInterval: 30000 }
  );

  const handleStartVideo = (videoId: string) => {
    console.log('Starting video:', videoId);
    // Find the video data and open modal
    if (learningData?.nextVideo) {
      setSelectedVideo(learningData.nextVideo);
      setVideoModalOpen(true);
    }
  };

  const handleVideoComplete = (videoId: string) => {
    console.log('Video completed:', videoId);
    // Could trigger notifications or progress updates here
  };

  const handleStartQuiz = (quizId: string, quizTitle: string) => {
    console.log('Starting quiz:', quizId, quizTitle);

    // Create mock quiz data - in production this would come from API
    const quizData = {
      id: quizId,
      title: quizTitle,
      videoRequired: true, // All quizzes require video completion
      videoData: {
        id: `${quizId}-video`,
        title: `${quizTitle} - Required Video`,
        duration: "5min",
        videoUrl: `/videos/${quizId}.mp4` // Mock video URL
      },
      questions: [
        {
          id: `${quizId}-q1`,
          question: "What is the primary function of a SIEM system?",
          options: [
            "To store user passwords securely",
            "To collect, analyze, and correlate security events",
            "To create backup copies of files",
            "To monitor network bandwidth usage"
          ],
          correctAnswer: 1,
          explanation: "SIEM systems collect and analyze security events from various sources to identify potential security incidents."
        },
        {
          id: `${quizId}-q2`,
          question: "Which of the following is NOT a typical SIEM component?",
          options: [
            "Log collection agents",
            "Correlation engine",
            "Dashboard and reporting",
            "Password cracking tools"
          ],
          correctAnswer: 3,
          explanation: "Password cracking tools are not part of a SIEM system. SIEM focuses on monitoring and analysis, not offensive security tools."
        },
        {
          id: `${quizId}-q3`,
          question: "What does MTTR stand for in cybersecurity?",
          options: [
            "Mean Time To Respond",
            "Maximum Threat Tolerance Rating",
            "Multi-Tier Threat Response",
            "Mean Time To Recovery"
          ],
          correctAnswer: 0,
          explanation: "MTTR stands for Mean Time To Respond, measuring how quickly an organization can respond to security incidents."
        }
      ],
      timeLimit: 10 // 10 minutes
    };

    setSelectedQuiz(quizData);
    setQuizWorkflowOpen(true);
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Quiz completed: ${score}/${totalQuestions}`);

    // Update learning data to reflect completed quiz
    if (learningData) {
      const updatedData = {
        ...learningData,
        quizBlockers: learningData.quizBlockers.filter(q => q.id !== selectedQuiz?.id)
      };

      // Update local data
      mutate(updatedData, false);

      // In production, this would trigger an API call to update progress
    }

    setQuizWorkflowOpen(false);
    setSelectedQuiz(null);
  };

  const handleViewPrereq = (prereqTitle: string) => {
    console.log('Viewing prereq:', prereqTitle);
    // Navigate to learning curriculum or show prerequisite details
    // For now, we'll show an alert with prerequisite information
    alert(`Prerequisite: ${prereqTitle}\n\nThis module requires completion of the prerequisite content. Please complete the required modules first to unlock this assessment.`);
  };

  if (isLoading) return <LearningSkeleton />;
  if (error || !learningData) return <LearningEmptyState />;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
          <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2 mb-2">
            📚 LEARNING
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-och-steel-grey">{learningData.track.toUpperCase()} TRACK</div>
            <div className="flex items-center gap-2">
              <span className="text-och-steel-grey text-xs">{learningData.level}</span>
              <div className="flex-1">
                <ProgressBar value={learningData.progress} variant="mint" showLabel={false} className="h-2" />
              </div>
              <span className="text-sm font-bold text-och-cyber-mint">{learningData.progress}%</span>
            </div>
          </div>
        </div>

        {/* Next Video */}
        <div className="m-4 border border-och-defender-blue/20 bg-och-steel-grey/30 flex-shrink-0 rounded-lg">
          <div className="p-4 pt-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-och-defender-blue/20 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-och-defender-blue" />
              </div>
              <div>
                <div className="font-medium text-sm">{learningData.nextVideo.title}</div>
                <div className="text-xs text-och-steel-grey">{learningData.nextVideo.duration}</div>
              </div>
            </div>
            <Button
              className="w-full bg-och-defender-blue hover:bg-och-defender-blue/90 h-10"
              onClick={() => handleStartVideo(learningData.nextVideo.id)}
            >
              CONTINUE VIDEO
            </Button>
          </div>
        </div>

        {/* Quiz Blockers & Assessment Prereqs */}
        <div className="px-4 flex-1 overflow-y-auto space-y-3">
          {/* Quiz Blockers */}
          <div className="flex items-center gap-2 text-sm font-medium text-och-signal-orange">
            <AlertTriangle className="w-4 h-4" />
            {learningData.quizBlockers.length} QUIZ BLOCKERS
          </div>

          {learningData.quizBlockers.map((quiz) => (
            <div key={quiz.id} className="bg-och-signal-orange/10 border border-och-signal-orange/30 hover:bg-och-signal-orange/20 rounded-lg">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm">{quiz.title}</div>
                  <div className="text-xs text-och-steel-grey">
                    Class: {quiz.classAvg}%
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
          ))}

          {/* Assessment Prereqs */}
          {learningData.assessmentPrereqs.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-och-sahara-gold">
                <Lock className="w-4 h-4" />
                ASSESSMENT PREREQS
              </div>

              {learningData.assessmentPrereqs.map((prereq) => (
                <div key={prereq.title} className="bg-och-sahara-gold/10 border border-och-sahara-gold/30 rounded-lg">
                  <div className="p-4">
                    <div className="font-medium text-sm mb-2">{prereq.title}</div>
                    <div className="text-xs text-och-steel-grey mb-3">{prereq.blocker}</div>
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs"
                      onClick={() => handleViewPrereq(prereq.title)}
                    >
                      VIEW PREREQ
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty State for No Blockers */}
          {learningData.quizBlockers.length === 0 && learningData.assessmentPrereqs.length === 0 && (
            <div className="bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-och-cyber-mint font-medium mb-2">All Clear!</div>
              <div className="text-och-steel-grey text-sm">
                No blockers detected. Continue with your learning journey.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoData={selectedVideo}
        onVideoComplete={handleVideoComplete}
        isSkippable={true}
      />

      {/* Quiz Workflow Modal */}
      {quizWorkflowOpen && selectedQuiz && (
        <QuizWorkflow
          quizData={selectedQuiz}
          onComplete={handleQuizComplete}
          onCancel={() => {
            setQuizWorkflowOpen(false);
            setSelectedQuiz(null);
          }}
        />
      )}
    </>
  );
};
