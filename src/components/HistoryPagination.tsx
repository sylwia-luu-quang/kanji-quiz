/**
 * HistoryPagination - Pagination controls for quiz history
 */

import { Button } from "@/components/ui/button";
import type { PaginationState } from "./types/dashboard.types";

interface HistoryPaginationProps {
  pagination: PaginationState;
  onChange: (pagination: PaginationState) => void;
}

export default function HistoryPagination({ pagination, onChange }: HistoryPaginationProps) {
  const { limit, offset, total } = pagination;
  const hasNextPage = offset + limit < total;
  const hasPrevPage = offset > 0;

  const handlePrevious = () => {
    if (hasPrevPage) {
      onChange({
        ...pagination,
        offset: Math.max(0, offset - limit),
      });
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onChange({
        ...pagination,
        offset: offset + limit,
      });
    }
  };

  // Don't show pagination if there's no items
  if (total === 0) {
    return null;
  }

  const showingEnd = Math.min(offset + limit, total);

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Page Navigation */}
      <nav className="flex items-center justify-between" aria-label="Quiz history pagination">
        <div className="text-sm text-gray-600">
          Showing {offset + 1}-{showingEnd} of {total}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!hasPrevPage}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNextPage} aria-label="Next page">
            Next
          </Button>
        </div>
      </nav>
    </div>
  );
}
