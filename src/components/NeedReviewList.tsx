/**
 * NeedReviewList - Renders list or empty state
 */

import NeedReviewListItem from "./NeedReviewListItem";
import { Skeleton } from "@/components/ui/skeleton";
import type { NeedReviewListItemVM } from "./types/dashboard.types";

interface NeedReviewListProps {
  items: NeedReviewListItemVM[];
  onRemove: (kanjiId: number) => void;
  isLoading: boolean;
  isDeleting: boolean;
}

export default function NeedReviewList({ items, onRemove, isLoading, isDeleting }: NeedReviewListProps) {
  // Loading state
  if (isLoading) {
    return (
      <ul className="space-y-3" role="status" aria-label="Loading need review list">
        {[1, 2, 3].map((i) => (
          <li key={i} className="p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-16" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className="text-center py-12 border-2 border-dashed rounded-lg"
        role="status"
        aria-label="No kanji in need review list"
      >
        <p className="text-gray-500 mb-2">No kanji marked for review yet.</p>
        <p className="text-sm text-gray-400">Add kanji during quizzes to practice them later.</p>
      </div>
    );
  }

  // List with items
  return (
    <ul className="space-y-3" aria-label="Need review kanji list">
      {items.map((item) => (
        <NeedReviewListItem key={item.id} item={item} onRemove={onRemove} isDeleting={isDeleting} />
      ))}
    </ul>
  );
}
