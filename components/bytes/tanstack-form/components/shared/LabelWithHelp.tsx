import * as React from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/bytes/utils';
import { ToggleTip } from '../../../ToggleTip';
import { Label } from '../../../Label';
import { useFieldContext } from '../../hooks/form-context';

export type LabelWithHelpProps = {
  label: ReactNode;
  description?: ReactNode;
  tooltip?: ReactNode;
  className?: string;
  size?: 'small' | 'medium';
};

export function LabelWithHelp(props: LabelWithHelpProps) {
  const field = useFieldContext();
  const size = props.size ?? 'small';
  return (
    <div className="space-y-1">
      <Label
        htmlFor={field.name}
        className={cn(
          'flex items-center gap-1 font-sans',
          size === 'small' ? 'text-xs' : 'text-sm',
          props.className,
        )}
      >
        <div>{props.label}</div>
        {props.tooltip ? <ToggleTip>{props.tooltip}</ToggleTip> : null}
      </Label>
      {props.description && (
        <div
          aria-describedby={field.name}
          className={cn('text-fg2 text-xs text-pretty', size === 'small' ? '' : 'mt-1')}
        >
          {props.description}
        </div>
      )}
    </div>
  );
}
