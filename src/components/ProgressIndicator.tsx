/**
 * ProgressIndicator Component
 *
 * Visual progress bar and text indicator showing current question position
 */

interface ProgressIndicatorProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

export function ProgressIndicator({ currentQuestionIndex, totalQuestions }: ProgressIndicatorProps) {
  const current = currentQuestionIndex + 1;
  const percentComplete = Math.round((current / totalQuestions) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <span>
          Question {current} of {totalQuestions}
        </span>
        <span>{percentComplete}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-500"
          style={{ width: `${percentComplete}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label={`Progress: ${current} of ${totalQuestions} questions completed`}
        />
      </div>
    </div>
  );
}
