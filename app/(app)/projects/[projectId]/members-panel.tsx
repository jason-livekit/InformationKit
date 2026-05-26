'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { CopyToClipboard } from '@/components/bytes/CopyToClipboard';
import { PeopleAddIcon, TrashCanIcon } from '@/icons/react';

export interface MemberRow {
  userId: string;
  email: string | null;
  name: string | null;
  role: 'owner' | 'member';
}

export interface InviteRow {
  token: string;
  email: string;
}

interface MembersPanelProps {
  projectId: string;
  role: 'owner' | 'member';
  owner: { userId: string; email: string; name: string } | null;
  members: MemberRow[];
  invites: InviteRow[];
}

export function MembersPanel({ projectId, role, owner, members, invites }: MembersPanelProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pendingLink, setPendingLink] = React.useState<string | null>(null);

  const isOwner = role === 'owner';

  const ownerRow: MemberRow | null = owner
    ? { userId: owner.userId, email: owner.email, name: owner.name, role: 'owner' }
    : null;
  const rows = [ownerRow, ...members].filter((r): r is MemberRow => r !== null);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !email) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setPendingLink(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        added?: boolean;
        invited?: boolean;
        emailed?: boolean;
        fallbackLink?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(body.error || 'Could not send the invite.');
        return;
      }
      if (body.added) {
        setNotice(`${email} already has an account and now has access.`);
      } else if (body.invited && body.emailed) {
        setNotice(`Invite emailed to ${email}.`);
      } else if (body.invited) {
        setNotice(`No account yet for ${email}. Share this invite link with them:`);
        setPendingLink(body.fallbackLink ?? null);
      }
      setEmail('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Could not remove that member.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(token: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites/${token}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Could not revoke that invite.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-separator1 bg-bg1 flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-center gap-2">
        <PeopleAddIcon className="text-fg3 h-4 w-4" />
        <h2 className="text-fg0 text-sm font-semibold">Members</h2>
      </div>

      <ul className="divide-separator1 divide-y">
        {rows.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-fg1 truncate text-sm">{m.name || m.email || m.userId}</span>
              {m.email && m.name && (
                <span className="text-fg4 truncate text-xs">{m.email}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={m.role === 'owner' ? 'accent' : 'muted'} size="medium">
                {m.role}
              </Badge>
              {isOwner && m.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(m.userId)}
                  disabled={busy}
                  leftIcon={<TrashCanIcon />}
                  aria-label={`Remove ${m.email ?? 'member'}`}
                >
                  Remove
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isOwner && invites.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-fg3 font-mono text-[10px] uppercase tracking-wider">Pending invites</h3>
          <ul className="divide-separator1 divide-y">
            {invites.map((i) => (
              <li key={i.token} className="flex items-center justify-between gap-3 py-2">
                <span className="text-fg2 truncate text-sm">{i.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeInvite(i.token)}
                  disabled={busy}
                  aria-label={`Revoke invite for ${i.email}`}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && (
        <form onSubmit={invite} className="flex flex-col gap-2 border-t border-separator1 pt-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-fg2 text-xs font-semibold uppercase tracking-wider">
              Invite by email
            </span>
            <div className="flex items-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="border-separator1 bg-bg1 text-fg0 focus:border-separatorAccent focus:outline-none w-full rounded-md border px-3 py-2 text-sm"
              />
              <Button variant="primary" size="sm" type="submit" disabled={busy || !email}>
                {busy ? 'Sending…' : 'Invite'}
              </Button>
            </div>
          </label>
          {notice && <p className="text-fg2 text-xs">{notice}</p>}
          {pendingLink && (
            <div className="flex items-center gap-2">
              <code className="bg-bg2 text-fg1 flex-1 truncate rounded px-2 py-1.5 font-mono text-[11px]">
                {pendingLink}
              </code>
              <CopyToClipboard textToCopy={pendingLink} icon="chain-link" label="Copy" variant="secondary" />
            </div>
          )}
          {error && <p className="text-fgSerious1 text-xs">{error}</p>}
        </form>
      )}
    </div>
  );
}
