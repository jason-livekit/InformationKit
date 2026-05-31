import { describe, it, expect } from 'vitest';
import { buildAnalysis } from './analysis';
import { toCSV, toMarkdown, toJSON } from './export';
import type { Card, Submission, Study } from '@/lib/repo/schemas';

const cards: Card[] = [
  { id: 'a', label: 'Agent', description: 'A realtime AI participant in a room.' },
  { id: 'b', label: 'Webhook' },
  { id: 'c', label: 'API key' },
];

const submissions: Submission[] = [
  {
    id: 's1',
    studyId: 'study',
    groups: [
      { id: 'g1', label: 'Eventing', cardIds: ['b', 'a'] },
      { id: 'g2', label: 'Auth', cardIds: ['c'] },
    ],
    unsorted: [],
    notUseful: [],
    createdAt: 1,
  },
];

const study: Pick<Study, 'id' | 'name' | 'description' | 'cards'> = {
  id: 'study',
  name: 'LiveKit terms',
  description: 'How do people group these?',
  cards,
};

const model = buildAnalysis(study, submissions);

describe('export — CSV', () => {
  it('cards CSV has a header and one row per card', () => {
    const csv = toCSV(model, 'cards');
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Card');
    expect(lines).toHaveLength(1 + cards.length);
  });

  it('escapes cells containing commas', () => {
    const m = buildAnalysis(
      { ...study, cards: [{ id: 'x', label: 'A, B and C' }] },
      [{ ...submissions[0]!, groups: [{ id: 'g', label: 'g', cardIds: ['x'] }] }],
    );
    expect(toCSV(m, 'cards')).toContain('"A, B and C"');
  });

  it('similarity CSV is a square matrix with header row + col', () => {
    const lines = toCSV(model, 'similarity').split('\n');
    expect(lines).toHaveLength(1 + cards.length);
    expect(lines[1]!.split(',')).toHaveLength(1 + cards.length);
  });
});

describe('export — Markdown (LLM-primed)', () => {
  it('leads with context and study metadata', () => {
    const md = toMarkdown(model, 'all');
    expect(md).toContain('open card sort');
    expect(md).toContain('LiveKit terms');
    expect(md).toContain('How do people group these?');
    expect(md).toContain("What I'd like help with");
  });

  it('includes every section for the full scope', () => {
    const md = toMarkdown(model, 'all');
    for (const heading of ['## Cards', '## Categories', '## Standardization grid', '## Similarity matrix', '## Dendrograms']) {
      expect(md).toContain(heading);
    }
  });

  it('handles the empty state without throwing', () => {
    const empty = buildAnalysis(study, []);
    expect(toMarkdown(empty, 'all')).toContain('No submissions yet');
  });
});

describe('export — JSON (LLM-primed)', () => {
  it('is valid JSON with a context block', () => {
    const parsed = JSON.parse(toJSON(model, 'all'));
    expect(parsed._context).toBeTruthy();
    expect(parsed.study.name).toBe('LiveKit terms');
    expect(Array.isArray(parsed.cards)).toBe(true);
    expect(parsed.similarityMatrix.matrix).toHaveLength(cards.length);
  });
});
