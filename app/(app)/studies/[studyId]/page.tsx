import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAccessibleStudy, requireSessionUser } from '@/lib/repo/access';
import { listSubmissions, countSubmissions } from '@/lib/repo/submissions';
import { aggregate } from '@/lib/card-sort/aggregate';
import { Badge } from '@/components/bytes/Badge';
import { Button } from '@/components/bytes/Button';
import { ArrowLeftIcon, ArrowUpRightIcon } from '@/icons/react';
import { StudyTabs } from '@/components/study/study-tabs';
import { SetupTab } from '@/components/study/setup-tab';
import { CaptureTab } from '@/components/study/capture-tab';
import { AnalysisTab } from '@/components/study/analysis-tab';
import { StudyStatusSwitcher } from '@/components/study/study-status-switcher';

export const dynamic = 'force-dynamic';

type Tab = 'setup' | 'capture' | 'analysis';
const VALID_TABS: Tab[] = ['setup', 'capture', 'analysis'];

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ studyId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSessionUser();
  const { studyId } = await params;
  const sp = await searchParams;
  const tab: Tab = (VALID_TABS as string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'setup';

  let study, project;
  try {
    ({ study, project } = await loadAccessibleStudy(studyId, user.id));
  } catch {
    notFound();
  }

  const submissionsCount = await countSubmissions(study.id);
  const submissions = tab === 'analysis' ? await listSubmissions(study.id) : [];
  const results = tab === 'analysis' ? aggregate({ cards: study.cards, submissions }) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="text-fg3 hover:text-fg1 inline-flex w-fit items-center gap-1 text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3" /> {project.name}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="medium">
              Card sort
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">{study.name}</h1>
          </div>
          {study.description && (
            <p className="text-fg3 max-w-2xl text-sm">{study.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StudyStatusSwitcher studyId={study.id} initialStatus={study.status} />
          <Link href={`/preview/${study.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" rightIcon={<ArrowUpRightIcon />}>
              Preview
            </Button>
          </Link>
        </div>
      </div>

      <StudyTabs studyId={study.id} active={tab} submissionsCount={submissionsCount} />

      <div className="border-separator1 bg-bg1 rounded-lg border p-5">
        {tab === 'setup' && <SetupTab study={study} />}
        {tab === 'capture' && (
          <CaptureTab study={study} submissionsCount={submissionsCount} />
        )}
        {tab === 'analysis' && results && (
          <AnalysisTab
            study={study}
            results={results}
            submissions={submissions}
            submissionsCount={submissionsCount}
          />
        )}
      </div>
    </div>
  );
}
