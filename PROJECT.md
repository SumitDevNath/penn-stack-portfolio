# Portfolio Website — Project Context

This file defines the architecture and conventions for this project. Read this before scaffolding, generating, or modifying any code. Do not introduce alternate patterns (e.g. Next.js API routes for backend logic, a different ORM, a different DB provider) without asking first.

## Author

Sumit Dev Nath — Full Stack Developer (Next.js, React, TypeScript, PostgreSQL, Node/Express, Prisma).
Portfolio purpose: showcase production-level full-stack work, including a real Node.js/Express + PostgreSQL backend (not just a static site), since target roles specifically require Node/Express + SQL experience.

## Architecture: Separate Frontend + Backend (two services)

Two independently deployable services, not a monorepo with shared build:

```
portfolio/
├── client/          → Next.js frontend
└── server/          → Express backend
```

Deployed as **two separate Coolify apps**, each on its own (sub)domain:
- `client` → e.g. sumitdevnath.com
- `server` → e.g. api.sumitdevnath.com

## Frontend (`client/`)

- Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- No database access from the frontend. No Prisma client here.
- All data comes from fetch calls to the Express API via `lib/api.ts`
- Sections: Hero, Featured Projects (from `Project` table via API), Experience timeline, Skills grid, Contact form (POSTs to API)
- Env var: `NEXT_PUBLIC_API_URL` → points to the server's public URL

## Backend (`server/`)

- Node.js + Express + TypeScript
- Prisma ORM against Supabase Postgres
- Structure:
```
server/
├── src/
│   ├── index.ts
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   └── lib/prisma.ts
├── prisma/schema.prisma
├── Dockerfile
└── .env.example
```

### Database: Supabase Postgres (free tier)

**Critical Prisma + Supabase pattern — do not deviate:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled connection, port 6543 (pgbouncer) — used at runtime
  directUrl = env("DIRECT_URL")     // direct connection, port 5432 — used for migrations only
}
```
- Runtime queries use the pooled URL.
- `prisma migrate deploy` / `migrate dev` use the direct URL.
- Supabase free-tier projects pause after ~1 week of inactivity; first request after a pause is slow (cold start). The `/health` endpoint is a reasonable target for an uptime pinger to avoid this.

### Data models

```prisma
model Project {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String
  techStack   String[]
  imageUrl    String?
  liveUrl     String?
  githubUrl   String?
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}

model Admin {
  id       String @id @default(cuid())
  email    String @unique
  password String // hashed, never plaintext
}
```

### Routes / access control

- `GET /api/projects` — public, no auth
- `POST/PUT/DELETE /api/projects` — protected, requires `requireAuth` middleware (JWT)
- `POST /api/contact` — public, but rate-limited more strictly than the global limit
- `POST /api/auth/login` — public (admin login, issues JWT)
- `GET /health` — public, used for uptime pinging (guards against Supabase free-tier pause)

### Middleware stack (in `index.ts`)

- `helmet()` for security headers
- `cors({ origin: process.env.CLIENT_URL, credentials: true })` — origin must match the deployed client domain exactly
- `express.json()`
- Global rate limiter (e.g. 100 req / 15 min), plus a tighter limiter specifically on `/api/contact`
- Central `errorHandler` middleware, all controllers call `next(err)` on failure rather than handling errors inline

### Auth

- JWT-based, `requireAuth` middleware reads token from cookie or `Authorization: Bearer` header
- Only used to gate the admin project-management routes — this is a single-admin portfolio, not multi-tenant

## Deployment (Coolify)

- Two Coolify apps, deployed from the same repo but different build contexts (`client/`, `server/`)
- `server/` deploys via the provided Dockerfile (multi-stage build)
- Post-deploy command for `server/`: `npx prisma migrate deploy` (non-interactive — never `migrate dev` in production)
- Env vars set per-service in Coolify, not committed:
  - `server`: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CLIENT_URL`, `PORT`
  - `client`: `NEXT_PUBLIC_API_URL`

## Conventions

- TypeScript everywhere, strict mode on
- Controllers stay thin — Prisma queries live in controllers or a thin service layer, not scattered across routes
- No inline `any` — type request/response shapes explicitly
- Prefer editing existing files/patterns over introducing new libraries not listed here
