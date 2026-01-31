/**
 * NeedReviewListItem - Single need-review row with kanji info and remove action
 */

import { Button } from "@/components/ui/button";
import type { NeedReviewListItemVM } from "./types/dashboard.types";

interface NeedReviewListItemProps {
  item: NeedReviewListItemVM;
  onRemove: (kanjiId: number) => void;
  isDeleting: boolean;
}

export default function NeedReviewListItem({ item, onRemove, isDeleting }: NeedReviewListItemProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <li className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Kanji Character */}
        <div className="text-4xl font-bold text-gray-900 w-16 text-center">{item.character}</div>

        {/* Kanji Info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white bg-blue-600 px-2 py-0.5 rounded">{item.level}</span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>

          <div className="text-sm">
            <span className="font-medium text-gray-700">Readings: </span>
            <span className="text-gray-900">{item.readings.join(", ")}</span>
          </div>

          <div className="text-sm">
            <span className="font-medium text-gray-700">Meanings: </span>
            <span className="text-gray-900">{item.meanings.join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemove(item.kanjiId)}
        disabled={isDeleting}
        aria-label={`Remove ${item.character} from need review list`}
      >
        {isDeleting ? "Removing..." : "Remove"}
      </Button>
    </li>
  );
}
