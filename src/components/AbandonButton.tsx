/**
 * AbandonButton Component
 *
 * Destructive button that opens confirmation dialog before abandoning quiz
 */

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AbandonButtonProps {
  onOpenDialog: () => void;
  disabled?: boolean;
}

export function AbandonButton({ onOpenDialog, disabled }: AbandonButtonProps) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onOpenDialog}
      disabled={disabled}
    >
      <X className="mr-1 h-4 w-4" aria-hidden="true" />
      Abandon Quiz
    </Button>
  );
}
