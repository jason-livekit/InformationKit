import { describe, it, expect } from 'vitest';
import type { JourneyMap } from '@/lib/repo/schemas';
import {
  MIN_COLUMNS,
  addCard,
  addLane,
  collectDescendants,
  contentRightEdge,
  findCard,
  insertCardAt,
  insertColumns,
  moveCard,
  moveLane,
  normalize,
  removeCard,
  removeColumns,
  removeLane,
  renameLane,
  resizeCard,
  resizeCardLeft,
  updateCard,
} from '@/components/map/grid';

function baseMap(): JourneyMap {
  return {
    id: 'map_1',
    projectId: 'p_1',
    name: 'Test',
    description: '',
    swimlanes: [
      { id: 'lane_a', name: 'Phases' },
      { id: 'lane_b', name: 'Steps' },
      { id: 'lane_c', name: 'Details' },
    ],
    cards: [],
    columnCount: MIN_COLUMNS,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('addCard', () => {
  it('adds a card and reports its id', () => {
    const { map, cardId } = addCard(baseMap(), { laneId: 'lane_a', startCol: 2, colSpan: 3 });
    const card = findCard(map, cardId)!;
    expect(card.startCol).toBe(2);
    expect(card.colSpan).toBe(3);
    expect(card.level).toBe(0); // lane index 0
  });

  it('clamps colSpan to a minimum of 1', () => {
    const { map, cardId } = addCard(baseMap(), { laneId: 'lane_a', startCol: 0, colSpan: 0 });
    expect(findCard(map, cardId)!.colSpan).toBe(1);
  });

  it('seeds a data card with a series and one point per column', () => {
    const { map, cardId } = addCard(baseMap(), {
      laneId: 'lane_a',
      startCol: 0,
      colSpan: 4,
      kind: 'data',
    });
    const card = findCard(map, cardId)!;
    expect(card.kind).toBe('data');
    expect(card.series).toHaveLength(1);
    expect(card.points).toHaveLength(4);
    expect(card.points![0].col).toBe(0);
  });
});

describe('level + parent derivation (normalize)', () => {
  it('sets level from lane index', () => {
    let map = baseMap();
    map = addCard(map, { laneId: 'lane_b', startCol: 0, colSpan: 1 }).map;
    map = addCard(map, { laneId: 'lane_c', startCol: 0, colSpan: 1 }).map;
    expect(map.cards.find((c) => c.laneId === 'lane_b')!.level).toBe(1);
    expect(map.cards.find((c) => c.laneId === 'lane_c')!.level).toBe(2);
  });

  it('parents a card to the containing card in the lane above', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 6 });
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 2, colSpan: 1 });
    map = child.map;
    expect(findCard(map, child.cardId)!.parentId).toBe(parent.cardId);
  });

  it('leaves a card unparented when nothing above contains it', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 });
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 5, colSpan: 1 });
    map = child.map;
    expect(findCard(map, child.cardId)!.parentId).toBeNull();
  });

  it('prefers the tightest container when several overlap', () => {
    let map = baseMap();
    // lane_a is index 0; put two overlapping cards there.
    const wide = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 10 });
    map = wide.map;
    // Add another lane_a card is impossible to be parent (same lane). Use 3 lanes:
    // wide in lane_a, tight in lane_b, child in lane_c → child parents to tight.
    const tight = addCard(map, { laneId: 'lane_b', startCol: 2, colSpan: 2 });
    map = tight.map;
    const child = addCard(map, { laneId: 'lane_c', startCol: 2, colSpan: 1 });
    map = child.map;
    expect(findCard(map, child.cardId)!.parentId).toBe(tight.cardId);
  });
});

describe('insertColumns / removeColumns', () => {
  it('shifts later cards right and grows spanning cards on insert', () => {
    let map = baseMap();
    const spanning = addCard(map, { laneId: 'lane_a', startCol: 1, colSpan: 4 }); // [1,5)
    map = spanning.map;
    const after = addCard(map, { laneId: 'lane_b', startCol: 6, colSpan: 2 }); // [6,8)
    map = after.map;

    map = insertColumns(map, 3, 2); // insert at col 3
    expect(findCard(map, spanning.cardId)!.colSpan).toBe(6); // spanned col 3 → grew
    expect(findCard(map, after.cardId)!.startCol).toBe(8); // 6 + 2
  });

  it('pulls later cards left and shrinks spanning cards on remove', () => {
    let map = baseMap();
    const spanning = addCard(map, { laneId: 'lane_a', startCol: 1, colSpan: 5 }); // [1,6)
    map = spanning.map;
    const after = addCard(map, { laneId: 'lane_b', startCol: 8, colSpan: 1 }); // [8,9)
    map = after.map;

    map = removeColumns(map, 3, 2); // remove cols [3,5)
    expect(findCard(map, spanning.cardId)!.colSpan).toBe(3); // 5 - 2 removed
    expect(findCard(map, after.cardId)!.startCol).toBe(6); // 8 - 2
  });
});

describe('resizeCard (ripple + containment)', () => {
  it('widening pushes later same-lane siblings right by the delta', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 }); // [0,3)
    map = card.map;
    const sibling = addCard(map, { laneId: 'lane_a', startCol: 6, colSpan: 1 }); // [6,7)
    map = sibling.map;

    map = resizeCard(map, card.cardId, 5); // grow by +2 → [0,5)
    expect(findCard(map, card.cardId)!.colSpan).toBe(5);
    expect(findCard(map, sibling.cardId)!.startCol).toBe(8); // pushed by +2
  });

  it('widening pushes an adjacent sibling to make room', () => {
    let map = baseMap();
    const a = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = a.map;
    const b = addCard(map, { laneId: 'lane_a', startCol: 2, colSpan: 1 }); // [2,3) adjacent
    map = b.map;

    map = resizeCard(map, a.cardId, 4); // grow by +2
    expect(findCard(map, a.cardId)!.colSpan).toBe(4); // [0,4)
    expect(findCard(map, b.cardId)!.startCol).toBe(4); // pushed right to stay adjacent
  });

  it('narrowing pulls following cards left by the delta', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 4 }); // [0,4)
    map = card.map;
    const after = addCard(map, { laneId: 'lane_a', startCol: 5, colSpan: 1 }); // [5,6)
    map = after.map;

    map = resizeCard(map, card.cardId, 2); // shrink by -2
    expect(findCard(map, card.cardId)!.colSpan).toBe(2);
    expect(findCard(map, after.cardId)!.startCol).toBe(3); // pulled in by -2
  });

  it('leaves cards in other lanes untouched when rippling', () => {
    let map = baseMap();
    const a = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = a.map;
    const other = addCard(map, { laneId: 'lane_b', startCol: 6, colSpan: 1 }); // other lane
    map = other.map;

    map = resizeCard(map, a.cardId, 4);
    expect(findCard(map, other.cardId)!.startCol).toBe(6); // unaffected
  });

  it('never goes below a width of 1', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 });
    map = card.map;
    map = resizeCard(map, card.cardId, 0);
    expect(findCard(map, card.cardId)!.colSpan).toBe(1);
  });

  it('grows the parent when a child is stretched beyond its bounds', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 }); // [0,3)
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 1, colSpan: 1 }); // inside
    map = child.map;

    map = resizeCard(map, child.cardId, 5); // child → [1,6), beyond parent's right edge
    expect(findCard(map, child.cardId)!.colSpan).toBe(5);
    expect(findCard(map, child.cardId)!.parentId).toBe(parent.cardId);
    // Parent stretched to contain the child: [0,6).
    expect(findCard(map, parent.cardId)!.startCol).toBe(0);
    expect(findCard(map, parent.cardId)!.colSpan).toBe(6);
  });
});

describe('resizeCardLeft (free placement)', () => {
  it('grows the left edge when there is room', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 4, colSpan: 2 }); // [4,6)
    map = card.map;
    map = resizeCardLeft(map, card.cardId, 2); // move left edge to 2
    const c = findCard(map, card.cardId)!;
    expect(c.startCol).toBe(2);
    expect(c.colSpan).toBe(4); // right edge stays at 6
  });

  it('clamps so it cannot overlap the previous sibling', () => {
    let map = baseMap();
    const prev = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = prev.map;
    const card = addCard(map, { laneId: 'lane_a', startCol: 4, colSpan: 2 }); // [4,6)
    map = card.map;
    map = resizeCardLeft(map, card.cardId, 0); // would overlap prev → clamp to 2
    const c = findCard(map, card.cardId)!;
    expect(c.startCol).toBe(2);
    expect(c.colSpan).toBe(4); // right edge stays at 6
  });

  it('widens past the origin by opening columns and shifting the rest right', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = card.map;
    const other = addCard(map, { laneId: 'lane_b', startCol: 0, colSpan: 1 }); // [0,1)
    map = other.map;

    map = resizeCardLeft(map, card.cardId, -3); // pull left edge 3 past the origin
    const c = findCard(map, card.cardId)!;
    expect(c.startCol).toBe(0);
    expect(c.colSpan).toBe(5); // grew left by 3 (right edge 2 → 5 after shift)
    expect(findCard(map, other.cardId)!.startCol).toBe(3); // everything shifted right by 3
  });
});

describe('moveCard', () => {
  it('moves a card and drags its descendants by the same delta', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 });
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 1, colSpan: 1 });
    map = child.map;

    map = moveCard(map, parent.cardId, 'lane_a', 5); // delta +5
    expect(findCard(map, parent.cardId)!.startCol).toBe(5);
    expect(findCard(map, child.cardId)!.startCol).toBe(6); // 1 + 5
  });

  it('clamps the group so nothing goes before column 0', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 3, colSpan: 2 });
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 3, colSpan: 1 });
    map = child.map;

    map = moveCard(map, parent.cardId, 'lane_a', -5); // would go negative
    expect(findCard(map, parent.cardId)!.startCol).toBe(0);
    expect(findCard(map, child.cardId)!.startCol).toBe(0);
  });

  it('changes the lane of the moved card only', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 });
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 1, colSpan: 1 });
    map = child.map;

    map = moveCard(map, parent.cardId, 'lane_a', 0); // no-op position, ensure lane stable
    expect(findCard(map, child.cardId)!.laneId).toBe('lane_b');
  });
});

describe('collectDescendants', () => {
  it('returns transitive children', () => {
    let map = baseMap();
    const a = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 6 });
    map = a.map;
    const b = addCard(map, { laneId: 'lane_b', startCol: 0, colSpan: 4 });
    map = b.map;
    const c = addCard(map, { laneId: 'lane_c', startCol: 1, colSpan: 1 });
    map = c.map;
    const desc = collectDescendants(map, a.cardId).map((x) => x.id);
    expect(desc).toContain(b.cardId);
    expect(desc).toContain(c.cardId);
  });
});

describe('lanes', () => {
  it('addLane bumps levels of cards below it when inserted above', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_b', startCol: 0, colSpan: 1 });
    map = card.map;
    expect(findCard(map, card.cardId)!.level).toBe(1);
    map = addLane(map, 'New top', 0); // insert at index 0
    expect(findCard(map, card.cardId)!.level).toBe(2);
  });

  it('renameLane updates the name', () => {
    const map = renameLane(baseMap(), 'lane_a', 'Customer actions');
    expect(map.swimlanes[0].name).toBe('Customer actions');
  });

  it('removeLane deletes the lane and its cards', () => {
    let map = baseMap();
    map = addCard(map, { laneId: 'lane_b', startCol: 0, colSpan: 1 }).map;
    map = removeLane(map, 'lane_b');
    expect(map.swimlanes.find((l) => l.id === 'lane_b')).toBeUndefined();
    expect(map.cards.some((c) => c.laneId === 'lane_b')).toBe(false);
  });

  it('moveLane reorders lanes and recomputes card levels', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_c', startCol: 0, colSpan: 1 }); // index 2
    map = card.map;
    expect(findCard(map, card.cardId)!.level).toBe(2);
    map = moveLane(map, 2, 0); // lane_c → top
    expect(map.swimlanes[0].id).toBe('lane_c');
    expect(findCard(map, card.cardId)!.level).toBe(0);
  });
});

describe('insertCardAt', () => {
  it('drops a card into an empty gap without shifting anything', () => {
    let map = baseMap();
    const a = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = a.map;
    const b = addCard(map, { laneId: 'lane_a', startCol: 5, colSpan: 1 }); // [5,6)
    map = b.map;
    const ins = insertCardAt(map, 'lane_a', 3); // gap at col 3
    map = ins.map;
    expect(findCard(map, ins.cardId)!.startCol).toBe(3);
    expect(findCard(map, b.cardId)!.startCol).toBe(5); // unchanged
  });

  it('opens a new column when inserting between adjacent cards', () => {
    let map = baseMap();
    const a = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 2 }); // [0,2)
    map = a.map;
    const b = addCard(map, { laneId: 'lane_a', startCol: 2, colSpan: 1 }); // [2,3) adjacent
    map = b.map;
    const ins = insertCardAt(map, 'lane_a', 2); // between a and b
    map = ins.map;
    expect(findCard(map, ins.cardId)!.startCol).toBe(2);
    expect(findCard(map, b.cardId)!.startCol).toBe(3); // pushed right to make room
    expect(findCard(map, a.cardId)!.startCol).toBe(0); // unchanged
  });
});

describe('columnCount + sizing', () => {
  it('tracks the rightmost card edge with a minimum floor', () => {
    let map = baseMap();
    expect(map.columnCount).toBe(MIN_COLUMNS);
    map = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 20 }).map;
    expect(map.columnCount).toBe(20);
    expect(contentRightEdge(map.cards)).toBe(20);
  });

  it('shrinks back toward the floor when the widest card is removed', () => {
    let map = baseMap();
    const wide = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 20 });
    map = wide.map;
    map = removeCard(map, wide.cardId);
    expect(map.columnCount).toBe(MIN_COLUMNS);
  });
});

describe('data card points', () => {
  it('stores points as offsets within the card', () => {
    const { map, cardId } = addCard(baseMap(), {
      laneId: 'lane_a',
      startCol: 5,
      colSpan: 3,
      kind: 'data',
    });
    const cols = findCard(map, cardId)!.points!.map((p) => p.col);
    expect(cols).toEqual([0, 1, 2]);
  });

  it('adds points when a data card is widened', () => {
    let map = baseMap();
    const { map: m, cardId } = addCard(map, {
      laneId: 'lane_a',
      startCol: 0,
      colSpan: 2,
      kind: 'data',
    });
    map = m;
    expect(findCard(map, cardId)!.points).toHaveLength(2);
    map = resizeCard(map, cardId, 5);
    const card = findCard(map, cardId)!;
    expect(card.colSpan).toBe(5);
    expect(card.points).toHaveLength(5);
    expect(card.points!.map((p) => p.col)).toEqual([0, 1, 2, 3, 4]);
  });

  it('drops trailing points when a data card is narrowed and preserves earlier values', () => {
    let map = baseMap();
    const seriesId = 's_keep';
    map.cards.push({
      id: 'mc_data',
      kind: 'data',
      laneId: 'lane_a',
      startCol: 0,
      colSpan: 4,
      level: 0,
      parentId: null,
      title: '',
      color: 'blue',
      viz: 'line',
      series: [{ id: seriesId, label: 'S', color: 'blue' }],
      points: [
        { col: 0, values: { [seriesId]: 10 } },
        { col: 1, values: { [seriesId]: 20 } },
        { col: 2, values: { [seriesId]: 30 } },
        { col: 3, values: { [seriesId]: 40 } },
      ],
    });
    map = normalize(map);
    map = resizeCard(map, 'mc_data', 2);
    const card = findCard(map, 'mc_data')!;
    expect(card.points).toHaveLength(2);
    expect(card.points!.map((p) => p.values[seriesId])).toEqual([10, 20]);
  });
});

describe('updateCard', () => {
  it('merges a patch and preserves the id', () => {
    let map = baseMap();
    const { map: m, cardId } = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 1 });
    map = updateCard(m, cardId, { title: 'Hello', color: 'purple' });
    const card = findCard(map, cardId)!;
    expect(card.title).toBe('Hello');
    expect(card.color).toBe('purple');
    expect(card.id).toBe(cardId);
  });
});
