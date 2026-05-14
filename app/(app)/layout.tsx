import Link from 'next/link';
import { auth } from '@/auth';
import { ThemeToggleStandalone } from '@/components/custom/theme-toggle-standalone';
import { TooltipProvider } from '@/components/bytes/Tooltip';
import { SignInButton } from '@/components/auth/sign-in-button';
import { UserMenu } from '@/components/auth/user-menu';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;
  return (
    <div className="bg-bg0 text-fg0 flex min-h-svh flex-col">
      <header className="border-b-separator1 bg-bg1 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-6">
        <Link href="/" className="group flex items-center gap-2">
          <svg
            width={26}
            height={26}
            viewBox="0 0 28 28"
            fill="none"
            role="img"
            aria-label="LiveKit logo"
            xmlns="http://www.w3.org/2000/svg"
            className="text-fg0 transition-transform group-hover:scale-105"
          >
            <g className="text-fgAccent1">
              <path d="M16.8005 11.1995H11.1996V16.8003H16.8005V11.1995Z" fill="currentcolor" />
              <path d="M22.4013 5.60083H16.8004V11.2017H22.4013V5.60083Z" fill="currentcolor" />
              <path d="M22.4013 16.8005H16.8004V22.4014H22.4013V16.8005Z" fill="currentcolor" />
              <path d="M28 0H22.3991V5.60087H28V0Z" fill="currentcolor" />
              <path d="M28 22.3992H22.3991V28H28V22.3992Z" fill="currentcolor" />
            </g>
            <path
              d="M5.60088 22.3991V16.8004V11.1996V5.60088V0H0V5.60088V11.1996V16.8004V22.3991V28H5.60088H11.1996H16.8004V22.3991H11.1996H5.60088Z"
              fill="currentcolor"
            />
          </svg>
          <span className="text-fg0 text-sm font-semibold leading-none">Information Kit</span>
          <span className="text-fg4 hidden text-xs font-mono uppercase tracking-wider sm:inline-block">
            · studies
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu name={user.name} email={user.email} image={user.image} />
          ) : (
            <SignInButton variant="secondary">Sign in</SignInButton>
          )}
          <ThemeToggleStandalone />
        </div>
      </header>
      <main className="flex-1">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </main>
    </div>
  );
}
