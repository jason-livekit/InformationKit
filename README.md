# Card sort poll — Sessions UI

A tiny [Next.js](https://nextjs.org) card-sorting poll built on top of the LiveKit prototyping starter kit. Anyone with the link can sort cards, group them, mark some as not useful, and submit. The `/results` page aggregates every submission into a single shared dashboard.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Submissions are written to an in-memory list when no Redis is configured, so the app works locally with no extra setup. Two browser tabs hitting the same dev server will see each other's submissions immediately.

## Deploy on Vercel (with cross-user sharing)

The poll only behaves like a true shared poll across users on the open internet when there's a shared backend. This project uses **Upstash Redis** via the Vercel Marketplace.

1. Import the repo on [vercel.com/new](https://vercel.com/new).
2. After the first deploy, run from your project root:

   ```bash
   vercel link
   vercel integration add upstash
   ```

   (or use the Vercel dashboard → Integrations → Upstash). The Marketplace integration auto-provisions an Upstash database and injects `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` into the project's environment variables.
3. Redeploy. No code changes needed — `lib/card-sort/store.ts` calls `Redis.fromEnv()` and picks up the credentials automatically.

You can confirm shared storage is wired up by visiting `/settings` — it'll show a green "Shared store connected" status when Redis is reachable, and an amber warning otherwise.

## Reset

`/settings → Danger zone → Reset all submissions` clears the list for everyone. Anyone can do it — there's no auth on this poll by design.

## Relevant files

- `lib/card-sort/items.ts` — the deduplicated card catalog (every metric / value / event / configuration field across the source UI screenshots).
- `lib/card-sort/store.ts` — Upstash Redis with in-memory fallback.
- `components/card-sort/*` — the sort UI, draggable cards, "not useful" divider, group panels, and results dashboard.
- `app/(app)/page.tsx` — the poll itself.
- `app/(app)/results/page.tsx` — the aggregated dashboard.
- `app/(app)/settings/page.tsx` — storage status, recent submissions, draft management, reset.
- `app/api/submissions/*` — REST endpoints backing the store.
