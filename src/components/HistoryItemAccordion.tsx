/**
 * HistoryItemAccordion - Expandable summary + details of a completed quiz
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { HistoryItemVM } from "./types/dashboard.types";

interface HistoryItemAccordionProps {
  item: HistoryItemVM;
}

export default function HistoryItemAccordion({ item }: HistoryItemAccordionProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const completedDate = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <AccordionItem value={item.id.toString()}>
      <AccordionTrigger>
        <div className="flex items-center gap-4 flex-1 text-left">
          {/* Type Badge */}
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              item.type === "level" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {item.type === "level" ? "Level Quiz" : "Need Review"}
          </span>

          {/* Level Badge (if applicable) */}
          {item.level && (
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">{item.level}</span>
          )}

          {/* Question Count */}
          <span className="text-sm text-gray-600">{item.questionCount} questions</span>

          {/* Score */}
          {item.scorePercent !== null && (
            <span
              className={`text-sm font-semibold ${
                item.scorePercent >= 80
                  ? "text-green-600"
                  : item.scorePercent >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {item.scorePercent}%
            </span>
          )}

          {/* Date */}
          <span className="text-xs text-gray-500 ml-auto">{formattedDate}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Type: </span>
              <span className="text-gray-900">{item.type === "level" ? "Level Quiz" : "Need Review Quiz"}</span>
            </div>
            {item.level && (
              <div>
                <span className="font-medium text-gray-700">Level: </span>
                <span className="text-gray-900">{item.level}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Questions: </span>
              <span className="text-gray-900">{item.questionCount}</span>
            </div>
            {item.scorePercent !== null && (
              <div>
                <span className="font-medium text-gray-700">Score: </span>
                <span className="text-gray-900">{item.scorePercent}%</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Started: </span>
              <span className="text-gray-900">{formattedDate}</span>
            </div>
            {completedDate && (
              <div>
                <span className="font-medium text-gray-700">Completed: </span>
                <span className="text-gray-900">{completedDate}</span>
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
