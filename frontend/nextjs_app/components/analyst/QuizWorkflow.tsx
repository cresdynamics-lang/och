'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { VideoPlayerModal } from './VideoPlayerModal';
import { Play, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface QuizWorkflowProps {
  quizData: {
    id: string;
    title: string;
    videoRequired: boolean;
    videoData?: {
      id: string;
      title: string;
      duration: string;
      videoUrl?: string;
    };
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    timeLimit?: number;
  };
  onComplete: (score: number, totalQuestions: number) => void;
  onCancel: () => void;
}

export const QuizWorkflow: React.FC<QuizWorkflowProps> = ({ quizData, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'video' | 'quiz' | 'results'>('intro');
  const [videoWatched, setVideoWatched] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState((quizData.timeLimit || 30) * 60);
  const [quizStarted, setQuizStarted] = useState(false);

  // Timer effect for quiz
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentStep === 'quiz' && quizStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [currentStep, quizStarted, timeRemaining]);

  const handleVideoComplete = (videoId: string) => {
    setVideoWatched(true);
    setTimeout(() => {
      setCurrentStep('quiz');
      setQuizStarted(true);
    }, 1500);
  };

  const handleStartQuiz = () => {
    if (quizData.videoRequired && !videoWatched) {
      setCurrentStep('video');
    } else {
      setCurrentStep('quiz');
      setQuizStarted(true);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
    setCurrentStep('results');

    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return count + (answer === quizData.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    onComplete(correctAnswers, quizData.questions.length);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  // Main render function with conditional rendering
  const renderContent = () => {
    // Video step
    if (currentStep === 'video' && quizData.videoRequired && quizData.videoData) {
      return (
        <>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
            <div className="w-full max-w-2xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg">
              <div className="p-6 border-b border-och-steel-grey/50">
                <h2 className="text-och-cyber-mint flex items-center gap-2 text-xl font-bold">
                  <Play className="w-5 h-5" />
                  Required Video: {quizData.videoData.title}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-och-steel-grey/20 rounded-lg p-4">
                  <p className="text-och-steel-grey mb-3">
                    You must watch this video before taking the quiz. The video will unlock the quiz questions.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-och-cyber-mint">
                    <Clock className="w-4 h-4" />
                    Duration: {quizData.videoData.duration}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleStartQuiz}
                    className="flex-1 bg-och-defender-blue hover:bg-och-defender-blue/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Video
                  </Button>
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="border-och-steel-grey/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <VideoPlayerModal
            isOpen={currentStep === 'video'}
            onClose={() => {}}
            videoData={quizData.videoData}
            onVideoComplete={handleVideoComplete}
            isSkippable={false}
          />
        </>
      );
    }

    // Quiz step
    if (currentStep === 'quiz') {
      const timeColor = timeRemaining < 300 ? 'text-red-400' : timeRemaining < 600 ? 'text-och-sahara-gold' : 'text-och-cyber-mint';

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="w-full max-w-3xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-och-steel-grey/50">
              <div className="flex items-center justify-between">
                <h2 className="text-och-cyber-mint text-xl font-bold">{quizData.title}</h2>
                <div className={`text-lg font-mono font-bold ${timeColor}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>

              <div className="w-full bg-och-steel-grey/50 rounded-full h-2 mt-4">
                <div
                  className="bg-och-defender-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-och-steel-grey mt-1">
                <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    {currentQuestion.question}
                  </h3>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? 'border-och-defender-blue bg-och-defender-blue/10 text-och-defender-blue'
                            : 'border-och-steel-grey/50 hover:border-och-steel-grey/80 text-och-steel-grey hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-och-defender-blue bg-och-defender-blue'
                              : 'border-och-steel-grey/50'
                          }`} />
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="border-och-steel-grey/50"
                  >
                    Previous
                  </Button>

                  <Button
                    onClick={currentQuestionIndex === quizData.questions.length - 1 ? handleSubmitQuiz : handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="bg-och-defender-blue hover:bg-och-defender-blue/90"
                  >
                    {currentQuestionIndex === quizData.questions.length - 1 ? 'Submit Quiz' : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Results step
    if (currentStep === 'results' && showResults) {
      const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
        return count + (answer === quizData.questions[index].correctAnswer ? 1 : 0);
      }, 0);

      const scorePercentage = Math.round((correctAnswers / quizData.questions.length) * 100);
      const passed = scorePercentage >= 70;

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="w-full max-w-2xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg">
            <div className="p-6 border-b border-och-steel-grey/50">
              <h2 className="text-center text-2xl text-och-cyber-mint font-bold mb-4">
                Quiz Complete!
              </h2>
            </div>

            <div className="p-6 text-center space-y-6">
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${passed ? 'text-och-cyber-mint' : 'text-red-400'}`}>
                  {scorePercentage}%
                </div>
                <div className="text-lg text-och-steel-grey">
                  {correctAnswers} out of {quizData.questions.length} correct
                </div>
              </div>

              <div className={`p-4 rounded-lg ${passed ? 'bg-och-cyber-mint/10 border border-och-cyber-mint/30' : 'bg-red-400/10 border border-red-400/30'}`}>
                <div className="flex items-center justify-center gap-2">
                  {passed ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-och-cyber-mint" />
                      <span className="text-och-cyber-mint font-medium">Passed! Quiz blocker removed.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <span className="text-red-400 font-medium">Not passed. Review material and try again.</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onCancel}
                  className="flex-1 bg-och-defender-blue hover:bg-och-defender-blue/90"
                >
                  Return to Learning
                </Button>
                {!passed && (
                  <Button
                    onClick={() => {
                      setCurrentStep('quiz');
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers([]);
                      setShowResults(false);
                      setTimeRemaining((quizData.timeLimit || 30) * 60);
                      setQuizStarted(false);
                    }}
                    variant="outline"
                    className="border-och-steel-grey/50"
                  >
                    Retake Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Initial intro state
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="w-full max-w-2xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg">
          <div className="p-6 border-b border-och-steel-grey/50">
            <h2 className="text-och-cyber-mint flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="w-5 h-5" />
              Quiz: {quizData.title}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-och-steel-grey/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-och-steel-grey">Questions:</span>
                <span className="text-white">{quizData.questions.length}</span>
              </div>
              {quizData.timeLimit && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-och-steel-grey">Time Limit:</span>
                  <span className="text-white">{quizData.timeLimit} minutes</span>
                </div>
              )}
              {quizData.videoRequired && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-och-steel-grey">Video Required:</span>
                  <span className="text-och-signal-orange">Yes</span>
                </div>
              )}
            </div>

            <div className="text-sm text-och-steel-grey">
              Complete this quiz to remove the learning blocker and unlock the next module.
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStartQuiz}
                className="flex-1 bg-och-defender-blue hover:bg-och-defender-blue/90"
              >
                {quizData.videoRequired ? 'Start Video & Quiz' : 'Start Quiz'}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-och-steel-grey/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};
