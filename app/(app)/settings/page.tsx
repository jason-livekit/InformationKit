import Link from 'next/link';
import { aggregate } from '@/lib/card-sort/store';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftXIcon } from '@/icons/react';
import { ResetSection } from './reset-section';
import { ClearDraftSection } from './clear-draft-section';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const results = await aggregate();
  const recent = results.recentSubmissions.slice(0, 8);
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
