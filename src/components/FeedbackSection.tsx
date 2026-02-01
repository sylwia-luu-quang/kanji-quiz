/**
 * FeedbackSection Component
 *
 * Section shown after submission with correctness and correct answers
 * Styled green/red based on correctness. Includes aria-live region for accessibility.
 */

import type { QuestionFeedbackDTO } from "@/types";
import { CorrectnessIndicator } from "./CorrectnessIndicator";
import { CorrectAnswersList } from "./CorrectAnswersList";

interface FeedbackSectionProps {
  feedback: QuestionFeedbackDTO;
}

export function FeedbackSection({ feedback }: FeedbackSectionProps) {
  const bgColor = feedback.is_correct
    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
    : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";

  return (
    <div className={`space-y-4 rounded-lg border p-6 ${bgColor}`} role="status" aria-live="polite" aria-atomic="true">
      <CorrectnessIndicator isCorrect={feedback.is_correct} />

      {!feedback.is_correct && <CorrectAnswersList correctAnswers={feedback.correct_answers} />}
    </div>
  );
}
