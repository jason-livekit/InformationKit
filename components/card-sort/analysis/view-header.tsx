'use client';

import * as React from 'react';
import { CircleQuestionmarkIcon } from '@/icons/react';
import { TextTooltip } from '@/components/bytes/TextTooltip';

interface ViewHeaderProps {
  title: string;
  description: string;
  help?: string;
  /** Optional controls rendered on the right (e.g. a search box). */
  children?: React.ReactNode;
}

/** Shared header for every analysis view: title + help, plus optional controls. */
export function ViewHeader({ title, description, help, children }: ViewHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-fg0 font-display text-lg">{title}</h2>
            {help && (
              <TextTooltip text={help}>
                <CircleQuestionmarkIcon className="text-fg4 hover:text-fg2 h-3.5 w-3.5 cursor-help" />
              </TextTooltip>
            )}
          </div>
          <p className="text-fg3 max-w-2xl text-sm">{description}</p>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
