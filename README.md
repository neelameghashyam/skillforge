# SkillForge — Personal Learning & Productivity OS

SkillForge is a full-stack productivity and learning platform: weekly planner,
calendar, skill progress tracking, learning paths, spaced-repetition
flashcards, project reminders, habit tracking, notes, a resource manager,
analytics, and gamification — all backed by Supabase (Postgres + Auth + Edge
Functions) with a Next.js 14 App Router frontend.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Big Calendar
- **State/data:** TanStack Query, Zustand, React Hook Form + Zod
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions, pg_cron)
- **Notifications:** Web Push (VAPID) + Resend (email)
- **Deployment:** Vercel (app) + Supabase Cloud (backend), Docker for self-hosting

---

## 1. Prerequisites

- Node.js ≥ 18.18 (20 recommended — see `.nvmrc`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase` or via Homebrew)
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Resend](https://resend.com) account + API key (for email)
- Docker (optional, for containerized deployment)

---

## 2. Local setup

```bash
git clone <this-repo>
cd skillforge
npm install
cp .env.example .env.local
```

### 2.1 Start Supabase locally (recommended for development)

```bash
supabase start
```

This spins up local Postgres, Auth, Studio (http://127.0.0.1:54323), and Edge
Functions. Copy the printed `API URL`, `anon key`, and `service_role key` into
`.env.local`.

### 2.2 Run migrations

```bash
supabase db reset
```

This applies every file in `supabase/migrations/` in order and then runs
`supabase/seed.sql` (badge catalog + demo data, see below).

### 2.3 Create the demo user + seed demo data (optional but recommended)

```bash
node scripts/seed.mjs
```

This creates `demo@skillforge.app` / `SkillForge123!` with a fixed UUID that
`supabase/seed.sql` uses to attach sample skills, tasks, habits, notes,
projects, and flashcards. Re-run `supabase db reset` afterward if you want the
demo data applied (or run the seed SQL directly via `supabase db execute -f
supabase/seed.sql`).

### 2.4 Generate VAPID keys for Web Push

```bash
npm run vapid:generate
```

Copy the output into `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`) and set the same keys as Supabase Edge Function secrets
(the command prints the exact `supabase secrets set` calls to run).

### 2.5 Configure Resend

Sign up at resend.com, verify a sending domain (or use their sandbox), and set:

```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=SkillForge <notifications@yourdomain.com>
```

### 2.6 Run the app

```bash
npm run dev
```

Visit http://localhost:3000. Log in with the demo account or sign up.

---

## 3. Deploying Edge Functions (notification engine)

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy daily-notifications
supabase functions deploy spaced-repetition-cron
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@domain.com
supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL="SkillForge <notifications@yourdomain.com>"
supabase secrets set APP_URL=https://your-deployed-app.vercel.app
```

### Scheduling

Two options are provided — pick one:

1. **pg_cron (default, runs inside Postgres):** migration
   `00000000000010_views_and_cron.sql` schedules hourly/daily jobs that call
   the Edge Functions via `pg_net`. After deploying, set the two Postgres
   settings it references (via the Supabase SQL editor, since they require
   your real project URL and service role key):
   ```sql
   alter database postgres set app.settings.edge_function_url = 'https://<project-ref>.functions.supabase.co';
   alter database postgres set app.settings.service_role_key = '<service-role-key>';
   ```
   Then re-run the two `cron.schedule(...)` blocks from that migration (or
   simply re-apply the migration on the linked project).

2. **Vercel Cron:** `vercel.json` already defines two cron routes
   (`/api/cron/daily-notifications`, `/api/cron/spaced-repetition`) that proxy
   to the same Edge Functions. Set `CRON_SECRET` in Vercel's environment
   variables — Vercel automatically sends it as a Bearer token to cron routes
   you configure with matching auth.

---

## 4. Deploying to Vercel

```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # or set the vars below in the dashboard
vercel --prod
```

Required environment variables in Vercel (Project Settings → Environment
Variables) — mirror `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (your production URL)

Also add your production domain to Supabase Auth → URL Configuration
(Site URL + Redirect URLs: `https://yourdomain.com/api/auth/callback`).

---

## 5. Docker (self-hosted deployment)

```bash
cp .env.example .env   # fill in real values
docker compose build
docker compose up -d
```

The `app` service builds a production Next.js standalone server (see
`Dockerfile`). `supabase-db` is a bare Postgres container for local testing
only — for a full self-hosted Supabase stack (Auth, Storage, Realtime), run
the [official self-hosting compose file](https://supabase.com/docs/guides/self-hosting/docker)
alongside this app, or use Supabase Cloud instead.

---

## 6. Testing

```bash
npm run test          # Vitest unit tests (SM-2 algorithm, XP/level math, utils)
npm run test:watch    # watch mode
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run test:e2e      # Playwright end-to-end tests (starts the dev server automatically)
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build, and
Playwright e2e tests on every push/PR to `main`.

---

## 7. Project structure

```
src/
  app/
    (auth)/            # login, signup, forgot/reset password
    (dashboard)/        # all authenticated feature pages
    api/                 # REST route handlers (tasks, events, skills, ...)
  components/
    ui/                  # shadcn/ui primitives
    layout/               # sidebar, topbar, notification bell
    <feature>/            # feature-specific components (dialogs, etc.)
  hooks/
    queries/               # TanStack Query hooks per resource
  lib/
    supabase/                # browser / server / admin / middleware clients
    spaced-repetition/         # SM-2 algorithm
    gamification/                # XP/level math
    validations/                   # Zod schemas
    api/                             # CRUD route-handler factory + fetcher
  store/                              # Zustand stores (UI, planner)
  types/                                # hand-authored Database types
supabase/
  migrations/                            # numbered SQL migrations (schema, RLS, triggers, cron)
  functions/                               # Edge Functions (daily-notifications, spaced-repetition-cron)
  seed.sql                                   # badge catalog + demo data
tests/
  unit/                                        # Vitest
  e2e/                                            # Playwright
```

## 8. Feature notes

- **Auth:** Supabase Auth (email/password + email confirmation), middleware-protected routes, password reset flow.
- **Gamification:** Postgres triggers award XP automatically on task completion, habit logging, flashcard review, skill logging, and project completion; badges are checked and awarded server-side after every XP event.
- **Spaced repetition:** SM-2 algorithm (`src/lib/spaced-repetition/sm2.ts`), unit-tested, used identically on the client preview and the `/api/revisions/[id]/review` route.
- **Notifications:** in-app (Postgres + Realtime), Web Push (VAPID, service worker in `public/sw.js`), and email (Resend), dispatched by two Supabase Edge Functions on a schedule.
- **RLS:** every table is row-level-secured to `auth.uid() = user_id` (or scoped through a parent relation for child tables like milestones/steps).

## 9. Demo account

```
Email:    demo@skillforge.app
Password: SkillForge123!
```

(Only available after running `scripts/seed.mjs` + `supabase db reset` locally, or recreating the same user/seed against your hosted project.)

## 10. License

MIT — do whatever you'd like with this.
#   s k i l l f o r g e  
 #   s k i l l f o r g e  
 