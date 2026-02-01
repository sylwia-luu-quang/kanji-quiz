/**
 * InlineAlert - Reusable inline error or info message
 */

import type { InlineAlertVM } from "./types/dashboard.types";

interface InlineAlertProps extends InlineAlertVM {
  onDismiss?: () => void;
}

export default function InlineAlert({ variant, message, onDismiss }: InlineAlertProps) {
  const variantStyles = {
    error: "text-destructive bg-destructive/10 border-destructive/20",
    info: "text-blue-700 bg-blue-50 border-blue-200",
  };

  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      className={`flex items-start justify-between px-4 py-3 rounded-md border ${variantStyles[variant]}`}
    >
      <div className="flex-1">
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
