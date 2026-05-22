import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SignInForm } from './sign-in-form';
import { Badge } from '@/components/bytes/Badge';

export const dynamic = 'force-dynamic';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    redirect(sp.next || '/');
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="accent" size="medium">
          Sign in
        </Badge>
        <h1 className="font-display text-fg0 text-2xl">Sign in to Information Kit</h1>
        <p className="text-fg3 max-w-sm text-sm">
          Enter your email and we&apos;ll send you a one-time sign-in link. No password required.
        </p>
      </div>
      <SignInForm next={sp.next ?? '/'} />
    </div>
  );
}
