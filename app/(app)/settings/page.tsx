import Link from 'next/link';
import { ensureSeed } from '@/lib/repo/seed';
import { isSharedStoreConfigured } from '@/lib/repo/redis';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon, CircleCheckIcon, CircleInfoIcon } from '@/icons/react';
import { ClearDraftSection } from './clear-draft-section';
import { DotFill } from '@/components/card-sort/dot-fill';
import { cn } from '@/lib/bytes/utils';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await ensureSeed();
  const sharedStore = isSharedStoreConfigured();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="muted" size="medium">
              Settings
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">App settings</h1>
          </div>
          <p className="text-fg3 max-w-xl text-sm">
            Per-study controls (reset submissions, capture status, share link) live inside each
            study&apos;s tabs. This page just covers the global storage status and your
            in-browser draft.
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeftIcon />}>
            Back
          </Button>
        </Link>
      </div>

      <Section title="Storage">
        <StorageStatus configured={sharedStore} />
      </Section>

      <Section title="Your draft">
        <ClearDraftSection />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-fg0 font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}

function StorageStatus({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <div className="border-separatorSuccess bg-bgSuccess1 relative flex flex-wrap items-center gap-3 overflow-hidden rounded-lg border p-4">
        <DotFill tone="success" opacity={0.18} spacing={5} />
        <CircleCheckIcon className="text-fgSuccess relative h-4 w-4 shrink-0" />
        <div className="relative flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-fgSuccess text-sm font-semibold">
            Shared store connected (Upstash Redis)
          </span>
          <span className="text-fg2 text-xs">
            Submissions from every participant land in the same Redis list, so the analysis tab
            is the same for everyone with access.
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'border-separatorModerate bg-bgModerate1 relative flex flex-wrap items-start gap-3 overflow-hidden rounded-lg border p-4',
      )}
    >
      <DotFill tone="moderate" opacity={0.2} spacing={5} />
      <CircleInfoIcon className="text-fgModerate relative h-4 w-4 mt-0.5 shrink-0" />
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-fgModerate text-sm font-semibold">
          Shared store not configured
        </span>
        <span className="text-fg2 text-xs">
          Submissions are stored in a per-instance memory list. They&apos;ll work locally and
          inside a single warm Vercel instance, but two users hitting different regions or
          after a cold start won&apos;t see the same results.
        </span>
        <span className="text-fg2 text-xs">
          To enable cross-user sharing, run{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[11px]">
            vercel integration add upstash
          </code>{' '}
          and redeploy.
        </span>
      </div>
    </div>
  );
}
