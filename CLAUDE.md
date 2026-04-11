# CLAUDE.md — YACTracker

## What this is

YACTracker = directory + review platform for Young Artist Programs (YAPs) in classical music/opera. Users browse/filter programs, submit reviews. No auth v1.

## Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Prisma ORM
- Neon Postgres (connection string in `DATABASE_URL` env var)
- Tailwind CSS
- Deploy to Vercel

## Project structure

```
yactracker/
├── prisma/
│   ├── schema.prisma        # provided — do not modify without asking
│   └── seed.ts              # seed script for reference data + sample programs
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # landing — featured programs, search entry
│   │   ├── programs/
│   │   │   ├── page.tsx                      # browsable/filterable program directory
│   │   │   └── [program_id]/
│   │   │       └── page.tsx                  # program detail + reviews list + review form
│   │   └── api/
│   │       ├── programs/
│   │       │   ├── route.ts                  # GET (list/filter), POST (create)
│   │       │   └── [program_id]/
│   │       │       ├── route.ts              # GET (single), PUT (update)
│   │       │       ├── reviews/
│   │       │       │   ├── route.ts          # GET (list), POST (create)
│   │       │       │   └── [review_id]/
│   │       │       │       └── route.ts      # GET (single), PUT (update)
│   │       │       └── auditions/
│   │       │           ├── route.ts          # GET (list), POST (create)
│   │       │           └── [audition_id]/
│   │       │               └── route.ts      # GET (single), PUT (update)
│   │       ├── instruments/
│   │       │   ├── route.ts                  # GET (list), POST (create)
│   │       │   └── [instrument_id]/
│   │       │       └── route.ts              # PUT (update)
│   │       ├── categories/
│   │       │   ├── route.ts                  # GET (list), POST (create)
│   │       │   └── [category_id]/
│   │       │       └── route.ts              # PUT (update)
│   │       └── locations/
│   │           ├── route.ts                  # GET (list), POST (create)
│   │           └── [location_id]/
│   │               └── route.ts              # PUT (update)
│   └── lib/
│       ├── prisma.ts                         # singleton Prisma client
│       └── problem.ts                        # RFC 9457 problem JSON helper
├── yactracker-api.yaml                       # OpenAPI 3.1 spec — source of truth for all endpoints
├── CLAUDE.md
└── .env.local                                # DATABASE_URL=<neon connection string>
```

## Database schema

Prisma schema at `prisma/schema.prisma`. Models:

**Core entities:**
- `Program` — central entity. Scalar fields: dates, tuition, age range, scholarship, URLs.
- `Review` — belongs to one Program (FK `program_id`). Fields: rating (int 1-5), year_attended, reviewer_name, title, body.
- `Audition` — belongs to one Program (FK `program_id`) + one Location (FK `location_id`). Fields: time_slot, fee, instructions, registration URL.

**Reference data:**
- `Instrument` — unique name. Filter dropdowns.
- `Category` — unique name. Filter dropdowns.
- `Location` — city, country, state, address.

**Join tables (all @@unique on FK pair):**
- `ProgramInstrument` — Program ↔ Instrument (M:N)
- `ProgramCategory` — Program ↔ Category (M:N)
- `ProgramLocation` — Program ↔ Location (M:N)
- `AuditionInstrument` — Audition ↔ Instrument (M:N)

## API design rules

Follows Zalando RESTful API Guidelines. Rules per handler:

1. **snake_case** all JSON props + query params. Never camelCase.
2. **Plural resource names** in URLs: `/programs`, `/reviews`, `/instruments`.
3. **Sub-resources** for owned entities: `/programs/{program_id}/reviews`, `/programs/{program_id}/auditions`.
4. **All errors** return `application/problem+json` per RFC 9457:
   ```json
   {
     "type": "/problems/not-found",
     "title": "Resource not found",
     "status": 404,
     "detail": "Program with id 'xxx' not found."
   }
   ```
5. **POST** → 201 + created resource + `Location` header.
6. **PUT** → 200 + updated resource.
7. **GET** collections → `{ "items": [...], "meta": { "page_number", "page_size", "total_pages", "total_items" } }`.
8. **Pagination** via `page[number]` (default 0) + `page[size]` (default 20, max 100).
9. **Sorting** via `sort` query param. Comma-separated, `-` prefix = desc. Example: `sort=-created_at,name`.
10. **No auth** v1. All endpoints public.

## API endpoints

Full OpenAPI 3.1 spec in `yactracker-api.yaml`. Implement every endpoint. Filtering on `GET /programs`:

- `instrument_id` — filter by instrument UUID (comma-separated = OR)
- `category_id` — filter by category UUID (comma-separated = OR)
- `location_id` — filter by location UUID
- `country` — filter by country name
- `deadline_after` / `deadline_before` — date range on application_deadline
- `tuition_lower_than` — upper bound on tuition
- `offers_scholarship` — boolean filter
- `q` — free-text search on name + description

## Seed data

Create `prisma/seed.ts` populating:

**Instruments** (min): Voice, Violin, Viola, Cello, Double Bass, Flute, Oboe, Clarinet, Bassoon, French Horn, Trumpet, Trombone, Tuba, Piano, Harp, Percussion, Composition, Conducting

**Categories** (min): Opera, Orchestral, Chamber Music, Art Song / Lieder, Musical Theatre, Baroque, Contemporary, Choral

**Locations** — 8-10 real YAP cities: Salzburg (Austria), Aspen (Colorado, US), Tanglewood (Massachusetts, US), Santa Fe (New Mexico, US), Glyndebourne (England, UK), Aix-en-Provence (France), Spoleto (Italy), Banff (Alberta, Canada), Ravinia (Illinois, US), Brevard (North Carolina, US)

**Programs** — 10-15 real/realistic YAPs, plausible data. Link to instruments, categories, locations via join tables.

**Reviews** — 2-4 per program, varied ratings + years.

**Auditions** — 2-3 per program, different locations.

Configure seed in `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

## Frontend pages

Three pages, server-rendered where possible:

### 1. Landing page (`/`)
- Hero + tagline: "Find and review young artist programs in classical music and opera"
- Search bar → `/programs?q=<query>`
- Featured programs (nearest deadlines or top rated)
- Quick filter chips for common categories

### 2. Program directory (`/programs`)
- Filter sidebar/top bar: instrument, category, country, scholarship, tuition range dropdowns
- Program cards grid: name, location(s), category badges, tuition, deadline, avg rating, review count
- Pagination controls
- Sort dropdown (deadline, rating, tuition, name)

### 3. Program detail (`/programs/[program_id]`)
- Full info: description, dates, tuition, age range, scholarship, links
- Instrument + category tags
- Locations list
- Auditions: dates, locations, fees, registration links
- Reviews: avg rating summary + individual cards
- Review form (reviewer_name, rating 1-5 stars, year_attended, title, body)

## UI guidelines

- Clean, professional. Not flashy. Glassdoor/Yelp, not Dribbble.
- Tailwind only — no component library.
- Responsive: mobile + desktop.
- Semantic HTML.
- Accessible: labels, contrast, focus states.

## Tailwind v4 rules (IMPORTANT)

Project uses Tailwind CSS v4 via `@tailwindcss/postcss`. Different from v3.

- **Only** `@import "tailwindcss"` in `src/app/globals.css`. No `@tailwind base/components/utilities` directives — those are v3.
- v4 cascade layers: `theme, base, components, utilities`. Unlayered CSS **beats** utilities — never write raw `body { background: ... }` or `h1 { color: ... }` in globals.css. Either use Tailwind utilities on the element, or wrap overrides in `@layer base { ... }` so utilities still win.
- Do **not** add `@media (prefers-color-scheme: dark)` blocks that set colors on `:root`/`body`. This silently flips the whole POC to dark mode on dark-OS users and defeats `bg-white`/`text-gray-900` utilities. For dark mode use Tailwind's `dark:` variants explicitly.
- Design tokens go in `@theme inline { ... }`. Example:
  ```css
  @theme inline {
    --font-sans: var(--font-geist-sans);
    --font-mono: var(--font-geist-mono);
  }
  ```
- Fonts: `next/font` injects `--font-geist-sans` on `<html>`. `@theme inline` maps it to Tailwind's `--font-sans`, so `font-sans` utility picks it up automatically. Never write raw `font-family: Arial` in globals.css — it overrides Geist.
- POC palette is **light**: `bg-white`, `text-gray-900`, `border-gray-200`. Do not introduce dark variants until the design phase.
- Arbitrary values (`bg-[#123]`) are fine but prefer the default palette for consistency.

## Build steps (in order)

1. `npx create-next-app@latest yactracker --typescript --tailwind --app --src-dir`
2. Copy `schema.prisma` to `prisma/schema.prisma`
3. `npm install prisma @prisma/client`
4. `npx prisma generate`
5. `npx prisma db push` (creates tables in Neon)
6. Create `src/lib/prisma.ts` (singleton client)
7. Create `src/lib/problem.ts` (error response helper)
8. Implement all API route handlers per OpenAPI spec
9. Create seed script, run `npx prisma db seed`
10. Build three frontend pages
11. Test: filtering, pagination, review submission, error responses
12. `npm run build` — no build errors
13. Deploy to Vercel

## Important constraints

- No auth/authz v1.
- No DELETE v1.
- No PATCH — PUT for all updates.
- Every collection response wrapped in `{ "items": [...] }` — never bare array top-level.
- UUIDs for all primary keys.
- Timestamps UTC, format `date-time` per RFC 3339.
- OpenAPI spec (`yactracker-api.yaml`) = source of truth for request/response shapes. Match exactly.