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
       ├─ Study  (status: draft | open | closed)
       │    ├─ Setup     ← author cards + predefined groups
       │    ├─ Capture   ← share link + submission counts
       │    └─ Analysis  ← aggregated dashboard
       └─ Map    (journey map; published: true | false)
            └─ Page
                 └─ Table  ← markdown cells, rows, merged columns
```

A project holds **Studies** (card sorts) and **Maps** (journey maps). Anyone with a study's
share link can take the sort without an account. Owners can also click **Preview** to try the
sort themselves — preview submissions are not recorded.

## Maps — journey mapping

A **Map** is a Figma-like, zoomable journey-mapping document. Each map has pages; each page
hosts one markdown **table** on an infinite canvas.

- **Inline markdown** — click the canvas and type `| Cell 1 | Cell 2 |`. Typing `|` commits a
  cell and opens the next; *leading* pipes on an empty cell declare its width up front (`||`
  before any text = a 2-column cell, Excel-style merge). `Enter` on the trailing empty cell
  opens a new row; `---` turns the row above into a header. Tab /
  arrows navigate; Backspace / Delete at a cell edge shrink merges or delete cells/rows. The
  full rule set lives in the pure, unit-tested engine `components/map/grid.ts`.
- **OKLCH auto-coloring** (`components/map/colors.ts`) — rows step from dark (top) to light
  (bottom); columns get ROYGBIV hues from the design palette via a union-find so merged cells
  cascade their hue to vertically aligned cells. A per-cell hue override (from the style panel)
  wins and cascades to its whole group. Header rows keep `bg-bg2`.
- **Google-Maps-style zoom** — pinch / ⌘-scroll zooms (column widths scale, **row heights and
  text stay constant**); two-finger scroll pans. Zooming out reveals fewer rows (top-first);
  zooming in reveals more. A faint ⋯ pill steps in the next row. The view rubber-bands to keep
  the table centered per axis until it exceeds the viewport, then frees panning.
- **FigJam-style chrome** — a floating style panel (hue picker, bold/italic/strike, text size,
  sans/mono), hover add-row/column buttons, drag handles that select rows/columns, divider
  resize cursors, and a `?` / `⌘?` shortcuts popover.
- **Pages + find** — a Figma-like left sidebar to add/rename/reorder pages and find-on-page that
  auto-zooms to a match.
- **Edit / Preview / Public** — the editor has top-right **Preview** and **Share** buttons.
  Preview is a read-only formatted view with a **Publish** toggle; published maps are viewable
  anonymously at `/m/<shareSlug>`.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No credentials required to start. The dashboard / project / study & map editors are behind
sign-in; the demo study at `/share/demo-sessions-ui` and the demo map at `/m/demo-journey-map`
are public.

### Magic-link sign-in

Sign-in works via a one-time email link. The flow:

1. User enters an email at `/sign-in`.
2. The server issues a single-use token (15-minute TTL, stored in the KV).
3. The link is delivered:
   - **With `RESEND_API_KEY` set** — emailed via [Resend](https://resend.com).
   - **Without it** — logged to the server console only. It is never returned to the
     browser, so a visitor can't harvest a working sign-in link for someone else's email.
4. User opens the link → `/sign-in/verify?token=…` → token is consumed → session cookie set.

Put these in `.env.local`:

```
AUTH_SECRET=...   # required in prod; `openssl rand -hex 32`
RESEND_API_KEY=...           # required to email links; without it, links go to server console only
MAGIC_LINK_FROM=...          # optional, e.g. "You <you@yourdomain.com>"
```

In local dev without `RESEND_API_KEY`, the sign-in page will show "Couldn't send sign-in
link" — read the link from your terminal (`[magic-link] for you@example.com: …`) and paste
it into your browser.

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
- `components/map/` — journey-map engines (`grid.ts`, `colors.ts`) and editor (store, canvas,
  cells, style panel, pages sidebar, viewer).
- `components/auth/` — sign-in button + user menu.
- `app/(app)/` — authenticated app: dashboard, projects, studies, maps.
- `app/share/` — anonymous participant flow (studies).
- `app/m/` — anonymous public map view (published maps).
- `app/preview/` — owner-only study preview flow.
- `app/api/` — REST API for auth + projects + studies + maps + submissions.

## Demo study

On first server boot a seed migration creates a public **Demo project** + study (the same
Sessions UI cards the original prototype used) and a public **demo journey map**
(`/m/demo-journey-map`), and migrates any legacy submissions from the old global list into the
demo study. The flag `migration:done:v3` in the KV makes this idempotent.

You can reset just the demo study's submissions from its Analysis tab (sign in first), or wipe
the whole KV from your Upstash dashboard.
