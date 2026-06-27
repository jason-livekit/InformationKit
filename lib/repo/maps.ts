import { getKV } from './redis';
import {
  MapSchema,
  type JourneyMap,
  type Swimlane,
  type MapCard,
} from './schemas';
import { makeId } from './ids';

const mapKey = (id: string) => `map:${id}`;
const mapsByProjectKey = (projectId: string) => `project:${projectId}:maps`;

/** Lanes a brand-new map starts with. Row 0 is the coarsest level (visible when
 *  fully zoomed out); deeper rows reveal as you zoom in. */
const DEFAULT_SWIMLANES: { name: string }[] = [
  { name: 'Phases' },
  { name: 'Steps' },
  { name: 'Details' },
];

const DEFAULT_COLUMN_COUNT = 12;

export interface CreateMapInput {
  projectId: string;
  name: string;
  description?: string;
  swimlanes?: Swimlane[];
  cards?: MapCard[];
  columnCount?: number;
}

export async function createMap(input: CreateMapInput): Promise<JourneyMap> {
  const kv = getKV();
  const now = Date.now();
  const swimlanes: Swimlane[] =
    input.swimlanes ??
    DEFAULT_SWIMLANES.map((l) => ({ id: makeId('lane_'), name: l.name }));
  const map: JourneyMap = MapSchema.parse({
    id: makeId('map_'),
    projectId: input.projectId,
    name: input.name,
    description: input.description ?? '',
    swimlanes,
    cards: input.cards ?? [],
    columnCount: input.columnCount ?? DEFAULT_COLUMN_COUNT,
    createdAt: now,
    updatedAt: now,
  });
  await kv.jsonSet(mapKey(map.id), map);
  await kv.listPush(mapsByProjectKey(map.projectId), map.id);
  return map;
}

export async function getMap(id: string): Promise<JourneyMap | null> {
  return getKV().jsonGet<JourneyMap>(mapKey(id));
}

export async function listMapsByProject(projectId: string): Promise<JourneyMap[]> {
  const kv = getKV();
  const ids = await kv.listRange(mapsByProjectKey(projectId), 0, -1);
  const maps = await Promise.all(ids.map((id) => kv.jsonGet<JourneyMap>(mapKey(id))));
  return maps.filter((m): m is JourneyMap => m !== null);
}

export interface UpdateMapInput {
  name?: string;
  description?: string;
  swimlanes?: Swimlane[];
  cards?: MapCard[];
  columnCount?: number;
}

export async function updateMap(
  id: string,
  patch: UpdateMapInput,
): Promise<JourneyMap | null> {
  const kv = getKV();
  const existing = await kv.jsonGet<JourneyMap>(mapKey(id));
  if (!existing) return null;
  const updated: JourneyMap = MapSchema.parse({
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  });
  await kv.jsonSet(mapKey(id), updated);
  return updated;
}

export async function deleteMap(id: string): Promise<void> {
  const kv = getKV();
  const existing = await kv.jsonGet<JourneyMap>(mapKey(id));
  if (!existing) return;
  await kv.del(mapKey(id));
  // Rebuild the project's map list without this id.
  const list = await kv.listRange(mapsByProjectKey(existing.projectId), 0, -1);
  await kv.del(mapsByProjectKey(existing.projectId));
  for (const mid of list) {
    if (mid !== id) await kv.listPush(mapsByProjectKey(existing.projectId), mid);
  }
}
