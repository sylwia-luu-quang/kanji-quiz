/**
 * NeedReviewToggle Component
 *
 * Checkbox to mark/unmark kanji for review with optimistic updates
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface NeedReviewToggleProps {
  isMarked: boolean;
  onChange: (newState: boolean) => Promise<void>;
}

export function NeedReviewToggle({
  isMarked,
  onChange,
}: NeedReviewToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.checked;
    setIsLoading(true);
    try {
      await onChange(newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={isMarked}
          onChange={handleChange}
          disabled={isLoading}
          className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-blue-400"
          aria-label="Mark this kanji for review"
        />
        <span>Mark for review</span>
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin text-neutral-500"
            aria-hidden="true"
          />
        )}
      </label>
    </div>
  );
}
