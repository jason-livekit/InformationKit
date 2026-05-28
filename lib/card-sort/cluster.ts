/**
 * Agglomerative hierarchical clustering for card-sort dendrograms.
 *
 * Input is a pairwise *agreement* similarity (0–100, the % of participants who
 * put two cards in the same category). We repeatedly merge the two closest
 * clusters; the agreement at which they merge becomes the node's `height`.
 *
 * Two linkage strategies map to Optimal Workshop's two dendrogram methods:
 *  - `complete` ("actual agreement" / skeptical): a cluster merges at the
 *    *weakest* pair across it, so a merge height only stays high when every
 *    member genuinely co-occurs. Only "absolutely factual" relationships climb.
 *  - `average` ("best merge"): merges at the mean pairwise agreement, making
 *    softer assumptions about larger clusters — better with few participants.
 */

export type Linkage = 'average' | 'complete';

export type DendroNode =
  | { kind: 'leaf'; cardId: string; leaves: string[] }
  | {
      kind: 'internal';
      /** Agreement % (0–100) at which the two children merge. */
      height: number;
      left: DendroNode;
      right: DendroNode;
      leaves: string[];
    };

function linkageSimilarity(
  a: string[],
  b: string[],
  sim: (x: string, y: string) => number,
  linkage: Linkage,
): number {
  if (linkage === 'complete') {
    let min = Infinity;
    for (const x of a) for (const y of b) min = Math.min(min, sim(x, y));
    return min === Infinity ? 0 : min;
  }
  let total = 0;
  let n = 0;
  for (const x of a) for (const y of b) {
    total += sim(x, y);
    n += 1;
  }
  return n > 0 ? total / n : 0;
}

/**
 * Build a dendrogram tree over `cardIds`. Returns `null` for an empty input and
 * a bare leaf for a single card. Merge heights decrease monotonically from the
 * root down for both supported linkages, so the tree renders cleanly left→right
 * (100% agreement at the left, 0% at the right).
 */
export function cluster(
  cardIds: string[],
  sim: (a: string, b: string) => number,
  linkage: Linkage,
): DendroNode | null {
  if (cardIds.length === 0) return null;
  let clusters: DendroNode[] = cardIds.map((id) => ({
    kind: 'leaf',
    cardId: id,
    leaves: [id],
  }));
  if (clusters.length === 1) return clusters[0]!;

  while (clusters.length > 1) {
    let best = -Infinity;
    let bi = 0;
    let bj = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = linkageSimilarity(clusters[i]!.leaves, clusters[j]!.leaves, sim, linkage);
        if (s > best) {
          best = s;
          bi = i;
          bj = j;
        }
      }
    }
    const a = clusters[bi]!;
    const b = clusters[bj]!;
    const merged: DendroNode = {
      kind: 'internal',
      height: Math.max(0, Math.min(100, best)),
      left: a,
      right: b,
      leaves: [...a.leaves, ...b.leaves],
    };
    clusters = clusters.filter((_, idx) => idx !== bi && idx !== bj);
    clusters.push(merged);
  }
  return clusters[0]!;
}

/** Left-to-right leaf order from an in-order traversal of the tree. */
export function leafOrder(node: DendroNode | null): string[] {
  if (!node) return [];
  if (node.kind === 'leaf') return [node.cardId];
  return [...leafOrder(node.left), ...leafOrder(node.right)];
}

/** Largest merge height (root agreement) — useful for axis scaling. */
export function maxHeight(node: DendroNode | null): number {
  if (!node || node.kind === 'leaf') return 0;
  return Math.max(node.height, maxHeight(node.left), maxHeight(node.right));
}
