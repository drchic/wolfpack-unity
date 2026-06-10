# Wolfpack Unity Gym Reservation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack gym reservation system for Wolfpack Unity — Spring Boot REST API + React SPA — with Google/email auth, spot booking (10 spots × 24 hourly slots), cancellation deadlines, email confirmations, and an admin panel.

**Architecture:** Spring Boot 3 backend exposes a stateless REST API secured with JWT. React 18 + Vite frontend consumes it via axios. PostgreSQL stores users and reservations; jOOQ provides type-safe queries for both CRUD and analytics.

**Tech Stack:** Java 21, Spring Boot 3.3.13, jOOQ 3.20.7, Flyway, PostgreSQL 18.4, Spring Security OAuth2, Spring Mail, JUnit 5, Testcontainers, React 18, Vite 5, TypeScript 5, React Router 6, Axios, Vitest, React Testing Library

**Ports:** Backend 8081, Frontend 5173, PostgreSQL 5433 (local dev)

**Project root:** `wolfpack-unity/` (no git — will be pushed to GitHub manually by the developer)

---

## File Map

### Backend (`backend/`)
```
pom.xml
src/main/java/com/wolfpackunity/gym/
  GymApplication.java
  config/
    SecurityConfig.java          — Spring Security: JWT filter, role guards, OAuth2
    AdminSeeder.java             — promotes app.admin.email on startup
  exception/
    ErrorCode.java               — enum: SLOT_FULL, SPOT_TAKEN, DAILY_LIMIT_REACHED, ...
    GymException.java            — RuntimeException carrying ErrorCode + HTTP status
    GlobalExceptionHandler.java  — @RestControllerAdvice → { error, message } JSON
  auth/
    JwtUtil.java                 — sign/verify JWT (24h)
    JwtFilter.java               — OncePerRequestFilter: parse Bearer, set SecurityContext
    AuthController.java          — POST /api/auth/register, POST /api/auth/login
    AuthService.java             — register, login logic
    GoogleOAuthSuccessHandler.java — OAuth2 success: upsert user, return JWT redirect
    dto/RegisterRequest.java
    dto/LoginRequest.java
    dto/AuthResponse.java        — { token: string }
  user/
    Role.java                    — enum USER, ADMIN
    UserRepository.java          — jOOQ: findByEmail, findById, updateRole, delete
  reservation/
    CancellationPolicy.java      — pure logic: isCancellable(date, hour, now)
    ReservationRepository.java   — jOOQ: findByDate, findByUser, insert, cancel, dailyCount
    ReservationService.java      — book, cancel (enforces all constraints)
    ReservationController.java   — GET /api/slots, POST/DELETE /api/reservations, GET /me
    dto/BookRequest.java
    dto/SlotView.java            — { hour, spots: [{number, available, reservationId, mine}] }
    dto/ReservationView.java     — { id, date, hour, spotNumber, status }
  admin/
    AdminService.java            — admin-level cancel, user management, stats queries
    AdminController.java         — /api/admin/** endpoints
    dto/RoleUpdateRequest.java
    dto/StatsView.java           — { dailyOccupancy, busiestHours, topUsers }
  email/
    EmailService.java            — @Async sendBookingConfirmation, sendCancellationNotice
src/main/resources/
  application.properties
  application-dev.properties
  db/migration/
    V1__create_enums.sql
    V2__create_users.sql
    V3__create_reservations.sql
src/test/java/com/wolfpackunity/gym/
  reservation/
    CancellationPolicyTest.java        — unit, no DB
    ReservationIntegrationTest.java    — Testcontainers
  auth/
    AuthIntegrationTest.java           — Testcontainers
  admin/
    AdminIntegrationTest.java          — Testcontainers
```

### Frontend (`frontend/`)
```
package.json
vite.config.ts
tsconfig.json
index.html
src/
  main.tsx
  App.tsx                    — router, AuthProvider wrapper
  api/
    client.ts                — axios instance, attaches JWT
    auth.ts                  — register(), login(), googleLoginUrl()
    slots.ts                 — getSlots(date)
    reservations.ts          — book(req), cancelReservation(id), getMyReservations()
    admin.ts                 — getAdminReservations(), getUsers(), updateRole(), deleteUser(), getStats()
  auth/
    AuthContext.tsx           — token in memory, user info, login/logout
    LoginPage.tsx
    RegisterPage.tsx
    OAuth2Callback.tsx
  slots/
    SlotGridPage.tsx          — date picker + 24-row slot grid
    SlotRow.tsx               — one hour row: 10 spot buttons
    BookingModal.tsx          — confirm spot, submits book()
    MyReservationsPage.tsx    — upcoming list with cancel button
  admin/
    AdminLayout.tsx           — tab nav: Users / Reservations / Stats
    UsersTable.tsx
    ReservationsTable.tsx
    StatsView.tsx
  components/
    ProtectedRoute.tsx        — redirects to /login if no token
    AdminRoute.tsx            — redirects if role !== ADMIN
    ErrorMessage.tsx          — inline error display
src/test/
  setup.ts
  slots/SlotRow.test.tsx
  slots/MyReservationsPage.test.tsx
  auth/LoginPage.test.tsx
```

---

## Task 1: Backend Scaffold

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/wolfpackunity/gym/GymApplication.java`
- Create: `backend/src/main/resources/application.properties`
- Create: `backend/src/main/resources/application-dev.properties`

Working directory for all backend steps: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p backend/src/main/java/com/wolfpackunity/gym
mkdir -p backend/src/main/resources/db/migration
mkdir -p backend/src/test/java/com/wolfpackunity/gym
```

- [ ] **Step 2: Write `backend/pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
  </parent>
  <groupId>com.wolfpackunity</groupId>
  <artifactId>gym</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <properties>
    <java.version>21</java.version>
    <jooq.version>3.19.10</jooq.version>
  </properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-oauth2-client</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-mail</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-jooq</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-core</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-database-postgresql</artifactId></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.6</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.testcontainers</groupId><artifactId>postgresql</artifactId><version>1.19.8</version><scope>test</scope></dependency>
    <dependency><groupId>org.testcontainers</groupId><artifactId>junit-jupiter</artifactId><version>1.19.8</version><scope>test</scope></dependency>
    <dependency><groupId>org.springframework.security</groupId><artifactId>spring-security-test</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 3: Write `backend/src/main/java/com/wolfpackunity/gym/GymApplication.java`**

```java
package com.wolfpackunity.gym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class GymApplication {
    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }
}
```

- [ ] **Step 4: Write `backend/src/main/resources/application.properties`**

```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/wolfpackunity}
spring.datasource.username=${DB_USER:gym}
spring.datasource.password=${DB_PASS:gym}
spring.flyway.locations=classpath:db/migration
spring.jooq.sql-dialect=POSTGRES

app.jwt.secret=${JWT_SECRET:change-me-in-production-min-32-chars!!}
app.jwt.expiration-ms=86400000

app.admin.email=${ADMIN_EMAIL:admin@wolfpackunity.com}

spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID:}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET:}
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google
spring.security.oauth2.client.registration.google.scope=openid,email,profile

spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USER:}
spring.mail.password=${MAIL_PASS:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

- [ ] **Step 5: Write `backend/src/main/resources/application-dev.properties`**

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/wolfpackunity
spring.datasource.username=gym
spring.datasource.password=gym
logging.level.org.jooq.tools.LoggerListener=DEBUG
```

- [ ] **Step 6: Verify compilation**

```bash
cd backend && mvn compile
```
Expected: `BUILD SUCCESS`

---

## Task 2: Database Migrations & jOOQ Codegen

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__create_enums.sql`
- Create: `backend/src/main/resources/db/migration/V2__create_users.sql`
- Create: `backend/src/main/resources/db/migration/V3__create_reservations.sql`
- Modify: `backend/pom.xml` (add jOOQ codegen plugin)

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Start PostgreSQL via Docker**

```bash
docker run --name wolfpackunity-db -e POSTGRES_USER=gym -e POSTGRES_PASSWORD=gym \
  -e POSTGRES_DB=wolfpackunity -p 5433:5432 -d postgres:18.4
```
If container already exists: `docker start wolfpackunity-db`

- [ ] **Step 2: Write `V1__create_enums.sql`**

```sql
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'CANCELLED');
```

- [ ] **Step 3: Write `V2__create_users.sql`**

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT,
    google_id     TEXT,
    role          user_role NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 4: Write `V3__create_reservations.sql`**

```sql
CREATE TABLE reservations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    hour        SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    spot_number SMALLINT NOT NULL CHECK (spot_number BETWEEN 1 AND 10),
    status      reservation_status NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active booking per spot per slot
CREATE UNIQUE INDEX uq_active_spot
    ON reservations (date, hour, spot_number)
    WHERE status = 'ACTIVE';

-- Fast lookup of a user's reservations by date
CREATE INDEX idx_reservations_user_date ON reservations (user_id, date);
```

- [ ] **Step 5: Run Flyway migrations (starts app briefly to migrate)**

```bash
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev &
sleep 15
kill %1
```
Expected: Flyway logs `Successfully applied 3 migrations`

- [ ] **Step 6: Add jOOQ codegen plugin to `backend/pom.xml`**

Inside `<build><plugins>`, add after the spring-boot-maven-plugin:

```xml
<plugin>
  <groupId>org.jooq</groupId>
  <artifactId>jooq-codegen-maven</artifactId>
  <version>${jooq.version}</version>
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
    </execution>
  </executions>
  <configuration>
    <jdbc>
      <driver>org.postgresql.Driver</driver>
      <url>jdbc:postgresql://localhost:5433/wolfpackunity</url>
      <user>gym</user>
      <password>gym</password>
    </jdbc>
    <generator>
      <database>
        <name>org.jooq.meta.postgres.PostgresDatabase</name>
        <includes>.*</includes>
        <excludes>flyway_schema_history</excludes>
        <inputSchema>public</inputSchema>
      </database>
      <target>
        <packageName>com.wolfpackunity.gym.jooq</packageName>
        <directory>target/generated-sources/jooq</directory>
      </target>
    </generator>
  </configuration>
</plugin>
```

- [ ] **Step 7: Generate jOOQ classes**

```bash
cd backend && mvn jooq-codegen:generate
```
Expected: `target/generated-sources/jooq/com/wolfpackunity/gym/jooq/` with `Tables`, `tables/Users`, `tables/Reservations`, `enums/UserRole`, `enums/ReservationStatus`.

- [ ] **Step 8: Verify compilation with generated sources**

```bash
cd backend && mvn compile
```
Expected: `BUILD SUCCESS`

---

## Task 3: Exception Handling Infrastructure

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/exception/ErrorCode.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/exception/GymException.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/exception/GlobalExceptionHandler.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `ErrorCode.java`**

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
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "An account with this email already exists.");

    public final HttpStatus status;
    public final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
```

- [ ] **Step 2: Write `GymException.java`**

```java
package com.wolfpackunity.gym.exception;

public class GymException extends RuntimeException {
    public final ErrorCode code;

    public GymException(ErrorCode code) {
        super(code.message);
        this.code = code;
    }
}
```

- [ ] **Step 3: Write `GlobalExceptionHandler.java`**

```java
package com.wolfpackunity.gym.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GymException.class)
    public ResponseEntity<Map<String, String>> handleGym(GymException ex) {
        return ResponseEntity.status(ex.code.status)
                .body(Map.of("error", ex.code.name(), "message", ex.code.message));
    }
}
```

- [ ] **Step 4: Compile**

```bash
cd backend && mvn compile
```
Expected: `BUILD SUCCESS`

---

## Task 4: JWT Utilities & Auth Infrastructure

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/user/Role.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/JwtUtil.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/JwtFilter.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `Role.java`**

```java
package com.wolfpackunity.gym.user;

public enum Role { USER, ADMIN }
```

- [ ] **Step 2: Write `JwtUtil.java`**

```java
package com.wolfpackunity.gym.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generate(UUID userId, String email, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
```

- [ ] **Step 3: Write `JwtFilter.java`**

```java
package com.wolfpackunity.gym.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) { this.jwtUtil = jwtUtil; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtUtil.parse(header.substring(7));
                var auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role", String.class)))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {}
        }
        chain.doFilter(req, res);
    }
}
```

- [ ] **Step 4: Compile**

```bash
cd backend && mvn compile
```
Expected: `BUILD SUCCESS`

---

## Task 5: Security Config, User Repository & Admin Seeder

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/user/UserRepository.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/config/AdminSeeder.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `UserRepository.java`**

```java
package com.wolfpackunity.gym.user;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {

    private final DSLContext dsl;

    public UserRepository(DSLContext dsl) { this.dsl = dsl; }

    public Optional<UsersRecord> findByEmail(String email) {
        return dsl.selectFrom(Tables.USERS)
                .where(Tables.USERS.EMAIL.eq(email))
                .fetchOptional();
    }

    public Optional<UsersRecord> findById(UUID id) {
        return dsl.selectFrom(Tables.USERS)
                .where(Tables.USERS.ID.eq(id))
                .fetchOptional();
    }

    public UsersRecord insert(String email, String name, String passwordHash, String googleId) {
        return dsl.insertInto(Tables.USERS)
                .set(Tables.USERS.EMAIL, email)
                .set(Tables.USERS.NAME, name)
                .set(Tables.USERS.PASSWORD_HASH, passwordHash)
                .set(Tables.USERS.GOOGLE_ID, googleId)
                .set(Tables.USERS.ROLE, UserRole.USER)
                .returning()
                .fetchOne();
    }

    public void updateRole(UUID id, UserRole role) {
        dsl.update(Tables.USERS)
                .set(Tables.USERS.ROLE, role)
                .where(Tables.USERS.ID.eq(id))
                .execute();
    }

    public void delete(UUID id) {
        dsl.deleteFrom(Tables.USERS).where(Tables.USERS.ID.eq(id)).execute();
    }
}
```

- [ ] **Step 2: Write `SecurityConfig.java`**

```java
package com.wolfpackunity.gym.config;

import com.wolfpackunity.gym.auth.GoogleOAuthSuccessHandler;
import com.wolfpackunity.gym.auth.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final GoogleOAuthSuccessHandler googleHandler;

    public SecurityConfig(JwtFilter jwtFilter, GoogleOAuthSuccessHandler googleHandler) {
        this.jwtFilter = jwtFilter;
        this.googleHandler = googleHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/login/oauth2/**", "/oauth2/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/slots").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2Login(o -> o.successHandler(googleHandler))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 3: Write `AdminSeeder.java`**

```java
package com.wolfpackunity.gym.config;

import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminSeeder {

    @Bean
    public ApplicationRunner seedAdmin(UserRepository users,
                                       @Value("${app.admin.email}") String adminEmail) {
        return args -> users.findByEmail(adminEmail).ifPresent(user -> {
            if (user.getRole() != UserRole.ADMIN) {
                users.updateRole(user.getId(), UserRole.ADMIN);
            }
        });
    }
}
```

- [ ] **Step 4: Compile**

```bash
cd backend && mvn compile
```
Expected: `BUILD SUCCESS`

---

## Task 6: Auth Endpoints (Register, Login, Google OAuth2)

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/dto/RegisterRequest.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/dto/AuthResponse.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/AuthService.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/AuthController.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/auth/GoogleOAuthSuccessHandler.java`
- Test: `backend/src/test/java/com/wolfpackunity/gym/auth/AuthIntegrationTest.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write DTOs**

`backend/src/main/java/com/wolfpackunity/gym/auth/dto/RegisterRequest.java`:
```java
package com.wolfpackunity.gym.auth.dto;
public record RegisterRequest(String name, String email, String password) {}
```

`backend/src/main/java/com/wolfpackunity/gym/auth/dto/LoginRequest.java`:
```java
package com.wolfpackunity.gym.auth.dto;
public record LoginRequest(String email, String password) {}
```

`backend/src/main/java/com/wolfpackunity/gym/auth/dto/AuthResponse.java`:
```java
package com.wolfpackunity.gym.auth.dto;
public record AuthResponse(String token) {}
```

- [ ] **Step 2: Write `AuthService.java`**

```java
package com.wolfpackunity.gym.auth;

import com.wolfpackunity.gym.auth.dto.AuthResponse;
import com.wolfpackunity.gym.auth.dto.LoginRequest;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.findByEmail(req.email()).isPresent()) {
            throw new GymException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        UsersRecord user = users.insert(req.email(), req.name(), encoder.encode(req.password()), null);
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }

    public AuthResponse login(LoginRequest req) {
        UsersRecord user = users.findByEmail(req.email())
                .orElseThrow(() -> new GymException(ErrorCode.USER_NOT_FOUND));
        if (user.getPasswordHash() == null || !encoder.matches(req.password(), user.getPasswordHash())) {
            throw new GymException(ErrorCode.USER_NOT_FOUND);
        }
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }

    public AuthResponse upsertGoogleUser(String email, String name, String googleId) {
        UsersRecord user = users.findByEmail(email).orElseGet(
                () -> users.insert(email, name, null, googleId));
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }
}
```

- [ ] **Step 3: Write `AuthController.java`**

```java
package com.wolfpackunity.gym.auth;

import com.wolfpackunity.gym.auth.dto.AuthResponse;
import com.wolfpackunity.gym.auth.dto.LoginRequest;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {
        return authService.login(req);
    }
}
```

- [ ] **Step 4: Write `GoogleOAuthSuccessHandler.java`**

```java
package com.wolfpackunity.gym.auth;

import com.wolfpackunity.gym.auth.dto.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GoogleOAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    public GoogleOAuthSuccessHandler(AuthService authService) { this.authService = authService; }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res,
                                        Authentication auth) throws IOException {
        OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String googleId = oauth2User.getAttribute("sub");

        AuthResponse token = authService.upsertGoogleUser(email, name, googleId);
        getRedirectStrategy().sendRedirect(req, res,
                "http://localhost:5173/oauth2/callback?token=" + token.token());
    }
}
```

- [ ] **Step 5: Write `AuthIntegrationTest.java`**

```java
package com.wolfpackunity.gym.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;

    @Test
    void register_returnsToken() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Alice","email":"alice@example.com","password":"secret123"}
                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void login_withValidCredentials_returnsToken() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Bob","email":"bob@example.com","password":"pass123"}
                    """));
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"bob@example.com","password":"pass123"}
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String body = """
            {"name":"Carol","email":"carol@example.com","password":"pw"}
            """;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("EMAIL_ALREADY_EXISTS"));
    }
}
```

- [ ] **Step 6: Run tests**

```bash
cd backend && mvn test -Dtest=AuthIntegrationTest
```
Expected: all 3 tests PASS.

- [ ] **Step 7: Run full test suite**

```bash
cd backend && mvn test
```
Expected: `BUILD SUCCESS`, all tests green.

---

## Task 7: Cancellation Policy (Pure Logic)

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/CancellationPolicy.java`
- Test: `backend/src/test/java/com/wolfpackunity/gym/reservation/CancellationPolicyTest.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write failing tests first**

```java
package com.wolfpackunity.gym.reservation;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

class CancellationPolicyTest {

    @Test
    void morningSlot_beforeDeadline_isAllowed() {
        // hour=7, date=June10, now=June9 19:59 — before 20:00 deadline
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 7,
                LocalDateTime.of(2026, 6, 9, 19, 59))).isTrue();
    }

    @Test
    void morningSlot_atDeadline_isDenied() {
        // now=June9 20:00 — exactly at deadline, not allowed
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 7,
                LocalDateTime.of(2026, 6, 9, 20, 0))).isFalse();
    }

    @Test
    void morningSlot_dayOf_isDenied() {
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 7,
                LocalDateTime.of(2026, 6, 10, 6, 0))).isFalse();
    }

    @Test
    void afternoonSlot_moreThan4hBefore_isAllowed() {
        // hour=14, deadline=10:00, now=09:59
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 9, 59))).isTrue();
    }

    @Test
    void afternoonSlot_exactly4hBefore_isDenied() {
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 10, 0))).isFalse();
    }

    @Test
    void afternoonSlot_after4hBefore_isDenied() {
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 11, 0))).isFalse();
    }
}
```

- [ ] **Step 2: Run tests to confirm compile error**

```bash
cd backend && mvn test -Dtest=CancellationPolicyTest 2>&1 | tail -5
```
Expected: compile error — `CancellationPolicy` not found.

- [ ] **Step 3: Write `CancellationPolicy.java`**

```java
package com.wolfpackunity.gym.reservation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CancellationPolicy {

    private CancellationPolicy() {}

    public static boolean isAllowed(LocalDate bookingDate, int hour, LocalDateTime now) {
        if (hour < 12) {
            LocalDateTime deadline = bookingDate.minusDays(1).atTime(20, 0);
            return now.isBefore(deadline);
        } else {
            LocalDateTime deadline = bookingDate.atTime(hour, 0).minusHours(4);
            return now.isBefore(deadline);
        }
    }
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend && mvn test -Dtest=CancellationPolicyTest
```
Expected: all 6 tests PASS.

---

## Task 8: Reservation Repository, Service & Controller

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/dto/BookRequest.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/dto/ReservationView.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/dto/SlotView.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/ReservationRepository.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/email/EmailService.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/ReservationService.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/reservation/ReservationController.java`
- Test: `backend/src/test/java/com/wolfpackunity/gym/reservation/ReservationIntegrationTest.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

Note: `EmailService` is created here (before Task 9) because `ReservationService` depends on it. The full email implementation comes in Task 9 — here we just need it to compile.

- [ ] **Step 1: Write DTOs**

`backend/src/main/java/com/wolfpackunity/gym/reservation/dto/BookRequest.java`:
```java
package com.wolfpackunity.gym.reservation.dto;
import java.time.LocalDate;
public record BookRequest(LocalDate date, int hour, int spotNumber) {}
```

`backend/src/main/java/com/wolfpackunity/gym/reservation/dto/ReservationView.java`:
```java
package com.wolfpackunity.gym.reservation.dto;
import java.time.LocalDate;
import java.util.UUID;
public record ReservationView(UUID id, LocalDate date, int hour, int spotNumber, String status) {}
```

`backend/src/main/java/com/wolfpackunity/gym/reservation/dto/SlotView.java`:
```java
package com.wolfpackunity.gym.reservation.dto;

import java.util.List;
import java.util.UUID;

public record SlotView(int hour, List<SpotView> spots) {
    public record SpotView(int number, boolean available, UUID reservationId, boolean mine) {}
}
```

- [ ] **Step 2: Write a stub `EmailService.java` so the project compiles**

```java
package com.wolfpackunity.gym.email;

import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class EmailService {

    public void sendBookingConfirmation(String to, String name, LocalDate date, int hour, int spot) {}

    public void sendCancellationNotice(String to, String name, LocalDate date, int hour, int spot) {}
}
```

- [ ] **Step 3: Write `ReservationRepository.java`**

```java
package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.ReservationStatus;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ReservationRepository {

    private final DSLContext dsl;

    public ReservationRepository(DSLContext dsl) { this.dsl = dsl; }

    public List<ReservationsRecord> findActiveByDate(LocalDate date) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.DATE.eq(date))
                .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE))
                .fetch();
    }

    public int countActiveByUserAndDate(UUID userId, LocalDate date) {
        return dsl.fetchCount(Tables.RESERVATIONS,
                Tables.RESERVATIONS.USER_ID.eq(userId)
                        .and(Tables.RESERVATIONS.DATE.eq(date))
                        .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE)));
    }

    public List<ReservationsRecord> findUpcomingByUser(UUID userId) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.USER_ID.eq(userId))
                .and(Tables.RESERVATIONS.DATE.greaterOrEqual(LocalDate.now()))
                .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE))
                .orderBy(Tables.RESERVATIONS.DATE, Tables.RESERVATIONS.HOUR)
                .fetch();
    }

    public ReservationsRecord insert(UUID userId, LocalDate date, int hour, int spotNumber) {
        return dsl.insertInto(Tables.RESERVATIONS)
                .set(Tables.RESERVATIONS.USER_ID, userId)
                .set(Tables.RESERVATIONS.DATE, date)
                .set(Tables.RESERVATIONS.HOUR, (short) hour)
                .set(Tables.RESERVATIONS.SPOT_NUMBER, (short) spotNumber)
                .set(Tables.RESERVATIONS.STATUS, ReservationStatus.ACTIVE)
                .returning()
                .fetchOne();
    }

    public Optional<ReservationsRecord> findById(UUID id) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.ID.eq(id))
                .fetchOptional();
    }

    public void cancel(UUID id) {
        dsl.update(Tables.RESERVATIONS)
                .set(Tables.RESERVATIONS.STATUS, ReservationStatus.CANCELLED)
                .where(Tables.RESERVATIONS.ID.eq(id))
                .execute();
    }
}
```

- [ ] **Step 4: Write `ReservationService.java`**

```java
package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.email.EmailService;
import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.reservation.dto.BookRequest;
import com.wolfpackunity.gym.reservation.dto.ReservationView;
import com.wolfpackunity.gym.reservation.dto.SlotView;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository repo;
    private final UserRepository users;
    private final EmailService email;

    public ReservationService(ReservationRepository repo, UserRepository users, EmailService email) {
        this.repo = repo;
        this.users = users;
        this.email = email;
    }

    public List<SlotView> getSlots(LocalDate date, UUID currentUserId) {
        List<ReservationsRecord> active = repo.findActiveByDate(date);
        Map<Short, Map<Short, ReservationsRecord>> byHourAndSpot = active.stream()
                .collect(Collectors.groupingBy(ReservationsRecord::getHour,
                        Collectors.toMap(ReservationsRecord::getSpotNumber, r -> r)));

        List<SlotView> slots = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            List<SlotView.SpotView> spots = new ArrayList<>();
            for (int s = 1; s <= 10; s++) {
                ReservationsRecord r = byHourAndSpot.getOrDefault((short) h, Map.of()).get((short) s);
                if (r == null) {
                    spots.add(new SlotView.SpotView(s, true, null, false));
                } else {
                    spots.add(new SlotView.SpotView(s, false, r.getId(), r.getUserId().equals(currentUserId)));
                }
            }
            slots.add(new SlotView(h, spots));
        }
        return slots;
    }

    public ReservationView book(BookRequest req, UUID userId) {
        if (req.date().isBefore(LocalDate.now()) ||
                (req.date().equals(LocalDate.now()) && req.hour() <= LocalDateTime.now().getHour())) {
            throw new GymException(ErrorCode.PAST_SLOT);
        }
        if (repo.countActiveByUserAndDate(userId, req.date()) >= 2) {
            throw new GymException(ErrorCode.DAILY_LIMIT_REACHED);
        }
        try {
            ReservationsRecord r = repo.insert(userId, req.date(), req.hour(), req.spotNumber());
            UsersRecord user = users.findById(userId).orElseThrow();
            email.sendBookingConfirmation(user.getEmail(), user.getName(), r.getDate(), r.getHour(), r.getSpotNumber());
            return toView(r);
        } catch (DuplicateKeyException e) {
            throw new GymException(ErrorCode.SPOT_TAKEN);
        }
    }

    public void cancel(UUID reservationId, UUID userId, boolean isAdmin) {
        ReservationsRecord r = repo.findById(reservationId)
                .orElseThrow(() -> new GymException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!isAdmin && !r.getUserId().equals(userId)) {
            throw new GymException(ErrorCode.RESERVATION_NOT_FOUND);
        }
        if (!isAdmin && !CancellationPolicy.isAllowed(r.getDate(), r.getHour(), LocalDateTime.now())) {
            throw new GymException(ErrorCode.CANCELLATION_DEADLINE_PASSED);
        }
        repo.cancel(reservationId);
        UsersRecord owner = users.findById(r.getUserId()).orElseThrow();
        email.sendCancellationNotice(owner.getEmail(), owner.getName(), r.getDate(), r.getHour(), r.getSpotNumber());
    }

    public List<ReservationView> getMyReservations(UUID userId) {
        return repo.findUpcomingByUser(userId).stream().map(this::toView).toList();
    }

    private ReservationView toView(ReservationsRecord r) {
        return new ReservationView(r.getId(), r.getDate(), r.getHour(), r.getSpotNumber(), r.getStatus().getLiteral());
    }
}
```

- [ ] **Step 5: Write `ReservationController.java`**

```java
package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.reservation.dto.BookRequest;
import com.wolfpackunity.gym.reservation.dto.ReservationView;
import com.wolfpackunity.gym.reservation.dto.SlotView;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) { this.service = service; }

    @GetMapping("/slots")
    public List<SlotView> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication auth) {
        return service.getSlots(date, UUID.fromString(auth.getName()));
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationView book(@RequestBody BookRequest req, Authentication auth) {
        return service.book(req, UUID.fromString(auth.getName()));
    }

    @DeleteMapping("/reservations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID id, Authentication auth) {
        service.cancel(id, UUID.fromString(auth.getName()), false);
    }

    @GetMapping("/reservations/me")
    public List<ReservationView> myReservations(Authentication auth) {
        return service.getMyReservations(UUID.fromString(auth.getName()));
    }
}
```

- [ ] **Step 6: Write `ReservationIntegrationTest.java`**

```java
package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.auth.AuthService;
import com.wolfpackunity.gym.auth.dto.AuthResponse;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
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

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ReservationIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired AuthService authService;
    @MockBean com.wolfpackunity.gym.email.EmailService emailService;

    private String token;
    private final LocalDate tomorrow = LocalDate.now().plusDays(1);

    @BeforeEach
    void setup() {
        AuthResponse auth = authService.register(new RegisterRequest("Tester", "tester@example.com", "pw"));
        token = auth.token();
    }

    @Test
    void getSlots_returnsAllHoursWithSpots() throws Exception {
        mvc.perform(get("/api/slots?date=" + tomorrow)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(24))
                .andExpect(jsonPath("$[0].spots.length()").value(10));
    }

    @Test
    void book_thenGetMyReservations_containsBooking() throws Exception {
        String body = String.format("""
            {"date":"%s","hour":10,"spotNumber":3}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spotNumber").value(3));

        mvc.perform(get("/api/reservations/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void book_sameSpotTwice_returns409() throws Exception {
        String body = String.format("""
            {"date":"%s","hour":10,"spotNumber":5}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("SPOT_TAKEN"));
    }

    @Test
    void book_thirdInDay_returns409() throws Exception {
        for (int spot = 1; spot <= 2; spot++) {
            String body = String.format("""
                {"date":"%s","hour":%d,"spotNumber":1}
                """, tomorrow, 8 + spot);
            mvc.perform(post("/api/reservations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON).content(body));
        }
        String body = String.format("""
            {"date":"%s","hour":14,"spotNumber":2}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DAILY_LIMIT_REACHED"));
    }
}
```

- [ ] **Step 7: Run tests**

```bash
cd backend && mvn test -Dtest=ReservationIntegrationTest
```
Expected: all 4 tests PASS.

---

## Task 9: Email Service (Full Implementation)

**Files:**
- Modify: `backend/src/main/java/com/wolfpackunity/gym/email/EmailService.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

Replace the stub from Task 8 with the full async implementation.

- [ ] **Step 1: Replace `EmailService.java` with full implementation**

```java
package com.wolfpackunity.gym.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EmailService {

    private final JavaMailSender mailer;

    public EmailService(JavaMailSender mailer) { this.mailer = mailer; }

    @Async
    public void sendBookingConfirmation(String to, String name, LocalDate date, int hour, int spot) {
        send(to, "Wolfpack Unity — Booking Confirmed",
                "Hi " + name + ",\n\nYour spot is booked!\n\n" +
                "Date: " + date + "\nTime: " + String.format("%02d:00", hour) +
                "\nSpot: #" + spot + "\n\nSee you at Wolfpack Unity!");
    }

    @Async
    public void sendCancellationNotice(String to, String name, LocalDate date, int hour, int spot) {
        send(to, "Wolfpack Unity — Booking Cancelled",
                "Hi " + name + ",\n\nYour booking has been cancelled.\n\n" +
                "Date: " + date + "\nTime: " + String.format("%02d:00", hour) +
                "\nSpot: #" + spot + "\n\nWolfpack Unity Team");
    }

    private void send(String to, String subject, String text) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(text);
        mailer.send(msg);
    }
}
```

- [ ] **Step 2: Run all backend tests (EmailService is mocked in integration tests)**

```bash
cd backend && mvn test
```
Expected: `BUILD SUCCESS`, all tests PASS.

---

## Task 10: Admin Endpoints

**Files:**
- Create: `backend/src/main/java/com/wolfpackunity/gym/admin/dto/RoleUpdateRequest.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/admin/dto/StatsView.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/admin/AdminService.java`
- Create: `backend/src/main/java/com/wolfpackunity/gym/admin/AdminController.java`
- Test: `backend/src/test/java/com/wolfpackunity/gym/admin/AdminIntegrationTest.java`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write DTOs**

`backend/src/main/java/com/wolfpackunity/gym/admin/dto/RoleUpdateRequest.java`:
```java
package com.wolfpackunity.gym.admin.dto;
public record RoleUpdateRequest(String role) {}
```

`backend/src/main/java/com/wolfpackunity/gym/admin/dto/StatsView.java`:
```java
package com.wolfpackunity.gym.admin.dto;

import java.time.LocalDate;
import java.util.List;

public record StatsView(
    List<DailyOccupancy> dailyOccupancy,
    List<HourlyOccupancy> busiestHours,
    List<TopUser> topUsers
) {
    public record DailyOccupancy(LocalDate date, int bookedSpots) {}
    public record HourlyOccupancy(int hour, int bookedSpots) {}
    public record TopUser(String name, String email, int totalBookings) {}
}
```

- [ ] **Step 2: Write `AdminService.java`**

```java
package com.wolfpackunity.gym.admin;

import com.wolfpackunity.gym.admin.dto.StatsView;
import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.ReservationStatus;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.reservation.ReservationService;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final DSLContext dsl;
    private final ReservationService reservationService;

    public AdminService(DSLContext dsl, ReservationService reservationService) {
        this.dsl = dsl;
        this.reservationService = reservationService;
    }

    public List<ReservationsRecord> getReservations(LocalDate date, UUID userId) {
        var cond = Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE);
        if (date != null) cond = cond.and(Tables.RESERVATIONS.DATE.eq(date));
        if (userId != null) cond = cond.and(Tables.RESERVATIONS.USER_ID.eq(userId));
        return dsl.selectFrom(Tables.RESERVATIONS).where(cond)
                .orderBy(Tables.RESERVATIONS.DATE, Tables.RESERVATIONS.HOUR).fetch();
    }

    public void cancelReservation(UUID reservationId) {
        reservationService.cancel(reservationId, null, true);
    }

    public List<UsersRecord> getUsers() {
        return dsl.selectFrom(Tables.USERS).orderBy(Tables.USERS.NAME).fetch();
    }

    public void updateRole(UUID userId, String role) {
        dsl.update(Tables.USERS)
                .set(Tables.USERS.ROLE, UserRole.valueOf(role))
                .where(Tables.USERS.ID.eq(userId))
                .execute();
    }

    public void deleteUser(UUID userId) {
        dsl.deleteFrom(Tables.USERS).where(Tables.USERS.ID.eq(userId)).execute();
    }

    public StatsView getStats() {
        var R = Tables.RESERVATIONS;
        var U = Tables.USERS;
        var active = R.STATUS.eq(ReservationStatus.ACTIVE);

        List<StatsView.DailyOccupancy> daily = dsl
                .select(R.DATE, DSL.count().as("cnt"))
                .from(R).where(active)
                .groupBy(R.DATE).orderBy(R.DATE.desc()).limit(30)
                .fetch(r -> new StatsView.DailyOccupancy(r.get(R.DATE), r.get("cnt", Integer.class)));

        List<StatsView.HourlyOccupancy> hourly = dsl
                .select(R.HOUR, DSL.count().as("cnt"))
                .from(R).where(active)
                .groupBy(R.HOUR).orderBy(DSL.count().desc()).limit(10)
                .fetch(r -> new StatsView.HourlyOccupancy(r.get(R.HOUR), r.get("cnt", Integer.class)));

        List<StatsView.TopUser> top = dsl
                .select(U.NAME, U.EMAIL, DSL.count().as("cnt"))
                .from(R).join(U).on(R.USER_ID.eq(U.ID))
                .where(active)
                .groupBy(U.ID, U.NAME, U.EMAIL)
                .orderBy(DSL.count().desc()).limit(10)
                .fetch(r -> new StatsView.TopUser(r.get(U.NAME), r.get(U.EMAIL), r.get("cnt", Integer.class)));

        return new StatsView(daily, hourly, top);
    }
}
```

- [ ] **Step 3: Write `AdminController.java`**

```java
package com.wolfpackunity.gym.admin;

import com.wolfpackunity.gym.admin.dto.RoleUpdateRequest;
import com.wolfpackunity.gym.admin.dto.StatsView;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) { this.service = service; }

    @GetMapping("/reservations")
    public List<ReservationsRecord> reservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID userId) {
        return service.getReservations(date, userId);
    }

    @DeleteMapping("/reservations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelReservation(@PathVariable UUID id) {
        service.cancelReservation(id);
    }

    @GetMapping("/users")
    public List<UsersRecord> users() {
        return service.getUsers();
    }

    @PatchMapping("/users/{id}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateRole(@PathVariable UUID id, @RequestBody RoleUpdateRequest req) {
        service.updateRole(id, req.role());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        service.deleteUser(id);
    }

    @GetMapping("/stats")
    public StatsView stats() {
        return service.getStats();
    }
}
```

- [ ] **Step 4: Write `AdminIntegrationTest.java`**

```java
package com.wolfpackunity.gym.admin;

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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

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
    private String userToken;

    @BeforeEach
    void setup() {
        userToken = authService.register(new RegisterRequest("User", "user@example.com", "pw")).token();
        authService.register(new RegisterRequest("Admin", "admin@example.com", "pw"));
        dsl.update(Tables.USERS).set(Tables.USERS.ROLE, UserRole.ADMIN)
                .where(Tables.USERS.EMAIL.eq("admin@example.com")).execute();
        adminToken = authService.login(new LoginRequest("admin@example.com", "pw")).token();
    }

    @Test
    void adminCanListUsers() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void userCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanViewStats() throws Exception {
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyOccupancy").isArray());
    }
}
```

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && mvn test
```
Expected: all tests PASS.

---

## Task 11: Frontend Scaffold

**Files:**
- Create: `frontend/` (Vite scaffold)
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/auth/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/components/AdminRoute.tsx`
- Create: `frontend/src/App.tsx`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Scaffold React + Vite project**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install react-router-dom axios
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Replace `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/login': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
})
```

- [ ] **Step 3: Write `frontend/src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write `frontend/src/api/client.ts`**

```typescript
import axios from 'axios'

export const client = axios.create({ baseURL: '/api' })

export function setToken(token: string | null) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common['Authorization']
  }
}
```

- [ ] **Step 5: Write `frontend/src/auth/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, ReactNode } from 'react'
import { setToken } from '../api/client'

interface AuthUser { userId: string; email: string; role: string }
interface AuthCtx {
  user: AuthUser | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>(null!)

function parseJwt(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return { userId: payload.sub, email: payload.email, role: payload.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  function login(token: string) {
    setToken(token)
    setUser(parseJwt(token))
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
```

- [ ] **Step 6: Write `frontend/src/components/ProtectedRoute.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 7: Write `frontend/src/components/AdminRoute.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
```

- [ ] **Step 8: Write `frontend/src/App.tsx`**

```typescript
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<SlotGridPage />} />
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

- [ ] **Step 9: Verify build**

```bash
cd frontend && npm run build
```
Expected: `dist/` created, no errors.

---

## Task 12: Auth Pages

**Files:**
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/components/ErrorMessage.tsx`
- Create: `frontend/src/auth/LoginPage.tsx`
- Create: `frontend/src/auth/RegisterPage.tsx`
- Create: `frontend/src/auth/OAuth2Callback.tsx`
- Test: `frontend/src/test/auth/LoginPage.test.tsx`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `frontend/src/api/auth.ts`**

```typescript
import { client } from './client'

export async function register(name: string, email: string, password: string) {
  const res = await client.post<{ token: string }>('/auth/register', { name, email, password })
  return res.data.token
}

export async function login(email: string, password: string) {
  const res = await client.post<{ token: string }>('/auth/login', { email, password })
  return res.data.token
}

export function googleLoginUrl() {
  return '/oauth2/authorization/google'
}
```

- [ ] **Step 2: Write `frontend/src/components/ErrorMessage.tsx`**

```typescript
export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return <p style={{ color: 'red', marginTop: 8 }}>{message}</p>
}
```

- [ ] **Step 3: Write `frontend/src/auth/LoginPage.tsx`**

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, googleLoginUrl } from '../api/auth'
import { useAuth } from './AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login: authLogin } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const token = await login(email, password)
      authLogin(token)
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Wolfpack Unity</h1>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        <div><label>Email<br /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label></div>
        <div style={{ marginTop: 12 }}><label>Password<br /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label></div>
        <ErrorMessage message={error} />
        <button type="submit" style={{ marginTop: 16 }}>Sign in</button>
      </form>
      <p><a href={googleLoginUrl()}>Sign in with Google</a></p>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  )
}
```

- [ ] **Step 4: Write `frontend/src/auth/RegisterPage.tsx`**

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from './AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login: authLogin } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const token = await register(name, email, password)
      authLogin(token)
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Wolfpack Unity</h1>
      <h2>Create account</h2>
      <form onSubmit={handleSubmit}>
        <div><label>Name<br /><input value={name} onChange={e => setName(e.target.value)} required /></label></div>
        <div style={{ marginTop: 12 }}><label>Email<br /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label></div>
        <div style={{ marginTop: 12 }}><label>Password<br /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label></div>
        <ErrorMessage message={error} />
        <button type="submit" style={{ marginTop: 16 }}>Create account</button>
      </form>
      <p>Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  )
}
```

- [ ] **Step 5: Write `frontend/src/auth/OAuth2Callback.tsx`**

```typescript
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function OAuth2Callback() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      login(token)
      nav('/', { replace: true })
    } else {
      nav('/login', { replace: true })
    }
  }, [])

  return <p>Signing in...</p>
}
```

- [ ] **Step 6: Write `frontend/src/test/auth/LoginPage.test.tsx`**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../../auth/LoginPage'
import { AuthProvider } from '../../auth/AuthContext'
import { vi } from 'vitest'
import * as authApi from '../../api/auth'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>
  )
}

test('shows error when login fails', async () => {
  vi.spyOn(authApi, 'login').mockRejectedValue({
    response: { data: { message: 'Invalid credentials' } }
  })
  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
})
```

- [ ] **Step 7: Run test**

```bash
cd frontend && npx vitest run src/test/auth/LoginPage.test.tsx
```
Expected: PASS.

---

## Task 13: Slot Grid & Booking

**Files:**
- Create: `frontend/src/api/slots.ts`
- Create: `frontend/src/api/reservations.ts`
- Create: `frontend/src/slots/SlotRow.tsx`
- Create: `frontend/src/slots/BookingModal.tsx`
- Create: `frontend/src/slots/SlotGridPage.tsx`
- Test: `frontend/src/test/slots/SlotRow.test.tsx`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `frontend/src/api/slots.ts`**

```typescript
import { client } from './client'

export interface SpotView {
  number: number
  available: boolean
  reservationId: string | null
  mine: boolean
}

export interface SlotView {
  hour: number
  spots: SpotView[]
}

export async function getSlots(date: string): Promise<SlotView[]> {
  const res = await client.get<SlotView[]>('/slots', { params: { date } })
  return res.data
}
```

- [ ] **Step 2: Write `frontend/src/api/reservations.ts`**

```typescript
import { client } from './client'

export interface ReservationView {
  id: string
  date: string
  hour: number
  spotNumber: number
  status: string
}

export async function book(date: string, hour: number, spotNumber: number) {
  const res = await client.post<ReservationView>('/reservations', { date, hour, spotNumber })
  return res.data
}

export async function cancelReservation(id: string) {
  await client.delete(`/reservations/${id}`)
}

export async function getMyReservations(): Promise<ReservationView[]> {
  const res = await client.get<ReservationView[]>('/reservations/me')
  return res.data
}
```

- [ ] **Step 3: Write `frontend/src/slots/SlotRow.tsx`**

```typescript
import { SpotView } from '../api/slots'

interface Props {
  hour: number
  spots: SpotView[]
  onSpotClick: (spot: SpotView) => void
}

export function SlotRow({ hour, spots, onSpotClick }: Props) {
  return (
    <tr>
      <td style={{ width: 60, fontWeight: 'bold' }}>{String(hour).padStart(2, '0')}:00</td>
      {spots.map(spot => (
        <td key={spot.number} style={{ padding: 4 }}>
          <button
            disabled={!spot.available && !spot.mine}
            onClick={() => onSpotClick(spot)}
            style={{
              width: 40, height: 40,
              background: spot.mine ? '#4caf50' : spot.available ? '#e0f7fa' : '#ccc',
              border: '1px solid #999',
              cursor: spot.available ? 'pointer' : 'default',
              borderRadius: 4
            }}
            aria-label={`Spot ${spot.number} ${spot.available ? 'available' : spot.mine ? 'yours' : 'taken'}`}
          >
            {spot.number}
          </button>
        </td>
      ))}
    </tr>
  )
}
```

- [ ] **Step 4: Write `frontend/src/slots/BookingModal.tsx`**

```typescript
import { useState } from 'react'
import { SpotView } from '../api/slots'
import { book } from '../api/reservations'
import { ErrorMessage } from '../components/ErrorMessage'

interface Props {
  date: string
  hour: number
  spot: SpotView
  onClose: () => void
  onBooked: () => void
}

export function BookingModal({ date, hour, spot, onClose, onBooked }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleBook() {
    setLoading(true)
    setError(null)
    try {
      await book(date, hour, spot.number)
      onBooked()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 300 }}>
        <h3>Book spot #{spot.number}</h3>
        <p>{date} at {String(hour).padStart(2, '0')}:00</p>
        <ErrorMessage message={error} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={handleBook} disabled={loading}>Confirm booking</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `frontend/src/slots/SlotGridPage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSlots, SlotView, SpotView } from '../api/slots'
import { SlotRow } from './SlotRow'
import { BookingModal } from './BookingModal'
import { useAuth } from '../auth/AuthContext'

function todayIso() { return new Date().toISOString().slice(0, 10) }

export function SlotGridPage() {
  const { user, logout } = useAuth()
  const [date, setDate] = useState(todayIso())
  const [slots, setSlots] = useState<SlotView[]>([])
  const [selected, setSelected] = useState<{ slot: SlotView; spot: SpotView } | null>(null)

  async function load() {
    const data = await getSlots(date)
    setSlots(data)
  }

  useEffect(() => { load() }, [date])

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Wolfpack Unity</h1>
        <div>
          <Link to="/my-reservations" style={{ marginRight: 16 }}>My reservations</Link>
          {user?.role === 'ADMIN' && <Link to="/admin" style={{ marginRight: 16 }}>Admin</Link>}
          <button onClick={logout}>Sign out</button>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      </div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Hour</th>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <th key={n}>#{n}</th>)}
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => (
            <SlotRow key={slot.hour} hour={slot.hour} spots={slot.spots}
              onSpotClick={spot => spot.available && setSelected({ slot, spot })} />
          ))}
        </tbody>
      </table>
      {selected && (
        <BookingModal
          date={date} hour={selected.slot.hour} spot={selected.spot}
          onClose={() => setSelected(null)}
          onBooked={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Write `frontend/src/test/slots/SlotRow.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlotRow } from '../../slots/SlotRow'
import { vi } from 'vitest'

const makeSpots = (overrides: any[] = []) =>
  Array.from({ length: 10 }, (_, i) => ({
    number: i + 1, available: true, reservationId: null, mine: false,
    ...overrides[i]
  }))

test('renders 10 spot buttons', () => {
  render(<table><tbody><SlotRow hour={9} spots={makeSpots()} onSpotClick={() => {}} /></tbody></table>)
  expect(screen.getAllByRole('button')).toHaveLength(10)
})

test('taken spot button is disabled', () => {
  const spots = makeSpots([{ available: false, mine: false }])
  render(<table><tbody><SlotRow hour={9} spots={spots} onSpotClick={() => {}} /></tbody></table>)
  expect(screen.getByLabelText('Spot 1 taken')).toBeDisabled()
})

test('clicking available spot calls onSpotClick', async () => {
  const handler = vi.fn()
  render(<table><tbody><SlotRow hour={9} spots={makeSpots()} onSpotClick={handler} /></tbody></table>)
  await userEvent.click(screen.getByLabelText('Spot 1 available'))
  expect(handler).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }))
})
```

- [ ] **Step 7: Run tests**

```bash
cd frontend && npx vitest run src/test/slots/SlotRow.test.tsx
```
Expected: 3 tests PASS.

---

## Task 14: My Reservations Page

**Files:**
- Create: `frontend/src/slots/MyReservationsPage.tsx`
- Test: `frontend/src/test/slots/MyReservationsPage.test.tsx`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `frontend/src/slots/MyReservationsPage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyReservations, cancelReservation, ReservationView } from '../api/reservations'
import { ErrorMessage } from '../components/ErrorMessage'

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationView[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() { setReservations(await getMyReservations()) }
  useEffect(() => { load() }, [])

  async function handleCancel(id: string) {
    setError(null)
    try {
      await cancelReservation(id)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Cancellation failed')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Link to="/">← Back to schedule</Link>
      <h2>My Reservations</h2>
      <ErrorMessage message={error} />
      {reservations.length === 0 && <p>No upcoming reservations.</p>}
      <ul>
        {reservations.map(r => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            {r.date} {String(r.hour).padStart(2, '0')}:00 — Spot #{r.spotNumber}
            <button onClick={() => handleCancel(r.id)} style={{ marginLeft: 12 }}>Cancel</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Write `frontend/src/test/slots/MyReservationsPage.test.tsx`**

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MyReservationsPage } from '../../slots/MyReservationsPage'
import { vi } from 'vitest'
import * as api from '../../api/reservations'

const sample = { id: 'abc', date: '2026-06-10', hour: 9, spotNumber: 3, status: 'ACTIVE' }

test('shows reservations', async () => {
  vi.spyOn(api, 'getMyReservations').mockResolvedValue([sample])
  render(<MemoryRouter><MyReservationsPage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText(/Spot #3/)).toBeInTheDocument())
})

test('shows error when cancel fails', async () => {
  vi.spyOn(api, 'getMyReservations').mockResolvedValue([sample])
  vi.spyOn(api, 'cancelReservation').mockRejectedValue({
    response: { data: { message: 'Cancellation deadline has passed.' } }
  })
  render(<MemoryRouter><MyReservationsPage /></MemoryRouter>)
  await waitFor(() => screen.getByText(/Spot #3/))
  await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
  await waitFor(() => expect(screen.getByText('Cancellation deadline has passed.')).toBeInTheDocument())
})
```

- [ ] **Step 3: Run tests**

```bash
cd frontend && npx vitest run src/test/slots/MyReservationsPage.test.tsx
```
Expected: 2 tests PASS.

---

## Task 15: Admin Panel

**Files:**
- Create: `frontend/src/api/admin.ts`
- Create: `frontend/src/admin/UsersTable.tsx`
- Create: `frontend/src/admin/ReservationsTable.tsx`
- Create: `frontend/src/admin/StatsView.tsx`
- Create: `frontend/src/admin/AdminLayout.tsx`

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Write `frontend/src/api/admin.ts`**

```typescript
import { client } from './client'

export interface AdminUser { id: string; name: string; email: string; role: string; createdAt: string }
export interface AdminReservation { id: string; userId: string; date: string; hour: number; spotNumber: number; status: string }
export interface Stats {
  dailyOccupancy: { date: string; bookedSpots: number }[]
  busiestHours: { hour: number; bookedSpots: number }[]
  topUsers: { name: string; email: string; totalBookings: number }[]
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return (await client.get<AdminUser[]>('/admin/users')).data
}

export async function updateUserRole(id: string, role: string) {
  await client.patch(`/admin/users/${id}/role`, { role })
}

export async function deleteUser(id: string) {
  await client.delete(`/admin/users/${id}`)
}

export async function getAdminReservations(date?: string, userId?: string): Promise<AdminReservation[]> {
  return (await client.get<AdminReservation[]>('/admin/reservations', { params: { date, userId } })).data
}

export async function adminCancelReservation(id: string) {
  await client.delete(`/admin/reservations/${id}`)
}

export async function getStats(): Promise<Stats> {
  return (await client.get<Stats>('/admin/stats')).data
}
```

- [ ] **Step 2: Write `frontend/src/admin/UsersTable.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { getAdminUsers, updateUserRole, deleteUser, AdminUser } from '../api/admin'

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])

  async function load() { setUsers(await getAdminUsers()) }
  useEffect(() => { load() }, [])

  async function toggleRole(u: AdminUser) {
    await updateUserRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete user and all their reservations?')) return
    await deleteUser(id)
    await load()
  }

  return (
    <div>
      <h3>Users</h3>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => toggleRole(u)}>{u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}</button>
                <button onClick={() => handleDelete(u.id)} style={{ marginLeft: 8 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Write `frontend/src/admin/ReservationsTable.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { getAdminReservations, adminCancelReservation, AdminReservation } from '../api/admin'

export function ReservationsTable() {
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [dateFilter, setDateFilter] = useState('')

  async function load() {
    setReservations(await getAdminReservations(dateFilter || undefined))
  }
  useEffect(() => { load() }, [dateFilter])

  async function handleCancel(id: string) {
    await adminCancelReservation(id)
    await load()
  }

  return (
    <div>
      <h3>Reservations</h3>
      <label>Filter by date: <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} /></label>
      <table style={{ marginTop: 12 }}>
        <thead><tr><th>Date</th><th>Hour</th><th>Spot</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>{String(r.hour).padStart(2, '0')}:00</td>
              <td>#{r.spotNumber}</td>
              <td>{r.status}</td>
              <td>{r.status === 'ACTIVE' && <button onClick={() => handleCancel(r.id)}>Cancel</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Write `frontend/src/admin/StatsView.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { getStats, Stats } from '../api/admin'

export function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => { getStats().then(setStats) }, [])

  if (!stats) return <p>Loading...</p>

  return (
    <div>
      <h3>Statistics</h3>
      <h4>Daily Occupancy (last 30 days)</h4>
      <table>
        <thead><tr><th>Date</th><th>Booked Spots</th></tr></thead>
        <tbody>{stats.dailyOccupancy.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.bookedSpots}</td></tr>)}</tbody>
      </table>
      <h4>Busiest Hours</h4>
      <table>
        <thead><tr><th>Hour</th><th>Bookings</th></tr></thead>
        <tbody>{stats.busiestHours.map(h => <tr key={h.hour}><td>{String(h.hour).padStart(2,'0')}:00</td><td>{h.bookedSpots}</td></tr>)}</tbody>
      </table>
      <h4>Top Users</h4>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Total Bookings</th></tr></thead>
        <tbody>{stats.topUsers.map(u => <tr key={u.email}><td>{u.name}</td><td>{u.email}</td><td>{u.totalBookings}</td></tr>)}</tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Write `frontend/src/admin/AdminLayout.tsx`**

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersTable } from './UsersTable'
import { ReservationsTable } from './ReservationsTable'
import { StatsView } from './StatsView'

type Tab = 'users' | 'reservations' | 'stats'

export function AdminLayout() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div style={{ padding: 24 }}>
      <Link to="/">← Back to schedule</Link>
      <h2>Admin Panel — Wolfpack Unity</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setTab('users')} style={{ fontWeight: tab === 'users' ? 'bold' : 'normal' }}>Users</button>
        <button onClick={() => setTab('reservations')} style={{ fontWeight: tab === 'reservations' ? 'bold' : 'normal' }}>Reservations</button>
        <button onClick={() => setTab('stats')} style={{ fontWeight: tab === 'stats' ? 'bold' : 'normal' }}>Stats</button>
      </div>
      {tab === 'users' && <UsersTable />}
      {tab === 'reservations' && <ReservationsTable />}
      {tab === 'stats' && <StatsView />}
    </div>
  )
}
```

- [ ] **Step 6: Run full frontend test suite**

```bash
cd frontend && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 7: Verify build**

```bash
npm run build
```
Expected: no errors.

---

## Task 16: Final Verification

Working directory: `/home/miroslav-dyrcik/claude/wolfpack-unity`

- [ ] **Step 1: Ensure Docker DB is running**

```bash
docker start wolfpackunity 2>/dev/null || docker run --name wolfpackunity -e POSTGRES_USER=gym -e POSTGRES_PASSWORD=gym -e POSTGRES_DB=wolfpackunity -p 5432:5432 -d postgres:16
```

- [ ] **Step 2: Start backend**

```bash
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
Expected: `Started GymApplication` in logs, Flyway runs migrations.

- [ ] **Step 3: Start frontend (separate terminal)**

```bash
cd frontend && npm run dev
```
Expected: `Local: http://localhost:5173`

- [ ] **Step 4: Manual smoke test checklist**

Open `http://localhost:5173`:

- [ ] Redirects to `/login`
- [ ] Register a new account — lands on slot grid
- [ ] Slot grid shows 24 rows × 10 spots
- [ ] Change date to tomorrow — spots reload
- [ ] Click an available spot — booking modal appears
- [ ] Confirm booking — spot turns green
- [ ] Navigate to My Reservations — booking listed
- [ ] Cancel booking — disappears from list
- [ ] Sign out → redirects to `/login`
- [ ] Sign back in — works
- [ ] Promote to admin via DB: `docker exec -it wolfpackunity psql -U gym -c "UPDATE users SET role='ADMIN' WHERE email='your@email.com';"`
- [ ] Re-login — Admin link in nav
- [ ] Admin → Users tab shows users
- [ ] Admin → Stats tab loads

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && mvn test
```
Expected: all tests PASS.

- [ ] **Step 6: Run all frontend tests**

```bash
cd frontend && npx vitest run
```
Expected: all tests PASS.
