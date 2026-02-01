/**
 * CorrectnessIndicator Component
 *
 * Icon and text showing correctness (checkmark + "Correct!" or X + "Incorrect")
 */

import { CheckCircle2, XCircle } from "lucide-react";

interface CorrectnessIndicatorProps {
  isCorrect: boolean;
}

export function CorrectnessIndicator({ isCorrect }: CorrectnessIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 ${
        isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
      }`}
    >
      {isCorrect ? (
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      ) : (
        <XCircle className="h-6 w-6" aria-hidden="true" />
      )}
      <span className="text-lg font-semibold">{isCorrect ? "Correct!" : "Incorrect"}</span>
    </div>
  );
}
