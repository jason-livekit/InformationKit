import Link from 'next/link';
import { TooltipProvider } from '@/components/bytes/Tooltip';
import { ThemeToggleStandalone } from '@/components/custom/theme-toggle-standalone';
import { Badge } from '@/components/bytes/Badge';

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-bg0 text-fg0 flex min-h-svh flex-col">
      <header className="border-b-separator1 bg-bg1 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Badge variant="warning" size="medium">
            Preview
          </Badge>
          <span className="text-fg3 text-xs">Submissions are not recorded.</span>
        </Link>
        <ThemeToggleStandalone />
      </header>
      <main className="flex-1">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </main>
    </div>
  );
}
