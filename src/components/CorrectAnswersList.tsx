/**
 * CorrectAnswersList Component
 *
 * List of all acceptable correct answers
 */

interface CorrectAnswersListProps {
  correctAnswers: string[];
}

export function CorrectAnswersList({
  correctAnswers,
}: CorrectAnswersListProps) {
  if (correctAnswers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Correct answer{correctAnswers.length > 1 ? "s" : ""}:
      </h3>
      <ul className="space-y-1">
        {correctAnswers.map((answer, index) => (
          <li
            key={index}
            className="text-base text-neutral-900 dark:text-neutral-100"
          >
            {answer}
          </li>
        ))}
      </ul>
    </div>
  );
}
