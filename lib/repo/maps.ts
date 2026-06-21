import { getKV } from './redis';
import { MapDocSchema, MapPageSchema, type MapDoc, type MapPage } from './schemas';
import { makeId, makeSlug } from './ids';

const mapKey = (id: string) => `map:${id}`;
const mapsByProjectKey = (projectId: string) => `project:${projectId}:maps`;
const mapByShareSlugKey = (slug: string) => `map:byShareSlug:${slug}`;

/** A fresh, empty page with a blank table. */
export function makeEmptyPage(name: string): MapPage {
  return MapPageSchema.parse({
    id: makeId('mp_'),
    name,
    table: {
      columnCount: 0,
      columnWidths: [],
      headerRows: 0,
      rows: [],
    },
  });
}

export interface CreateMapInput {
  projectId: string;
  name: string;
  pages?: MapPage[];
  shareSlug?: string;
  published?: boolean;
}

export async function createMap(input: CreateMapInput): Promise<MapDoc> {
  const kv = getKV();
  const now = Date.now();
  const shareSlug = input.shareSlug ?? (await uniqueSlug());
  const map: MapDoc = MapDocSchema.parse({
    id: makeId('mapdoc_'),
    projectId: input.projectId,
    name: input.name,
    shareSlug,
    published: input.published ?? false,
    pages: input.pages ?? [makeEmptyPage('Page 1')],
    createdAt: now,
    updatedAt: now,
  });
  await kv.jsonSet(mapKey(map.id), map);
  await kv.listPush(mapsByProjectKey(map.projectId), map.id);
  await kv.setString(mapByShareSlugKey(map.shareSlug), map.id);
  return map;
}

async function uniqueSlug(): Promise<string> {
  const kv = getKV();
  for (let i = 0; i < 8; i++) {
    const candidate = makeSlug(2);
    if (!(await kv.getString(mapByShareSlugKey(candidate)))) return candidate;
  }
  return makeSlug(3);
}

export async function getMap(id: string): Promise<MapDoc | null> {
  return getKV().jsonGet<MapDoc>(mapKey(id));
}

export async function getMapByShareSlug(slug: string): Promise<MapDoc | null> {
  const kv = getKV();
  const id = await kv.getString(mapByShareSlugKey(slug));
  if (!id) return null;
  return kv.jsonGet<MapDoc>(mapKey(id));
}

export async function listMapsByProject(projectId: string): Promise<MapDoc[]> {
  const kv = getKV();
  const ids = await kv.listRange(mapsByProjectKey(projectId), 0, -1);
  const maps = await Promise.all(ids.map((id) => kv.jsonGet<MapDoc>(mapKey(id))));
  return maps.filter((m): m is MapDoc => m !== null);
}

export interface UpdateMapInput {
  name?: string;
  published?: boolean;
  pages?: MapPage[];
}

export async function updateMap(id: string, patch: UpdateMapInput): Promise<MapDoc | null> {
  const kv = getKV();
  const existing = await kv.jsonGet<MapDoc>(mapKey(id));
  if (!existing) return null;
  const updated: MapDoc = MapDocSchema.parse({
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  });
  await kv.jsonSet(mapKey(id), updated);
  return updated;
}

export async function deleteMap(id: string): Promise<void> {
  const kv = getKV();
  const existing = await kv.jsonGet<MapDoc>(mapKey(id));
  if (!existing) return;
  await kv.del(mapKey(id));
  await kv.del(mapByShareSlugKey(existing.shareSlug));
  const list = await kv.listRange(mapsByProjectKey(existing.projectId), 0, -1);
  await kv.del(mapsByProjectKey(existing.projectId));
  for (const mid of list) {
    if (mid !== id) await kv.listPush(mapsByProjectKey(existing.projectId), mid);
  }
}
