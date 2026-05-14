import { describe, it, expect } from 'vitest';
import { aggregate } from './aggregate';
import type { Card, Submission } from '@/lib/repo/schemas';

const cards: Card[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
];

function sub(id: string, partial: Partial<Submission>): Submission {
  return {
    id,
    studyId: 'study1',
    groups: [],
    unsorted: [],
    notUseful: [],
    createdAt: 1,
    ...partial,
  };
}

describe('aggregate', () => {
  it('returns zeros for an empty submissions list', () => {
    const r = aggregate({ cards, submissions: [] });
    expect(r.totalSubmissions).toBe(0);
    expect(r.notUsefulByCard).toEqual({ a: 0, b: 0, c: 0 });
    expect(r.groupNameTotals).toEqual({});
  });

  it('counts notUseful per card', () => {
    const r = aggregate({
      cards,
      submissions: [
        sub('s1', { notUseful: ['a', 'b'] }),
        sub('s2', { notUseful: ['a'] }),
      ],
    });
    expect(r.notUsefulByCard.a).toBe(2);
    expect(r.notUsefulByCard.b).toBe(1);
    expect(r.notUsefulByCard.c).toBe(0);
  });

  it('normalizes group labels and counts pair affinities', () => {
    const r = aggregate({
      cards,
      submissions: [
        sub('s1', {
          groups: [
            { id: 'g1', label: 'Top Section', cardIds: ['a', 'b'] },
          ],
        }),
        sub('s2', {
          groups: [
            { id: 'g2', label: '  top   section!! ', cardIds: ['a', 'b'] },
          ],
        }),
      ],
    });
    expect(r.groupNameTotals['top section']).toBe(2);
    expect(r.pairCounts.a!.b).toBe(2);
    expect(r.pairCounts.b!.a).toBe(2);
    expect(r.pairCounts.a!.c).toBeUndefined();
  });

  it('produces a sorted recentSubmissions list (newest first)', () => {
    const r = aggregate({
      cards,
      submissions: [
        sub('s1', { createdAt: 10 }),
        sub('s2', { createdAt: 30 }),
        sub('s3', { createdAt: 20 }),
      ],
    });
    expect(r.recentSubmissions.map((s) => s.id)).toEqual(['s2', 's3', 's1']);
  });
});
