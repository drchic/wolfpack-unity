# Frontend Visual Refresh — Design

## Problem

The Wolfpack Unity frontend works but looks dated. Every page (`LoginPage`, `RegisterPage`, `SlotGridPage`, `SlotRow`, `BookingModal`, `MyReservationsPage`, `AdminLayout`, `UsersTable`, `ReservationsTable`, `StatsView`) is built with raw inline `style={{...}}` objects on plain HTML elements: hardcoded hex colors (`#007bff`, `#28a745`, `#dc3545`, `red`), no consistent type scale or spacing, default browser buttons/inputs, and no shared layout or component library. `App.css`/`index.css` still carry unused leftover Vite-template styles (hero logo animation, `#next-steps`, `.ticks`, `.counter`) that the real app never uses.

## Goal

A full visual refresh: a real design system (colors, type, spacing, shared components) applied consistently across every page, built with Tailwind CSS. Visual direction is "clean modern SaaS" — light theme, rounded cards, soft shadows, one accent color, generous whitespace. Responsive (mobile + desktop), light mode only (no dark mode for this pass).

## Non-goals

- No dark mode (existing dark-mode CSS variables in `index.css` are out of scope; can be revisited later).
- No backend changes.
- No new pages, routes, or features — purely visual/structural restyle of what exists.
- No adoption of a headless component library (shadcn/ui, MUI, Mantine) — hand-built Tailwind components instead.

## Approach

Add Tailwind CSS (v4, CSS-first `@theme` config) to the Vite build. Build a small shared component layer (`frontend/src/components/ui/`) so styling logic lives in one place instead of being duplicated across 11 files. Add a persistent app shell (header/nav) so navigation isn't reinvented per page. Restyle each existing page to use the new tokens/components without changing their behavior, DOM semantics (roles/labels/text), or data flow — so existing Vitest/RTL tests keep passing unmodified.

## 1. Foundation — Tailwind + design tokens

- Add `tailwindcss` (v4) and its Vite plugin to `frontend/`.
- Define tokens via `@theme` in `index.css`:
  - **Color**: one primary accent (blue family, replacing `#007bff`), neutral grays for text/borders/backgrounds, semantic `success` (replacing `#28a745`), `danger` (replacing `#dc3545`/`red`), `warning` if needed for "taken" states.
  - **Type scale**: page title (h1), section heading (h2), body, small/meta text — replacing ad-hoc inline font sizes.
  - **Spacing/radius**: consistent scale reused by all components (replacing one-off `padding: '8px'`, `borderRadius: '4px'`, etc.).
  - **Shadow**: one subtle elevation value for cards/modals.
- Delete unused Vite-template CSS: the `.hero`, `#next-steps`, `#docs`, `#spacer`, `.ticks`, `.counter` rules in `App.css`/`index.css` and any markup that referenced them (none currently — they're dead CSS only).
- Keep `#root` width constraint or replace with Tailwind's container utilities — decide during implementation based on what reads cleaner.

## 2. Shared component layer

New directory `frontend/src/components/ui/`, one file per component:

| Component | Replaces | Notes |
|---|---|---|
| `Button` | every inline-styled `<button>` | variants: `primary`, `secondary`, `danger`; built-in disabled/loading visual state |
| `Input` + `Label` + `FormField` | Login/Register inline-styled inputs | consistent border, focus ring, spacing |
| `Card` | ad-hoc white boxes (login form, slot grid container, admin panel, modal content) | rounded, bordered, soft shadow |
| `Table` (`Table`, `Thead`, `Tbody`, `Tr`, `Th`, `Td`) | raw `<table>` in `MyReservationsPage`, `UsersTable`, `ReservationsTable` | consistent header/row/cell styling |
| `Badge` | inline status colors (reservation status, spot availability) | colored pill, uses semantic colors |
| `ErrorBanner` | repeated red error-box markup (`error && <div style={{color:'red', ...}}>`) | single consistent error treatment |
| `Modal` | `BookingModal`'s hand-rolled fixed-overlay markup | overlay + centered `Card`-based content; reusable for any future modal |

These are presentational only — no new state/logic, no behavior change. Existing components pass the same props/children they already render (text, labels) so RTL queries by role/text are unaffected.

## 3. App shell

New `frontend/src/components/Layout.tsx`:
- Header bar: app name on the left; nav links (`Book a Spot`, `My Reservations`, `Admin` — admin link only rendered for admin users) with active-route highlighting (via `react-router-dom`'s `NavLink` or `useLocation`); logout button on the right.
- Wraps the authenticated route tree in `App.tsx` (inside `ProtectedRoute`, wrapping `SlotGridPage`, `MyReservationsPage`, `AdminLayout`).
- Removes the duplicated "Back to App" / "My Reservations" inline links currently hardcoded into `SlotGridPage`, `MyReservationsPage`, and `AdminLayout` — those pages keep their own content but drop their own nav links since the shell now provides navigation.
- Collapses to a simpler stacked/compact layout below ~640px (nav links wrap or compact down; exact mobile treatment decided during implementation).

## 4. Page-by-page restyle

- **`LoginPage` / `RegisterPage`**: centered `Card`, `FormField`s for inputs, primary `Button` for submit, Google OAuth2 link restyled as a secondary `Button`-style link, `ErrorBanner` for errors.
- **`SlotGridPage`**: date picker restyled with `Input`; slot list wrapped in a `Card`; "My Reservations" link removed (now in shell nav); `ErrorBanner` for errors.
- **`SlotRow`**: time label + row of spot buttons reusing `Button` (or a dedicated small spot-button variant) — available = primary, mine = success-colored, taken = disabled gray. Same `onSelectSpot` interaction, same `title` attribute for hover state.
- **`BookingModal`**: rebuilt on the shared `Modal` + `Card` + `Button` (primary for confirm, secondary for cancel) + `ErrorBanner`. Same props/behavior (`onClose`, `onSuccess`, `book()` call).
- **`MyReservationsPage`**: shared `Table` for the reservation list, `Badge` for `status`, danger `Button` for cancel, `ErrorBanner` for errors; "Book a Spot" link removed (now in shell nav).
- **`AdminLayout`**: tab bar restyled as a segmented control (still local `useState` for `activeTab`, no routing change); "Back to App" link removed (now in shell nav); tab content wrapped in `Card`.
- **`UsersTable` / `ReservationsTable` / `StatsView`**: adopt shared `Table`/`Card` components, same data/columns.

## 5. Responsive behavior

- Header/nav collapses under ~640px as described above.
- Page content keeps a max-width with side padding that shrinks at narrow viewports (mirroring the existing `@media (max-width: 1024px)` pattern already in `index.css`, reimplemented via Tailwind breakpoints).
- Tables (`MyReservationsPage`, admin tables) get horizontal scroll (`overflow-x-auto` wrapper) on narrow viewports instead of breaking the layout.

## 6. Testing

- No DOM semantics change: same elements, same accessible roles, same visible text/labels. Existing Vitest/RTL tests (`LoginPage.test.tsx`, `MyReservationsPage.test.tsx`, `SlotRow.test.tsx`) query by role/label/text, not class names, so they should pass unmodified.
- After implementation, run the existing test suite (`npm run test` / vitest) to confirm no regressions before considering the work done.
- No new tests required for pure styling changes; if the `Layout`/nav active-state logic introduces new conditional behavior, add a small test for it.

## Risks / open questions

- Tailwind v4 install in this Vite 8 + React 19 setup — should be straightforward but verify peer-dependency compatibility during implementation.
- Exact accent color/shade and exact mobile breakpoint behavior for the header are implementation-time judgment calls within the "clean modern SaaS" direction already agreed on — not blocking design approval.
