# Dark Athletic Redesign — Design

> Supersedes `2026-06-24-frontend-visual-refresh-design.md` (light "clean SaaS" direction, never implemented). The visual direction chosen with the user on 2026-07-16 is **Dark Athletic**: near-black surfaces, heavy display headlines, one amber accent.

## Problem

The Wolfpack Unity frontend works but looks dated. Every page is built with raw inline `style={{...}}` objects, hardcoded hex colors (`#007bff`, `#28a745`, `#dc3545`), default browser buttons/inputs, and no shared components. `App.css` and `index.css` still carry unused Vite starter-template styles. The new Content CMS pages (Home, News, Blog, Vlog, Post) shipped functional but visually bare.

## Goal

A full app-wide restyle in a **Dark Athletic** visual direction — dark-only theme, Archivo Black display headlines, amber accent — applied to every page: public content, booking, auth, and admin. Built with **Tailwind CSS 4** and a small shared component layer. Purely presentational: behavior, routing, data flow, and DOM semantics (roles/labels/visible text) stay unchanged so existing tests keep passing.

## Non-goals

- No light mode (dark-only; `color-scheme: dark`).
- No backend changes of any kind.
- No new pages, routes, or features.
- No headless component library (shadcn/ui, MUI, etc.) — hand-built Tailwind components.
- No fixing of the 6 pre-existing frontend test failures (SlotRow, LoginPage, MyReservationsPage) — they must simply not get worse.

## Decisions made with the user

| Decision | Choice |
|---|---|
| Visual direction | Dark Athletic (over Clean Minimal, Bold Energetic) |
| Accent color | Amber orange `#ff8a1e` (over lime, crimson) |
| Homepage layout | Big hero with CTA (over content-first dashboard) |
| Scope | Entire app incl. admin panel |
| Styling tech | Tailwind 4 (CSS-first `@theme`, `@tailwindcss/vite` plugin) |
| Display typography | Archivo (Black 900), uppercase, tight tracking; Inter for body/UI |

## 1. Foundation

**Dependencies (frontend/):**
- `tailwindcss` v4 + `@tailwindcss/vite` (dev deps). Plugin added to `vite.config.ts`.
- `@fontsource/archivo` and `@fontsource-variable/inter` — fonts self-hosted, imported in `main.tsx`. No runtime CDN requests.

**`index.css` is replaced entirely** with:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #0c0e12;          /* page background */
  --color-surface: #151922;     /* cards, nav, modals */
  --color-surface-2: #1c2230;   /* hover / raised surface */
  --color-edge: #232936;        /* borders */
  --color-ink: #f5f7fa;         /* primary text */
  --color-ink-muted: #8b93a3;   /* secondary text */
  --color-accent: #ff8a1e;      /* amber — buttons, links, labels */
  --color-accent-hi: #ffa04d;   /* accent hover */
  --color-danger: #ff5c5c;
  --color-success: #3ddc84;
  --font-display: 'Archivo', sans-serif;
  --font-sans: 'Inter Variable', system-ui, sans-serif;
}
```

plus a tiny base layer: `body` gets `bg-bg text-ink font-sans`, `color-scheme: dark`.

**Deleted:** `App.css` (entirely), all starter-template rules in `index.css` (`.hero`, `#next-steps`, `.ticks`, `.counter`, `#root` fixed width). `#root` becomes a plain full-width flex column; page content constrained by a `max-w-6xl mx-auto px-4` container pattern.

**Headline convention:** hero and page titles use `font-display font-black uppercase tracking-tight`; the amber "eyebrow" label above titles uses `text-accent text-xs font-bold tracking-[0.2em] uppercase`.

## 2. Shared component layer — `frontend/src/components/ui/`

One file per component. Props stay minimal; variants via a `variant` prop.

| Component | Purpose |
|---|---|
| `Button` | variants `primary` (amber pill, dark text), `ghost` (border, ink text), `danger`; `disabled` state |
| `Card` | `bg-surface border border-edge rounded-xl`; hover raise for clickable cards |
| `Badge` | post-type chip; color map: ANNOUNCEMENT → amber, NEWS → blue (`#6ea8ff`), BLOG → green (`#3ddc84`), VLOG → red (`#ff5c5c`); tinted background at ~12% opacity |
| `Input`, `Label`, `Select`, `Textarea` | dark field styling: `bg-surface-2 border-edge`, amber focus ring |
| `PageHeader` | display-font title + muted subtitle |
| `Spinner` | loading indicator used by all pages that fetch |
| `ErrorMessage` | visible error block (danger-tinted); also an `EmptyState` variant ("No posts yet") |

**Behavior fix folded in:** list pages (Home, News, Blog, Vlog) currently swallow fetch errors silently — every fetching page now renders `Spinner` while loading and `ErrorMessage` on failure.

## 3. Page treatments

All pages keep their existing components, props, handlers, and visible text unless noted. Only markup structure and classes change.

**TopNav** (`components/TopNav.tsx`)
- Sticky top bar: `bg-surface/90 backdrop-blur border-b border-edge`.
- Left: 🐺 WOLFPACK wordmark (display font, links to `/`) + News / Blog / Vlog links (muted, ink on hover, accent when route active).
- Right (authed): amber pill **Book a slot** → `/book`, ghost **My Reservations**, ghost **Logout**. (Guest): amber pill **Login**.

**HomePage** (`content/HomePage.tsx`) — Big Hero layout
- Hero (full-width, `bg` → subtle gradient to `surface`): eyebrow `TRAIN WITH THE PACK`, headline `STRONGER EVERY DAY.` (display font, ~`text-6xl`), tagline `24/7 gym · hourly slots · book in seconds`, amber CTA button **BOOK YOUR SLOT →** linking to `/book`.
- Announcement strip: amber-tinted banner rows (one per announcement, up to 5), each linking to the post.
- Three sections — News, Blog, Vlog — each: section title (display font) + "View all →" accent link + row of up to 3 `PostCard`s.
- Data fetching unchanged (4 parallel `getPosts` calls).

**PostCard** (`content/PostCard.tsx`)
- `Card` with `Badge`, title (ink, semibold, accent on hover), author + date (muted, small).
- VLOG cards additionally show the YouTube thumbnail (`https://img.youtube.com/vi/{videoId}/hqdefault.jpg`, 16:9, rounded top) using the existing videoId extraction; no thumbnail if URL unparseable.

**NewsPage / BlogPage / VlogPage**
- `PageHeader` + responsive grid (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`) of `PostCard`s + Prev/Next pagination as ghost `Button`s with muted "Page N" between. Fetch/merge logic unchanged.

**PostPage** (`content/PostPage.tsx`)
- Centered article column (`max-w-3xl`): `Badge`, title in display font, author + date muted, body in relaxed reading style (`text-ink-muted leading-relaxed`, paragraphs preserved), 16:9 rounded YouTube embed for VLOGs (existing iframe logic).

**LoginPage / RegisterPage** (`auth/`)
- Centered `Card` (~`max-w-sm`) on dark bg: wordmark, form with `Label`+`Input`, amber submit `Button` (full width), Google button as ghost `Button`, error text via `ErrorMessage`. All input labels/ids/visible text unchanged.

**SlotGridPage / SlotRow / BookingModal** (`slots/`)
- Grid of hour rows; spot cells: free → `bg-surface border-edge`, amber border on hover; full → muted/disabled look; user's own reservation → amber-filled or amber-outlined cell. Legend chips under the header.
- BookingModal: `Card` on `bg-black/60` overlay, amber confirm `Button`, ghost cancel.

**MyReservationsPage**
- `PageHeader` + list of `Card` rows: date + time (display font accent), spot number `Badge`-style chip, cancel `Button` (danger ghost) with existing deadline messaging.

**Admin** (`admin/`)
- `AdminLayout`: same container; tab nav restyled — muted tabs, active tab accent text + amber underline.
- Tables (`UsersTable`, `ReservationsTable`, `PostsTable`): dark table styling — muted uppercase header row, `divide-y divide-edge`, row hover `bg-surface-2`; action buttons → `Button` ghost/danger.
- `StatsView`: stat tiles as `Card`s — big display-font number, muted label.
- `PostForm`: two-column-capable form using `Label`/`Input`/`Select`/`Textarea`, amber submit; existing slug auto-fill and conditional YouTube field behavior untouched.

## 4. Testing & verification

- **Existing Vitest/RTL tests must pass unmodified.** They select by role, label, and visible text — the restyle must not change any of those. The 6 pre-existing failures remain exactly 6.
- **New tests are not required** for purely presentational components; `ErrorMessage` rendering on fetch failure (new behavior) gets a test per affected list page or in one representative page test.
- `npm run build` (tsc + vite) must succeed.
- Manual visual pass of every route in the running dev server (backend on 8081, frontend on 5174), including admin as the seeded admin user.

## Rollout

Single feature branch, implemented foundation-first (Tailwind + tokens + ui components), then public pages, then booking/auth, then admin — each stage leaves the app fully working.
