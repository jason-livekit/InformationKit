'use client';

import * as React from 'react';
import { Button } from '@/components/bytes/Button';
import { CircleCheckIcon, CircleInfoIcon } from '@/icons/react';
import { DotFill } from '@/components/card-sort/dot-fill';

interface SignInFormProps {
  next: string;
}

interface RequestResponse {
  ok?: boolean;
  email?: string;
  emailed?: boolean;
  error?: string;
}

interface Sent {
  email: string;
  emailed: boolean;
}

export function SignInForm({ next }: SignInFormProps) {
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState<Sent | null>(null);
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
        body: JSON.stringify({ email, next }),
      });
      const body = (await res.json().catch(() => ({}))) as RequestResponse;
      if (!res.ok) {
        setError(body.error || 'Could not send sign-in link.');
        return;
      }
      setSent({
        email: body.email ?? email,
        emailed: body.emailed ?? false,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    if (sent.emailed) {
      return (
        <ResultCard
          icon={<CircleCheckIcon className="text-fgSuccess relative h-7 w-7" />}
          title="Check your email"
        >
          <p className="text-fg3 relative max-w-sm text-xs">
            We sent a sign-in link to{' '}
            <strong className="text-fg1 font-semibold">{sent.email}</strong>. It expires in
            15 minutes and can only be used once.
          </p>
          <ResetLink onClick={() => setSent(null)} />
        </ResultCard>
      );
    }

    return (
      <ResultCard
        icon={<CircleInfoIcon className="text-fgSerious1 relative h-7 w-7" />}
        title="Couldn't send sign-in link"
      >
        <p className="text-fg3 relative max-w-sm text-xs">
          We weren&apos;t able to email a sign-in link to{' '}
          <strong className="text-fg1 font-semibold">{sent.email}</strong>. Please try again
          in a moment. If this keeps happening, contact the admin. In local dev, the link is
          printed to the server console.
        </p>
        <ResetLink onClick={() => setSent(null)} />
      </ResultCard>
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
      {error && <p className="text-fgSerious1 text-xs">{error}</p>}
    </form>
  );
}

function ResultCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border p-6 text-center">
      <DotFill tone="accent" opacity={0.14} />
      {icon}
      <h2 className="text-fg0 relative text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-fg3 relative text-xs hover:underline"
    >
      Use a different email
    </button>
  );
}
