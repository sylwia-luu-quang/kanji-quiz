/**
 * KanjiDisplay Component
 *
 * Displays a large centered kanji character
 * Responsive: 120px on desktop, scales down on mobile
 */

interface KanjiDisplayProps {
  character: string;
}

export function KanjiDisplay({ character }: KanjiDisplayProps) {
  return (
    <div className="flex items-center justify-center py-8 md:py-12">
      <div
        className="text-8xl font-bold text-neutral-900 dark:text-neutral-100 md:text-[120px]"
        aria-label={`Kanji character: ${character}`}
      >
        {character}
      </div>
    </div>
  );
}
