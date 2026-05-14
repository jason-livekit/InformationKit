'use client';

import * as React from 'react';
import type { Study } from '@/lib/repo/schemas';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { Chart5Icon, CopyIcon, Checkmark2SmallIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { DotFill } from '@/components/card-sort/dot-fill';

interface CaptureTabProps {
  study: Study;
  submissionsCount: number;
}

export function CaptureTab({ study, submissionsCount }: CaptureTabProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${study.shareSlug}`
      : `/share/${study.shareSlug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Audience" description="No audience network here — share the link with whoever you want to take the sort.">
        <div className="border-separator1 bg-bg2 flex flex-wrap items-center gap-3 rounded-md border p-3">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="text-fg0 min-w-0 flex-1 bg-transparent font-mono text-sm focus:outline-none"
            aria-label="Share link"
          />
          <Button
            variant="primary"
            size="sm"
            leftIcon={copied ? <Checkmark2SmallIcon /> : <CopyIcon />}
            onClick={copy}
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        {study.status !== 'open' && (
          <div className="border-separatorModerate bg-bgModerate1 relative flex flex-wrap items-center gap-3 overflow-hidden rounded-md border p-3">
            <DotFill tone="moderate" opacity={0.18} spacing={5} />
            <p className="text-fgModerate relative text-sm">
              The study is in <strong className="font-semibold">{study.status}</strong> mode. Open
              it to start accepting submissions.
            </p>
          </div>
        )}
      </Section>

      <Section
        title="Capture so far"
        description="Each participant who submits via the share link adds a row to your Analysis tab."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Submissions" value={String(submissionsCount)} />
          <Stat label="Cards in sort" value={String(study.cards.length)} />
          <Stat
            label="Predefined groups"
            value={String(study.predefinedGroups.length)}
            helper={
              study.predefinedGroups.length === 0
                ? 'Participants will create their own.'
                : undefined
            }
          />
        </div>
        {submissionsCount === 0 && (
          <div className="border-separator1 text-fg3 flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center text-sm">
            <Chart5Icon className="text-fg4 h-5 w-5" />
            <span>
              No submissions yet. Send the share link and they&apos;ll show up under{' '}
              <Badge variant="muted" size="medium">
                Analysis
              </Badge>
              .
            </span>
          </div>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="border-separator1 bg-bg2 flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-fg3 font-mono text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-fg0 font-display text-xl tabular-nums">{value}</span>
      {helper && <span className="text-fg3 text-xs">{helper}</span>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col gap-3')}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-fg0 text-sm font-semibold">{title}</h2>
        {description && <p className="text-fg3 max-w-xl text-xs">{description}</p>}
      </div>
      {children}
    </section>
  );
}
