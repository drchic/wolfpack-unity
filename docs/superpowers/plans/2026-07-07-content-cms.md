# Wolfpack Unity Content CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add news, blog, vlog, and announcement content to the wolfpack-unity app — a `posts` table, a public REST API, public-facing pages with navigation, and an admin Content tab for CRUD.

**Architecture:** A single `posts` table with a `post_type` PG enum discriminates content type. Public GET endpoints require no auth; write endpoints require ADMIN role (checked in SecurityConfig). The frontend adds a TopNav, five public pages, and a new Content tab in the existing admin panel.

**Tech Stack:** Java 21 · Spring Boot 3.3.13 · jOOQ 3.20.7 · PostgreSQL 16 · Flyway · React 18 · Vite 5 · TypeScript 5 · Axios · @testing-library/react · Vitest · Testcontainers

## Global Constraints

- Java 21, Spring Boot 3.3.13, jOOQ 3.20.7, PostgreSQL 16 — no version changes
- Package root: `com.wolfpackunity.gym` — new code goes in `com.wolfpackunity.gym.post`
- Frontend feature folder: `src/content/` for public pages, existing `src/admin/` for admin tab
- No new Maven or npm dependencies — use what is already in `pom.xml` and `package.json`
- jOOQ codegen runs manually: `mvn jooq-codegen:generate` from `backend/` with local PG running
- All admin write endpoints protected by ADMIN role via SecurityConfig (not annotations)
- Existing routes `/login`, `/register`, `/my-reservations`, `/admin` must not break
- The slot booking page moves from `/` to `/book` — update every link that referenced `/`
- CORS allowed methods must include `PUT` (currently missing — add it in SecurityConfig)

---

### Task 1: Database Migration + jOOQ Codegen

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__create_posts.sql`

**Interfaces:**
- Consumes: nothing
- Produces: jOOQ generated `Tables.POSTS`, `com.wolfpackunity.gym.jooq.enums.PostType` (values: `NEWS`, `BLOG`, `VLOG`, `ANNOUNCEMENT`), `PostsRecord` — used by Task 2

- [ ] **Step 1: Write the migration file**

Create `backend/src/main/resources/db/migration/V4__create_posts.sql`:

```sql
CREATE TYPE post_type AS ENUM ('NEWS', 'BLOG', 'VLOG', 'ANNOUNCEMENT');

CREATE TABLE posts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type          post_type    NOT NULL,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    body          TEXT,
    youtube_url   VARCHAR(500),
    author_id     UUID         NOT NULL REFERENCES users(id),
    published_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Apply the migration by restarting the backend**

Stop the running backend (kill the `mvn spring-boot:run` process), then restart it. Spring Boot runs Flyway on startup, applying V4 automatically.

```bash
# From wolfpack-unity/backend/
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Expected log output includes:
```
Flyway: Migrating schema "public" to version 4 - create posts
Flyway: Successfully applied 1 migration to schema "public", now at version v4
```

Stop the backend again after it starts (Ctrl+C). It does not need to keep running for Step 3.

- [ ] **Step 3: Regenerate jOOQ sources**

```bash
# From wolfpack-unity/backend/
mvn jooq-codegen:generate
```

Expected: `BUILD SUCCESS`. Verify the generated files exist:

```bash
ls target/generated-sources/jooq/com/wolfpackunity/gym/jooq/enums/PostType.java
ls target/generated-sources/jooq/com/wolfpackunity/gym/jooq/tables/Posts.java
```

Both files must exist before continuing.

- [ ] **Step 4: Run existing tests to confirm no regressions**

```bash
mvn test
```

Expected: all existing tests pass (`AuthIntegrationTest`, `AdminIntegrationTest`, `ReservationIntegrationTest`, `CancellationPolicyTest`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V4__create_posts.sql \
        backend/target/generated-sources/jooq/
git commit -m "feat: add posts table migration and regenerate jOOQ sources"
```

---

### Task 2: Backend Post API

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostView.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostRequest.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostsPage.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/PostRepository.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/PostService.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/post/PostController.java`
- Modify: `backend/src/main/java/com/wolfpackunity/gym/exception/ErrorCode.java`
- Modify: `backend/src/main/java/com/wolfpackunity/gym/config/SecurityConfig.java`
- Create: `backend/src/test/java/com/wolfpackunity/gym/post/PostIntegrationTest.java`

**Interfaces:**
- Consumes: `Tables.POSTS`, `PostType` (jOOQ generated from Task 1), `Tables.USERS`, `DSLContext`, `AuthService`, `GymException`, `ErrorCode`
- Produces:
  - `GET /api/posts?type=&page=&size=` → `PostsPage`
  - `GET /api/posts/{slug}` → `PostView`
  - `POST /api/posts` (ADMIN) → `PostView` (201)
  - `PUT /api/posts/{id}` (ADMIN) → `PostView` (200)
  - `DELETE /api/posts/{id}` (ADMIN) → 204
  - `PostView` record: `(UUID id, String type, String title, String slug, String body, String youtubeUrl, String authorName, OffsetDateTime publishedAt)`

- [ ] **Step 1: Write the failing integration test**

Create `backend/src/test/java/com/wolfpackunity/gym/post/PostIntegrationTest.java`:

```java
package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.auth.AuthService;
import com.wolfpackunity.gym.auth.dto.LoginRequest;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PostIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18.4");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired AuthService authService;
    @Autowired DSLContext dsl;
    @MockBean com.wolfpackunity.gym.email.EmailService emailService;

    private String adminToken;

    @BeforeEach
    void setup() {
        authService.register(new RegisterRequest("Admin", "admin@example.com", "pw"));
        dsl.update(Tables.USERS).set(Tables.USERS.ROLE, UserRole.ADMIN)
                .where(Tables.USERS.EMAIL.eq("admin@example.com")).execute();
        adminToken = authService.login(new LoginRequest("admin@example.com", "pw")).token();
    }

    @Test
    void getPublicPosts_noAuth_returns200() throws Exception {
        mvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void createPost_withoutAuth_returns403() throws Exception {
        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Test Post","body":"Hello"}
                    """))
                .andExpect(status().isForbidden());
    }

    @Test
    void createPost_withAdminAuth_returns201() throws Exception {
        mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Breaking News","body":"Content here"}
                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("breaking-news"))
                .andExpect(jsonPath("$.type").value("NEWS"));
    }

    @Test
    void getPostBySlug_returns200() throws Exception {
        mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"BLOG","title":"My Blog Post","body":"Body text"}
                    """));
        mvc.perform(get("/api/posts/my-blog-post"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Blog Post"));
    }

    @Test
    void deletePost_withAdminAuth_returns204() throws Exception {
        String response = mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"ANNOUNCEMENT","title":"Delete Me","body":"bye"}
                    """))
                .andReturn().getResponse().getContentAsString();
        String id = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(response).get("id").asText();
        mvc.perform(delete("/api/posts/" + id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
mvn test -pl backend -Dtest=PostIntegrationTest
```

Expected: FAIL — `PostController` does not exist yet.

- [ ] **Step 3: Add POST_NOT_FOUND to ErrorCode**

In `backend/src/main/java/com/wolfpackunity/gym/exception/ErrorCode.java`, add one entry after `USER_NOT_FOUND`:

```java
POST_NOT_FOUND(HttpStatus.NOT_FOUND, "Post not found.");
```

The full enum after the change:

```java
package com.wolfpackunity.gym.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    SLOT_FULL(HttpStatus.CONFLICT, "All 10 spots are taken for this slot."),
    SPOT_TAKEN(HttpStatus.CONFLICT, "This spot is already booked."),
    DAILY_LIMIT_REACHED(HttpStatus.CONFLICT, "You already have 2 reservations on this day."),
    CANCELLATION_DEADLINE_PASSED(HttpStatus.BAD_REQUEST, "The cancellation deadline has passed."),
    PAST_SLOT(HttpStatus.BAD_REQUEST, "Cannot book a slot that has already started."),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Reservation not found."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "Post not found."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "An account with this email already exists.");

    public final HttpStatus status;
    public final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
```

- [ ] **Step 4: Create DTOs**

Create `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostView.java`:

```java
package com.wolfpackunity.gym.post.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PostView(
        UUID id,
        String type,
        String title,
        String slug,
        String body,
        String youtubeUrl,
        String authorName,
        OffsetDateTime publishedAt
) {}
```

Create `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostRequest.java`:

```java
package com.wolfpackunity.gym.post.dto;

public record PostRequest(
        String type,
        String title,
        String slug,
        String body,
        String youtubeUrl
) {}
```

Create `backend/src/main/java/com/wolfpackunity/gym/post/dto/PostsPage.java`:

```java
package com.wolfpackunity.gym.post.dto;

import java.util.List;

public record PostsPage(List<PostView> content, long total, int page, int size) {}
```

- [ ] **Step 5: Create PostRepository**

Create `backend/src/main/java/com/wolfpackunity/gym/post/PostRepository.java`:

```java
package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.PostType;
import com.wolfpackunity.gym.post.dto.PostView;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PostRepository {

    private final DSLContext dsl;

    public PostRepository(DSLContext dsl) { this.dsl = dsl; }

    public List<PostView> findAll(PostType type, int page, int size) {
        Condition condition = type != null ? Tables.POSTS.TYPE.eq(type) : DSL.trueCondition();
        return dsl.select(
                        Tables.POSTS.ID, Tables.POSTS.TYPE, Tables.POSTS.TITLE, Tables.POSTS.SLUG,
                        Tables.POSTS.BODY, Tables.POSTS.YOUTUBE_URL, Tables.POSTS.PUBLISHED_AT,
                        Tables.USERS.NAME)
                .from(Tables.POSTS)
                .join(Tables.USERS).on(Tables.POSTS.AUTHOR_ID.eq(Tables.USERS.ID))
                .where(condition)
                .orderBy(Tables.POSTS.PUBLISHED_AT.desc())
                .limit(size).offset((long) page * size)
                .fetch(r -> new PostView(
                        r.get(Tables.POSTS.ID),
                        r.get(Tables.POSTS.TYPE).getLiteral(),
                        r.get(Tables.POSTS.TITLE),
                        r.get(Tables.POSTS.SLUG),
                        r.get(Tables.POSTS.BODY),
                        r.get(Tables.POSTS.YOUTUBE_URL),
                        r.get(Tables.USERS.NAME),
                        r.get(Tables.POSTS.PUBLISHED_AT)));
    }

    public long count(PostType type) {
        Condition condition = type != null ? Tables.POSTS.TYPE.eq(type) : DSL.trueCondition();
        return dsl.fetchCount(Tables.POSTS, condition);
    }

    public Optional<PostView> findBySlug(String slug) {
        return dsl.select(
                        Tables.POSTS.ID, Tables.POSTS.TYPE, Tables.POSTS.TITLE, Tables.POSTS.SLUG,
                        Tables.POSTS.BODY, Tables.POSTS.YOUTUBE_URL, Tables.POSTS.PUBLISHED_AT,
                        Tables.USERS.NAME)
                .from(Tables.POSTS)
                .join(Tables.USERS).on(Tables.POSTS.AUTHOR_ID.eq(Tables.USERS.ID))
                .where(Tables.POSTS.SLUG.eq(slug))
                .fetchOptional(r -> new PostView(
                        r.get(Tables.POSTS.ID),
                        r.get(Tables.POSTS.TYPE).getLiteral(),
                        r.get(Tables.POSTS.TITLE),
                        r.get(Tables.POSTS.SLUG),
                        r.get(Tables.POSTS.BODY),
                        r.get(Tables.POSTS.YOUTUBE_URL),
                        r.get(Tables.USERS.NAME),
                        r.get(Tables.POSTS.PUBLISHED_AT)));
    }

    public PostView insert(PostType type, String title, String slug, String body,
                           String youtubeUrl, UUID authorId) {
        UUID id = dsl.insertInto(Tables.POSTS)
                .set(Tables.POSTS.TYPE, type)
                .set(Tables.POSTS.TITLE, title)
                .set(Tables.POSTS.SLUG, slug)
                .set(Tables.POSTS.BODY, body)
                .set(Tables.POSTS.YOUTUBE_URL, youtubeUrl)
                .set(Tables.POSTS.AUTHOR_ID, authorId)
                .returning(Tables.POSTS.ID)
                .fetchOne(Tables.POSTS.ID);
        return findBySlug(slug).orElseThrow();
    }

    public PostView update(UUID id, PostType type, String title, String slug,
                           String body, String youtubeUrl) {
        dsl.update(Tables.POSTS)
                .set(Tables.POSTS.TYPE, type)
                .set(Tables.POSTS.TITLE, title)
                .set(Tables.POSTS.SLUG, slug)
                .set(Tables.POSTS.BODY, body)
                .set(Tables.POSTS.YOUTUBE_URL, youtubeUrl)
                .where(Tables.POSTS.ID.eq(id))
                .execute();
        return findBySlug(slug).orElseThrow();
    }

    public void delete(UUID id) {
        dsl.deleteFrom(Tables.POSTS).where(Tables.POSTS.ID.eq(id)).execute();
    }

    public boolean existsById(UUID id) {
        return dsl.fetchExists(Tables.POSTS, Tables.POSTS.ID.eq(id));
    }

    public boolean existsBySlug(String slug) {
        return dsl.fetchExists(Tables.POSTS, Tables.POSTS.SLUG.eq(slug));
    }
}
```

- [ ] **Step 6: Create PostService**

Create `backend/src/main/java/com/wolfpackunity/gym/post/PostService.java`:

```java
package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.enums.PostType;
import com.wolfpackunity.gym.post.dto.PostRequest;
import com.wolfpackunity.gym.post.dto.PostView;
import com.wolfpackunity.gym.post.dto.PostsPage;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PostService {

    private final PostRepository repo;

    public PostService(PostRepository repo) { this.repo = repo; }

    public PostsPage list(String type, int page, int size) {
        PostType postType = type != null ? PostType.valueOf(type) : null;
        List<PostView> content = repo.findAll(postType, page, size);
        long total = repo.count(postType);
        return new PostsPage(content, total, page, size);
    }

    public PostView get(String slug) {
        return repo.findBySlug(slug)
                .orElseThrow(() -> new GymException(ErrorCode.POST_NOT_FOUND));
    }

    public PostView create(PostRequest req, UUID authorId) {
        PostType type = PostType.valueOf(req.type());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? req.slug()
                : uniqueSlug(req.title());
        return repo.insert(type, req.title(), slug, req.body(), req.youtubeUrl(), authorId);
    }

    public PostView update(UUID id, PostRequest req) {
        if (!repo.existsById(id)) throw new GymException(ErrorCode.POST_NOT_FOUND);
        PostType type = PostType.valueOf(req.type());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? req.slug()
                : uniqueSlug(req.title());
        return repo.update(id, type, req.title(), slug, req.body(), req.youtubeUrl());
    }

    public void delete(UUID id) {
        if (!repo.existsById(id)) throw new GymException(ErrorCode.POST_NOT_FOUND);
        repo.delete(id);
    }

    private String uniqueSlug(String title) {
        String base = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        if (!repo.existsBySlug(base)) return base;
        int i = 2;
        while (repo.existsBySlug(base + "-" + i)) i++;
        return base + "-" + i;
    }
}
```

- [ ] **Step 7: Create PostController**

Create `backend/src/main/java/com/wolfpackunity/gym/post/PostController.java`:

```java
package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.post.dto.PostRequest;
import com.wolfpackunity.gym.post.dto.PostView;
import com.wolfpackunity.gym.post.dto.PostsPage;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) { this.service = service; }

    @GetMapping
    public PostsPage list(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(type, page, size);
    }

    @GetMapping("/{slug}")
    public PostView get(@PathVariable String slug) {
        return service.get(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostView create(@RequestBody PostRequest req, Authentication auth) {
        return service.create(req, UUID.fromString(auth.getName()));
    }

    @PutMapping("/{id}")
    public PostView update(@PathVariable UUID id, @RequestBody PostRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
```

- [ ] **Step 8: Update SecurityConfig**

In `backend/src/main/java/com/wolfpackunity/gym/config/SecurityConfig.java`, make two changes:

1. Add `"PUT"` to the CORS allowed methods list.
2. Add permit rules for public GET on `/api/posts` and admin-only for write operations.

The updated `filterChain` and `corsSource` methods:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/login/oauth2/**", "/oauth2/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
                    .requestMatchers("/api/posts/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/slots").authenticated()
                    .anyRequest().authenticated()
            )
            .oauth2Login(o -> o.successHandler(googleHandler))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
}

@Bean
public CorsConfigurationSource corsSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

- [ ] **Step 9: Run the integration test**

```bash
mvn test -pl backend -Dtest=PostIntegrationTest
```

Expected: all 5 tests pass.

- [ ] **Step 10: Run the full test suite**

```bash
mvn test -pl backend
```

Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add backend/src/main/java/com/wolfpackunity/gym/post/ \
        backend/src/main/java/com/wolfpackunity/gym/exception/ErrorCode.java \
        backend/src/main/java/com/wolfpackunity/gym/config/SecurityConfig.java \
        backend/src/test/java/com/wolfpackunity/gym/post/PostIntegrationTest.java
git commit -m "feat: add Post API with public read and admin write endpoints"
```

---

### Task 3: Frontend Public Pages + Navigation

**Files:**
- Create: `frontend/src/api/posts.ts`
- Create: `frontend/src/components/TopNav.tsx`
- Create: `frontend/src/content/PostCard.tsx`
- Create: `frontend/src/content/HomePage.tsx`
- Create: `frontend/src/content/NewsPage.tsx`
- Create: `frontend/src/content/BlogPage.tsx`
- Create: `frontend/src/content/VlogPage.tsx`
- Create: `frontend/src/content/PostPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `client` from `src/api/client.ts`, `useAuth` from `src/auth/AuthContext.tsx`
- Produces:
  - Routes: `/` (HomePage), `/news` (NewsPage), `/blog` (BlogPage), `/vlog` (VlogPage), `/posts/:slug` (PostPage), `/book` (SlotGridPage — moved from `/`)
  - `PostView`, `PostsPage`, `PostRequest` TypeScript interfaces — used by Task 4
  - `getPosts`, `getPost`, `createPost`, `updatePost`, `deletePost` functions — used by Task 4

- [ ] **Step 1: Write the failing test for PostCard**

Create `frontend/src/test/content/PostCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PostCard } from '../../content/PostCard'

const newsPost = {
  id: '1',
  type: 'NEWS' as const,
  title: 'Big News',
  slug: 'big-news',
  body: 'Something happened',
  youtubeUrl: null,
  authorName: 'Admin',
  publishedAt: '2026-07-07T10:00:00Z',
}

test('renders post title as a link', () => {
  render(<MemoryRouter><PostCard post={newsPost} /></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Big News' })).toHaveAttribute('href', '/posts/big-news')
})

test('renders author name', () => {
  render(<MemoryRouter><PostCard post={newsPost} /></MemoryRouter>)
  expect(screen.getByText('Admin')).toBeInTheDocument()
})

test('VLOG card renders youtube link text', () => {
  const vlog = { ...newsPost, type: 'VLOG' as const, youtubeUrl: 'https://youtu.be/abc123' }
  render(<MemoryRouter><PostCard post={vlog} /></MemoryRouter>)
  expect(screen.getByText(/watch/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd frontend && npx vitest run src/test/content/PostCard.test.tsx
```

Expected: FAIL — `PostCard` does not exist.

- [ ] **Step 3: Create the API client**

Create `frontend/src/api/posts.ts`:

```typescript
import { client } from './client'

export interface PostView {
  id: string
  type: 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'
  title: string
  slug: string
  body: string | null
  youtubeUrl: string | null
  authorName: string
  publishedAt: string
}

export interface PostsPage {
  content: PostView[]
  total: number
  page: number
  size: number
}

export interface PostRequest {
  type: string
  title: string
  slug?: string
  body?: string
  youtubeUrl?: string
}

export async function getPosts(params?: {
  type?: string
  page?: number
  size?: number
}): Promise<PostsPage> {
  const res = await client.get<PostsPage>('/posts', { params })
  return res.data
}

export async function getPost(slug: string): Promise<PostView> {
  const res = await client.get<PostView>(`/posts/${slug}`)
  return res.data
}

export async function createPost(req: PostRequest): Promise<PostView> {
  const res = await client.post<PostView>('/posts', req)
  return res.data
}

export async function updatePost(id: string, req: PostRequest): Promise<PostView> {
  const res = await client.put<PostView>(`/posts/${id}`, req)
  return res.data
}

export async function deletePost(id: string): Promise<void> {
  await client.delete(`/posts/${id}`)
}
```

- [ ] **Step 4: Create PostCard**

Create `frontend/src/content/PostCard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import type { PostView } from '../api/posts'

interface Props { post: PostView }

export function PostCard({ post }: Props) {
  const date = new Date(post.publishedAt).toLocaleDateString()
  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
      <Link to={`/posts/${post.slug}`} style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', color: '#1a1a1a' }}>
        {post.title}
      </Link>
      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
        {post.authorName} · {date}
      </div>
      {post.type === 'VLOG' && post.youtubeUrl && (
        <div style={{ marginTop: '8px' }}>
          <a href={post.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
            Watch on YouTube
          </a>
        </div>
      )}
      {post.type !== 'VLOG' && post.body && (
        <p style={{ marginTop: '8px', color: '#333', fontSize: '0.95rem' }}>
          {post.body.slice(0, 160)}{post.body.length > 160 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run PostCard test to confirm it passes**

```bash
npx vitest run src/test/content/PostCard.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 6: Create TopNav**

Create `frontend/src/components/TopNav.tsx`:

```tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function TopNav() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkStyle = { color: '#1a1a1a', textDecoration: 'none', padding: '0 12px' }

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px', borderBottom: '1px solid #ddd', backgroundColor: '#fff'
    }}>
      <div>
        <Link to="/" style={{ ...linkStyle, fontWeight: 700, fontSize: '1.1rem' }}>Wolfpack Unity</Link>
        <Link to="/news" style={linkStyle}>News</Link>
        <Link to="/blog" style={linkStyle}>Blog</Link>
        <Link to="/vlog" style={linkStyle}>Vlog</Link>
      </div>
      <div>
        {token ? (
          <>
            <Link to="/book" style={linkStyle}>Book a slot</Link>
            <Link to="/my-reservations" style={linkStyle}>My Reservations</Link>
            <button onClick={handleLogout} style={{ marginLeft: '12px', padding: '6px 14px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ ...linkStyle, padding: '6px 14px', border: '1px solid #ccc', borderRadius: '4px' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 7: Create public pages**

Create `frontend/src/content/HomePage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function HomePage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts({ size: 10 })
      .then(p => setPosts(p.content))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Wolfpack Unity</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No posts yet.</p>}
      </div>
    </>
  )
}
```

Create `frontend/src/content/NewsPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function NewsPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    getPosts({ type: 'NEWS', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>News</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No news yet.</p>}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)}>← Previous</button>}
          {(page + 1) * size < total && <button onClick={() => setPage(p => p + 1)}>Next →</button>}
        </div>
      </div>
    </>
  )
}
```

Create `frontend/src/content/BlogPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function BlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    getPosts({ type: 'BLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Blog</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No blog posts yet.</p>}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)}>← Previous</button>}
          {(page + 1) * size < total && <button onClick={() => setPage(p => p + 1)}>Next →</button>}
        </div>
      </div>
    </>
  )
}
```

Create `frontend/src/content/VlogPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function VlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    getPosts({ type: 'VLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Vlog</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No vlogs yet.</p>}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)}>← Previous</button>}
          {(page + 1) * size < total && <button onClick={() => setPage(p => p + 1)}>Next →</button>}
        </div>
      </div>
    </>
  )
}
```

Create `frontend/src/content/PostPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { getPost, type PostView } from '../api/posts'

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

  if (error) return (<><TopNav /><div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}><p>Post not found. <Link to="/">Back to home</Link></p></div></>)
  if (!post) return (<><TopNav /><div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}><p>Loading...</p></div></>)

  const date = new Date(post.publishedAt).toLocaleDateString()

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          <Link to="/">Home</Link> · {post.type}
        </p>
        <h1>{post.title}</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{post.authorName} · {date}</p>
        {post.type === 'VLOG' && (() => {
          const videoId = post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null
          return videoId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                allowFullScreen
                title={post.title}
              />
            </div>
          ) : null
        })()}
        {post.body && <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.body}</p>}
      </div>
    </>
  )
}
```

- [ ] **Step 8: Update App.tsx**

Replace the contents of `frontend/src/App.tsx`. The slot grid moves from `/` to `/book`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'
import { OAuth2Callback } from './auth/OAuth2Callback'
import { SlotGridPage } from './slots/SlotGridPage'
import { MyReservationsPage } from './slots/MyReservationsPage'
import { AdminLayout } from './admin/AdminLayout'
import { HomePage } from './content/HomePage'
import { NewsPage } from './content/NewsPage'
import { BlogPage } from './content/BlogPage'
import { VlogPage } from './content/VlogPage'
import { PostPage } from './content/PostPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/vlog" element={<VlogPage />} />
          <Route path="/posts/:slug" element={<PostPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/book" element={<SlotGridPage />} />
            <Route path="/my-reservations" element={<MyReservationsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 9: Run frontend tests**

```bash
npx vitest run
```

Expected: all tests pass including `PostCard.test.tsx`. If `LoginPage.test.tsx` or `SlotRow.test.tsx` now fail due to routing changes, check that `MemoryRouter` wraps them (they already do — no change needed).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/api/posts.ts \
        frontend/src/components/TopNav.tsx \
        frontend/src/content/ \
        frontend/src/App.tsx \
        frontend/src/test/content/
git commit -m "feat: add public content pages and top navigation"
```

---

### Task 4: Admin Content Tab

**Files:**
- Create: `frontend/src/admin/PostsTable.tsx`
- Create: `frontend/src/admin/PostForm.tsx`
- Modify: `frontend/src/admin/AdminLayout.tsx`
- Create: `frontend/src/test/admin/PostForm.test.tsx`

**Interfaces:**
- Consumes: `getPosts`, `createPost`, `updatePost`, `deletePost`, `PostView`, `PostRequest` from `src/api/posts.ts` (Task 3)
- Produces: Content tab in `/admin` showing all posts with create, edit, and delete

- [ ] **Step 1: Write the failing test for PostForm**

Create `frontend/src/test/admin/PostForm.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PostForm } from '../../admin/PostForm'
import { vi } from 'vitest'

const noop = vi.fn()

test('YouTube URL field is hidden when type is not VLOG', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  expect(screen.queryByLabelText(/youtube/i)).not.toBeInTheDocument()
})

test('YouTube URL field is shown when type is VLOG', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'VLOG' } })
  expect(screen.getByLabelText(/youtube/i)).toBeInTheDocument()
})

test('submit calls onSave with form values', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'NEWS' } })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Post' } })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(noop).toHaveBeenCalledWith(expect.objectContaining({ type: 'NEWS', title: 'My Post' }))
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd frontend && npx vitest run src/test/admin/PostForm.test.tsx
```

Expected: FAIL — `PostForm` does not exist.

- [ ] **Step 3: Create PostForm**

Create `frontend/src/admin/PostForm.tsx`:

```tsx
import { useState } from 'react'
import type { PostRequest, PostView } from '../api/posts'

interface Props {
  initial?: PostView
  onSave: (req: PostRequest) => void
  onCancel: () => void
}

export function PostForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState(initial?.type ?? 'NEWS')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ type, title, slug: slug || undefined, body: body || undefined, youtubeUrl: youtubeUrl || undefined })
  }

  const fieldStyle = { width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', marginBottom: '12px' }

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>
        Type
        <select aria-label="Type" value={type} onChange={e => setType(e.target.value)} style={fieldStyle}>
          <option value="NEWS">NEWS</option>
          <option value="BLOG">BLOG</option>
          <option value="VLOG">VLOG</option>
          <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
        </select>
      </label>
      <label style={labelStyle}>
        Title
        <input aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} required style={fieldStyle} />
      </label>
      <label style={labelStyle}>
        Slug (leave blank to auto-generate)
        <input aria-label="Slug" value={slug} onChange={e => setSlug(e.target.value)} style={fieldStyle} />
      </label>
      <label style={labelStyle}>
        Body
        <textarea aria-label="Body" value={body} onChange={e => setBody(e.target.value)} rows={6} style={fieldStyle} />
      </label>
      {type === 'VLOG' && (
        <label style={labelStyle}>
          YouTube URL
          <input aria-label="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={fieldStyle} />
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Save
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '8px 20px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run PostForm test to confirm it passes**

```bash
npx vitest run src/test/admin/PostForm.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Create PostsTable**

Create `frontend/src/admin/PostsTable.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { getPosts, createPost, updatePost, deletePost, type PostView } from '../api/posts'
import { PostForm } from './PostForm'

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
      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
      <button onClick={() => setCreating(true)} style={{ marginBottom: '16px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        New Post
      </button>
      {loading && <p>Loading...</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Published</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{post.title}</td>
              <td style={{ padding: '10px' }}>{post.type}</td>
              <td style={{ padding: '10px' }}>{new Date(post.publishedAt).toLocaleDateString()}</td>
              <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditing(post)} style={{ padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(post.id)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
          {!loading && posts.length === 0 && (
            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No posts yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Add Content tab to AdminLayout**

Modify `frontend/src/admin/AdminLayout.tsx`. Add the `PostsTable` import and a `content` tab button:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersTable } from './UsersTable'
import { ReservationsTable } from './ReservationsTable'
import { StatsView } from './StatsView'
import { PostsTable } from './PostsTable'

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState('users')

  const tabStyle = (tab: string) => ({
    padding: '10px 20px',
    backgroundColor: activeTab === tab ? '#007bff' : '#e9ecef',
    color: activeTab === tab ? 'white' : 'black',
    border: 'none',
    borderRadius: activeTab === tab ? '4px 4px 0 0' : '0',
    cursor: 'pointer',
    marginRight: '5px'
  })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Panel</h1>
        <Link to="/" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to App
        </Link>
      </div>

      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button onClick={() => setActiveTab('users')} style={tabStyle('users')}>Users</button>
        <button onClick={() => setActiveTab('reservations')} style={tabStyle('reservations')}>Reservations</button>
        <button onClick={() => setActiveTab('stats')} style={tabStyle('stats')}>Stats</button>
        <button onClick={() => setActiveTab('content')} style={tabStyle('content')}>Content</button>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '0 4px 4px 4px' }}>
        {activeTab === 'users' && <UsersTable />}
        {activeTab === 'reservations' && <ReservationsTable />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'content' && <PostsTable />}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run the full frontend test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Run TypeScript type check**

```bash
npx tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/admin/PostForm.tsx \
        frontend/src/admin/PostsTable.tsx \
        frontend/src/admin/AdminLayout.tsx \
        frontend/src/test/admin/PostForm.test.tsx
git commit -m "feat: add Content tab to admin panel with post CRUD"
```
