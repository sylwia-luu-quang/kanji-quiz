import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface NextQuestionButtonProps {
  onClick: () => void | Promise<void>;
  isLastQuestion: boolean;
}

export function NextQuestionButton({ onClick, isLastQuestion }: NextQuestionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } catch {
      // Error is handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button data-testid="next-question-button" onClick={handleClick} className="w-full" size="lg" disabled={isLoading}>
      {isLoading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
          {isLastQuestion ? "Completing..." : "Loading..."}
        </>
      ) : isLastQuestion ? (
        "Finish Quiz"
      ) : (
        <>
          Next Question
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </>
      )}
    </Button>
  );
}
