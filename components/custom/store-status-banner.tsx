import { isSharedStoreConfigured } from '@/lib/repo/redis';
import { CircleInfoIcon } from '@/icons/react';

/**
 * Warns when the app is running on the in-memory fallback store instead of a shared,
 * durable one (Upstash Redis). On serverless (e.g. Vercel) the in-memory store is
 * per-instance, so data — projects, members, sign-in tokens — is not shared across
 * requests. That surfaces as confusing "Not found" errors and flaky sign-in. Renders
 * nothing once a shared store is configured. Mirrors the "Email delivery isn't
 * configured" notice on the sign-in page.
 */
export function StoreStatusBanner() {
  if (isSharedStoreConfigured()) return null;
  return (
    <div className="border-separator1 bg-bgModerate2 flex items-start gap-3 rounded-lg border p-4">
      <CircleInfoIcon className="text-fgModerate mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="text-fg0 text-sm font-semibold">Data store isn&apos;t configured</span>
        <p className="text-fg2 max-w-2xl text-xs">
          This deployment is using a temporary in-memory store, so projects, members, and
          sign-ins aren&apos;t shared reliably between requests — inviting someone can fail with
          &ldquo;Not found.&rdquo; Set{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[10px]">
            UPSTASH_REDIS_REST_URL
          </code>{' '}
          and{' '}
          <code className="bg-bg2 text-fg1 rounded px-1 py-0.5 font-mono text-[10px]">
            UPSTASH_REDIS_REST_TOKEN
          </code>{' '}
          (Upstash Redis) for this environment and redeploy.
        </p>
      </div>
    </div>
  );
}
