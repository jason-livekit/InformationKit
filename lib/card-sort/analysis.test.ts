import { describe, it, expect } from 'vitest';
import { buildAnalysis } from './analysis';
import { mergeLabels } from './standardize';
import { leafOrder } from './cluster';
import type { Card, Submission, Study } from '@/lib/repo/schemas';

/**
 * Fixture reverse-engineered from Optimal Workshop's "Organize content into
 * categories" example (2 participants, 5 cards) shown in the analysis
 * screenshots. The expected numbers below are read directly off those screens,
 * so this doubles as a conformance test against a known-good tool.
 *
 * Participant 1: Banking[bank accounts, credit cards, business banking] · Loans[home loans, business loans]
 * Participant 2: Banking[credit cards, bank accounts] · Business[business banking] · Loans[home loans, business loans]
 */
const cards: Card[] = [
  { id: 'bb', label: 'Business banking' },
  { id: 'bl', label: 'Business loans' },
  { id: 'cc', label: 'Credit cards' },
  { id: 'hl', label: 'Home loans' },
  { id: 'ba', label: 'Bank accounts' },
];

const submissions: Submission[] = [
  {
    id: 's1',
    studyId: 'study',
    groups: [
      { id: 'g1', label: 'Banking', cardIds: ['ba', 'cc', 'bb'] },
      { id: 'g2', label: 'Loans', cardIds: ['hl', 'bl'] },
    ],
    unsorted: [],
    notUseful: [],
    createdAt: 1,
  },
  {
    id: 's2',
    studyId: 'study',
    groups: [
      { id: 'g3', label: 'Banking', cardIds: ['cc', 'ba'] },
      { id: 'g4', label: 'Business', cardIds: ['bb'] },
      { id: 'g5', label: 'Loans', cardIds: ['hl', 'bl'] },
    ],
    unsorted: [],
    notUseful: [],
    createdAt: 2,
  },
];

const study: Pick<Study, 'id' | 'name' | 'description' | 'cards'> = {
  id: 'study',
  name: 'Example',
  description: '',
  cards,
};

function cardRow(model: ReturnType<typeof buildAnalysis>, id: string) {
  return model.cardRows.find((r) => r.card.id === id)!;
}

describe('buildAnalysis — Cards view (matches Optimal Workshop)', () => {
  const model = buildAnalysis(study, submissions);

  it('Business banking → Business (1, 1.0) + Banking (1, 3.0)', () => {
    const row = cardRow(model, 'bb');
    expect(row.categoryCount).toBe(2);
    expect(row.frequency).toBe(2);
    const banking = row.categories.find((c) => c.name === 'Banking')!;
    const business = row.categories.find((c) => c.name === 'Business')!;
    expect(banking.frequency).toBe(1);
    expect(banking.avgPosition).toBe(3.0);
    expect(business.frequency).toBe(1);
    expect(business.avgPosition).toBe(1.0);
  });

  it('Business loans → Loans (2, 2.0)', () => {
    const row = cardRow(model, 'bl');
    expect(row.categoryCount).toBe(1);
    expect(row.categories[0]).toMatchObject({ name: 'Loans', frequency: 2, avgPosition: 2.0 });
  });

  it('Credit cards → Banking (2, 1.5)', () => {
    const row = cardRow(model, 'cc');
    expect(row.categories[0]).toMatchObject({ name: 'Banking', frequency: 2, avgPosition: 1.5 });
  });

  it('Home loans → Loans (2, 1.0)', () => {
    const row = cardRow(model, 'hl');
    expect(row.categories[0]).toMatchObject({ name: 'Loans', frequency: 2, avgPosition: 1.0 });
  });

  it('Bank accounts → Banking (2, 1.5)', () => {
    const row = cardRow(model, 'ba');
    expect(row.categories[0]).toMatchObject({ name: 'Banking', frequency: 2, avgPosition: 1.5 });
  });
});

describe('buildAnalysis — Categories view', () => {
  it('shows 5 raw participant categories when unstandardized', () => {
    const model = buildAnalysis(study, submissions);
    expect(model.categoryRows).toHaveLength(5);
    expect(model.categoryRows.every((r) => !r.standardized)).toBe(true);
    const banking3 = model.categoryRows.find((r) => r.name === 'Banking' && r.cardCount === 3)!;
    expect(banking3.participantCount).toBe(1);
  });

  it('merges into one standardized category after standardizing "banking"', () => {
    const std = mergeLabels({ categories: [] }, ['banking'], 'Banking');
    const model = buildAnalysis({ ...study, standardization: std }, submissions);
    const banking = model.categoryRows.find((r) => r.standardized && r.name === 'Banking')!;
    expect(banking).toBeTruthy();
    expect(banking.participantCount).toBe(2);
    expect(banking.cardCount).toBe(3); // bank accounts, credit cards, business banking
    // Two raw Banking rows collapse → 5 - 2 + 1 = 4 rows total
    expect(model.categoryRows).toHaveLength(4);
  });
});

describe('buildAnalysis — Standardization grid', () => {
  it('counts every card as placed by both participants in the not-standardized column', () => {
    const model = buildAnalysis(study, submissions);
    expect(model.grid.columns).toHaveLength(1);
    expect(model.grid.columns[0]!.name).toBe('Not standardized');
    for (const row of model.grid.rows) {
      expect(row.total).toBe(2);
      expect(row.notStandardizedCount).toBe(2);
      expect(row.standardizedCount).toBe(0);
      expect(row.countsByColumn[model.grid.columns[0]!.id]).toBe(2);
    }
  });

  it('moves placements into the standardized column once standardized', () => {
    const std = mergeLabels({ categories: [] }, ['banking'], 'Banking');
    const model = buildAnalysis({ ...study, standardization: std }, submissions);
    const bankingCol = model.grid.columns.find((c) => c.name === 'Banking')!;
    const notStdCol = model.grid.columns.find((c) => !c.standardized)!;

    const ba = model.grid.rows.find((r) => r.card.id === 'ba')!;
    expect(ba.standardizedCount).toBe(2);
    expect(ba.notStandardizedCount).toBe(0);
    expect(ba.countsByColumn[bankingCol.id]).toBe(2);
    expect(ba.countsByColumn[notStdCol.id]).toBe(0);

    const bb = model.grid.rows.find((r) => r.card.id === 'bb')!;
    expect(bb.standardizedCount).toBe(1); // only P1's Banking; P2 used Business
    expect(bb.notStandardizedCount).toBe(1);
    expect(bb.countsByColumn[bankingCol.id]).toBe(1);
    expect(bb.countsByColumn[notStdCol.id]).toBe(1);
  });
});

describe('buildAnalysis — Similarity matrix (matches Optimal Workshop)', () => {
  const model = buildAnalysis(study, submissions);
  const sim = (a: string, b: string) => {
    const i = model.similarity.order.findIndex((c) => c.id === a);
    const j = model.similarity.order.findIndex((c) => c.id === b);
    return model.similarity.matrix[i]![j]!;
  };

  it('Bank accounts ↔ Credit cards = 100', () => expect(sim('ba', 'cc')).toBe(100));
  it('Home loans ↔ Business loans = 100', () => expect(sim('hl', 'bl')).toBe(100));
  it('Bank accounts ↔ Business banking = 50', () => expect(sim('ba', 'bb')).toBe(50));
  it('Credit cards ↔ Business banking = 50', () => expect(sim('cc', 'bb')).toBe(50));
  it('Bank accounts ↔ Home loans = 0', () => expect(sim('ba', 'hl')).toBe(0));

  it('merging Banking + Business raises cross-group banking affinity to 100%', () => {
    const std = mergeLabels({ categories: [] }, ['banking', 'business'], 'Banking');
    const merged = buildAnalysis({ ...study, standardization: std }, submissions);
    const simMerged = (a: string, b: string) => {
      const i = merged.similarity.order.findIndex((c) => c.id === a);
      const j = merged.similarity.order.findIndex((c) => c.id === b);
      return merged.similarity.matrix[i]![j]!;
    };
    expect(simMerged('ba', 'bb')).toBe(100);
    expect(simMerged('cc', 'bb')).toBe(100);
    expect(simMerged('hl', 'bl')).toBe(100);
  });
});

describe('buildAnalysis — Dendrograms', () => {
  const model = buildAnalysis(study, submissions);

  it('clusters the banking trio and the loans pair', () => {
    const order = leafOrder(model.dendrograms.bestMerge);
    const idx = (id: string) => order.indexOf(id);
    // loans pair adjacent
    expect(Math.abs(idx('hl') - idx('bl'))).toBe(1);
    // banking trio contiguous
    const bankingIdx = ['ba', 'cc', 'bb'].map(idx).sort((a, b) => a - b);
    expect(bankingIdx[2]! - bankingIdx[0]!).toBe(2);
  });

  it('merges the 100%-agreement pair at full height', () => {
    // best-merge root height is the top-level agreement; the tightest pairs
    // (ba/cc, hl/bl) must merge at 100.
    function find100Pair(node: typeof model.dendrograms.bestMerge): boolean {
      if (!node || node.kind === 'leaf') return false;
      if (node.height === 100 && node.left.leaves.length === 1 && node.right.leaves.length === 1)
        return true;
      return find100Pair(node.left) || find100Pair(node.right);
    }
    expect(find100Pair(model.dendrograms.bestMerge)).toBe(true);
  });
});
