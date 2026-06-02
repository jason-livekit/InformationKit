import type { Card, Group } from '@/lib/repo/schemas';

/** Make a value safe to sit inside a single Markdown table cell. */
function escapeCell(text: string): string {
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

/**
 * Render the cards as a GitHub-flavored Markdown table with `Card` and
 * `Description` columns. Always includes the header + divider row, even when
 * there are no cards.
 */
export function cardsToMarkdownTable(cards: Pick<Card, 'label' | 'description'>[]): string {
  const lines = ['| Card | Description |', '| --- | --- |'];
  for (const c of cards) {
    lines.push(`| ${escapeCell(c.label)} | ${escapeCell(c.description ?? '')} |`);
  }
  return lines.join('\n');
}

/** Render the groups as a Markdown unordered list of their labels. */
export function groupsToMarkdownList(groups: Pick<Group, 'label'>[]): string {
  return groups.map((g) => `- ${g.label.replace(/\r?\n/g, ' ').trim()}`).join('\n');
}
