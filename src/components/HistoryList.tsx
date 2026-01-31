/**
 * HistoryList - Renders history or empty state
 */

import { Accordion } from "@/components/ui/accordion";
import HistoryItemAccordion from "./HistoryItemAccordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryItemVM } from "./types/dashboard.types";

interface HistoryListProps {
  items: HistoryItemVM[];
  isLoading: boolean;
}

export default function HistoryList({ items, isLoading }: HistoryListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading quiz history">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg" role="status" aria-label="No quiz history">
        <p className="text-gray-500 mb-2">No completed quizzes yet.</p>
        <p className="text-sm text-gray-400">Start a quiz above to see your history here.</p>
      </div>
    );
  }

  // List with items
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {items.map((item) => (
        <HistoryItemAccordion key={item.id} item={item} />
      ))}
    </Accordion>
  );
}
