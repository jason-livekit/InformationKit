import { cn } from '@/components/bytes';

interface BrowserChromeProps {
  address?: string;
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
}

export function BrowserChrome({
  address,
  children,
  className,
  bgColor = 'bg-bg2',
}: BrowserChromeProps) {
  return (
    <div className={cn('border-separator1 w-full rounded-lg border', bgColor, className)}>
      <div className="flex min-h-8 w-full items-center justify-between gap-4 rounded-t-lg px-3 py-1">
        <div className="flex shrink-0 space-x-1.5">
          <span className="bg-bg3 size-2.5 rounded-full" />
          <span className="bg-bg3 size-2.5 rounded-full" />
          <span className="bg-bg3 size-2.5 rounded-full" />
        </div>
        <div className="mx-4 min-w-0 flex-1">
          {address ? (
            <div className="bg-bg3 text-fg3 mx-auto w-full truncate rounded-full px-3 py-1 text-center text-xs">
              {address}
            </div>
          ) : null}
        </div>
        <div className="w-5 flex-0 shrink-0"></div>
      </div>
      <div className="border-separator1 mx-[3px] mb-[3px] flex h-full items-center justify-center overflow-hidden rounded-t-md rounded-b-md border">
        {children}
      </div>
    </div>
  );
}
