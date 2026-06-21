import { notFound } from 'next/navigation';
import { ensureSeed } from '@/lib/repo/seed';
import { getMapByShareSlug } from '@/lib/repo/maps';
import { MapViewer } from '@/components/map/MapViewer';

export const dynamic = 'force-dynamic';

export default async function PublicMapPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeed();
  const { slug } = await params;
  const map = await getMapByShareSlug(slug);
  if (!map || !map.published) notFound();
  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-separator1 flex shrink-0 items-center gap-2 border-b px-6 py-2">
        <h1 className="text-fg0 text-sm font-semibold">{map.name}</h1>
        <span className="text-fg4 text-xs">· read-only</span>
      </div>
      <div className="min-h-0 flex-1">
        <MapViewer initial={map} />
      </div>
    </div>
  );
}
