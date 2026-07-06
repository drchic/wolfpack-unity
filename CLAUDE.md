# Wolfpack Unity - Development Setup

## Tech Stack

| Component | Version |
|-----------|---------|
| Java | 21 |
| Spring Boot | 3.3.13 |
| jOOQ | 3.20.7 |
| PostgreSQL | 18.4 |
| Flyway | (via Spring Boot) |
| React | 18 |
| Vite | 5 |
| TypeScript | 5 |

## Infrastructure

### PostgreSQL Database
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `wolfpackunity`

**Start/Stop** (via systemctl):
```bash
sudo systemctl start postgresql
sudo systemctl stop postgresql
```

### Backend (Spring Boot)
- **Port**: `8081`
- **Dev Profile**: `dev` (includes test OAuth2 credentials)
- **Profiles**: `application.properties` (prod), `application-dev.properties` (dev)

**Required Environment Variables** (dev defaults in application-dev.properties):
```bash
JWT_SECRET=dev-secret-min-32-chars-required-!!
```

**Start**:
```bash
JWT_SECRET="..." mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend (React + Vite)
- **Port**: `5174`
- **Proxy**: Routes `/api`, `/login`, `/oauth2` to `http://localhost:8081`

## Development Workflow

### Initial Setup
1. Start PostgreSQL: `sudo systemctl start postgresql`
2. Run Flyway migrations: Start Spring Boot once to create schema
3. Generate jOOQ classes: `mvn jooq-codegen:generate`
4. Compile backend: `mvn compile`

### After Schema Changes
1. Modify `.sql` files in `backend/src/main/resources/db/migration/`
2. Restart backend (Flyway runs automatically)
3. Regenerate jOOQ: `mvn jooq-codegen:generate`
4. Recompile: `mvn compile`

## Business Logic

### Cancellation Deadlines
| Time Range | Deadline |
|------------|----------|
| 21:00 - 06:00 | 1 hour before |
| 06:00 - 12:00 | 20:00 previous day |
| 12:00 - 21:00 | 4 hours before |

Admins bypass all deadline restrictions.

### Reservation Constraints
- Max **2 active reservations per user per day**
- **10 spots** per hourly slot (1–10)
- **24-hour operation** (00:00–23:59)
- One user per spot per slot (enforced by unique index)

## Important Notes

- **jOOQ Codegen**: Runs manually only. Does NOT auto-execute during build. Requires running database.
- **Generated Sources**: In `target/generated-sources/jooq/` — Maven compiles via `build-helper-maven-plugin`
- **Ports**: PostgreSQL on 5432, Backend on 8081, Frontend on 5174
- **Dev Mode**: OAuth2 credentials are stubbed in `application-dev.properties`

## Implementation Status

- ✅ Task 1: Backend Scaffold
- ✅ Task 2: Database Migrations & jOOQ Codegen
- ✅ Task 3: Exception Handling
- ✅ Task 4: JWT Utilities & Auth Infrastructure
- ✅ Task 5: Security Config, User Repository & Admin Seeder
- ✅ Task 6: Auth Endpoints (Register, Login, Google OAuth2)
- ✅ Task 7: Cancellation Policy (Pure Logic)
- ✅ Task 8: Reservation Repository, Service & Controller
- ✅ Task 9: Email Service (Full Implementation)
- ✅ Task 10: Admin Endpoints
- ✅ Task 11: Frontend Scaffold
- ✅ Task 12: Auth Pages
- ✅ Task 13: Slot Grid & Booking
- ✅ Task 14: My Reservations Page
- ✅ Task 15: Admin Panel
- ⏳ Task 16: Final Verification (run tests + manual smoke test)
