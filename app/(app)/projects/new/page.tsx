import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSessionUser } from '@/lib/repo/access';
import { createProject } from '@/lib/repo/projects';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon } from '@/icons/react';

export const dynamic = 'force-dynamic';

async function createProjectAction(formData: FormData) {
  'use server';
  const user = await requireSessionUser();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!name) return;
  const project = await createProject({ ownerId: user.id, name, description });
  redirect(`/projects/${project.id}`);
}

export default async function NewProjectPage() {
  await requireSessionUser();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="medium">
            New project
          </Badge>
        </div>
        <h1 className="font-display text-fg0 text-2xl">Name your project</h1>
        <p className="text-fg3 text-sm">
          A project is a workspace for related studies. You can add as many studies as you like
          to it.
        </p>
      </div>

      <form action={createProjectAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg1 text-sm font-semibold">Name</span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder="e.g. Pricing page IA"
            className="border-separator1 bg-bg1 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg1 text-sm font-semibold">
            Description{' '}
            <span className="text-fg4 font-normal">optional</span>
          </span>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            placeholder="What is this project for?"
            className="border-separator1 bg-bg1 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-center justify-between gap-2 pt-2">
          <Link href="/">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeftIcon />}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="sm" type="submit">
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
}
