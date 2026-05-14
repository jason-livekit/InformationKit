import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadOwnedProject, requireSessionUser } from '@/lib/repo/access';
import { createStudy } from '@/lib/repo/studies';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon } from '@/icons/react';

export const dynamic = 'force-dynamic';

export default async function NewStudyPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireSessionUser();
  const { projectId } = await params;
  const project = await loadOwnedProject(projectId, user.id);

  async function createStudyAction(formData: FormData) {
    'use server';
    const u = await requireSessionUser();
    await loadOwnedProject(projectId, u.id);
    const name = String(formData.get('name') ?? '').trim() || 'Untitled card sort';
    const type = String(formData.get('type') ?? 'card-sort');
    if (type !== 'card-sort') return;
    const study = await createStudy({ projectId, name, type: 'card-sort' });
    redirect(`/studies/${study.id}`);
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
          New study
        </Badge>
        <h1 className="font-display text-fg0 text-2xl">Pick a study type</h1>
        <p className="text-fg3 text-sm">
          More study types are coming soon. For now, you can run a card sort.
        </p>
      </div>

      <form action={createStudyAction} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <label className="border-separator1 bg-bg1 hover:bg-bg2 flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors has-[:checked]:border-separatorAccent has-[:checked]:bg-bgAccent1">
            <span className="flex items-center gap-2">
              <input type="radio" name="type" value="card-sort" defaultChecked className="accent-fgAccent1" />
              <span className="text-fg0 text-sm font-semibold">Card sort</span>
            </span>
            <span className="text-fg3 pl-6 text-xs">
              Participants drag cards into groups they create. Best for discovering information
              architecture.
            </span>
          </label>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-fg1 text-sm font-semibold">Study name</span>
          <input
            name="name"
            required
            maxLength={160}
            placeholder="e.g. Settings page IA"
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
            Create study
          </Button>
        </div>
      </form>
    </div>
  );
}
