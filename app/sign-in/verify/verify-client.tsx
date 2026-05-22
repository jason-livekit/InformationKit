'use client';

import * as React from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/bytes/Button';
import { CircleInfoIcon } from '@/icons/react';
import { DotFill } from '@/components/card-sort/dot-fill';

type State = 'idle' | 'pending' | 'error';

interface VerifyClientProps {
  token: string;
  next: string;
}

export function VerifyClient({ token, next }: VerifyClientProps) {
  const [state, setState] = React.useState<State>(token ? 'pending' : 'error');
  const [errorMessage, setErrorMessage] = React.useState<string>(
    token ? '' : 'Missing token. Open the link from your email or request a new one.',
  );
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const res = await signIn('magic-link', {
        token,
        redirect: false,
        callbackUrl: next,
      });
      if (res?.error || !res?.ok) {
        setState('error');
        setErrorMessage(
          'This sign-in link is invalid or expired. Request a new one to try again.',
        );
        return;
      }
      // Manually navigate so the JWT cookie is present on the next request.
      window.location.replace(res.url || next || '/');
    })();
  }, [token, next]);

  if (state === 'pending') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border p-8">
          <DotFill tone="accent" opacity={0.14} />
          <div className="border-separator2 relative h-8 w-8 animate-spin rounded-full border-2 border-t-fgAccent1" />
          <h1 className="font-display text-fg0 relative text-lg">Signing you in…</h1>
          <p className="text-fg3 relative max-w-xs text-xs">
            Verifying your magic link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border p-8">
        <DotFill tone="accent" opacity={0.14} />
        <CircleInfoIcon className="text-fgSerious1 relative h-7 w-7" />
        <h1 className="font-display text-fg0 relative text-lg">Sign-in failed</h1>
        <p className="text-fg3 relative max-w-xs text-xs">{errorMessage}</p>
        <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="relative">
          <Button variant="primary" size="sm">
            Request a new link
          </Button>
        </Link>
      </div>
    </div>
  );
}
