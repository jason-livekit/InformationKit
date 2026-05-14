# Information Kit

A research tool for designing better information architecture. Sign in, create projects, design
card sort studies, share a link to capture submissions, and analyze how participants actually
group your content.

Built on [Next.js](https://nextjs.org), [Auth.js v5](https://authjs.dev) (magic-link sign-in),
[Upstash Redis](https://upstash.com), and the
[LiveKit design prototyping kit](https://github.com/livekit/design-prototyping-kit).

## Architecture

```
User (Google SSO)
  └─ Project
       └─ Study  (status: draft | open | closed)
            ├─ Setup     ← author cards + predefined groups
            ├─ Capture   ← share link + submission counts
            └─ Analysis  ← aggregated dashboard
```

Anyone with a study's share link can take the sort without an account. Owners can also click
**Preview** to try the sort themselves — preview submissions are not recorded.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No credentials required to start. The dashboard / project / study editor are behind sign-in;
the demo study at `/share/demo-sessions-ui` is public.

### Magic-link sign-in

Sign-in works via a one-time email link. The flow:

1. User enters an email at `/sign-in`.
2. The server issues a single-use token (15-minute TTL, stored in the KV).
3. The link is delivered:
   - **With `RESEND_API_KEY` set** — sent via [Resend](https://resend.com).
   - **Without it** — printed to the server console, and shown inline on the sign-in page
     in development for easy click-through.
4. User opens the link → `/sign-in/verify?token=…` → token is consumed → session cookie set.

Put these in `.env.local`:

```
AUTH_SECRET=...   # required in prod; `openssl rand -hex 32`
RESEND_API_KEY=...           # optional, only needed to actually email links
MAGIC_LINK_FROM=...          # optional, e.g. "You <you@yourdomain.com>"
```

In development, both env vars are optional — leave them blank and the link prints to your
terminal (and shows up on the sign-in page).

### Storage

Submissions are stored in [Upstash Redis](https://upstash.com) via the Vercel Marketplace
integration. Without it, the app falls back to an in-memory store so local dev just works.

To enable shared storage on Vercel:

```bash
vercel link
vercel integration add upstash
```

(or use the Vercel dashboard). The integration auto-injects `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. No code changes needed.

`/settings` shows a green status when the shared store is connected.

## Tests

```bash
pnpm test          # one-shot
pnpm test:watch    # watch mode
```

Tests use Vitest with `happy-dom`. The repos run against an in-memory KV store that is reset
between cases (`__resetMemoryStoreForTests`), so tests are fast and isolated.

## Layout

- `auth.ts` — Auth.js configuration + Google provider + user upsert on sign-in.
- `middleware.ts` — route protection.
- `lib/repo/` — schemas, repos, demo seed, KV abstraction.
- `lib/card-sort/` — items catalog (used by the demo study), aggregate function, per-study
  localStorage drafts.
- `components/card-sort/` — the parameterized `<CardSort>` component, the not-useful divider,
  group panels, results dashboard.
- `components/study/` — study tabs, status switcher, Setup/Capture/Analysis tab contents.
- `components/auth/` — sign-in button + user menu.
- `app/(app)/` — authenticated app: dashboard, projects, studies.
- `app/share/` — anonymous participant flow.
- `app/preview/` — owner-only preview flow.
- `app/api/` — REST API for auth + projects + studies + submissions.

## Demo study

On first server boot a seed migration creates a public **Demo project** + study (the same
Sessions UI cards the original prototype used), and migrates any legacy submissions from the
old global list into the demo study. The flag `migration:done:v1` in the KV makes this
idempotent.

You can reset just the demo study's submissions from its Analysis tab (sign in first), or wipe
the whole KV from your Upstash dashboard.
