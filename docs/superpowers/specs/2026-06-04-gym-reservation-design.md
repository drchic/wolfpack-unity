# Wolfpack Unity — Gym Reservation System Design Spec
**Date:** 2026-06-04

## Overview

A web application for managing **Wolfpack Unity**, a 24/7 gym with 10 numbered spots per hour. Users self-register (Google OAuth2 or email/password), browse slot availability, and book up to 2 spots per day. An admin panel provides user management, reservation oversight, and occupancy statistics.

---

## 1. Project Structure

Monorepo with two independent projects:

```
gym-reservation/
├── backend/    ← Spring Boot 3, Java 21, Maven, jOOQ, PostgreSQL
└── frontend/   ← React 18, Vite, TypeScript
```

- Backend runs on `localhost:8080` (development)
- Frontend runs on `localhost:5173` (Vite dev server)
- Production: Spring Boot JAR + separately hosted static React build (e.g., Nginx)

---

## 2. Authentication

### Methods
- **Google OAuth2** — Spring Security OAuth2 client. On first login, a user account is created automatically from the Google profile (name + email).
- **Email/Password** — Registration form (name, email, password). Password stored as BCrypt hash. Login returns a JWT.

### Session model
Both flows issue a **JWT (24-hour expiry)**. The React app stores it in memory and sends it as `Authorization: Bearer <token>` on every API request. Stateless — no server-side sessions.

### User table

| column        | type      | notes                          |
|---------------|-----------|--------------------------------|
| id            | UUID      | primary key                    |
| email         | text      | unique                         |
| name          | text      |                                |
| password_hash | text      | null for Google-authenticated users |
| google_id     | text      | null for email/password users  |
| role          | enum      | `USER` or `ADMIN`              |
| created_at    | timestamp |                                |

### Role management
- First admin is seeded via `app.admin.email` in `application.properties` — on application startup, if a user with that email exists, their role is set to `ADMIN`.
- Admins can promote/demote other users via the admin panel.

---

## 3. Reservation Data Model

### Slots
The gym operates 24 hours/day. Each hour is a slot. Each slot has **10 numbered spots (1–10)**. Users select a specific spot when booking.

### reservations table

| column      | type      | notes                          |
|-------------|-----------|--------------------------------|
| id          | UUID      | primary key                    |
| user_id     | UUID      | FK → users                     |
| date        | date      | e.g. `2026-06-10`              |
| hour        | int       | 0–23                           |
| spot_number | int       | 1–10                           |
| status      | enum      | `ACTIVE` or `CANCELLED`        |
| created_at  | timestamp |                                |

### Constraints
- **Partial unique index** on `(date, hour, spot_number)` where `status = 'ACTIVE'` — one user per spot per slot. Cancelled spots become available for re-booking.
- Max **2 active reservations per `(user_id, date)`** — daily limit.
- A user can book **2 spots in the same slot** (e.g., for a friend) — both count toward the daily limit.
- Booking horizon is **unlimited** — users can book any future date.

### Cancellation deadlines
Enforced at cancel time by the backend:

| Hours | Deadline |
|-------|----------|
| 21:00–06:00 (night/early morning) | 1 hour before slot |
| 06:00–12:00 (morning) | 20:00 the day before |
| 12:00–21:00 (afternoon/evening) | 4 hours before slot |

Admins can cancel any reservation with no deadline restriction.

---

## 4. REST API

All endpoints prefixed `/api`. JWT required on all except auth endpoints.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Email/password signup |
| POST | `/api/auth/login` | Email/password login, returns JWT |
| GET  | `/api/auth/google` | Initiate Google OAuth2 flow |

### Reservations (USER role)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/slots?date=YYYY-MM-DD` | All 24 hours with spot availability for a date |
| POST   | `/api/reservations` | Book a spot `{date, hour, spot_number}` |
| DELETE | `/api/reservations/{id}` | Cancel own reservation (deadline enforced) |
| GET    | `/api/reservations/me` | List current user's upcoming reservations |

### Admin (ADMIN role)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/reservations?date=&userId=` | All reservations with filters |
| DELETE | `/api/admin/reservations/{id}` | Cancel any reservation, no deadline |
| GET    | `/api/admin/users` | List all users |
| PATCH  | `/api/admin/users/{id}/role` | Promote or demote role |
| DELETE | `/api/admin/users/{id}` | Delete user (cascades reservations) |
| GET    | `/api/admin/stats` | Occupancy stats |

---

## 5. Admin Panel

Protected `/admin` area in the React app. Backend enforces `ADMIN` role on all `/api/admin/**` endpoints.

**Capabilities:**
- View and filter all reservations by date and/or user
- Cancel any reservation on behalf of a user (no deadline restriction)
- View all users, promote/demote roles, delete users
- View occupancy stats: spots booked per day, busiest hours, most active users (powered by jOOQ aggregate queries)

Admins do **not** create reservations on behalf of users — users self-book only.

---

## 6. Email Notifications

Sent via **Spring Mail** (SMTP — configurable via `application.properties`, e.g., Gmail, SendGrid).

Sent **asynchronously** (`@Async`) to avoid blocking API responses.

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Booking confirmed | The booking user | Date, hour, spot number, "Wolfpack Unity" |
| Booking cancelled (self) | The booking user | Same details |
| Booking cancelled (by admin) | The booking user | Same details |

No reminders or recurring notifications in scope.

---

## 7. Error Handling

Backend returns structured JSON errors:

```json
{ "error": "SLOT_FULL", "message": "All 10 spots are taken for this slot." }
```

Key error cases:
- `SLOT_FULL` — all 10 spots taken for `(date, hour)`
- `SPOT_TAKEN` — specific spot already booked
- `DAILY_LIMIT_REACHED` — user already has 2 active reservations on that date
- `CANCELLATION_DEADLINE_PASSED` — cancellation window has closed
- `PAST_SLOT` — cannot book a slot that has already started
- `UNAUTHORIZED` — missing or invalid JWT
- `FORBIDDEN` — valid JWT but insufficient role

Frontend displays these errors inline (not alert dialogs).

---

## 8. Testing

### Backend
- **Unit tests** (JUnit 5 + Mockito) — cancellation deadline logic, daily limit enforcement, spot conflict checks. No DB required.
- **Integration tests** (Spring Boot Test + Testcontainers) — real PostgreSQL per test run. Covers full request→jOOQ→DB→response path for all endpoints.

### Frontend
- **Component tests** (Vitest + React Testing Library) — slot availability grid rendering, booking form validation, cancellation button visibility based on deadline.
- No end-to-end tests in scope.
