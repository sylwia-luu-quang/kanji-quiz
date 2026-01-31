/**
 * useQuizState Hook
 *
 * Custom hook for managing quiz state, question navigation, API calls,
 * and business logic for the quiz-taking experience.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { QuizWithQuestionsDTO } from "@/types";
import type {
  QuestionViewModel,
  ProgressViewModel,
  CompletionSummaryViewModel,
} from "@/components/types/quiz-view.types";
import {
  getQuiz,
  submitAnswer,
  completeQuiz,
  abandonQuiz,
  addNeedReview,
  removeNeedReview,
  QuizAPIError,
} from "@/lib/services/quiz-client.service";

interface UseQuizStateProps {
  initialQuiz: QuizWithQuestionsDTO;
  quizId: number;
}

interface UseQuizStateReturn {
  // State
  quiz: QuizWithQuestionsDTO;
  currentQuestionIndex: number;
  needReviewMap: Map<number, boolean>;
  isLoading: boolean;
  error: Error | null;
  isAbandoning: boolean;
  isCompleting: boolean;
  questionStates: Map<number, QuestionViewModel>;

  // Derived state
  currentQuestion: QuestionViewModel | null;
  isLastQuestion: boolean;
  progress: ProgressViewModel;
  allQuestionsAnswered: boolean;
  completionSummary: CompletionSummaryViewModel | null;

  // Actions
  submitQuestionAnswer: (answer: string) => Promise<void>;
  goToNextQuestion: () => void;
  handleAbandonQuiz: () => Promise<void>;
  handleCompleteQuiz: () => Promise<void>;
  toggleNeedReview: (kanjiId: number) => Promise<void>;
  refetchQuiz: () => Promise<void>;
  updateCurrentAnswer: (answer: string) => void;
}

/**
 * Generate encouragement message based on score percentage
 */
function getEncouragementMessage(scorePercent: number): string {
  if (scorePercent >= 90) return "Excellent work! You're mastering these kanji!";
  if (scorePercent >= 80) return "Great job! Keep up the good work!";
  if (scorePercent >= 70) return "Good effort! You're making progress!";
  if (scorePercent >= 60) return "Nice try! Review and try again!";
  return "Keep practicing! You'll get better with time!";
}

export function useQuizState({ initialQuiz, quizId }: UseQuizStateProps): UseQuizStateReturn {
  // Core state
  const [quiz, setQuiz] = useState<QuizWithQuestionsDTO>(initialQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [needReviewMap, setNeedReviewMap] = useState<Map<number, boolean>>(new Map());
  const [questionStates, setQuestionStates] = useState<Map<number, QuestionViewModel>>(new Map());

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const isInitialMount = useRef(true);

  /**
   * Initialize question states from quiz data
   * This only creates/updates the question view models, navigation is handled separately
   */
  useEffect(() => {
    setQuestionStates((prevStates) => {
      const newStates = new Map<number, QuestionViewModel>();

      quiz.questions.forEach((question) => {
        const prevState = prevStates.get(question.id);

        // Preserve feedback data and current answer if they exist in previous state
        newStates.set(question.id, {
          ...question,
          currentAnswer: prevState?.currentAnswer || "",
          isSubmitting: false,
          feedbackData: prevState?.feedbackData || null,
          isAnswered: question.user_answer !== null,
        });
      });

      return newStates;
    });
  }, [quiz.questions]);

  /**
   * Initialize current question index to first unanswered question on mount
   */
  useEffect(() => {
    if (isInitialMount.current) {
      const firstUnansweredIndex = quiz.questions.findIndex((q) => q.user_answer === null);
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      isInitialMount.current = false;
    }
  }, [quiz.questions]);

  /**
   * Current question view model
   */
  const currentQuestion = useMemo(() => {
    const question = quiz.questions[currentQuestionIndex];
    if (!question) return null;
    return questionStates.get(question.id) || null;
  }, [quiz.questions, currentQuestionIndex, questionStates]);

  /**
   * Check if current question is the last one
   */
  const isLastQuestion = useMemo(
    () => currentQuestionIndex === quiz.questions.length - 1,
    [currentQuestionIndex, quiz.questions.length]
  );

  /**
   * Progress tracking
   */
  const progress = useMemo<ProgressViewModel>(() => {
    const total = quiz.questions.length;
    const current = currentQuestionIndex + 1;
    const percentComplete = Math.round((current / total) * 100);

    return {
      current,
      total,
      percentComplete,
    };
  }, [currentQuestionIndex, quiz.questions.length]);

  /**
   * Check if all questions have been answered
   */
  const allQuestionsAnswered = useMemo(() => quiz.questions.every((q) => q.user_answer !== null), [quiz.questions]);

  /**
   * Completion summary (only available when quiz is completed)
   */
  const completionSummary = useMemo<CompletionSummaryViewModel | null>(() => {
    if (quiz.status !== "completed" || quiz.score_percent === null) return null;

    const totalCount = quiz.questions.length;
    const correctCount = quiz.questions.filter((q) => q.is_correct === true).length;
    const scorePercent = quiz.score_percent;

    return {
      scorePercent,
      correctCount,
      totalCount,
      encouragementMessage: getEncouragementMessage(scorePercent),
    };
  }, [quiz.status, quiz.score_percent, quiz.questions]);

  /**
   * Update the current answer in the question state
   */
  const updateCurrentAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;

      setQuestionStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(currentQuestion.id);
        if (state) {
          newStates.set(currentQuestion.id, {
            ...state,
            currentAnswer: answer,
          });
        }
        return newStates;
      });
    },
    [currentQuestion]
  );

  /**
   * Submit answer for current question
   */
  const submitQuestionAnswer = useCallback(
    async (answer: string) => {
      if (!currentQuestion) return;

      const trimmedAnswer = answer.trim();
      if (trimmedAnswer.length === 0) {
        throw new Error("Answer cannot be empty");
      }

      if (currentQuestion.isAnswered) {
        throw new Error("This question has already been answered");
      }

      // Set submitting state
      setQuestionStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(currentQuestion.id);
        if (state) {
          newStates.set(currentQuestion.id, {
            ...state,
            isSubmitting: true,
          });
        }
        return newStates;
      });

      try {
        const response = await submitAnswer(quizId, currentQuestion.id, trimmedAnswer);

        // Update question state with feedback
        setQuestionStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(currentQuestion.id, {
            ...response,
            currentAnswer: trimmedAnswer,
            isSubmitting: false,
            feedbackData: response.feedback,
            isAnswered: true,
          });
          return newStates;
        });

        // Update quiz with updated question
        setQuiz((prevQuiz) => ({
          ...prevQuiz,
          questions: prevQuiz.questions.map((q) => (q.id === currentQuestion.id ? response : q)),
        }));
      } catch (err) {
        // Reset submitting state on error
        setQuestionStates((prev) => {
          const newStates = new Map(prev);
          const state = newStates.get(currentQuestion.id);
          if (state) {
            newStates.set(currentQuestion.id, {
              ...state,
              isSubmitting: false,
            });
          }
          return newStates;
        });
        throw err;
      }
    },
    [currentQuestion, quizId]
  );

  /**
   * Refetch quiz data from server
   */
  const refetchQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const freshQuiz = await getQuiz(quizId);
      setQuiz(freshQuiz);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to refetch quiz"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  /**
   * Complete the quiz
   */
  const handleCompleteQuiz = useCallback(async () => {
    if (quiz.status !== "in_progress") {
      throw new Error("Can only complete a quiz that is in progress");
    }

    if (!allQuestionsAnswered) {
      throw new Error("All questions must be answered before completing");
    }

    setIsCompleting(true);
    setError(null);

    try {
      const updatedQuiz = await completeQuiz(quizId);
      setQuiz((prevQuiz) => ({ ...prevQuiz, ...updatedQuiz }));
    } catch (err) {
      // Handle 409 conflict as success (already completed)
      if (err instanceof QuizAPIError && err.status === 409) {
        await refetchQuiz();
        return;
      }
      setError(err instanceof Error ? err : new Error("Failed to complete quiz"));
      throw err;
    } finally {
      setIsCompleting(false);
    }
  }, [quiz, quizId, allQuestionsAnswered, refetchQuiz]);

  /**
   * Navigate to next question
   */
  const goToNextQuestion = useCallback(async () => {
    if (isLastQuestion) {
      // Automatically trigger completion on last question
      await handleCompleteQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [isLastQuestion, handleCompleteQuiz]);

  /**
   * Abandon the quiz
   */
  const handleAbandonQuiz = useCallback(async () => {
    if (quiz.status !== "in_progress") {
      throw new Error("Can only abandon a quiz that is in progress");
    }

    setIsAbandoning(true);
    setError(null);

    try {
      const updatedQuiz = await abandonQuiz(quizId);
      setQuiz({ ...quiz, ...updatedQuiz });
      // Navigate to dashboard (handled by parent component)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to abandon quiz"));
      throw err;
    } finally {
      setIsAbandoning(false);
    }
  }, [quiz, quizId]);

  /**
   * Toggle need review status for a kanji
   */
  const toggleNeedReview = useCallback(
    async (kanjiId: number) => {
      const currentState = needReviewMap.get(kanjiId) || false;
      const newState = !currentState;

      // Optimistic update
      setNeedReviewMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(kanjiId, newState);
        return newMap;
      });

      try {
        if (newState) {
          await addNeedReview(kanjiId);
        } else {
          await removeNeedReview(kanjiId);
        }
      } catch (err) {
        // Rollback on error
        setNeedReviewMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(kanjiId, currentState);
          return newMap;
        });
        throw err;
      }
    },
    [needReviewMap]
  );

  return {
    // State
    quiz,
    currentQuestionIndex,
    needReviewMap,
    isLoading,
    error,
    isAbandoning,
    isCompleting,
    questionStates,

    // Derived state
    currentQuestion,
    isLastQuestion,
    progress,
    allQuestionsAnswered,
    completionSummary,

    // Actions
    submitQuestionAnswer,
    goToNextQuestion,
    handleAbandonQuiz,
    handleCompleteQuiz,
    toggleNeedReview,
    refetchQuiz,
    updateCurrentAnswer,
  };
}
