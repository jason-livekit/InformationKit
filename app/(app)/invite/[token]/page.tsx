import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getInvite, deleteInvite } from '@/lib/repo/invites';
import { getProject } from '@/lib/repo/projects';
import { getUserById } from '@/lib/repo/users';
import { addProjectMember } from '@/lib/repo/members';
import { Badge } from '@/components/bytes/Badge';
import { Button } from '@/components/bytes/Button';
import { DotFill } from '@/components/card-sort/dot-fill';

export const dynamic = 'force-dynamic';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invite = await getInvite(token);
  if (!invite || invite.expiresAt < Date.now()) {
    return (
      <Card title="This invite is no longer valid" tone="error">
        <p className="text-fg3 relative max-w-xs text-xs">
          The link may have expired or already been used. Ask the project owner to send a new
          invite.
        </p>
        <Link href="/" className="relative">
          <Button variant="secondary" size="sm">
            Go to your projects
          </Button>
        </Link>
      </Card>
    );
  }

  const sessionEmail = normalizeEmail(session.user.email ?? '');
  if (sessionEmail !== invite.email) {
    return (
      <Card title="This invite was sent to a different email" tone="warning">
        <p className="text-fg3 relative max-w-xs text-xs">
          The invite is for{' '}
          <strong className="text-fg1 font-semibold">{invite.email}</strong>, but you&apos;re
          signed in as <strong className="text-fg1 font-semibold">{sessionEmail || 'unknown'}</strong>.
          Sign in with the invited address to accept.
        </p>
        <Link href="/" className="relative">
          <Button variant="secondary" size="sm">
            Go to your projects
          </Button>
        </Link>
      </Card>
    );
  }

  const project = await getProject(invite.projectId);
  if (!project) {
    await deleteInvite(token);
    return (
      <Card title="This project no longer exists" tone="error">
        <p className="text-fg3 relative max-w-xs text-xs">
          The project tied to this invite has been deleted.
        </p>
        <Link href="/" className="relative">
          <Button variant="secondary" size="sm">
            Go to your projects
          </Button>
        </Link>
      </Card>
    );
  }

  const inviter = await getUserById(invite.invitedBy);

  async function accept() {
    'use server';
    const s = await auth();
    if (!s?.user?.id) redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
    const current = await getInvite(token);
    if (!current || current.expiresAt < Date.now()) redirect('/');
    if (normalizeEmail(s.user.email ?? '') !== current.email) redirect('/');
    await addProjectMember({ projectId: current.projectId, userId: s.user.id });
    await deleteInvite(token);
    redirect(`/projects/${current.projectId}`);
  }

  return (
    <Card title="You've been invited" tone="accent">
      <p className="text-fg3 relative max-w-xs text-xs">
        <strong className="text-fg1 font-semibold">{inviter?.name ?? 'Someone'}</strong> invited
        you to collaborate on{' '}
        <strong className="text-fg1 font-semibold">{project.name}</strong>.
      </p>
      <form action={accept} className="relative">
        <Button variant="primary" size="sm" type="submit">
          Accept invite
        </Button>
      </form>
    </Card>
  );
}

function Card({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'accent' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const badge = tone === 'accent' ? 'accent' : tone === 'warning' ? 'warning' : 'error';
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border p-8">
        <DotFill tone="accent" opacity={0.14} />
        <Badge variant={badge} size="medium">
          Invite
        </Badge>
        <h1 className="font-display text-fg0 relative text-lg">{title}</h1>
        {children}
      </div>
    </div>
  );
}
