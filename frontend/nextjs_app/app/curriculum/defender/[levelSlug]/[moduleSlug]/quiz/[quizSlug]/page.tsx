'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Target, CheckCircle, X, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useContentProgress } from '@/hooks/useCurriculum';
import { emitCurriculumQuizCompleted } from '@/lib/coaching-events';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text_input';
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showResult = false
}: {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  showResult?: boolean;
}) {
  const isCorrect = showResult && selectedAnswer === question.correct_answer;

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="text-slate-400 border-slate-600">
            Question {questionIndex + 1} of {totalQuestions}
          </Badge>
          {showResult && (
            <Badge className={isCorrect ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}>
              {isCorrect ? 'Correct' : 'Incorrect'}
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-4">{question.question}</h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = showResult && option === question.correct_answer;
          const isIncorrectSelection = showResult && isSelected && !isCorrectOption;

          return (
            <button
              key={index}
              onClick={() => !showResult && onAnswerSelect(option)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isCorrectOption && showResult
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : isIncorrectSelection
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : isSelected
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : showResult
                  ? 'border-slate-600 bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  isCorrectOption && showResult
                    ? 'border-green-500 text-green-400'
                    : isIncorrectSelection
                    ? 'border-red-500 text-red-400'
                    : isSelected
                    ? 'border-blue-500 text-blue-400'
                    : 'border-slate-500 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{option}</span>
                {isCorrectOption && showResult && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {isIncorrectSelection && (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
          <h4 className="text-white font-medium mb-2">Explanation:</h4>
          <p className="text-slate-300 text-sm">{question.explanation}</p>
        </div>
      )}
    </Card>
  );
}

export default function QuizContentPage() {
  const params = useParams();
  const router = useRouter();
  const levelSlug = params.levelSlug as string;
  const moduleSlug = params.moduleSlug as string;
  const quizSlug = params.quizSlug as string;

  const { user } = useAuth();
  const { updateProgress, updating } = useContentProgress(user?.id?.toString());

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Mock quiz data
  const quizData = {
    id: 'mock-quiz-id',
    title: 'Log Analysis Fundamentals Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What Event ID indicates a failed logon attempt in Windows?',
        type: 'multiple_choice' as const,
        options: ['4624', '4625', '4634', '4648'],
        correct_answer: '4625',
        explanation: 'Event ID 4625 indicates an account failed to log on, which is crucial for detecting brute force attacks.'
      },
      {
        id: 'q2',
        question: 'Which of the following is NOT typically found in a security log?',
        type: 'multiple_choice' as const,
        options: ['User login attempts', 'File access records', 'Weather data', 'System service starts'],
        correct_answer: 'Weather data',
        explanation: 'Weather data would not be found in security logs. Security logs contain authentication, authorization, and security-related events.'
      },
      {
        id: 'q3',
        question: 'What is the primary purpose of log analysis in cybersecurity?',
        type: 'multiple_choice' as const,
        options: ['To monitor system performance', 'To detect and investigate security incidents', 'To track user behavior for marketing', 'To generate system reports'],
        correct_answer: 'To detect and investigate security incidents',
        explanation: 'Log analysis is primarily used to detect security incidents, investigate breaches, and monitor for suspicious activity.'
      }
    ]
  };

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const answeredQuestions = Object.keys(answers).length;

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Calculate score
    let correctAnswers = 0;
    quizData.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    setScore(finalScore);
    setShowResults(true);
    setQuizCompleted(true);

    // Update progress
    try {
      await updateProgress(quizData.id, 'completed', finalScore);

      // Emit coaching event
      if (user?.id) {
        await emitCurriculumQuizCompleted(
          user.id.toString(),
          'defender',
          levelSlug,
          moduleSlug,
          quizSlug,
          finalScore
        );
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleRetakeQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const canProceed = answers[currentQuestionIndex] !== undefined || showResults;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/curriculum/defender/${levelSlug}`}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <span>{levelSlug.charAt(0).toUpperCase() + levelSlug.slice(1)}</span>
                  <span>→</span>
                  <span>{moduleSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <h1 className="text-white font-semibold">{quizData.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                {answeredQuestions}/{totalQuestions} Answered
              </Badge>
              {quizCompleted && (
                <Badge className={`${
                  score >= 70
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {score}% Score
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!quizCompleted ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Quiz Progress</span>
                <span>{currentQuestionIndex + 1} of {totalQuestions}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question */}
            <QuestionCard
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              selectedAnswer={answers[currentQuestionIndex] || null}
              onAnswerSelect={handleAnswerSelect}
              showResult={showResults}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestionIndex === totalQuestions - 1 ? (
                  <>
                    Submit Quiz
                    <Target className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Results Screen */
          <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
            <div className="mb-6">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                score >= 70 ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {score >= 70 ? (
                  <CheckCircle className="w-10 h-10 text-green-400" />
                ) : (
                  <X className="w-10 h-10 text-red-400" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {score >= 70 ? 'Quiz Passed!' : 'Quiz Completed'}
              </h2>

              <p className="text-slate-300 mb-4">
                You scored {score}% ({Object.values(answers).filter((answer, index) =>
                  answer === quizData.questions[index].correct_answer
                ).length} out of {totalQuestions} correct)
              </p>

              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                score >= 70
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {score >= 70 ? 'Passing Score (70%+)' : 'Below Passing Score'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleRetakeQuiz}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>

              <Button
                onClick={() => router.push(`/curriculum/defender/${levelSlug}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Question Review */}
            <div className="mt-8 text-left">
              <h3 className="text-lg font-bold text-white mb-4">Question Review</h3>
              <div className="space-y-4">
                {quizData.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    questionIndex={index}
                    totalQuestions={totalQuestions}
                    selectedAnswer={answers[index] || null}
                    onAnswerSelect={() => {}}
                    showResult={true}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
