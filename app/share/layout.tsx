import Link from 'next/link';
import { TooltipProvider } from '@/components/bytes/Tooltip';
import { ThemeToggleStandalone } from '@/components/custom/theme-toggle-standalone';

export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-bg0 text-fg0 flex min-h-svh flex-col">
      <header className="border-b-separator1 bg-bg1 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6">
        <Link href="/" className="group flex items-center gap-2">
          <svg
            width={26}
            height={26}
            viewBox="72 72 240 240"
            fill="none"
            role="img"
            aria-label="LiveKit logo"
            xmlns="http://www.w3.org/2000/svg"
            className="text-fg0 transition-transform group-hover:scale-105"
          >
            <g className="text-fgAccent1">
              <path d="M216.004 167.996H167.996V216.004H216.004V167.996Z" fill="currentcolor" />
              <path d="M264.011 120.008H216.004V168.015H264.011V120.008Z" fill="currentcolor" />
              <path d="M264.011 216.004H216.004V264.011H264.011V216.004Z" fill="currentcolor" />
              <path d="M312 72H263.992V120.007H312V72Z" fill="currentcolor" />
              <path d="M312 263.992H263.992V312H312V263.992Z" fill="currentcolor" />
            </g>
            <path
              d="M120.008 263.992V216.004V167.996V120.008V72H72V120.008V167.996V216.004V263.992V312H120.008V263.992Z"
              fill="currentcolor"
            />
          </svg>
          <span className="text-fg0 text-sm font-semibold leading-none">Information Kit</span>
        </Link>
        <ThemeToggleStandalone />
      </header>
      <main className="flex-1">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </main>
    </div>
  );
}
