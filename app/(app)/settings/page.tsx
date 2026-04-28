import Link from 'next/link';
import { aggregate, isSharedStoreConfigured } from '@/lib/card-sort/store';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftXIcon, CircleCheckIcon, CircleInfoIcon } from '@/icons/react';
import { ResetSection } from './reset-section';
import { ClearDraftSection } from './clear-draft-section';
import { DotFill } from '@/components/card-sort/dot-fill';
import { cn } from '@/lib/bytes/utils';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const results = await aggregate();
  const recent = results.recentSubmissions.slice(0, 8);
  const sharedStore = isSharedStoreConfigured();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="muted" size="medium">
              Settings
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">Poll settings</h1>
          </div>
          <p className="text-fg3 max-w-xl text-sm">
            No accounts, no auth, just a poll. Anyone with the link can sort, and the results page is
            a shared dashboard. Use the reset to start over with a fresh poll.
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeftXIcon />}>
            Back to sort
          </Button>
        </Link>
      </div>

      <Section title="Storage">
        <StorageStatus configured={sharedStore} />
      </Section>

      <Section title="Poll status">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Submissions" value={String(results.totalSubmissions)} />
          <Stat label="Group themes" value={String(Object.keys(results.groupNameTotals).length)} />
          <Stat
            label="Most recent"
            value={
              recent[0]
                ? new Date(recent[0].createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—'
            }
          />
        </div>
      </Section>

      <Section title="Recent submissions">
        {recent.length === 0 ? (
          <div className="border-separator1 text-fg3 rounded-md border border-dashed px-4 py-6 text-center text-sm">
            No submissions yet.
          </div>
        ) : (
          <div className="border-separator1 bg-bg1 divide-y divide-separator1 overflow-hidden rounded-lg border">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-fg2 font-mono text-xs">
                  {new Date(s.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-fg3 text-xs">
                  {s.groupCount} groups · {s.notUsefulCount} not useful
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Your draft">
        <ClearDraftSection />
      </Section>

      <Section title="Danger zone" tone="serious">
        <ResetSection />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'serious';
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        className={
          tone === 'serious'
            ? 'text-fgSerious1 font-display text-lg'
            : 'text-fg0 font-display text-lg'
        }
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-separator1 bg-bg1 flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-fg3 font-mono text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-fg0 font-display text-xl tabular-nums">{value}</span>
    </div>
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
            Submissions from every teammate land in the same Redis list, so the results page is the
            same for everyone with the link.
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
          Submissions are stored in a per-instance memory list. They&apos;ll work locally and inside
          a single warm Vercel instance, but two users hitting different regions or after a cold
          start won&apos;t see the same results.
        </span>
        <span className="text-fg2 text-xs">
          To enable cross-user sharing, run{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[11px]">
            vercel integration add upstash
          </code>{' '}
          and redeploy. The Marketplace integration auto-injects{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[11px]">
            UPSTASH_REDIS_REST_URL
          </code>{' '}
          and{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[11px]">
            UPSTASH_REDIS_REST_TOKEN
          </code>
          .
        </span>
      </div>
    </div>
  );
}
