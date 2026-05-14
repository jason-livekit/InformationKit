'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/bytes/utils';

interface StudyTabsProps {
  studyId: string;
  active: 'setup' | 'capture' | 'analysis';
  submissionsCount: number;
}

export function StudyTabs({ studyId, active, submissionsCount }: StudyTabsProps) {
  const pathname = usePathname();
  const base = pathname.startsWith('/studies/') ? pathname : `/studies/${studyId}`;
  return (
    <div className="border-separator1 inline-flex w-full items-stretch border-b">
      {(
        [
          { key: 'setup', label: 'Setup' },
          { key: 'capture', label: 'Capture' },
          { key: 'analysis', label: 'Analysis', meta: submissionsCount > 0 ? String(submissionsCount) : null },
        ] as const
      ).map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={`${base}?tab=${t.key}`}
            className={cn(
              '-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'text-fg0 border-b-fgAccent1'
                : 'text-fg3 hover:text-fg1 border-b-transparent',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {t.label}
            {'meta' in t && t.meta != null && (
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-bgAccent2 text-fgAccent1' : 'bg-bg2 text-fg3',
                )}
              >
                {t.meta}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
