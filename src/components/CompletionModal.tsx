/**
 * CompletionModal Component
 *
 * Modal shown after completion with score, encouragement, and return button
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScoreSummary } from "./ScoreSummary";
import { ReturnToDashboardButton } from "./ReturnToDashboardButton";

interface CompletionModalProps {
  isOpen: boolean;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  encouragementMessage: string;
  onReturnToDashboard: () => void;
}

export function CompletionModal({
  isOpen,
  scorePercent,
  correctCount,
  totalCount,
  encouragementMessage,
  onReturnToDashboard,
}: CompletionModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent data-testid="completion-modal" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="completion-modal-title" className="text-center text-2xl">
            Quiz Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ScoreSummary scorePercent={scorePercent} correctCount={correctCount} totalCount={totalCount} />

          <p className="text-center text-base text-neutral-700 dark:text-neutral-300">{encouragementMessage}</p>

          <ReturnToDashboardButton onClick={onReturnToDashboard} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
