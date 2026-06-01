import type { Card } from '@/lib/repo/schemas';

/**
 * Combine several cards' text into one merged card's text.
 *
 * - Labels are joined with `" & "` (empty labels are skipped so you never get a
 *   dangling separator).
 * - Descriptions are concatenated with a single space between them (empty/missing
 *   descriptions are skipped); the result is `undefined` when nothing remains.
 *
 * Order follows the order of `cards` as given.
 */
export function mergeCardText(
  cards: Pick<Card, 'label' | 'description'>[],
): { label: string; description?: string } {
  const label = cards
    .map((c) => c.label.trim())
    .filter(Boolean)
    .join(' & ');
  const description =
    cards
      .map((c) => c.description?.trim())
      .filter(Boolean)
      .join(' ') || undefined;
  return { label, description };
}
