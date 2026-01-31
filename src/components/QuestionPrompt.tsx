/**
 * QuestionPrompt Component
 *
 * Displays dynamic prompt text based on question type
 */

import type { QuestionType } from "@/types";

interface QuestionPromptProps {
  questionType: QuestionType;
}

export function QuestionPrompt({ questionType }: QuestionPromptProps) {
  const promptText =
    questionType === "reading"
      ? "What is the reading?"
      : "What does this kanji mean?";

  return (
    <p className="text-center text-lg font-medium text-neutral-700 dark:text-neutral-300">
      {promptText}
    </p>
  );
}
