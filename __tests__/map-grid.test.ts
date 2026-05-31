import { describe, it, expect } from 'vitest';
import type { JourneyMap } from '@/lib/repo/schemas';
import {
  MIN_COLUMNS,
  addCard,
  addLane,
  collectDescendants,
  contentRightEdge,
  findCard,
  insertColumns,
  moveCard,
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

describe('resizeCard', () => {
  it('widening pushes following cards right and keeps descendants nested', () => {
    let map = baseMap();
    const parent = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 }); // [0,3)
    map = parent.map;
    const child = addCard(map, { laneId: 'lane_b', startCol: 1, colSpan: 1 }); // inside parent
    map = child.map;
    const sibling = addCard(map, { laneId: 'lane_a', startCol: 4, colSpan: 1 }); // [4,5)
    map = sibling.map;

    map = resizeCard(map, parent.cardId, 5); // grow parent by 2 to the right
    expect(findCard(map, parent.cardId)!.colSpan).toBe(5);
    expect(findCard(map, sibling.cardId)!.startCol).toBe(6); // 4 + 2
    // child stayed where it was and is still parented
    expect(findCard(map, child.cardId)!.startCol).toBe(1);
    expect(findCard(map, child.cardId)!.parentId).toBe(parent.cardId);
  });

  it('narrowing pulls following cards left', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 4 }); // [0,4)
    map = card.map;
    const after = addCard(map, { laneId: 'lane_b', startCol: 5, colSpan: 1 }); // [5,6)
    map = after.map;

    map = resizeCard(map, card.cardId, 2); // shrink by 2
    expect(findCard(map, card.cardId)!.colSpan).toBe(2);
    expect(findCard(map, after.cardId)!.startCol).toBe(3); // 5 - 2
  });

  it('never goes below a width of 1', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 0, colSpan: 3 });
    map = card.map;
    map = resizeCard(map, card.cardId, 0);
    expect(findCard(map, card.cardId)!.colSpan).toBe(1);
  });
});

describe('resizeCardLeft', () => {
  it('grows to the left and shifts earlier-overlapping content', () => {
    let map = baseMap();
    const card = addCard(map, { laneId: 'lane_a', startCol: 4, colSpan: 2 }); // [4,6)
    map = card.map;
    map = resizeCardLeft(map, card.cardId, 2); // move left edge to 2
    const c = findCard(map, card.cardId)!;
    expect(c.startCol).toBe(2);
    expect(c.colSpan).toBe(4); // right edge stays at 6
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
