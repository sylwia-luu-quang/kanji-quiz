/**
 * NeedReviewListSection - Paginated list of need-review kanji
 */

import NeedReviewList from "./NeedReviewList";
import NeedReviewPagination from "./NeedReviewPagination";
import type { NeedReviewListItemVM, PaginationState } from "./types/dashboard.types";

interface NeedReviewListSectionProps {
  items: NeedReviewListItemVM[];
  pagination: PaginationState;
  onRemove: (kanjiId: number) => void;
  onPaginate: (pagination: PaginationState) => void;
  isLoading: boolean;
  isDeleting: boolean;
  error?: string;
}

export default function NeedReviewListSection({
  items,
  pagination,
  onRemove,
  onPaginate,
  isLoading,
  isDeleting,
  error,
}: NeedReviewListSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Need Review</h2>
        <span className="text-sm text-gray-600">
          {pagination.total} {pagination.total === 1 ? "kanji" : "kanji"}
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
        <NeedReviewList items={items} onRemove={onRemove} isLoading={isLoading} isDeleting={isDeleting} />

        {/* Pagination */}
        {!isLoading && <NeedReviewPagination pagination={pagination} onChange={onPaginate} />}
      </div>
    </section>
  );
}
