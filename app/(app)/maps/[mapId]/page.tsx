import { notFound } from 'next/navigation';
import { loadAccessibleMap, requireSessionUser } from '@/lib/repo/access';
import { MapEditor } from '@/components/map/MapEditor';

export const dynamic = 'force-dynamic';

export default async function MapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const user = await requireSessionUser();
  const { mapId } = await params;
  let map, project;
  try {
    ({ map, project } = await loadAccessibleMap(mapId, user.id));
  } catch {
    notFound();
  }
  return <MapEditor initial={map} projectId={project.id} />;
}
