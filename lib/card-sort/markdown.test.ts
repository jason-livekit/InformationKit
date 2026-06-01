import { describe, it, expect } from 'vitest';
import { cardsToMarkdownTable, groupsToMarkdownList } from './markdown';

describe('cardsToMarkdownTable', () => {
  it('renders a header, divider, and one row per card', () => {
    const md = cardsToMarkdownTable([
      { id: 'a', label: 'Agent', description: 'A realtime AI participant.' },
      { id: 'b', label: 'Webhook' },
    ] as never);
    expect(md).toBe(
      [
        '| Card | Description |',
        '| --- | --- |',
        '| Agent | A realtime AI participant. |',
        '| Webhook |  |',
      ].join('\n'),
    );
  });

  it('escapes pipes and flattens newlines inside cells', () => {
    const md = cardsToMarkdownTable([
      { id: 'a', label: 'A | B', description: 'line one\nline two' },
    ] as never);
    expect(md.split('\n')[2]).toBe('| A \\| B | line one line two |');
  });

  it('still emits the header + divider when there are no cards', () => {
    expect(cardsToMarkdownTable([])).toBe('| Card | Description |\n| --- | --- |');
  });
});

describe('groupsToMarkdownList', () => {
  it('renders one bullet per group label', () => {
    expect(
      groupsToMarkdownList([
        { id: 'g1', label: 'Eventing', cardIds: [] },
        { id: 'g2', label: 'Auth', cardIds: [] },
      ] as never),
    ).toBe('- Eventing\n- Auth');
  });

  it('is empty for no groups', () => {
    expect(groupsToMarkdownList([])).toBe('');
  });
});
