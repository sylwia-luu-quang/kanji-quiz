/**
 * HistorySection - Completed quiz history with expandable details and pagination
 */

import HistoryList from "./HistoryList";
import HistoryPagination from "./HistoryPagination";
import type { HistoryItemVM, PaginationState } from "./types/dashboard.types";

interface HistorySectionProps {
  items: HistoryItemVM[];
  pagination: PaginationState;
  onPaginate: (pagination: PaginationState) => void;
  isLoading: boolean;
  error?: string;
}

export default function HistorySection({ items, pagination, onPaginate, isLoading, error }: HistorySectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quiz History</h2>
        <span className="text-sm text-gray-600">
          {pagination.total} {pagination.total === 1 ? "quiz" : "quizzes"}
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div role="alert" className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg border p-4">
        <HistoryList items={items} isLoading={isLoading} />

        {/* Pagination */}
        {!isLoading && <HistoryPagination pagination={pagination} onChange={onPaginate} />}
      </div>
    </section>
  );
}
