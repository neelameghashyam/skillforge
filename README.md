# SkillForge

SkillForge is a full-stack learning and productivity app for planning your week, tracking skills, managing projects, reviewing work, and staying consistent with habits and reminders.

It combines a Next.js app router frontend with Supabase for authentication, Postgres storage, edge functions, and realtime features.

## What’s included

- Weekly planner and calendar workflow
- Skills and curriculum tracking
- Project reminders and milestone tracking
- Notes, resources, and learning materials
- Gamification and progress streaks
- In-app notifications, web push, and email digests

## Tech stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- UI: shadcn/ui, Radix primitives, lucide-react
- State/data: TanStack Query, Zustand, React Hook Form, Zod
- Backend: Supabase (Postgres, Auth, RLS, Edge Functions)
- Testing: Vitest, Playwright

## Quick start

### Prerequisites

- Node.js 18.18+
- npm
- A Supabase project
- Optional: Supabase CLI and Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials and any notification-related values.

### 3. Start Supabase locally (recommended)

```bash
supabase start
```

This gives you local Postgres, Auth, Studio, and Edge Functions.

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Useful scripts

```bash
npm run dev
npm run build
npm run test
npm run test:watch
npm run typecheck
npm run lint
npm run test:e2e
```

## Database and seed data

If you want demo data locally, run:

```bash
supabase db reset
node scripts/seed.mjs
```

This seeds the demo account and sample curriculum content used by the app.

## Project structure

```text
src/
  app/               # App router pages and API routes
  components/        # UI and feature components
  hooks/             # React Query hooks and app-specific hooks
  lib/               # Utilities, Supabase clients, validation, gamification, etc.
supabase/
  migrations/        # Database schema and RLS migrations
  functions/         # Edge Functions
  seed.sql           # Demo seed data
tests/
  unit/              # Vitest tests
  e2e/               # Playwright tests
```

## Deployment notes

The app is designed to run on Vercel with Supabase Cloud as the backend. Edge functions and cron-driven notifications can also be deployed through Supabase.

## License

MIT
