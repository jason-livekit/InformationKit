import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadOwnedProject, requireSessionUser } from '@/lib/repo/access';
import { listStudiesByProject } from '@/lib/repo/studies';
import { countSubmissions } from '@/lib/repo/submissions';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon, CirclePlusIcon } from '@/icons/react';
import { ProjectHeader } from './project-header';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireSessionUser();
  const { projectId } = await params;
  let project;
  try {
    project = await loadOwnedProject(projectId, user.id);
  } catch {
    notFound();
  }
  const studies = await listStudiesByProject(project.id);
  const studyRows = await Promise.all(
    studies.map(async (s) => ({
      study: s,
      submissions: await countSubmissions(s.id),
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/" className="text-fg3 hover:text-fg1 inline-flex w-fit items-center gap-1 text-xs">
            <ArrowLeftIcon className="h-3 w-3" /> All projects
          </Link>
          <ProjectHeader project={project} />
        </div>
        <Link href={`/projects/${project.id}/studies/new`}>
          <Button variant="primary" size="sm" leftIcon={<CirclePlusIcon />}>
            New study
          </Button>
        </Link>
      </div>

      {studyRows.length === 0 ? (
        <EmptyStudies projectId={project.id} />
      ) : (
        <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-separator1 text-fg3 font-mono text-[10px] uppercase tracking-wider [&_th]:border-b [&_th]:px-4 [&_th]:py-2.5">
                <th>Study</th>
                <th>Status</th>
                <th>Submissions</th>
                <th>Last updated</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-separator1 divide-y">
              {studyRows.map(({ study, submissions }) => (
                <tr key={study.id} className="hover:bg-bg2 [&_td]:px-4 [&_td]:py-2.5">
                  <td>
                    <Link href={`/studies/${study.id}`} className="text-fg0 font-semibold hover:underline">
                      {study.name}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={study.status} />
                  </td>
                  <td className="text-fg2 tabular-nums">{submissions}</td>
                  <td className="text-fg3 font-mono text-xs">
                    {new Date(study.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/studies/${study.id}`}
                      className="text-fgAccent1 text-xs font-semibold hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'draft' | 'open' | 'closed' }) {
  const variant: 'muted' | 'accent' | 'error' =
    status === 'draft' ? 'muted' : status === 'open' ? 'accent' : 'error';
  return (
    <Badge variant={variant} size="medium">
      {status}
    </Badge>
  );
}

function EmptyStudies({ projectId }: { projectId: string }) {
  return (
    <div className="border-separator1 bg-bg1 flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <h3 className="text-fg0 text-sm font-semibold">No studies yet</h3>
      <p className="text-fg3 max-w-sm text-xs">
        Studies hold one card sort each. Each one runs through Setup, Capture, and Analysis.
      </p>
      <Link href={`/projects/${projectId}/studies/new`}>
        <Button variant="primary" size="sm" leftIcon={<CirclePlusIcon />}>
          Create your first study
        </Button>
      </Link>
    </div>
  );
}
