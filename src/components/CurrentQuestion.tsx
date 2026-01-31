/**
 * CurrentQuestion Component
 *
 * Container for current question displaying kanji, input, feedback, and navigation
 * Manages question state and user interactions
 */

import { useState } from "react";
import type { QuestionViewModel } from "@/components/types/quiz-view.types";
import { KanjiDisplay } from "./KanjiDisplay";
import { QuestionPrompt } from "./QuestionPrompt";
import { AnswerInput } from "./AnswerInput";
import { SubmitButton } from "./SubmitButton";
import { FeedbackSection } from "./FeedbackSection";
import { NextQuestionButton } from "./NextQuestionButton";
import { NeedReviewToggle } from "./NeedReviewToggle";

interface CurrentQuestionProps {
  question: QuestionViewModel;
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onNextQuestion: () => void | Promise<void>;
  onToggleNeedReview: (kanjiId: number, state: boolean) => Promise<void>;
  isLastQuestion: boolean;
  needReviewState: boolean;
}

export function CurrentQuestion({
  question,
  currentAnswer,
  onAnswerChange,
  onSubmitAnswer,
  onNextQuestion,
  onToggleNeedReview,
  isLastQuestion,
  needReviewState,
}: CurrentQuestionProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedAnswer = currentAnswer.trim();

    if (trimmedAnswer.length === 0) {
      setError("Answer cannot be empty");
      return;
    }

    if (question.isAnswered) {
      setError("This question has already been answered");
      return;
    }

    setError(null);

    try {
      await onSubmitAnswer(trimmedAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    }
  };

  const handleToggleNeedReview = async () => {
    try {
      await onToggleNeedReview(question.kanji.id, !needReviewState);
    } catch {
      // Error is handled by parent component
    }
  };

  const isSubmitDisabled = currentAnswer.trim().length === 0 || question.isAnswered;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <KanjiDisplay character={question.kanji.character} />

      <QuestionPrompt questionType={question.question_type} />

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <NeedReviewToggle isMarked={needReviewState} onChange={handleToggleNeedReview} />
      </div>

      {!question.isAnswered && (
        <div className="space-y-4">
          <AnswerInput
            questionType={question.question_type}
            value={currentAnswer}
            onChange={onAnswerChange}
            onSubmit={handleSubmit}
            disabled={question.isSubmitting}
          />

          {error && (
            <div
              className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          <SubmitButton onClick={handleSubmit} disabled={isSubmitDisabled} isLoading={question.isSubmitting} />
        </div>
      )}

      {question.feedbackData && (
        <div className="space-y-4">
          <FeedbackSection feedback={question.feedbackData} />

          <NextQuestionButton onClick={onNextQuestion} isLastQuestion={isLastQuestion} />
        </div>
      )}
    </div>
  );
}
