import { cn } from '@/lib/bytes/utils';

interface SpotlightImageProps {
  className?: string;
  children: React.ReactNode;
}

export function SpotlightImage({ className, children }: SpotlightImageProps) {
  return (
    <div
      className={cn(
        'bg-bg1 relative bg-[url("/images/spotlight-pattern-light.svg")] bg-repeat p-4 md:p-8 dark:bg-[url("/images/spotlight-pattern-dark.svg")]',
        className,
      )}
    >
      {children}
    </div>
  );
}
