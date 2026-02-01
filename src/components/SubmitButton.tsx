/**
 * SubmitButton Component
 *
 * Primary button to submit answer, disabled when empty or submitting
 */

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function SubmitButton({ onClick, disabled, isLoading }: SubmitButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || isLoading} className="w-full" size="lg">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Submitting...
        </>
      ) : (
        "Submit Answer"
      )}
    </Button>
  );
}
