# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx supabase db reset    # Reset local DB and apply migrations
npx supabase db push     # Push migrations to remote DB
```

## Project Overview

Swebuk is a Next.js 14+ platform for a software engineering student club, featuring:
- Student clusters and project collaboration
- Final Year Project (FYP) management system
- Blog publishing with approval workflows
- Event management with registration

## Architecture

**Three-Tier Architecture:**
1. **Presentation (Frontend)**: Next.js App Router, React 19, Tailwind CSS, shadcn/ui (Radix UI)
2. **Application (Backend)**: Supabase (Auth, Storage, Realtime, Edge Functions)
3. **Data (Database)**: PostgreSQL with Row Level Security (RLS)

**Key Patterns:**
- Server Actions for data mutations (`lib/supabase/*-actions.ts`)
- Client components use `createClient()` from `@/lib/supabase/client`
- Server components use `createClient()` from `@/lib/supabase/server`
- Middleware handles auth session refresh and role-based redirects

## Role-Based Dashboard Structure

Routes follow `/dashboard/{role}/...` pattern:
- `student/` - Base role, with `/student/fyp` for Level 400 FYP access
- `staff/` - Faculty/staff with cluster and FYP supervision duties
- `lead/` - Student cluster leads
- `deputy/` - Student cluster deputy leads
- `admin/` - System administrators

Role-based access is enforced in `middleware.ts` and `lib/supabase/middleware.ts`. The middleware:
1. Refreshes auth sessions
2. Fetches user role from `profiles` table (not metadata)
3. Redirects unauthorized dashboard access
4. Restricts FYP access to `academic_level === '400'`

## Supabase Integration

**Client Setup:**
- Server Components: `lib/supabase/server.ts` - uses cookies() for session
- Client Components: `lib/supabase/client.ts` - browser client
- Middleware: `lib/supabase/middleware.ts` - session refresh + role checks

**Database Migrations:**
- Located in `supabase/migrations/`
- Run `npx supabase db reset` to apply migrations
- Migrations handle RLS policies, storage buckets, and RPC functions

## Important Implementation Details

**Authentication Flow:**
1. User logs in via Supabase Auth
2. Middleware fetches profile role from `profiles` table
3. User redirected to `/dashboard/{role}`
4. Profile completion required for first-time users (`/auth/complete-profile`)

**RLS Policy Pattern:**
Policies restrict access by role. Example: Staff can only view data for their clusters or supervisees. Admins have broad access.

**FYP System:**
- Student dashboard: `/dashboard/student/fyp` (Level 400 only)
- Staff dashboard: `/dashboard/staff/fyp`
- Admin dashboard: `/dashboard/admin/fyp`
- Submissions table tracks chapters/versions with feedback

## File Organization

```
app/
├── dashboard/{role}/     # Role-based pages (student, staff, admin, lead, deputy)
├── auth/                 # Login, sign-up, password reset
├── blog/                 # Public blog listing and posts
├── events/               # Public events listing
└── api/                  # API routes (seed, migration, guest registration)

components/
├── fyp/{role}/           # FYP components organized by role
├── clusters/             # Cluster management components
├── projects/             # Project collaboration components
├── events/               # Event management components
├── blog/                 # Blog components
└── ui/                   # shadcn/ui base components

lib/
├── supabase/             # Database clients, server actions, middleware
├── constants/            # Static values for blogs, events
└── utils.ts              # Helper functions (cn, format dates)
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, for admin operations)
