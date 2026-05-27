import Link from 'next/link';
import { auth } from '@/auth';
import { ensureSeed, DEMO_STUDY_ID } from '@/lib/repo/seed';
import { getStudy } from '@/lib/repo/studies';
import { listProjectsForUser } from '@/lib/repo/projects';
import { listStudiesByProject } from '@/lib/repo/studies';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { SignInButton } from '@/components/auth/sign-in-button';
import { CirclePlusIcon, ArrowRightIcon } from '@/icons/react';
import { DotFill } from '@/components/card-sort/dot-fill';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await ensureSeed();
  const session = await auth();
  const user = session?.user;
  if (!user) {
    const demo = await getStudy(DEMO_STUDY_ID);
    return <SignedOutLanding demoSlug={demo?.shareSlug ?? null} />;
  }
  const projects = await listProjectsForUser(user.id);
  const projectsWithCounts = await Promise.all(
    projects.map(async (p) => {
      const studies = await listStudiesByProject(p.id);
      return { project: p, studyCount: studies.length, shared: p.ownerId !== user.id };
    }),
  );
  const demo = await getStudy(DEMO_STUDY_ID);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="medium">
              Dashboard
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">Your projects</h1>
          </div>
          <p className="text-fg3 max-w-2xl text-sm">
            A project is a place to collect related studies. Each study runs through Setup,
            Capture, and Analysis.
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary" size="sm" leftIcon={<CirclePlusIcon />}>
            New project
          </Button>
        </Link>
      </div>

      {projectsWithCounts.length === 0 ? (
        <EmptyProjects />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projectsWithCounts.map(({ project, studyCount, shared }) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="border-separator1 bg-bg1 hover:bg-bg2 group flex flex-col gap-2 rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="text-fg0 truncate text-sm font-semibold">{project.name}</h2>
                    {shared && (
                      <Badge variant="muted" size="medium">
                        Shared
                      </Badge>
                    )}
                  </div>
                  <span className="text-fg4 group-hover:text-fg2 shrink-0 text-xs">
                    {studyCount} {studyCount === 1 ? 'study' : 'studies'}
                  </span>
                </div>
                {project.description && (
                  <p className="text-fg3 line-clamp-2 text-xs">{project.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {demo && (
        <div className="border-separator1 bg-bg1 relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-lg border p-4">
          <DotFill tone="accent" opacity={0.12} />
          <div className="relative flex min-w-0 flex-col gap-1">
            <span className="text-fg0 text-sm font-semibold">Demo study · {demo.name}</span>
            <span className="text-fg3 text-xs">
              A read-only example with {demo.cards.length} cards. Open the share link to try it.
            </span>
          </div>
          <Link href={`/share/${demo.shareSlug}`} className="relative">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRightIcon />}>
              Open demo
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyProjects() {
  return (
    <div className="border-separator1 bg-bg1 relative flex min-h-56 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed p-8 text-center">
      <DotFill tone="accent" opacity={0.18} />
      <div className="relative flex flex-col items-center gap-1">
        <h3 className="text-fg0 text-sm font-semibold">No projects yet</h3>
        <p className="text-fg3 max-w-sm text-xs">
          Create a project to group your studies. You can run multiple card sorts inside one
          project.
        </p>
      </div>
      <Link href="/projects/new" className="relative">
        <Button variant="primary" size="sm" leftIcon={<CirclePlusIcon />}>
          New project
        </Button>
      </Link>
    </div>
  );
}

function SignedOutLanding({ demoSlug }: { demoSlug: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <Badge variant="accent" size="medium">
          Information Kit
        </Badge>
        <h1 className="font-display text-fg0 text-4xl">Design better information architecture.</h1>
        <p className="text-fg3 max-w-xl text-sm">
          Card sort with your team. Capture how people actually group things. Use what you learn
          to design clearer navigation, dashboards, and forms.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <SignInButton size="lg">Sign in with email</SignInButton>
        {demoSlug && (
          <Link href={`/share/${demoSlug}`}>
            <Button variant="secondary" size="lg" rightIcon={<ArrowRightIcon />}>
              Try the demo study
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
