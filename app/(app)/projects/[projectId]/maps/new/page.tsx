import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadProjectAccess, requireSessionUser } from '@/lib/repo/access';
import { createMap } from '@/lib/repo/maps';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon } from '@/icons/react';

export const dynamic = 'force-dynamic';

export default async function NewMapPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireSessionUser();
  const { projectId } = await params;
  const { project } = await loadProjectAccess(projectId, user.id);

  async function createMapAction(formData: FormData) {
    'use server';
    const u = await requireSessionUser();
    await loadProjectAccess(projectId, u.id);
    const name = String(formData.get('name') ?? '').trim() || 'Untitled journey map';
    const map = await createMap({ projectId, name });
    redirect(`/maps/${map.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      <Link
        href={`/projects/${project.id}`}
        className="text-fg3 hover:text-fg1 inline-flex w-fit items-center gap-1 text-xs"
      >
        <ArrowLeftIcon className="h-3 w-3" /> Back to {project.name}
      </Link>
      <div className="flex flex-col gap-1">
        <Badge variant="accent" size="medium">
          New map
        </Badge>
        <h1 className="font-display text-fg0 text-2xl">Create a journey map</h1>
        <p className="text-fg3 text-sm">
          A flexible, zoomable grid for journey maps and service blueprints. Zoom out for the
          big picture, zoom in for the detail.
        </p>
      </div>

      <form action={createMapAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg1 text-sm font-semibold">Map name</span>
          <input
            name="name"
            required
            maxLength={160}
            placeholder="e.g. Onboarding journey"
            className="border-separator1 bg-bg1 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
          />
        </label>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeftIcon />}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="sm" type="submit">
            Create map
          </Button>
        </div>
      </form>
    </div>
  );
}
