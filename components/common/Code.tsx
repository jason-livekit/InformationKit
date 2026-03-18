import { cn } from '@/lib/utils';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';

export interface CodeProps {
  className?: string;
  children: string | string[];
}

export function Code({ className, children }: CodeProps) {
  return (
    <div className="relative">
      <pre
        className={cn(
          'border-separator1 bg-bg2 text-fgAccent1 overflow-x-auto rounded border px-3 py-2 font-mono text-xs',
          className,
        )}
      >
        {children}
        <CopyToClipboard
          className="absolute top-0.5 right-0.5"
          textToCopy={typeof children === 'string' ? children : children.join('')}
        />
      </pre>
    </div>
  );
}
