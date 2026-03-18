import React from 'react';

import { cn } from '@/lib/utils';

export type Status = 'success' | 'warning' | 'critical' | 'default' | 'muted';

function TriangleSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="6" viewBox="0 0 7 6" fill="none">
      <path
        fill="currentColor"
        d="M2.30053 0.624999C2.68543 -0.0416674 3.64768 -0.0416659 4.03258 0.625001L6.19764 4.375C6.58254 5.04167 6.10142 5.875 5.33162 5.875H1.00149C0.23169 5.875 -0.249433 5.04167 0.135467 4.375L2.30053 0.624999Z"
      />
    </svg>
  );
}

interface StatusIndicatorProps {
  status: Status;
  message: string;
  className?: string;
}

export function StatusIndicator({ status, message, className }: StatusIndicatorProps) {
  let bgColor;
  let textColor;

  switch (status) {
    case 'success':
      bgColor = 'bg-fgSuccess';
      textColor = 'text-fgSuccess';
      break;
    case 'warning':
      bgColor = 'bg-fgModerate';
      textColor = 'text-fgModerate';
      break;
    case 'critical':
      bgColor = 'bg-fgSerious1';
      textColor = 'text-fgSerious1';
      break;
    case 'muted':
      bgColor = 'bg-fg4';
      textColor = 'text-fg3';
      break;
    default:
      bgColor = 'bg-fg1';
      textColor = 'text-fg1';
      break;
  }

  const icon = ['warning', 'critical'].includes(status) ? (
    <TriangleSvg />
  ) : (
    <span className="relative block size-1.5">
      {status === 'success' && (
        <span
          className={cn(
            'rounded-px absolute top-0 left-0 z-50 block size-1.5 origin-center animate-ping duration-1000',
            bgColor,
          )}
        />
      )}
      <span className={cn('rounded-px block size-1.5 duration-1000', bgColor)} />
    </span>
  );

  return (
    <div className={cn('flex items-center gap-1.5 whitespace-nowrap', textColor, className)}>
      {icon}
      <span className="text-xxs font-mono font-bold tracking-wider uppercase">{message}</span>
    </div>
  );
}
