/**
 * ReturnToDashboardButton Component
 *
 * Primary button to navigate back to dashboard
 */

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface ReturnToDashboardButtonProps {
  onClick: () => void;
}

export function ReturnToDashboardButton({ onClick }: ReturnToDashboardButtonProps) {
  return (
    <Button data-testid="return-to-dashboard-button" onClick={onClick} className="w-full" size="lg">
      <Home className="mr-2 h-5 w-5" aria-hidden="true" />
      Return to Dashboard
    </Button>
  );
}
