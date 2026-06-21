import { notFound } from 'next/navigation';
import { loadAccessibleMap, requireSessionUser } from '@/lib/repo/access';
import { MapPreviewClient } from '@/components/map/MapPreviewClient';

export const dynamic = 'force-dynamic';

export default async function MapPreviewPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const user = await requireSessionUser();
  const { mapId } = await params;
  let map;
  try {
    ({ map } = await loadAccessibleMap(mapId, user.id));
  } catch {
    notFound();
  }
  return <MapPreviewClient initial={map} />;
}
