import type { Card, Standardization, Study, Submission } from '@/lib/repo/schemas';
import { normalizeGroupLabel } from './aggregate';
import { cluster, leafOrder, type DendroNode } from './cluster';
import { getStandardization } from './standardize';

/**
 * Derived, presentation-ready analytics for a card-sort study. This is the
 * single source of truth behind every analysis sub-view (Cards, Categories,
 * Standardization grid, Similarity matrix, Dendrograms) and behind the CSV /
 * Markdown / JSON exports, so the numbers stay consistent everywhere.
 *
 * Vocabulary: participants create *categories* (groups) and drop *cards* into
 * them. A card's *position* is its 1-based index within a category. Two cards'
 * *similarity* is the share of participants who placed them in the same
 * category. Standardization merges differently-named categories that mean the
 * same thing into one canonical category.
 */

// ── Public model ────────────────────────────────────────────────────────────

export interface CardCategoryPlacement {
  /** Stable identity of the category (standardized id or `raw:<label>`). */
  categoryId: string;
  name: string;
  /** Participants who placed this card in this category. */
  frequency: number;
  /** Average 1-based position of the card within this category. */
  avgPosition: number;
  standardized: boolean;
}

export interface CardRow {
  card: Card;
  categories: CardCategoryPlacement[];
  /** Distinct categories this card was sorted into. */
  categoryCount: number;
  /** Participants who sorted this card into any category. */
  frequency: number;
  /** Average position across every placement. */
  avgPosition: number;
}

export interface CategoryCardMember {
  card: Card;
  frequency: number;
  avgPosition: number;
}

export interface CategoryRow {
  /** Standardized category id, or `inst:<submission>:<group>` for a raw row. */
  id: string;
  name: string;
  standardized: boolean;
  /** Normalized labels represented by this row. */
  labels: string[];
  cards: CategoryCardMember[];
  /** Distinct cards in this category. */
  cardCount: number;
  /** Participants who created this category. */
  participantCount: number;
  /** Total card placements (sum of card frequencies). */
  frequency: number;
  /** 0–1 internal consistency, or null when there is too little data. */
  agreement: number | null;
}

export interface GridRow {
  card: Card;
  /** Placements that fall inside a standardized category. */
  standardizedCount: number;
  /** Placements still in raw, un-standardized categories. */
  notStandardizedCount: number;
  /** Participants who sorted this card at all. */
  total: number;
}

export interface SimilarityModel {
  /** Cards in clustered order (matches the best-merge dendrogram). */
  order: Card[];
  /** Lower-triangular-friendly matrix of agreement %, indexed by `order`. */
  matrix: number[][];
}

export interface DendrogramModel {
  actual: DendroNode | null;
  bestMerge: DendroNode | null;
  /** Leaf order used for display (best-merge traversal). */
  order: string[];
}

export interface AnalysisModel {
  study: { id: string; name: string; description: string };
  totalParticipants: number;
  cards: Card[];
  cardRows: CardRow[];
  categoryRows: CategoryRow[];
  grid: GridRow[];
  similarity: SimilarityModel;
  dendrograms: DendrogramModel;
  /** Number of standardized categories currently defined. */
  standardizedCategoryCount: number;
}

// ── Internal helpers ────────────────────────────────────────────────────────

interface RawInstance {
  submissionId: string;
  groupId: string;
  label: string; // normalized
  /** cardId → position (1-based) within this category instance. */
  positions: Map<string, number>;
}

function prettifyLabel(normalized: string): string {
  if (!normalized) return 'Untitled';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/** Build per-instance raw categories and a normalized→display-name map. */
function collectInstances(submissions: Submission[]): {
  instances: RawInstance[];
  display: Map<string, string>;
} {
  const instances: RawInstance[] = [];
  const originalCounts = new Map<string, Map<string, number>>();

  for (const sub of submissions) {
    for (const group of sub.groups) {
      const label = normalizeGroupLabel(group.label) || 'untitled';
      const positions = new Map<string, number>();
      group.cardIds.forEach((cardId, idx) => {
        if (!positions.has(cardId)) positions.set(cardId, idx + 1);
      });
      instances.push({ submissionId: sub.id, groupId: group.id, label, positions });

      const original = group.label.trim() || 'Untitled';
      let counts = originalCounts.get(label);
      if (!counts) {
        counts = new Map();
        originalCounts.set(label, counts);
      }
      counts.set(original, (counts.get(original) ?? 0) + 1);
    }
  }

  const display = new Map<string, string>();
  for (const [label, counts] of originalCounts) {
    let bestName = prettifyLabel(label);
    let bestCount = 0;
    for (const [original, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestName = original;
      }
    }
    display.set(label, bestName);
  }
  return { instances, display };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Main builder ────────────────────────────────────────────────────────────

export function buildAnalysis(
  study: Pick<Study, 'id' | 'name' | 'description' | 'cards'> & {
    standardization?: Standardization;
  },
  submissions: Submission[],
): AnalysisModel {
  const cards = study.cards;
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const totalParticipants = submissions.length;
  const std = getStandardization(study.standardization);

  const { instances, display } = collectInstances(submissions);

  // Map a normalized label → its category identity (standardized or raw-by-name).
  const labelToCategory = new Map<string, { id: string; name: string; standardized: boolean }>();
  for (const cat of std.categories) {
    for (const label of cat.labels) {
      labelToCategory.set(label, { id: cat.id, name: cat.name, standardized: true });
    }
  }
  const identityForLabel = (label: string) => {
    const found = labelToCategory.get(label);
    if (found) return found;
    return { id: `raw:${label}`, name: display.get(label) ?? prettifyLabel(label), standardized: false };
  };

  // ── Cards view: per card, which categories it landed in (by identity) ──
  const cardRows: CardRow[] = cards.map((card) => {
    // identity id → { name, standardized, positions[], submissions:Set }
    const byCat = new Map<
      string,
      { name: string; standardized: boolean; positions: number[]; subs: Set<string> }
    >();
    const allPositions: number[] = [];
    const allSubs = new Set<string>();

    for (const inst of instances) {
      const pos = inst.positions.get(card.id);
      if (pos === undefined) continue;
      const identity = identityForLabel(inst.label);
      let entry = byCat.get(identity.id);
      if (!entry) {
        entry = { name: identity.name, standardized: identity.standardized, positions: [], subs: new Set() };
        byCat.set(identity.id, entry);
      }
      entry.positions.push(pos);
      entry.subs.add(inst.submissionId);
      allPositions.push(pos);
      allSubs.add(inst.submissionId);
    }

    const categories: CardCategoryPlacement[] = [...byCat.entries()]
      .map(([categoryId, e]) => ({
        categoryId,
        name: e.name,
        standardized: e.standardized,
        frequency: e.subs.size,
        avgPosition: round1(avg(e.positions)),
      }))
      .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name));

    return {
      card,
      categories,
      categoryCount: categories.length,
      frequency: allSubs.size,
      avgPosition: round1(avg(allPositions)),
    };
  });

  // ── Categories view: standardized rows + raw per-instance rows ──
  const categoryRows: CategoryRow[] = [];

  const buildCardMembers = (rowInstances: RawInstance[]): {
    cards: CategoryCardMember[];
    participantCount: number;
    frequency: number;
    agreement: number | null;
  } => {
    const perCard = new Map<string, { positions: number[]; subs: Set<string> }>();
    const subs = new Set<string>();
    for (const inst of rowInstances) {
      subs.add(inst.submissionId);
      for (const [cardId, pos] of inst.positions) {
        let e = perCard.get(cardId);
        if (!e) {
          e = { positions: [], subs: new Set() };
          perCard.set(cardId, e);
        }
        e.positions.push(pos);
        e.subs.add(inst.submissionId);
      }
    }
    const memberCards: CategoryCardMember[] = [...perCard.entries()]
      .map(([cardId, e]) => ({
        card: cardById.get(cardId) ?? { id: cardId, label: cardId },
        frequency: e.subs.size,
        avgPosition: round1(avg(e.positions)),
      }))
      .sort((a, b) => b.frequency - a.frequency || a.avgPosition - b.avgPosition);
    const participantCount = subs.size;
    const frequency = memberCards.reduce((sum, c) => sum + c.frequency, 0);
    const topFreq = memberCards[0]?.frequency ?? 0;
    const agreement = participantCount >= 2 ? topFreq / participantCount : null;
    return { cards: memberCards, participantCount, frequency, agreement };
  };

  // Standardized rows
  for (const cat of std.categories) {
    const rowInstances = instances.filter((i) => cat.labels.includes(i.label));
    if (rowInstances.length === 0) continue;
    const built = buildCardMembers(rowInstances);
    categoryRows.push({
      id: cat.id,
      name: cat.name,
      standardized: true,
      labels: cat.labels,
      cards: built.cards,
      cardCount: built.cards.length,
      participantCount: built.participantCount,
      frequency: built.frequency,
      agreement: built.agreement,
    });
  }

  // Raw rows: one per participant category whose label isn't standardized
  for (const inst of instances) {
    if (labelToCategory.has(inst.label)) continue;
    const built = buildCardMembers([inst]);
    categoryRows.push({
      id: `inst:${inst.submissionId}:${inst.groupId}`,
      name: display.get(inst.label) ?? prettifyLabel(inst.label),
      standardized: false,
      labels: [inst.label],
      cards: built.cards,
      cardCount: built.cards.length,
      participantCount: built.participantCount,
      frequency: built.frequency,
      agreement: built.agreement,
    });
  }

  categoryRows.sort(
    (a, b) =>
      Number(b.standardized) - Number(a.standardized) ||
      b.participantCount - a.participantCount ||
      b.cardCount - a.cardCount ||
      a.name.localeCompare(b.name),
  );

  // ── Standardization grid ──
  const grid: GridRow[] = cards.map((card) => {
    let standardizedCount = 0;
    let notStandardizedCount = 0;
    const subs = new Set<string>();
    for (const inst of instances) {
      if (!inst.positions.has(card.id)) continue;
      subs.add(inst.submissionId);
      if (labelToCategory.has(inst.label)) standardizedCount += 1;
      else notStandardizedCount += 1;
    }
    return { card, standardizedCount, notStandardizedCount, total: subs.size };
  });

  // ── Similarity matrix (per-participant co-occurrence in analytical categories) ──
  // Uses the same standardized/raw category identities as the Cards and Categories
  // views so merging labels updates similarity, dendrograms, and exports together.
  const coOccur = new Map<string, Map<string, number>>();
  for (const card of cards) coOccur.set(card.id, new Map());
  for (const sub of submissions) {
    const cardCategory = new Map<string, string>();
    for (const group of sub.groups) {
      const label = normalizeGroupLabel(group.label) || 'untitled';
      const { id: categoryId } = identityForLabel(label);
      for (const cardId of new Set(group.cardIds)) {
        if (!cardById.has(cardId)) continue;
        cardCategory.set(cardId, categoryId);
      }
    }

    const byCategory = new Map<string, string[]>();
    for (const [cardId, categoryId] of cardCategory) {
      const list = byCategory.get(categoryId);
      if (list) list.push(cardId);
      else byCategory.set(categoryId, [cardId]);
    }

    const seenPairs = new Set<string>();
    for (const ids of byCategory.values()) {
      const unique = [...new Set(ids)];
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const a = unique[i]!;
          const b = unique[j]!;
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          if (seenPairs.has(key)) continue;
          seenPairs.add(key);
          coOccur.get(a)!.set(b, (coOccur.get(a)!.get(b) ?? 0) + 1);
          coOccur.get(b)!.set(a, (coOccur.get(b)!.get(a) ?? 0) + 1);
        }
      }
    }
  }
  const similarityPct = (a: string, b: string): number => {
    if (a === b) return 100;
    if (totalParticipants === 0) return 0;
    const c = coOccur.get(a)?.get(b) ?? 0;
    return Math.round((c / totalParticipants) * 100);
  };

  // ── Dendrograms ──
  const cardIds = cards.map((c) => c.id);
  const bestMerge = cluster(cardIds, similarityPct, 'average');
  const actual = cluster(cardIds, similarityPct, 'complete');
  const order = leafOrder(bestMerge);
  const orderedCards = order.map((id) => cardById.get(id)!).filter(Boolean);

  const matrix = orderedCards.map((row) =>
    orderedCards.map((col) => similarityPct(row.id, col.id)),
  );

  return {
    study: { id: study.id, name: study.name, description: study.description },
    totalParticipants,
    cards,
    cardRows,
    categoryRows,
    grid,
    similarity: { order: orderedCards, matrix },
    dendrograms: { actual, bestMerge, order },
    standardizedCategoryCount: std.categories.length,
  };
}
