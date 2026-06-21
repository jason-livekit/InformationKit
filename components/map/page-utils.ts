import { MapPageSchema, type MapPage } from '@/lib/repo/schemas';
import { makeId } from '@/lib/repo/ids';

/** Client-safe empty page factory (mirrors lib/repo/maps.makeEmptyPage). */
export function makeEmptyPageClient(name: string): MapPage {
  return MapPageSchema.parse({
    id: makeId('mp_'),
    name,
    table: { columnCount: 0, columnWidths: [], headerRows: 0, rows: [] },
  });
}
