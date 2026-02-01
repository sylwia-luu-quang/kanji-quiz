/**
 * ScoreSummary Component
 *
 * Visual score display with large percentage and counts
 * Color coded: green >80%, yellow 50-80%, red <50%
 */

interface ScoreSummaryProps {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
}

export function ScoreSummary({ scorePercent, correctCount, totalCount }: ScoreSummaryProps) {
  const getScoreColor = () => {
    if (scorePercent >= 80) return "text-green-600 dark:text-green-400";
    if (scorePercent >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-4 text-center">
      <div data-testid="score-percentage" className={`text-6xl font-bold ${getScoreColor()}`}>
        {scorePercent}%
      </div>
      <div data-testid="score-summary" className="text-lg text-neutral-700 dark:text-neutral-300">
        {correctCount} out of {totalCount} correct
      </div>
    </div>
  );
}
