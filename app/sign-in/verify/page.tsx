import { VerifyClient } from './verify-client';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return <VerifyClient token={sp.token ?? ''} next={sp.next ?? '/'} />;
}
