---
title: "feat: Component Showcase Page"
type: feat
date: 2026-02-19
---

# Component Showcase Page

## Overview

Build a ShadCN-style component showcase at `/components` — a standalone, beautifully designed reference page for all curated prototyping components. Left sidebar for category navigation, right side for live interactive examples. Completely independent layout (no app sidebar).

## Problem Statement / Motivation

The current `/component-examples` page is a flat list showcasing ~10 of 60+ available components. It's hard to discover what's available, and the presentation doesn't reflect the quality of the design system. A proper showcase makes the starter kit immediately useful — designers and developers can browse, interact with, and copy patterns.

## Proposed Solution

A new route at `/components` with its own layout (bypassing the root sidebar). ShadCN docs-style: sticky sidebar with categorized component links, scrollable content area with live examples per component.

## Technical Approach

### Architecture

**Route structure:**

```
app/
  (components)/          ← Route group (no URL segment, own layout)
    layout.tsx           ← Standalone layout: no app sidebar, own nav
    components/
      page.tsx           ← Main showcase page
```

The route group `(components)` lets us define a separate `layout.tsx` that skips the root sidebar. The root `layout.tsx` keeps `<html>`, `<body>`, `ThemeProvider`, and font setup. Both `(app)/layout.tsx` and `(components)/layout.tsx` are plain `div` wrappers — they cannot render `<html>` or `<body>`.

**Key files to create:**

| File | Purpose |
|------|---------|
| `app/(components)/layout.tsx` | Standalone layout with category sidebar + theme toggle |
| `app/(components)/components/page.tsx` | Main showcase page, composes category sections |
| `app/(components)/components/_sections/*.tsx` | One file per category (buttons, forms, data, etc.) |

The root `layout.tsx` currently wraps children in `SidebarProvider > Sidebar > SidebarInset`. To give `/components` a different layout, **move the sidebar into a `(app)` route group** and keep root layout minimal.

**Refactored structure:**

```
app/
  layout.tsx             ← Minimal: html + body + ThemeProvider + font
  (app)/                 ← Route group for pages with sidebar
    layout.tsx           ← SidebarProvider + Sidebar + SidebarInset
    page.tsx             ← "/" (moved from app/page.tsx)
    demo-page/
      page.tsx           ← "/demo-page" (moved)
    component-examples/
      page.tsx           ← "/component-examples" (moved, kept for now)
  (components)/          ← Route group for showcase (no sidebar)
    layout.tsx           ← Own minimal layout with showcase sidebar
    components/
      page.tsx           ← "/components"
```

### Component Categories & Curated Selection

**Buttons & Actions** (~5 components)
- `Button` — all variants (primary, secondary, outline, ghost, destructive) + sizes + icon support
- `TaskButton` — async button with loading state
- `Toggle` / `ToggleGroup` — toggle states
- `SegmentedControl` — button group toggle

**Forms & Inputs** (~7 components)
- `Input` — standard text input
- `Textarea` — multiline input
- `Select` — dropdown with variants
- `Checkbox` — checked/unchecked/disabled states
- `RadioGroup` — radio options
- `Switch` — toggle switch
- `Slider` — range input

**Data Display** (~6 components)
- `Table` — full table with mock data
- `Badge` — all variants (muted, accent, success, warning, error)
- `StatusIndicator` — status dots with animated ping
- `Avatar` — image + fallback
- `Progress` — progress bar
- `Skeleton` — loading placeholders

**Feedback & Overlays** (~5 components)
- `Dialog` — modal with form content
- `AlertDialog` — confirmation modal
- `Sheet` — slide-in panel
- `Popover` — floating panel
- `Tooltip` — hover tooltip

**Navigation** (~4 components)
- `Tabs` — all three variants (default, segmented, underline)
- `Breadcrumb` — with BreadcrumbId pill
- `Accordion` — collapsible sections
- `Pagination` — page navigation

**Layout & Utilities** (~4 components)
- `Separator` — horizontal/vertical rules
- `ScrollArea` — custom scrollbar
- `Spinner` — loading indicator
- `CopyToClipboard` — copy button

**Total: ~31 components**

### Showcase Sidebar

A lightweight, custom sidebar — not reusing the app's `Sidebar` component (that's for the app chrome). Instead, a simple sticky `nav` with:

- Logo/title at top ("Components") with a link back to `/` (the app)
- Category headings with component links underneath
- Active state tracking via scroll position (Intersection Observer)
- Theme toggle at the bottom
- Fixed width ~240px, `bg-bg1`, `border-r border-separator1`

### Component Example Cards

Each component section follows a consistent pattern:

```
┌─────────────────────────────────────────┐
│  Component Name                         │
│  Brief description of what it does      │
├─────────────────────────────────────────┤
│                                         │
│  [Live interactive example area]        │
│  bg-bg1, rounded, border                │
│  Shows all variants inline              │
│                                         │
└─────────────────────────────────────────┘
```

- Each section has an `id` matching the sidebar link for scroll-to behavior
- Examples are fully interactive (checkboxes check, dialogs open, etc.)
- Use `bg-bg0` for the page background, `bg-bg1` for example cards

### Scroll-linked Active Sidebar

Use Intersection Observer to highlight the current section in the sidebar as the user scrolls. Each component section registers with an observer; whichever section is most visible gets its sidebar link highlighted.

## Acceptance Criteria

- [x] `/components` route renders a standalone page (no app sidebar)
- [x] All existing app routes (`/`, `/demo-page`, `/component-examples`) still work unchanged
- [x] Left sidebar shows categorized component list with scroll-to navigation
- [x] Active sidebar link updates based on scroll position
- [x] ~31 curated components are showcased with live interactive examples
- [x] Theme toggle works (light/dark) on the standalone page
- [x] "Back to app" link in sidebar navigates to `/`
- [x] Page uses existing design tokens (bg0, fg0, separator1, etc.) — no hardcoded colors
- [x] Responsive: sidebar collapses on mobile (hamburger or hidden)

## Implementation Phases

### Phase 1: Route Group Refactor
- Create `(app)` route group, move existing pages + sidebar layout into it
- Simplify root `layout.tsx` to just html/body/ThemeProvider
- Create `(components)` route group with its own layout
- **Verify all existing routes still work**

Files touched:
- `app/layout.tsx` — simplify (remove sidebar)
- `app/(app)/layout.tsx` — new, contains sidebar
- `app/(app)/page.tsx` — moved from `app/page.tsx`
- `app/(app)/demo-page/page.tsx` — moved
- `app/(app)/component-examples/page.tsx` — moved
- `app/(components)/layout.tsx` — new standalone layout
- `app/(components)/components/page.tsx` — placeholder

### Phase 2: Showcase Layout & Sidebar
- Build the showcase sidebar with category nav
- Build the page scaffold that composes section components
- Implement Intersection Observer for active link tracking
- Add theme toggle + back-to-app link

Files:
- `app/(components)/layout.tsx` — sidebar + content area
- `app/(components)/components/page.tsx` — composes sections

### Phase 3: Component Examples (Batch 1 — Buttons, Forms, Data)
- `_sections/buttons-actions.tsx` — Button, TaskButton, Toggle/ToggleGroup, SegmentedControl
- `_sections/forms-inputs.tsx` — Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- `_sections/data-display.tsx` — Table, Badge, StatusIndicator, Avatar, Progress, Skeleton
- Each with interactive state and variant showcase

### Phase 4: Component Examples (Batch 2 — Overlays, Nav, Layout)
- `_sections/feedback-overlays.tsx` — Dialog, AlertDialog, Sheet, Popover, Tooltip
- `_sections/navigation.tsx` — Tabs, Breadcrumb, Accordion, Pagination
- `_sections/layout-utilities.tsx` — Separator, ScrollArea, Spinner, CopyToClipboard

### Phase 5: Polish
- Mobile responsive sidebar (hidden by default, toggle to show)
- Smooth scroll behavior (`scroll-behavior: smooth` + offset for sticky header)

## Dependencies & Risks

**Risk: Route group refactor breaks existing pages.**
Mitigation: Phase 1 is isolated — verify all routes before moving on. Route groups don't affect URLs, only layouts.

**Risk: Page becomes very large with 31 component demos.**
Mitigation: Split into one file per category under `_sections/` from the start. `page.tsx` just composes them.

**Risk: Intersection Observer quirks with many sections.**
Mitigation: Use a threshold of 0.3-0.5 and track the topmost visible section. Well-understood pattern.

## References

- ShadCN UI docs layout: https://ui.shadcn.com/docs/components
- Current component examples: `app/component-examples/page.tsx`
- Design tokens: `app/globals.css`, `colors/two-face-colors.ts`
- Existing sidebar implementation: `components/ui/sidebar.tsx`
- Project conventions: `.cursor/rules/default-rules.mdc`
