'use client';

import * as React from 'react';
import { Button } from '@/components/bytes/Button';
import { CircleCheckIcon } from '@/icons/react';
import { DotFill } from '@/components/card-sort/dot-fill';

interface SignInFormProps {
  next: string;
}

interface RequestResponse {
  ok?: boolean;
  emailed?: boolean;
  devLink?: string | null;
  error?: string;
}

export function SignInForm({ next }: SignInFormProps) {
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState<{
    emailed: boolean;
    devLink: string | null;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as RequestResponse;
      if (!res.ok) {
        setError(body.error || 'Could not send sign-in link.');
        return;
      }
      setSent({
        emailed: body.emailed ?? false,
        devLink: body.devLink ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border p-6 text-center">
        <DotFill tone="accent" opacity={0.14} />
        <CircleCheckIcon className="text-fgSuccess relative h-7 w-7" />
        <h2 className="text-fg0 relative text-sm font-semibold">Check your email</h2>
        <p className="text-fg3 relative max-w-sm text-xs">
          {sent.emailed
            ? `We sent a sign-in link to ${email}. It expires in 15 minutes.`
            : `Email delivery is not configured. Check the server console for the sign-in link, or click below if you're in dev.`}
        </p>
        {sent.devLink && (
          <a
            href={`${sent.devLink}&next=${encodeURIComponent(next)}`}
            className="text-fgAccent1 relative break-all text-xs font-semibold hover:underline"
          >
            Open dev sign-in link →
          </a>
        )}
        <button
          type="button"
          onClick={() => setSent(null)}
          className="text-fg3 relative text-xs hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-fg2 text-xs font-semibold uppercase tracking-wider">Email</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border-separator1 bg-bg1 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
        />
      </label>
      <input type="hidden" name="next" value={next} />
      <Button variant="primary" size="lg" type="submit" disabled={submitting || !email}>
        {submitting ? 'Sending…' : 'Send sign-in link'}
      </Button>
      {error && (
        <p className="text-fgSerious1 text-xs">{error}</p>
      )}
    </form>
  );
}
