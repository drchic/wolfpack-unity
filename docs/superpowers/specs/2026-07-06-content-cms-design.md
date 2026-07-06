# Wolfpack Unity — Content CMS Design

## Goal

Extend the existing wolfpack-unity app with a public-facing content section so existing members can read gym news, blog posts, competition results, training tips, and vlogs — all managed by admins from within the existing admin panel.

## Architecture

A single `posts` table with a `type` discriminator covers all content types. Public read endpoints require no authentication. Write endpoints are restricted to the ADMIN role. The frontend adds public-facing routes for listing and reading content, a top nav linking to each section, and a Content tab in the existing admin panel.

**Tech stack:** Spring Boot 3.3 · jOOQ 3.20 · PostgreSQL 16 · React 18 · Vite · TypeScript

## Global Constraints

- Java 21, Spring Boot 3.3.13, jOOQ 3.20.7, PostgreSQL 16
- Follow existing package structure: `com.wolfpackunity.gym.<domain>`
- Follow existing frontend structure: feature folders under `src/`
- jOOQ codegen runs manually after each migration (`mvn jooq-codegen:generate`)
- No new dependencies beyond what's already in pom.xml and package.json
- All admin write endpoints protected by existing ADMIN role check
- Public GET endpoints added to `permitAll()` in SecurityConfig

---

## Data Model

New Flyway migration (`V4__create_posts.sql`):

```sql
CREATE TYPE post_type AS ENUM ('NEWS', 'BLOG', 'VLOG', 'ANNOUNCEMENT');

CREATE TABLE posts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type          post_type    NOT NULL,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    body          TEXT,
    youtube_url   VARCHAR(500),
    author_id     UUID         NOT NULL REFERENCES gym_user(id),
    published_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

- `slug` is auto-generated from `title` on create (lowercased, spaces → hyphens, special chars stripped), but can be overridden by the admin.
- `youtube_url` is nullable; only meaningful when `type = 'VLOG'`.
- `body` is plain text / markdown; the frontend renders it as-is.
- No `updated_at` — posts are replaced by creating a new version if needed (YAGNI).

---

## Backend

### Package: `com.wolfpackunity.gym.post`

**Files:**
- `PostType.java` — enum: `NEWS`, `BLOG`, `VLOG`, `ANNOUNCEMENT`
- `PostRepository.java` — jOOQ queries: list (paginated, filterable by type), findBySlug, insert, update, delete
- `PostService.java` — business logic: slug generation, author assignment from JWT principal
- `PostController.java` — REST controller
- `dto/PostView.java` — read DTO (id, type, title, slug, body, youtubeUrl, authorName, publishedAt)
- `dto/PostRequest.java` — write DTO (type, title, slug [optional], body, youtubeUrl)

### Endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/posts` | public | `Page<PostView>` — query params: `type`, `page` (0-based), `size` (default 20) |
| `GET` | `/api/posts/{slug}` | public | `PostView` |
| `POST` | `/api/posts` | ADMIN | `PostView` (201) |
| `PUT` | `/api/posts/{id}` | ADMIN | `PostView` (200) |
| `DELETE` | `/api/posts/{id}` | ADMIN | 204 |

### SecurityConfig changes

Add to `permitAll()`:
```java
.requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
```

---

## Frontend

### New pages

| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` | Pinned announcements (type=ANNOUNCEMENT) + 3 most recent from each other type |
| `/news` | `NewsPage` | Paginated list of NEWS + ANNOUNCEMENT posts |
| `/blog` | `BlogPage` | Paginated list of BLOG posts |
| `/vlog` | `VlogPage` | Paginated list of VLOG posts with YouTube embeds |
| `/posts/:slug` | `PostPage` | Full single post; if type=VLOG shows embedded YouTube player |

### Navigation

`TopNav` updated:
- Left: **Home · News · Blog · Vlog**
- Right: **Book a slot** (links to `/book`, visible when logged in) · **Login** / **My account** dropdown

### API client

New file `src/api/posts.ts`:
- `getPosts(params: { type?, page?, size? })` → `PageResponse<PostView>`
- `getPost(slug: string)` → `PostView`
- `createPost(req: PostRequest)` → `PostView`
- `updatePost(id: string, req: PostRequest)` → `PostView`
- `deletePost(id: string)` → `void`

### Admin panel

New **Content** tab in `AdminLayout` alongside Users and Reservations:
- `PostsTable` — lists all posts (title, type, published date) with Edit and Delete buttons
- `PostForm` — create/edit form: type selector, title, slug (auto-filled, editable), body textarea, YouTube URL field (visible only when type = VLOG)

### YouTube embed

For VLOG posts, extract the video ID from the stored URL and render:
```html
<iframe src="https://www.youtube.com/embed/{videoId}" ... />
```

---

## Testing

**Backend:**
- `PostServiceTest` — slug generation (special chars, duplicates), author assignment
- `PostControllerTest` — GET endpoints return 200 without auth; POST/PUT/DELETE return 403 for non-admin

**Frontend:**
- `PostsTable.test.tsx` — renders posts, delete confirmation
- `PostForm.test.tsx` — YouTube URL field shown/hidden based on type

---

## Out of Scope

- Image uploads / cover photos (future)
- Draft / scheduled publishing (future)
- Member comments (future)
- Rich text / WYSIWYG editor (future)
- Series / playlists for vlogs (future)
