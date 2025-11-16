# StudyWell – Backend 

Fastify-based backend powering **StudyWell**, a modular and scalable student wellness platform. The backend exposes RESTful APIs under `/v1` for **authentication**, **calendar management**, **ingestion**, **preferences**, **nudges**, **context/crowd monitoring**, and **Google Calendar interoperability**. 

It implements a layered, service-oriented architecture using **Fastify**, **Prisma ORM (PostgreSQL)**, **Redis + BullMQ** for asynchronous jobs, and **Zod** for strict schema validation. Authentication is handled with **JWT** using access and refresh tokens.

> **Status:** Backend-only execution; frontend not required to test endpoints.

---

## 🧩 Tech Stack Overview

| Category | Technology | Purpose |
|-----------|-------------|----------|
| **Runtime** | Node.js ≥ 20 | Event-driven runtime for scalable REST API |
| **Framework** | Fastify | High-performance server with plugin ecosystem |
| **Validation** | Zod | Strongly typed validation and serialization for all routes |
| **ORM** | Prisma (PostgreSQL) | Type-safe DB access and migrations |
| **Cache & Jobs** | Redis + BullMQ v5 | Queue-based asynchronous job processing |
| **Auth** | @fastify/jwt | JWT access and refresh token management |
| **Docs** | Swagger UI (via OpenAPI 3.1) | Interactive REST documentation |
| **Dates/Calendar** | date-fns, rrule | Temporal manipulation and recurrence rule support |
| **Security** | Helmet, Rate Limiters, CORS | Hardened HTTP headers and DoS protection |

---

## 🏗️ High-Level Architecture

```text
frontend (React, mobile app, etc)
    │
    ▼           HTTP (REST, /v1/*)
┌───────────┐   calls   ┌────────────────────┐
│  routes   │──────────▶│   svc (services)   │──┐
│ (Fastify) │           └────────────────────┘  │ Orchestration
└─────┬─────┘                    ▲              │
      │                          │              ▼
      │ uses                     │ uses   ┌───────────┐
      ▼                          │        │   repo    │──▶ Prisma/Redis/External APIs
┌───────────┐                    │        └───────────┘
│  schema   │ (Zod DTOs)        │
└───────────┘                    │
                                 │ schedules
                                 ▼
                           ┌───────────┐
                           │   jobs    │ (BullMQ Workers)
                           └───────────┘
```

### Layer Responsibilities

| Layer | Purpose | Description |
|--------|----------|-------------|
| **Schema (`schema/`)** | Data Validation | Defines all input/output DTOs with Zod, enforcing type safety and validation constraints. |
| **Routes (`routes/`)** | HTTP Interface | Fastify endpoints. Handle validation, authentication, and service orchestration. |
| **Service (`svc/`)** | Business Logic | Implements domain logic. Invokes repositories and schedules jobs. |
| **Repository (`repo/`)** | Persistence | Interacts with Prisma ORM, Redis, or external APIs (Google, OpenAI, etc.). |
| **Jobs (`jobs/`)** | Background Tasks | Processes BullMQ queues (reminders, nudges, Google sync). |

---

## 🗂️ Project Structure

```bash
backend/
├── init/
│   └── 001-init.sql
├── prisma/
│   ├── migrations/
│   │   ├── 20251106082129_semester_calendar_ocr
│   │   └── 20251108111328_init
│   ├── dev.db
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── plugins/         # Fastify plugins (CORS, JWT, Helmet, Multipart, etc.)
│   │   ├── routes.ts        # Registers all /v1 module routers
│   │   └── server.ts        # Bootstraps Fastify instance, applies lifecycle hooks
│   ├── core/
│   │   ├── cache/redis.ts   # Redis connection + BullMQ Queue helpers
│   │   ├── config/          # Environment + crypto configs
│   │   ├── db/prisma.ts     # Prisma client singleton + graceful shutdown
│   │   ├── http/            # Global error, guard, and RBAC middlewares
│   │   └── util/            # Common utilities: ICS/Date/Recurrence helpers
│   ├── jobs/                # Worker queues and processors
│   │   ├── queues.ts
│   │   ├── workers.reminders.ts
│   │   ├── workers.nudges.ts
│   │   ├── workers.google_Sync.ts
│   │   └── workers.sessionCleanup.ts
│   ├── modules/             # Core feature modules
│   │   ├── auth/            # Authentication + Token lifecycle
│   │   ├── calendar/        # Calendar CRUD, validation, reminders
│   │   ├── ingestion/       # Academic/Semester PDF upload + OCR
│   │   ├── crowd_Monitoring # Crowd density, OpenAI classification
│   │   ├── google/          # Google Calendar API integration
│   │   ├── preferences/     # Quiet hours, window settings
│   │   ├── nudges/          # Wellness nudges generation/response
│   │   └── interop/ics/     # ICS file exports and ETag validation
│   ├── scripts/             # Seeding and E2E testing scripts
│   ├── tests/               # Golden outputs, unit tests, integration stubs
│   └── types/               # Global shared types
├── tmp/                     # Temporary file uploads for PDF/ICS parsing
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Environment Setup

### Prerequisites

- Node.js ≥ 20  
- PostgreSQL and Redis locally available

```bash
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
docker run -d --name redis -p 6379:6379 redis:7
```

### Environment Variables (`.env`)

```env
NODE_ENV=development
PORT=3000
CORS_ALLOWLIST=http://localhost:5173

JWT_SECRET=superlongsupersecretvalue123
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ISSUER=https://auth.studywell.app
JWT_AUDIENCE=studywell-api

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studywell
REDIS_URL=redis://localhost:6379

ENCRYPTION_KEY_HEX=5c61c8e0a1f2d3e45f6a7b8c9d0e1f2233445566778899aabbccddeeff001122
```

---

## 🧭 Initialization & Running

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Setup Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Optional reset/reseed:

```bash
npx prisma migrate reset --force
npm run seed
```

### 3️⃣ Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:3000`.

- Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)  
- Health Check: [http://localhost:3000/v1/health](http://localhost:3000/v1/health)

### 4️⃣ Run Workers (Async Jobs)

```bash
npm run worker:reminders
npm run worker:nudges
npm run worker:google
```

Workers consume Redis queues for reminders, nudges, and Google Calendar synchronization.

---

## 🧪 Testing & E2E Flow

### E2E Script (Automation)

The file `scripts/e2e_Backend_Flow.ps1` automates the complete workflow:

1. Register → Login (creates student)
2. Upload **Academic Calendar (PDF)** → OCR semester structure
3. Upload **Semester Timetable (PDF/ICS)** → Course-class parsing
4. Materialize events into `MainCalendar`
5. Sync with Google Calendar (if tokens available)
6. Retrieve merged calendar feed

Run it from PowerShell:

```bash
pwsh ./src/scripts/e2e_Backend_Flow.ps1
```

---

## 🧱 Module Overview (Detailed)

### 🧩 `auth`
Handles student authentication, password verification, token issuance and rotation.

- `routes/login.ts`, `routes/refresh.ts`  
- `svc/auth.service.ts` → verifies password, issues JWTs  
- `repo/session.repo.ts` → manages refresh tokens

**Endpoints:**
- `POST /v1/auth/login` → `{ accessToken, refreshToken }`
- `POST /v1/auth/refresh` → rotates tokens

### 📅 `calendar`
Central module managing all user events (manual + ingested).

- **Repositories:** CRUD functions via Prisma.
- **Services:** Conflict detection, reminder scheduling, time validation.
- **Routes:** REST endpoints for calendar operations.

**Endpoints:**
| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET` | `/v1/calendar?from&to` | List events overlapping range |
| `POST` | `/v1/calendar` | Create event (supports RRULE) |
| `PATCH` | `/v1/calendar/:id` | Update event |
| `DELETE` | `/v1/calendar/:id` | Delete event |

### 🧾 `ingestion`
Responsible for PDF uploads, OCR text extraction, and semester parsing.

- **academic_Calendar_Service.ts** → Extracts academic year, semester patterns.
- **semester_Calendar_Service.ts** → Detects timetable, class time blocks.
- **upload.ts** → Handles file upload, MIME validation.

### 🌤️ `context` & `crowd_Monitoring`
Provides real-time contextual awareness (weather/crowd). Integrates with OpenAI API for semantic density classification.

- `crowd.service.ts` → Retrieves live density snapshots.
- `crowd.scheduler.ts` → Periodic queue refresh and notification dispatch.

### 🔄 `google`
OAuth integration for two-way Google Calendar sync.

- `google.oauth.ts` → Handles authorization code grant.
- `google.service.ts` → Syncs events DB ↔ Google Calendar.
- `token.store.ts` → Encrypted storage of OAuth tokens via AES-256-GCM.

### 🧠 `nudges`
Manages motivational nudges, accept/dismiss flow, and event-based triggers.

- `svc/nudge.service.ts` → Computes streaks, filters by quiet hours.
- `routes/nudge.routes.ts` → API endpoints for feed + actions.

### ⚙️ `preferences`
Stores per-user preferences (time windows, quiet hours, timezone).

- `repo/preferences.repo.ts` → Prisma persistence.
- `routes/preferences.routes.ts` → CRUD endpoints.

### 📦 `interop/ics`
Exports ICS files for external calendar integration.

- `svc.renderIcs.ts` → Converts DB events to iCalendar (RFC5545).
- `etag.ts` → Conditional GET caching.

---

## 🧩 Developer Commands

```bash
# Development mode
npm run dev

# Production build
npm run build && npm start

# Run database migrations
dpx prisma migrate deploy

# Workers
npm run worker:reminders
npm run worker:nudges
npm run worker:google

# Run tests
npm run test
```

---

## 🧰 Best Practices

- Keep **all database access** in `repo/` to maintain clean architecture.  
- Use **Zod schemas** consistently across backend and shared FE contracts.  
- Do **not** use `prisma` directly in `routes/` or `svc/`.  
- Run `npm run prisma:generate` after every schema change.  
- Use `BullMQ` delays for reminder scheduling (milliseconds-based).  
- Apply `helmet`, `rateLimit`, and `CORS` plugins in production.

---

## ⚠️ Troubleshooting

| Issue | Likely Cause | Fix |
|--------|---------------|-----|
| `PrismaClientInitializationError` | PostgreSQL not running | Start Postgres (`docker ps`) |
| `ECONNREFUSED: 6379` | Redis not running | Start Redis locally |
| `Invalid JWT` | Wrong `JWT_ISSUER` or expired token | Re-login and refresh tokens |
| `CORS policy blocked` | Missing FE URL in `.env` | Add origin to `CORS_ALLOWLIST` |
| `Google OAuth Error` | Missing env vars | Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

---

## 🧠 TL;DR Quick Run

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit [http://localhost:3000/docs](http://localhost:3000/docs) → test endpoints live.

---

📘 **StudyWell Backend** — Modular, validated, and production-ready Fastify backend architecture.

