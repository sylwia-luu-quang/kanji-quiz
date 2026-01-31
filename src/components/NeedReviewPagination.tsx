/**
 * NeedReviewPagination - Pagination controls for need-review list
 */

import { Button } from "@/components/ui/button";
import type { PaginationState } from "./types/dashboard.types";

interface NeedReviewPaginationProps {
  pagination: PaginationState;
  onChange: (pagination: PaginationState) => void;
}

export default function NeedReviewPagination({ pagination, onChange }: NeedReviewPaginationProps) {
  const { limit, offset, total } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
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

  // Don't show pagination if there's only one page or no items
  if (total === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between border-t pt-4" aria-label="Need review list pagination">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages} ({total} total)
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrevious} disabled={!hasPrevPage} aria-label="Previous page">
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNextPage} aria-label="Next page">
          Next
        </Button>
      </div>
    </nav>
  );
}
