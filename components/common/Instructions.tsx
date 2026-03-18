import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InstructionsProps extends React.PropsWithChildren {
  title?: string;
  icon?: ReactNode;
  className?: string;
}

export interface InstructionsStepProps {
  title: string;
  children?: ReactNode;
}

export function Instructions({ title, icon, className, children }: InstructionsProps) {
  return (
    <div className={cn('border-separator1 rounded border p-3', className)}>
      {!(title || icon) ? null : (
        <div className="border-b-separator1 flex items-center gap-2 border-b pb-3">
          {icon}
          <span className="text-fg1 font-semibold">{title}</span>
        </div>
      )}
      <ol className="*:text-initial divide-separator1 text-fg1 list-inside list-decimal divide-y text-sm font-semibold *:font-normal">
        {children}
      </ol>
    </div>
  );
}

export function InstructionsStep({ title, children }: InstructionsStepProps) {
  return (
    <li className="space-y-2 py-3">
      <span className="text-fg1 text-sm font-semibold">{title}</span>
      {children}
    </li>
  );
}
