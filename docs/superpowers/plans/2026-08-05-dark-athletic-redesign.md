# Dark Athletic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every page of the Wolfpack Unity frontend into a "Dark Athletic" visual theme (near-black surfaces, Archivo Black headlines, amber accent) using Tailwind CSS 4, without changing any behavior, routing, data flow, or DOM semantics.

**Architecture:** Add Tailwind 4 (CSS-first `@theme` tokens, `@tailwindcss/vite` plugin) and self-hosted fonts. Build a small shared `components/ui/` library (Button, Card, Badge, Input/Label/Select/Textarea, PageHeader, Spinner, ErrorMessage/EmptyState). Restyle every page to use the tokens and shared components, file by file, preserving existing props, handlers, and visible text so the existing Vitest/RTL suite does not regress.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, `@fontsource/archivo`, `@fontsource-variable/inter`, Vitest + Testing Library (existing).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-16-dark-athletic-redesign-design.md`
- Tailwind CSS **4**, CSS-first `@theme` config in `index.css`, installed via the `@tailwindcss/vite` plugin — no `tailwind.config.js`, no PostCSS config file.
- Design tokens (exact hex values): `--color-bg: #0c0e12`, `--color-surface: #151922`, `--color-surface-2: #1c2230`, `--color-edge: #232936`, `--color-ink: #f5f7fa`, `--color-ink-muted: #8b93a3`, `--color-accent: #ff8a1e`, `--color-accent-hi: #ffa04d`, `--color-danger: #ff5c5c`, `--color-success: #3ddc84`.
- Fonts: **Archivo** weight 900 (`--font-display`) for headlines, self-hosted via `@fontsource/archivo`; **Inter Variable** (`--font-sans`) for everything else, self-hosted via `@fontsource-variable/inter`. No runtime CDN font requests.
- Dark-only theme: `color-scheme: dark`, no light-mode variant.
- No backend changes. No new routes, pages, or features. Purely presentational restyle.
- Every page must render `<TopNav />`, including `/book`, `/my-reservations`, and `/admin/*`, which currently omit it.
- Existing Vitest/RTL tests must not regress. **Baseline as of this plan** (`npx vitest run` in `frontend/`): `Test Files: 3 failed | 2 passed (5)`, `Tests: 6 failed | 6 passed (12)`. The 3 failing files are `SlotRow.test.tsx` (prop-shape mismatch, pre-existing), `LoginPage.test.tsx` (button text mismatch, pre-existing), `MyReservationsPage.test.tsx` (wrong mocked module, pre-existing). **Do not fix these** — they are out of scope per the spec's non-goals. Every task that touches a tested file must re-run that file's tests and confirm the same pass/fail outcome (except Task 2, which adds a new always-passing test file).
- `npm run build` (`tsc -b && vite build`) must succeed after every task.
- All commands below run from `frontend/` unless stated otherwise.

---

### Task 1: Tailwind 4 Foundation, Design Tokens & Fonts

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/index.html`
- Delete: `frontend/src/App.css`

**Interfaces:**
- Produces: the `@theme` tokens listed in Global Constraints, available to every later task as Tailwind utility classes (e.g. `bg-bg`, `bg-surface`, `text-ink`, `text-accent`, `font-display`, `font-sans`).

- [ ] **Step 1: Record the test baseline**

Run: `cd frontend && npx vitest run`
Expected: `Test Files  3 failed | 2 passed (5)` and `Tests  6 failed | 6 passed (12)` — matches Global Constraints baseline. If your output differs, stop and reconcile before proceeding (something already changed).

- [ ] **Step 2: Install Tailwind 4 and font packages**

Run:
```bash
cd frontend
npm install -D tailwindcss@^4 @tailwindcss/vite@^4
npm install @fontsource/archivo @fontsource-variable/inter
```
Expected: `package.json` gains `tailwindcss` and `@tailwindcss/vite` under `devDependencies`, and `@fontsource/archivo` / `@fontsource-variable/inter` under `dependencies`. Command exits 0.

- [ ] **Step 3: Add the Tailwind Vite plugin**

Replace `frontend/vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8081',
      '/login': 'http://localhost:8081',
      '/oauth2': 'http://localhost:8081',
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Replace `index.css` with the theme**

Replace `frontend/src/index.css` entirely with:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #0c0e12;
  --color-surface: #151922;
  --color-surface-2: #1c2230;
  --color-edge: #232936;
  --color-ink: #f5f7fa;
  --color-ink-muted: #8b93a3;
  --color-accent: #ff8a1e;
  --color-accent-hi: #ffa04d;
  --color-danger: #ff5c5c;
  --color-success: #3ddc84;

  --font-display: 'Archivo', sans-serif;
  --font-sans: 'Inter Variable', system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background-color: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

#root {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 5: Delete the unused starter stylesheet**

Run: `rm frontend/src/App.css`
(Confirmed unused: `grep -rn "App.css" frontend/src` returns nothing.)

- [ ] **Step 6: Import fonts in `main.tsx`**

Replace `frontend/src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/archivo/900.css'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Fix the leftover page title**

In `frontend/index.html`, change:
```html
<title>frontend</title>
```
to:
```html
<title>Wolfpack Unity</title>
```

- [ ] **Step 8: Verify build and test baseline unchanged**

Run: `cd frontend && npm run build`
Expected: exits 0, `dist/` produced, no TypeScript or Vite errors.

Run: `cd frontend && npx vitest run`
Expected: identical to Step 1 — `Test Files  3 failed | 2 passed (5)`, `Tests  6 failed | 6 passed (12)`.

- [ ] **Step 9: Commit**

```bash
cd frontend
git add package.json package-lock.json vite.config.ts src/index.css src/main.tsx index.html
git rm src/App.css
git commit -m "feat: add Tailwind 4 foundation and dark athletic design tokens"
```

---

### Task 2: Shared UI Component Library

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`
- Create: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/components/ui/PageHeader.tsx`
- Create: `frontend/src/components/ui/Spinner.tsx`
- Create: `frontend/src/components/ui/ErrorMessage.tsx`
- Create: `frontend/src/components/ui/index.ts`
- Test: `frontend/src/test/ui/components.test.tsx`

**Interfaces:**
- Consumes: `@theme` tokens from Task 1 (`bg-accent`, `text-ink`, `border-edge`, `font-display`, etc.)
- Produces (used by every later task):
  - `Button({ variant?: 'primary' | 'ghost' | 'danger' } & ButtonHTMLAttributes<HTMLButtonElement>)`
  - `Card(HTMLAttributes<HTMLDivElement>)`
  - `Badge({ type: 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT' })`, exported type `PostType`
  - `Label(LabelHTMLAttributes<HTMLLabelElement>)`, `Input(InputHTMLAttributes<HTMLInputElement>)`, `Textarea(TextareaHTMLAttributes<HTMLTextAreaElement>)`, `Select(SelectHTMLAttributes<HTMLSelectElement>)`
  - `PageHeader({ title: string, subtitle?: string })`
  - `Spinner()`
  - `ErrorMessage({ message: string })`, `EmptyState({ message: string })`
  - All re-exported from `frontend/src/components/ui/index.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/components.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Button, Badge, Card, ErrorMessage, EmptyState } from '../../components/ui'

test('Button renders its label', () => {
  render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})

test('Badge renders the post type text', () => {
  render(<Badge type="VLOG" />)
  expect(screen.getByText('VLOG')).toBeInTheDocument()
})

test('Card renders children', () => {
  render(<Card>content</Card>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

test('ErrorMessage renders the message text', () => {
  render(<ErrorMessage message="Something broke" />)
  expect(screen.getByText('Something broke')).toBeInTheDocument()
})

test('EmptyState renders the message text', () => {
  render(<EmptyState message="Nothing here" />)
  expect(screen.getByText('Nothing here')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/test/ui/components.test.tsx`
Expected: FAIL — `Failed to resolve import "../../components/ui"` (module does not exist yet).

- [ ] **Step 3: Implement `Button.tsx`**

Create `frontend/src/components/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-5 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent-hi',
  ghost: 'border border-edge text-ink hover:border-accent hover:text-accent',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
```

- [ ] **Step 4: Implement `Card.tsx`**

Create `frontend/src/components/ui/Card.tsx`:

```tsx
import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-edge bg-surface ${className}`} {...props} />
}
```

- [ ] **Step 5: Implement `Badge.tsx`**

Create `frontend/src/components/ui/Badge.tsx`:

```tsx
export type PostType = 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'

const styles: Record<PostType, string> = {
  ANNOUNCEMENT: 'bg-accent/15 text-accent',
  NEWS: 'bg-[#6ea8ff]/15 text-[#6ea8ff]',
  BLOG: 'bg-success/15 text-success',
  VLOG: 'bg-danger/15 text-danger',
}

interface Props {
  type: PostType
}

export function Badge({ type }: Props) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${styles[type]}`}>
      {type}
    </span>
  )
}
```

- [ ] **Step 6: Implement `Input.tsx`**

Create `frontend/src/components/ui/Input.tsx`:

```tsx
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const fieldClass =
  'w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none'

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1 block text-sm font-medium text-ink-muted" {...props} />
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldClass} ${className}`} {...props} />
}
```

- [ ] **Step 7: Implement `PageHeader.tsx`**

Create `frontend/src/components/ui/PageHeader.tsx`:

```tsx
interface Props {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 8: Implement `Spinner.tsx`**

Create `frontend/src/components/ui/Spinner.tsx`:

```tsx
export function Spinner() {
  return (
    <div role="status" aria-label="Loading" className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-edge border-t-accent" />
    </div>
  )
}
```

- [ ] **Step 9: Implement `ErrorMessage.tsx`**

Create `frontend/src/components/ui/ErrorMessage.tsx`:

```tsx
interface Props {
  message: string
}

export function ErrorMessage({ message }: Props) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  )
}

export function EmptyState({ message }: Props) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-4 py-10 text-center text-sm text-ink-muted">
      {message}
    </div>
  )
}
```

- [ ] **Step 10: Implement the barrel export**

Create `frontend/src/components/ui/index.ts`:

```ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge, type PostType } from './Badge'
export { Label, Input, Textarea, Select } from './Input'
export { PageHeader } from './PageHeader'
export { Spinner } from './Spinner'
export { ErrorMessage, EmptyState } from './ErrorMessage'
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/test/ui/components.test.tsx`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

- [ ] **Step 12: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)` (the new file adds 1 passed file / 5 passed tests on top of the Task 1 baseline; the same 3 pre-existing files still fail the same way). This is the new baseline for every later task.

- [ ] **Step 13: Commit**

```bash
cd frontend
git add src/components/ui src/test/ui
git commit -m "feat: add shared dark athletic UI component library"
```

---

### Task 3: TopNav Restyle

**Files:**
- Modify: `frontend/src/components/TopNav.tsx`

**Interfaces:**
- Consumes: `Button` from `../components/ui` (Task 2); `useAuth()` from `../auth/AuthContext` (unchanged, existing).
- Produces: `TopNav()` — no props, same as before. Every page task from here on renders `<TopNav />` at the top of its returned JSX.

- [ ] **Step 1: Confirm no dedicated test exists**

Run: `cd frontend && find src/test -iname "*topnav*"`
Expected: no output — there is no `TopNav.test.tsx`, so this task carries no test-file gate beyond the full-suite baseline.

- [ ] **Step 2: Replace `TopNav.tsx`**

Replace `frontend/src/components/TopNav.tsx` with:

```tsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './ui'

const navLinkClass = (active: boolean) =>
  `text-sm font-medium transition-colors ${active ? 'text-accent' : 'text-ink-muted hover:text-ink'}`

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-edge bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-sm font-black uppercase tracking-wide text-ink">
            🐺 Wolfpack
          </Link>
          <Link to="/news" className={navLinkClass(location.pathname === '/news')}>News</Link>
          <Link to="/blog" className={navLinkClass(location.pathname === '/blog')}>Blog</Link>
          <Link to="/vlog" className={navLinkClass(location.pathname === '/vlog')}>Vlog</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/book">
                <Button variant="primary" className="px-4 py-2">Book a slot</Button>
              </Link>
              <Link to="/my-reservations" className={navLinkClass(location.pathname === '/my-reservations')}>
                My Reservations
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary" className="px-4 py-2">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 2 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/TopNav.tsx
git commit -m "feat: restyle TopNav with dark athletic theme"
```

---

### Task 4: HomePage + PostCard Restyle (Big Hero)

**Files:**
- Modify: `frontend/src/content/PostCard.tsx`
- Modify: `frontend/src/content/HomePage.tsx`
- Test: `frontend/src/test/content/PostCard.test.tsx` (existing — do not modify, must still pass)

**Interfaces:**
- Consumes: `Badge`, `Card`, `Button`, `Spinner`, `ErrorMessage`, `EmptyState` from `../components/ui` (Task 2); `TopNav` (Task 3); `PostView`, `getPosts` from `../api/posts` (unchanged).
- Produces: `PostCard({ post: PostView })` unchanged signature — consumed by Task 5 and Task 6.

- [ ] **Step 1: Confirm the existing PostCard test baseline**

Run: `cd frontend && npx vitest run src/test/content/PostCard.test.tsx`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  3 passed (3)`. This must still be true after Step 2 — the test asserts `getByRole('link', { name: 'Big News' })`, `getByText('Admin')`, and `getByText(/watch/i)`, so the restyled card must keep the link's accessible name equal to exactly `post.title`, the author name as its own text node, and VLOG cards showing text matching `/watch/i`.

- [ ] **Step 2: Replace `PostCard.tsx`**

Replace `frontend/src/content/PostCard.tsx` with:

```tsx
import { Link } from 'react-router-dom'
import type { PostView } from '../api/posts'
import { Badge, Card } from '../components/ui'

interface Props { post: PostView }

function extractYoutubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return match ? match[1] : null
}

export function PostCard({ post }: Props) {
  const date = new Date(post.publishedAt).toLocaleDateString()
  const thumbnailId = post.type === 'VLOG' && post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null

  return (
    <Card className="overflow-hidden">
      {thumbnailId && (
        <img
          src={`https://img.youtube.com/vi/${thumbnailId}/hqdefault.jpg`}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-4">
        <Badge type={post.type} />
        <div className="mt-2">
          <Link to={`/posts/${post.slug}`} className="font-display text-lg font-black text-ink hover:text-accent">
            {post.title}
          </Link>
        </div>
        <div className="mt-1 text-xs text-ink-muted">
          <span>{post.authorName}</span><span> · </span><span>{date}</span>
        </div>
        {post.type === 'VLOG' && post.youtubeUrl && (
          <div className="mt-2">
            <a
              href={post.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:text-accent-hi"
            >
              Watch on YouTube
            </a>
          </div>
        )}
        {post.type !== 'VLOG' && post.body && (
          <p className="mt-2 text-sm text-ink-muted">
            {post.body.slice(0, 160)}{post.body.length > 160 ? '…' : ''}
          </p>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Run PostCard test to verify it still passes**

Run: `cd frontend && npx vitest run src/test/content/PostCard.test.tsx`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  3 passed (3)`, identical to Step 1.

- [ ] **Step 4: Replace `HomePage.tsx`**

Replace `frontend/src/content/HomePage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function HomePage() {
  const [announcements, setAnnouncements] = useState<PostView[]>([])
  const [news, setNews] = useState<PostView[]>([])
  const [blogs, setBlogs] = useState<PostView[]>([])
  const [vlogs, setVlogs] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getPosts({ type: 'ANNOUNCEMENT', size: 5 }),
      getPosts({ type: 'NEWS', size: 3 }),
      getPosts({ type: 'BLOG', size: 3 }),
      getPosts({ type: 'VLOG', size: 3 }),
    ])
      .then(([a, n, b, v]) => {
        setAnnouncements(a.content)
        setNews(n.content)
        setBlogs(b.content)
        setVlogs(v.content)
      })
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false))
  }, [])

  const isEmpty = announcements.length === 0 && news.length === 0 && blogs.length === 0 && vlogs.length === 0

  return (
    <>
      <TopNav />
      <section className="bg-gradient-to-b from-surface to-bg px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Train with the pack</div>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight text-ink sm:text-6xl">
            Stronger<br />Every Day.
          </h1>
          <p className="mt-4 text-sm text-ink-muted">24/7 gym · hourly slots · book in seconds</p>
          <Link to="/book" className="mt-6 inline-block">
            <Button variant="primary" className="px-6 py-3 text-base">Book your slot →</Button>
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && <Spinner />}
        {!loading && error && <ErrorMessage message={error} />}
        {!loading && !error && (
          <>
            {announcements.length > 0 && (
              <div className="mb-8 space-y-2">
                {announcements.map(p => (
                  <Link
                    key={p.id}
                    to={`/posts/${p.slug}`}
                    className="block rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink hover:border-accent"
                  >
                    <span className="mr-2 font-bold text-accent">📣 Announcement</span>
                    {p.title}
                  </Link>
                ))}
              </div>
            )}

            {([
              ['News', news, '/news'],
              ['Blog', blogs, '/blog'],
              ['Vlog', vlogs, '/vlog'],
            ] as const).map(([label, posts, href]) =>
              posts.length > 0 ? (
                <section key={label} className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-xl font-black uppercase tracking-tight text-ink">{label}</h2>
                    <Link to={href} className="text-sm font-medium text-accent hover:text-accent-hi">View all →</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map(p => <PostCard key={p.id} post={p} />)}
                  </div>
                </section>
              ) : null
            )}

            {isEmpty && <EmptyState message="No posts yet." />}
          </>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 5: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 3 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/content/PostCard.tsx src/content/HomePage.tsx
git commit -m "feat: restyle homepage with big hero and PostCard"
```

---

### Task 5: News / Blog / Vlog List Pages Restyle

**Files:**
- Modify: `frontend/src/content/NewsPage.tsx`
- Modify: `frontend/src/content/BlogPage.tsx`
- Modify: `frontend/src/content/VlogPage.tsx`

**Interfaces:**
- Consumes: `PostCard` (Task 4), `TopNav` (Task 3), `Button`, `PageHeader`, `Spinner`, `ErrorMessage`, `EmptyState` from `../components/ui` (Task 2). Fetch/merge/pagination logic is unchanged from the current implementation.

- [ ] **Step 1: Confirm no dedicated tests exist for these pages**

Run: `cd frontend && find src/test -iname "*newspage*" -o -iname "*blogpage*" -o -iname "*vlogpage*"`
Expected: no output — no dedicated test files, so this task is gated only by the full-suite baseline.

- [ ] **Step 2: Replace `NewsPage.tsx`**

Replace `frontend/src/content/NewsPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, PageHeader, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function NewsPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const size = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      getPosts({ type: 'NEWS', page, size }),
      getPosts({ type: 'ANNOUNCEMENT', page, size }),
    ])
      .then(([newsPage, announcementPage]) => {
        const merged = [...newsPage.content, ...announcementPage.content]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        setPosts(merged)
        const newsHasMore = (page + 1) * size < newsPage.total
        const announcementHasMore = (page + 1) * size < announcementPage.total
        setHasMore(newsHasMore || announcementHasMore)
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="News" subtitle="Announcements and news from the gym" />
        <div className="mt-6">
          {loading && <Spinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && posts.length === 0 && <EmptyState message="No news yet." />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(p => p - 1)}>← Previous</Button>}
          {hasMore && <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Replace `BlogPage.tsx`**

Replace `frontend/src/content/BlogPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, PageHeader, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function BlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    getPosts({ type: 'BLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => setError('Failed to load blog posts'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Blog" subtitle="Training tips and gym updates" />
        <div className="mt-6">
          {loading && <Spinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && posts.length === 0 && <EmptyState message="No blog posts yet." />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(p => p - 1)}>← Previous</Button>}
          {(page + 1) * size < total && <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Replace `VlogPage.tsx`**

Replace `frontend/src/content/VlogPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, PageHeader, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function VlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    getPosts({ type: 'VLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => setError('Failed to load vlogs'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Vlog" subtitle="Training videos from the team" />
        <div className="mt-6">
          {loading && <Spinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && posts.length === 0 && <EmptyState message="No vlogs yet." />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(p => p - 1)}>← Previous</Button>}
          {(page + 1) * size < total && <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 4 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/content/NewsPage.tsx src/content/BlogPage.tsx src/content/VlogPage.tsx
git commit -m "feat: restyle news, blog and vlog list pages"
```

---

### Task 6: Post Detail Page Restyle

**Files:**
- Modify: `frontend/src/content/PostPage.tsx`

**Interfaces:**
- Consumes: `Badge`, `Spinner`, `ErrorMessage` from `../components/ui` (Task 2), `TopNav` (Task 3), `getPost`/`PostView` from `../api/posts` (unchanged).

- [ ] **Step 1: Confirm no dedicated test exists**

Run: `cd frontend && find src/test -iname "*postpage*"`
Expected: no output.

- [ ] **Step 2: Replace `PostPage.tsx`**

Replace `frontend/src/content/PostPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { getPost, type PostView } from '../api/posts'
import { Badge, Spinner, ErrorMessage } from '../components/ui'

function extractYoutubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return match ? match[1] : null
}

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostView | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    getPost(slug).then(setPost).catch(() => setError(true))
  }, [slug])

  if (error) return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorMessage message="Post not found." />
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hi">
          Back to home
        </Link>
      </div>
    </>
  )

  if (!post) return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Spinner />
      </div>
    </>
  )

  const date = new Date(post.publishedAt).toLocaleDateString()
  const videoId = post.type === 'VLOG' && post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs text-ink-muted">
          <Link to="/" className="hover:text-ink">Home</Link> · {post.type}
        </p>
        <div className="mt-3">
          <Badge type={post.type} />
        </div>
        <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-ink">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{post.authorName} · {date}</p>
        {videoId && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-xl">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              title={post.title}
            />
          </div>
        )}
        {post.body && (
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink-muted">{post.body}</p>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 5 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/content/PostPage.tsx
git commit -m "feat: restyle post detail page"
```

---

### Task 7: Auth Pages Restyle (Login + Register)

**Files:**
- Modify: `frontend/src/auth/LoginPage.tsx`
- Modify: `frontend/src/auth/RegisterPage.tsx`
- Test: `frontend/src/test/auth/LoginPage.test.tsx` (existing — do not modify)

**Interfaces:**
- Consumes: `Button`, `Card`, `Input`, `Label`, `ErrorMessage` from `../components/ui` (Task 2). `useAuth`, `login`, `register`, `googleLoginUrl` unchanged.

- [ ] **Step 1: Confirm the existing LoginPage test baseline**

Run: `cd frontend && npx vitest run src/test/auth/LoginPage.test.tsx`
Expected: FAIL (pre-existing) — currently fails with `Found a label with the text of: /email/i, however no form control was found associated to that label`, because the current markup nests the input inside a `<label>` with no `for`/`id` and additionally the submit button never has accessible name `/sign in/i` (it says "Login"). Confirm 1 failed test, matching the Global Constraints baseline.

- [ ] **Step 2: Replace `LoginPage.tsx`**

Replace `frontend/src/auth/LoginPage.tsx` with:

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { login, googleLoginUrl } from '../api/auth'
import { Button, Card, Input, Label, ErrorMessage } from '../components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await login(email, password)
      authLogin(token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center font-display text-lg font-black uppercase tracking-wide text-ink">
          🐺 Wolfpack Unity
        </div>
        <h1 className="mb-4 font-display text-2xl font-black uppercase tracking-tight text-ink">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="login-email">Email:</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="login-password">Password:</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 border-t border-edge pt-6">
          <a
            href={googleLoginUrl()}
            className="block rounded-full border border-edge px-5 py-2.5 text-center text-sm font-semibold text-ink hover:border-accent hover:text-accent"
          >
            Login with Google
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don't have an account? <Link to="/register" className="text-accent hover:text-accent-hi">Register here</Link>
        </p>
      </Card>
    </div>
  )
}
```

Note: this now correctly associates each `<Label htmlFor>` with its `<Input id>`, which resolves the original "no form control associated to label" error — but the test still expects a button named `/sign in/i` and this page intentionally keeps the visible text "Login" (per spec: no visible-text changes), so the test still fails, just at the later assertion. The pre-existing failure count for this file does not change.

- [ ] **Step 3: Run LoginPage test to verify it still fails the same way (not worse)**

Run: `cd frontend && npx vitest run src/test/auth/LoginPage.test.tsx`
Expected: FAIL — 1 failed test, same as Step 1, now failing on `Unable to find an accessible element with the role "button" and name "/sign in/i"` instead of the label-association error. Still exactly 1 failing test in this file — baseline preserved.

- [ ] **Step 4: Replace `RegisterPage.tsx`**

Replace `frontend/src/auth/RegisterPage.tsx` with:

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { register } from '../api/auth'
import { Button, Card, Input, Label, ErrorMessage } from '../components/ui'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await register(name, email, password)
      login(token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center font-display text-lg font-black uppercase tracking-wide text-ink">
          🐺 Wolfpack Unity
        </div>
        <h1 className="mb-4 font-display text-2xl font-black uppercase tracking-tight text-ink">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="register-name">Name:</Label>
            <Input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-4">
            <Label htmlFor="register-email">Email:</Label>
            <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <Label htmlFor="register-password">Password:</Label>
            <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account? <Link to="/login" className="text-accent hover:text-accent-hi">Login here</Link>
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 6 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/auth/LoginPage.tsx src/auth/RegisterPage.tsx
git commit -m "feat: restyle login and register pages"
```

---

### Task 8: Booking Pages Restyle (Slot Grid, Slot Row, Booking Modal, My Reservations)

**Files:**
- Modify: `frontend/src/slots/SlotGridPage.tsx`
- Modify: `frontend/src/slots/SlotRow.tsx`
- Modify: `frontend/src/slots/BookingModal.tsx`
- Modify: `frontend/src/slots/MyReservationsPage.tsx`
- Test: `frontend/src/test/slots/SlotRow.test.tsx` (existing — do not modify)
- Test: `frontend/src/test/slots/MyReservationsPage.test.tsx` (existing — do not modify)

**Interfaces:**
- Consumes: `TopNav` (Task 3), `Button`, `Card`, `Input`, `PageHeader`, `Spinner`, `ErrorMessage`, `EmptyState` from `../components/ui` (Task 2).
- `SlotRow` keeps its existing prop shape `{ slot: SlotView, onSelectSpot: (hour: number, spotNumber: number) => void }` — do NOT change to match the test's expected `{ hour, spots, onSpotClick }` shape; that mismatch is a pre-existing, out-of-scope issue (Global Constraints).
- `MyReservationsPage` keeps importing `getMyReservations`/`cancelReservation` from `../api/slots` (NOT `../api/reservations`) — do NOT switch the import; that mismatch with the test's mocked module is the pre-existing, out-of-scope issue.

- [ ] **Step 1: Confirm the existing SlotRow and MyReservationsPage test baselines**

Run: `cd frontend && npx vitest run src/test/slots/SlotRow.test.tsx src/test/slots/MyReservationsPage.test.tsx`
Expected: FAIL — `Test Files  2 failed (2)`, `Tests  5 failed (5)` (3 in SlotRow.test.tsx from a `TypeError: Cannot read properties of undefined (reading 'hour')`, 2 in MyReservationsPage.test.tsx from the wrong mocked module causing a real, unmocked network call). This matches the Global Constraints baseline.

- [ ] **Step 2: Replace `SlotRow.tsx`**

Replace `frontend/src/slots/SlotRow.tsx` with:

```tsx
import type { SlotView } from '../api/slots'

interface SlotRowProps {
  slot: SlotView
  onSelectSpot: (hour: number, spotNumber: number) => void
}

export function SlotRow({ slot, onSelectSpot }: SlotRowProps) {
  const timeStr = String(slot.hour).padStart(2, '0') + ':00'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface p-3">
      <div className="min-w-[56px] font-display text-sm font-bold text-ink">{timeStr}</div>
      <div className="flex flex-wrap gap-2">
        {slot.spots.map((spot) => (
          <button
            key={spot.number}
            onClick={() => onSelectSpot(slot.hour, spot.number)}
            disabled={!spot.available}
            title={spot.mine ? 'Your reservation' : (spot.available ? 'Available' : 'Taken')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              spot.mine
                ? 'border border-accent bg-accent/20 text-accent'
                : spot.available
                ? 'border border-edge bg-surface-2 text-ink hover:border-accent hover:text-accent'
                : 'cursor-not-allowed border border-edge bg-surface text-ink-muted/50'
            }`}
          >
            {spot.number}
          </button>
        ))}
      </div>
    </div>
  )
}
```

Note: keeps the exact `{ slot, onSelectSpot }` prop shape from before — only class names changed.

- [ ] **Step 3: Replace `BookingModal.tsx`**

Replace `frontend/src/slots/BookingModal.tsx` with:

```tsx
import { useState } from 'react'
import { book } from '../api/slots'
import { Button, Card, ErrorMessage } from '../components/ui'

interface BookingModalProps {
  date: string
  hour: number
  spotNumber: number
  onClose: () => void
  onSuccess: () => void
}

export function BookingModal({ date, hour, spotNumber, onClose, onSuccess }: BookingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await book({ date, hour, spotNumber })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const timeStr = String(hour).padStart(2, '0') + ':00'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-sm p-6">
        <h2 className="font-display text-xl font-black uppercase tracking-tight text-ink">Confirm Booking</h2>
        <p className="mt-3 text-sm text-ink-muted">Date: {date}</p>
        <p className="text-sm text-ink-muted">Time: {timeStr}</p>
        <p className="text-sm text-ink-muted">Spot: #{spotNumber}</p>

        {error && <div className="mt-3"><ErrorMessage message={error} /></div>}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading} className="flex-1">
            {loading ? 'Booking...' : 'Confirm'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Replace `SlotGridPage.tsx`**

Replace `frontend/src/slots/SlotGridPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSlots, type SlotView } from '../api/slots'
import { SlotRow } from './SlotRow'
import { BookingModal } from './BookingModal'
import { TopNav } from '../components/TopNav'
import { PageHeader, Input, Button, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function SlotGridPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<SlotView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<{ hour: number; spotNumber: number } | null>(null)

  useEffect(() => {
    loadSlots()
  }, [date])

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSlots(date)
      setSlots(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSpot = (hour: number, spotNumber: number) => {
    setSelectedSlot({ hour, spotNumber })
  }

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="Book a Spot" />
          <Link to="/my-reservations">
            <Button variant="ghost">My Reservations</Button>
          </Link>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-ink-muted" htmlFor="slot-date">Select Date</label>
          <Input id="slot-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {loading ? (
          <Spinner />
        ) : slots.length === 0 ? (
          <EmptyState message="No slots available" />
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <SlotRow key={slot.hour} slot={slot} onSelectSpot={handleSelectSpot} />
            ))}
          </div>
        )}

        {selectedSlot && (
          <BookingModal
            date={date}
            hour={selectedSlot.hour}
            spotNumber={selectedSlot.spotNumber}
            onClose={() => setSelectedSlot(null)}
            onSuccess={loadSlots}
          />
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 5: Replace `MyReservationsPage.tsx`**

Replace `frontend/src/slots/MyReservationsPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyReservations, cancelReservation, type ReservationView } from '../api/slots'
import { TopNav } from '../components/TopNav'
import { PageHeader, Button, ErrorMessage, EmptyState, Spinner } from '../components/ui'

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyReservations()
      setReservations(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      await cancelReservation(id)
      setReservations(reservations.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(null)
    }
  }

  const timeStr = (hour: number) => String(hour).padStart(2, '0') + ':00'

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="My Reservations" />
          <Link to="/book">
            <Button variant="ghost">Book a Spot</Button>
          </Link>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {loading ? (
          <Spinner />
        ) : reservations.length === 0 ? (
          <EmptyState message="No upcoming reservations" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-edge">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Spot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3 text-ink">{res.date}</td>
                    <td className="px-4 py-3 text-ink">{timeStr(res.hour)}</td>
                    <td className="px-4 py-3 text-ink">#{res.spotNumber}</td>
                    <td className="px-4 py-3 text-ink">{res.status}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        onClick={() => handleCancel(res.id)}
                        disabled={cancelling === res.id}
                        className="px-3 py-1.5 text-xs"
                      >
                        {cancelling === res.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 6: Run the two touched test files to verify same pass/fail outcome as Step 1**

Run: `cd frontend && npx vitest run src/test/slots/SlotRow.test.tsx src/test/slots/MyReservationsPage.test.tsx`
Expected: FAIL — `Test Files  2 failed (2)`, `Tests  5 failed (5)`, identical counts and failure reasons to Step 1 (SlotRow still throws `TypeError: Cannot read properties of undefined (reading 'hour')` because its test passes the wrong prop shape; MyReservationsPage still shows "Failed to load reservations" / "No upcoming reservations" because the test mocks the wrong module).

- [ ] **Step 7: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 7 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`.

- [ ] **Step 8: Commit**

```bash
cd frontend
git add src/slots/SlotGridPage.tsx src/slots/SlotRow.tsx src/slots/BookingModal.tsx src/slots/MyReservationsPage.tsx
git commit -m "feat: restyle booking pages and add TopNav to slot grid and my reservations"
```

---

### Task 9: Admin Panel Restyle

**Files:**
- Modify: `frontend/src/admin/AdminLayout.tsx`
- Modify: `frontend/src/admin/UsersTable.tsx`
- Modify: `frontend/src/admin/ReservationsTable.tsx`
- Modify: `frontend/src/admin/StatsView.tsx`
- Modify: `frontend/src/admin/PostsTable.tsx`
- Modify: `frontend/src/admin/PostForm.tsx`
- Test: `frontend/src/test/admin/PostForm.test.tsx` (existing — do not modify)

**Interfaces:**
- Consumes: `TopNav` (Task 3), `Button`, `Card`, `Badge`, `Input`, `Label`, `Select`, `Textarea`, `PageHeader`, `Spinner`, `ErrorMessage` from `../components/ui` (Task 2).
- `PostForm` keeps the exact `aria-label` values `"Type"`, `"Title"`, `"Slug"`, `"Body"`, `"YouTube URL"` on its form controls, and button text `"Save"` / `"Cancel"` — the existing test asserts these directly.

- [ ] **Step 1: Confirm the existing PostForm test baseline**

Run: `cd frontend && npx vitest run src/test/admin/PostForm.test.tsx`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  3 passed (3)`.

- [ ] **Step 2: Replace `PostForm.tsx`**

Replace `frontend/src/admin/PostForm.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import type { PostRequest, PostView } from '../api/posts'
import { Button, Input, Label, Select, Textarea } from '../components/ui'

interface Props {
  initial?: PostView
  onSave: (req: PostRequest) => void
  onCancel: () => void
}

export function PostForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'>(initial?.type ?? 'NEWS')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [body, setBody] = useState(initial?.body ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')

  const deriveSlug = (titleText: string): string => {
    return titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    setSlugManuallyEdited(false)
  }, [initial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ type, title, slug: slug || undefined, body: body || undefined, youtubeUrl: youtubeUrl || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <Label>Type</Label>
        <Select
          aria-label="Type"
          value={type}
          onChange={e => {
            const newType = e.target.value as 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'
            setType(newType)
            if (newType !== 'VLOG') {
              setYoutubeUrl('')
            }
          }}
        >
          <option value="NEWS">NEWS</option>
          <option value="BLOG">BLOG</option>
          <option value="VLOG">VLOG</option>
          <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          aria-label="Title"
          value={title}
          onChange={e => {
            const newTitle = e.target.value
            setTitle(newTitle)
            if (!slugManuallyEdited) {
              setSlug(deriveSlug(newTitle))
            }
          }}
          required
        />
      </div>
      <div>
        <Label>Slug (auto-filled from title, editable)</Label>
        <Input
          aria-label="Slug"
          value={slug}
          onChange={e => {
            setSlugManuallyEdited(true)
            setSlug(e.target.value)
          }}
        />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea aria-label="Body" value={body} onChange={e => setBody(e.target.value)} rows={6} />
      </div>
      {type === 'VLOG' && (
        <div>
          <Label>YouTube URL</Label>
          <Input aria-label="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Run PostForm test to verify it still passes**

Run: `cd frontend && npx vitest run src/test/admin/PostForm.test.tsx`
Expected: PASS — `Test Files  1 passed (1)`, `Tests  3 passed (3)`, identical to Step 1.

- [ ] **Step 4: Replace `AdminLayout.tsx`**

Replace `frontend/src/admin/AdminLayout.tsx` with:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersTable } from './UsersTable'
import { ReservationsTable } from './ReservationsTable'
import { StatsView } from './StatsView'
import { PostsTable } from './PostsTable'
import { TopNav } from '../components/TopNav'
import { Button, PageHeader } from '../components/ui'

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'stats', label: 'Stats' },
  { key: 'content', label: 'Content' },
] as const

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['key']>('users')

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="Admin Panel" />
          <Link to="/">
            <Button variant="ghost">Back to App</Button>
          </Link>
        </div>

        <div className="mb-6 flex gap-6 border-b border-edge">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'reservations' && <ReservationsTable />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'content' && <PostsTable />}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Replace `UsersTable.tsx`**

Replace `frontend/src/admin/UsersTable.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser, type UserRecord } from '../api/admin'
import { Button, Select, Spinner, ErrorMessage } from '../components/ui'

export function UsersTable() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setAction(userId)
    try {
      await updateUserRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role')
    } finally {
      setAction(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user?')) return
    setAction(userId)
    try {
      await deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setAction(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-ink">{user.name}</td>
                <td className="px-4 py-3 text-ink">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={action === user.id}
                    className="w-auto"
                  >
                    <option>USER</option>
                    <option>ADMIN</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                    disabled={action === user.id}
                    className="px-3 py-1.5 text-xs"
                  >
                    {action === user.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Replace `ReservationsTable.tsx`**

Replace `frontend/src/admin/ReservationsTable.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { getReservations, cancelAdminReservation } from '../api/admin'
import type { ReservationView } from '../api/slots'
import { Button, Input, Spinner, ErrorMessage } from '../components/ui'

export function ReservationsTable() {
  const [reservations, setReservations] = useState<ReservationView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    loadReservations()
  }, [filterDate])

  const loadReservations = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getReservations(filterDate || undefined)
      setReservations(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      await cancelAdminReservation(id)
      setReservations(reservations.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(null)
    }
  }

  const timeStr = (hour: number) => String(hour).padStart(2, '0') + ':00'

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-ink-muted" htmlFor="reservations-filter-date">Filter by Date</label>
        <Input
          id="reservations-filter-date"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        {filterDate && (
          <Button variant="ghost" onClick={() => setFilterDate('')} className="px-3 py-1.5 text-xs">Clear</Button>
        )}
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Spot</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr key={res.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-ink">{res.date}</td>
                <td className="px-4 py-3 text-ink">{timeStr(res.hour)}</td>
                <td className="px-4 py-3 text-ink">#{res.spotNumber}</td>
                <td className="px-4 py-3 text-ink">{res.status}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(res.id)}
                    disabled={cancelling === res.id}
                    className="px-3 py-1.5 text-xs"
                  >
                    {cancelling === res.id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Replace `StatsView.tsx`**

Replace `frontend/src/admin/StatsView.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { getStats, type StatsView as StatsViewType } from '../api/admin'
import { Spinner, ErrorMessage } from '../components/ui'

export function StatsView() {
  const [stats, setStats] = useState<StatsViewType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStats()
      setStats(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {stats && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-edge bg-surface p-4">
              <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Daily Occupancy (Last 30 days)</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyOccupancy.slice(0, 10).map((item) => (
                    <tr key={item.date} className="border-b border-edge last:border-0">
                      <td className="px-3 py-2 text-ink">{item.date}</td>
                      <td className="px-3 py-2 text-ink">{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-edge bg-surface p-4">
              <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Busiest Hours (Top 10)</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2">Hour</th>
                    <th className="px-3 py-2">Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.busiestHours.map((item) => (
                    <tr key={item.hour} className="border-b border-edge last:border-0">
                      <td className="px-3 py-2 text-ink">{String(item.hour).padStart(2, '0')}:00</td>
                      <td className="px-3 py-2 text-ink">{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-edge bg-surface p-4">
            <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Top Users</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Total Bookings</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.email} className="border-b border-edge last:border-0">
                    <td className="px-3 py-2 text-ink">{user.name}</td>
                    <td className="px-3 py-2 text-ink">{user.email}</td>
                    <td className="px-3 py-2 text-ink">{user.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Replace `PostsTable.tsx`**

Replace `frontend/src/admin/PostsTable.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { getPosts, createPost, updatePost, deletePost, type PostView } from '../api/posts'
import { PostForm } from './PostForm'
import { Button, Badge, Spinner, ErrorMessage } from '../components/ui'

export function PostsTable() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<PostView | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadPosts() }, [])

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPosts({ size: 100 })
      setPosts(data.content)
    } catch {
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (req: Parameters<typeof createPost>[0]) => {
    try {
      const created = await createPost(req)
      setPosts(prev => [created, ...prev])
      setCreating(false)
    } catch {
      setError('Failed to create post')
    }
  }

  const handleUpdate = async (req: Parameters<typeof updatePost>[1]) => {
    if (!editing) return
    try {
      const updated = await updatePost(editing.id, req)
      setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditing(null)
    } catch {
      setError('Failed to update post')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Failed to delete post')
    }
  }

  if (creating) return <PostForm onSave={handleCreate} onCancel={() => setCreating(false)} />
  if (editing) return <PostForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      <Button onClick={() => setCreating(true)} className="mb-4">New Post</Button>
      {loading && <Spinner />}
      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-ink">{post.title}</td>
                <td className="px-4 py-3"><Badge type={post.type} /></td>
                <td className="px-4 py-3 text-ink">{new Date(post.publishedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEditing(post)} className="px-3 py-1.5 text-xs">Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(post.id)} className="px-3 py-1.5 text-xs">Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && posts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-muted">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Verify build and full-suite baseline**

Run: `cd frontend && npm run build`
Expected: exits 0.

Run: `cd frontend && npx vitest run`
Expected: unchanged from Task 8 — `Test Files  3 failed | 3 passed (6)`, `Tests  6 failed | 11 passed (17)`. This is the final baseline for the whole redesign: the same 3 pre-existing files fail for the same pre-existing reasons, everything else (including all 5 new UI-library tests and the 3 PostCard / 3 PostForm tests) passes.

- [ ] **Step 10: Commit**

```bash
cd frontend
git add src/admin/AdminLayout.tsx src/admin/UsersTable.tsx src/admin/ReservationsTable.tsx src/admin/StatsView.tsx src/admin/PostsTable.tsx src/admin/PostForm.tsx
git commit -m "feat: restyle admin panel with dark athletic theme"
```

---

## Final Manual Verification (after all tasks)

Not a task with its own commit — a checklist to run once Task 9 is done, before handing off to `superpowers:finishing-a-development-branch`:

1. Start PostgreSQL, backend (`JWT_SECRET="dev-secret-min-32-chars-required-!!" mvn spring-boot:run -Dspring-boot.run.profiles=dev` from `backend/`), and frontend (`npm run dev -- --host` from `frontend/`).
2. Visit `/` — big hero renders with amber CTA, announcement strip (if any posts exist), News/Blog/Vlog sections.
3. Visit `/news`, `/blog`, `/vlog`, and a `/posts/:slug` — cards, pagination, and the post detail page all render in the dark theme.
4. Visit `/login` and `/register` — centered dark card, amber submit button.
5. Log in, visit `/book` — TopNav now visible, slot grid themed, booking modal opens and themes correctly.
6. Visit `/my-reservations` — TopNav now visible, table themed.
7. Log in as admin, visit `/admin` — TopNav now visible, tab nav themed, each tab (Users, Reservations, Stats, Content) renders correctly, PostForm create/edit flow works.
8. Confirm no light-mode flash and no console errors in the browser dev tools on any page.
