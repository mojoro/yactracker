# CLAUDE.md — YACTracker

## What this is

YACTracker — a Young Artist Community directory + review platform for Young Artist Programs (YAPs) in classical music/opera. Users browse/filter programs, submit reviews. Admin panel for data management + automated import pipeline.

## Stack

- Next.js 16 (App Router, Server Components)
- TypeScript (strict mode)
- Prisma 7 ORM + Neon serverless adapter
- Neon Postgres (connection string in `DATABASE_URL` env var)
- Tailwind CSS v4
- OpenRouter (Claude Haiku 4.5) for LLM extraction
- Deploy to Vercel

## Project structure

```
yactracker/
├── prisma/
│   ├── schema.prisma          # do not modify without asking
│   ├── prisma.config.ts       # Prisma 7 config w/ NeonAdapter
│   └── seed.ts                # seed script: reference data, programs, import sources
├── src/
│   ├── app/
│   │   ├── layout.tsx         # root layout w/ header nav, footer
│   │   ├── page.tsx           # landing — featured programs, search, category chips
│   │   ├── programs/
│   │   │   ├── page.tsx       # browsable/filterable program directory
│   │   │   └── [program_id]/
│   │   │       ├── page.tsx   # program detail + reviews + review form
│   │   │       └── actions.ts # submitReview server action
│   │   ├── admin/
│   │   │   ├── page.tsx       # admin login (ADMIN_TOKEN gate)
│   │   │   ├── actions.ts     # login/logout/isAdminAuthenticated
│   │   │   ├── import/
│   │   │   │   ├── page.tsx   # import review: candidates, sources, scrape
│   │   │   │   ├── actions.ts # approve/reject/addSource/reExtract/runScrape
│   │   │   │   ├── scrape-button.tsx
│   │   │   │   ├── re-extract-button.tsx
│   │   │   │   ├── add-source-form.tsx
│   │   │   │   └── candidate-editor.tsx
│   │   │   └── data/
│   │   │       ├── page.tsx   # program/review/audition CRUD
│   │   │       ├── actions.ts # updateProgram/deleteProgram/deleteReview/audition CRUD
│   │   │       ├── program-editor.tsx
│   │   │       ├── audition-form.tsx
│   │   │       └── delete-button.tsx
│   │   └── api/               # REST API (Zalando-aligned, RFC 9457 errors)
│   │       ├── programs/      # GET list/filter, POST create
│   │       │   └── [program_id]/
│   │       │       ├── route.ts          # GET single, PUT update
│   │       │       ├── reviews/route.ts  # GET list, POST create
│   │       │       │   └── [review_id]/route.ts
│   │       │       └── auditions/route.ts
│   │       │           └── [audition_id]/route.ts
│   │       ├── instruments/   # GET list, POST create, PUT update
│   │       ├── categories/    # GET list, POST create, PUT update
│   │       ├── locations/     # GET list, POST create, PUT update
│   │       └── import/run/    # POST trigger scrape (CRON_SECRET gated)
│   └── lib/
│       ├── prisma.ts          # singleton Prisma client w/ NeonAdapter
│       ├── problem.ts         # RFC 9457 problem+json helpers
│       ├── pagination.ts      # cursor-based pagination (opaque base64url tokens)
│       ├── sort.ts            # sort param parsing + Prisma orderBy
│       ├── types.ts           # shared TypeScript types
│       ├── api.ts             # typed fetch helpers (used by server actions only)
│       └── import/
│           ├── constants.ts   # USER_AGENT, throttle timings
│           ├── robots.ts      # robots.txt checker
│           ├── throttle.ts    # per-host rate limiter
│           ├── fetcher.ts     # HTML fetcher w/ hash diffing
│           ├── extractor.ts   # OpenRouter LLM extractor w/ Zod validation
│           ├── candidate.ts   # dedupe matching + ProgramCandidate creation
│           ├── upsert.ts      # approve → upsert Program from extracted JSON
│           └── run.ts         # orchestrator: fetch → extract → candidate
├── openapi.yaml               # OpenAPI 3.0.3 spec (Zally-linted)
├── vercel.json                # Vercel cron: monthly import run
├── CLAUDE.md
└── .env.local                 # DATABASE_URL, ADMIN_TOKEN, OPENROUTER_API_KEY
```

## Database schema

Prisma schema at `prisma/schema.prisma`. Models:

**Core entities:**
- `Program` — central entity. Scalar fields: dates, tuition, age range, scholarship, URLs.
- `Review` — belongs to one Program (FK `program_id`). Fields: rating (int 1-5), year_attended, reviewer_name, title, body.
- `Audition` — belongs to one Program (FK `program_id`) + one Location (FK `location_id`). Fields: time_slot, fee, instructions, registration URL.

**Reference data:**
- `Instrument` — unique name. Filter dropdowns. Validated on write — never auto-create from user input.
- `Category` — unique name. Filter dropdowns. Validated on write.
- `Location` — city, country, state, address. Matched case-insensitively on city+country.

**Join tables (all @@unique on FK pair):**
- `ProgramInstrument` — Program ↔ Instrument (M:N)
- `ProgramCategory` — Program ↔ Category (M:N)
- `ProgramLocation` — Program ↔ Location (M:N)
- `AuditionInstrument` — Audition ↔ Instrument (M:N)

**Import pipeline:**
- `ImportSource` — URL to scrape, links to optional Program. Has status (active/paused/broken).
- `ImportRun` — one fetch attempt. Stores gzipped HTML, hash, extraction model/tokens, result.
- `ProgramCandidate` — extracted program data awaiting human approval. Status: pending/approved/rejected/stale.

## API design rules

Follows Zalando RESTful API Guidelines (pragmatically — see memory).

1. **snake_case** all JSON props + query params.
2. **Plural resource names** in URLs.
3. **Sub-resources** for owned entities.
4. **All errors** return `application/problem+json` per RFC 9457.
5. **POST** → 201 + created resource + `Location` header.
6. **PUT** → 200 + updated resource. P2002 → 409 conflict.
7. **GET** collections → `{ "items": [...], "meta": { "next", "prev", "total_items" } }`.
8. **Cursor pagination** — opaque base64url tokens encoding `{offset}`. `cursor` + `limit` params.
9. **Sorting** via `sort` query param. Comma-separated, `-` prefix = desc.
10. **Validation errors** → 400 (not 422, per Zalando).
11. **No auth** on public API. Admin pages gated by `ADMIN_TOKEN` cookie.

## Data fetching pattern

**Server components query Prisma directly.** Do NOT use `apiFetch`/HTTP self-fetch from server components — it causes unnecessary round-trips and 401 errors on Vercel deployment-protected URLs. The `src/lib/api.ts` helpers exist only for server actions that POST to API routes.

## Admin pages

All admin pages gated by `ADMIN_TOKEN` env var (cookie-based, set via `/admin` login form).

- `/admin` — login page
- `/admin/import` — import pipeline: candidate review (approve/reject/edit), source management (add/list/re-extract), scrape trigger
- `/admin/data` — program CRUD (edit all fields), review delete, audition CRUD (create/edit/delete)

Reference data (instruments, categories, locations) is **validated, not auto-created** on the admin pages. Unknown values are rejected with an error listing valid options.

## Import pipeline

Flow: `ImportSource` → fetch HTML → hash diff → LLM extract (OpenRouter, Claude Haiku 4.5) → `ProgramCandidate` → human review → approve → upsert `Program`.

- Fetch respects robots.txt, 5s per-host throttle
- Hash comparison skips extraction when content unchanged
- Re-extract button runs extraction on stored HTML without re-fetching
- Approve resolves instrument/category/location names to existing IDs (skips unknown)
- Monthly Vercel cron triggers `POST /api/import/run` (gated by `CRON_SECRET`)

## Environment variables

- `DATABASE_URL` — Neon pooled connection string
- `ADMIN_TOKEN` — shared secret for admin login
- `OPENROUTER_API_KEY` — for LLM extraction
- `CRON_SECRET` — Vercel cron auth (auto-sent as Bearer token)

## Tailwind v4 rules (IMPORTANT)

- **Only** `@import "tailwindcss"` in `src/app/globals.css`. No `@tailwind` directives (v3).
- Unlayered CSS **beats** utilities — wrap overrides in `@layer base { ... }`.
- No `prefers-color-scheme: dark` blocks. POC palette is light.
- Design tokens in `@theme inline { ... }`.
- Never write raw `font-family` in globals.css — Geist loaded via `next/font`.

## Important constraints

- No public auth/authz. Admin uses `ADMIN_TOKEN`.
- No PATCH — PUT for all updates.
- Every collection response wrapped in `{ "items": [...] }`.
- UUIDs for all primary keys.
- Timestamps UTC, RFC 3339.
- `prisma/` excluded from tsconfig (seed.ts uses standalone PrismaClient).
- Build command: `prisma generate && next build` (generates client before type-check).
- OpenAPI spec (`openapi.yaml`) = source of truth for API request/response shapes.
