/**
 * QuizHeader Component
 *
 * Fixed header with app title and abandon button
 */

import { useState } from "react";
import { AbandonButton } from "./AbandonButton";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface QuizHeaderProps {
  onAbandonQuiz: () => Promise<void>;
  isAbandoning: boolean;
  canAbandon: boolean;
}

export function QuizHeader({
  onAbandonQuiz,
  isAbandoning,
  canAbandon,
}: QuizHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmAbandon = async () => {
    setIsDialogOpen(false);
    await onAbandonQuiz();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Kanji Quiz
          </h1>
          {canAbandon && (
            <AbandonButton
              onOpenDialog={() => setIsDialogOpen(true)}
              disabled={isAbandoning}
            />
          )}
        </div>
      </header>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onConfirm={handleConfirmAbandon}
        onCancel={() => setIsDialogOpen(false)}
        title="Abandon Quiz?"
        description="Are you sure you want to abandon this quiz? Your progress will be lost and this quiz will be marked as abandoned."
      />
    </>
  );
}
