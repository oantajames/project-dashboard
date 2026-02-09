# Project Dashboard — Overview

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: shadcn/ui (Radix UI primitives) + Tailwind CSS 4
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Animations**: Motion (Framer Motion)
- **Database**: Firebase Cloud Firestore (NoSQL)
- **Auth**: Firebase Authentication (email/password)
- **Deployment**: Vercel + Firebase Hosting
- **Analytics**: Vercel Analytics

## Architecture

- Client-side data fetching using Firebase SDK directly
- Real-time subscriptions via Firestore `onSnapshot`
- Custom React hooks wrap all data operations
- No traditional API routes (except AI Coder endpoints)

## Directory Structure

```
app/
├── (auth)/          — Login, signup, password reset, invite
├── (dashboard)/     — Protected dashboard pages
│   ├── page.tsx     — Dashboard home (projects overview)
│   ├── projects/    — Project list + detail pages
│   ├── clients/     — Client management
│   ├── contracts/   — Contract management
│   ├── invoices/    — Invoice management
│   └── ai-coder/   — AI code modification chat
├── portal/          — Client portal (client role only)
└── api/             — API routes (AI Coder endpoints)

components/
├── ui/              — shadcn/ui base components
├── auth/            — Auth forms and guards
├── projects/        — Project-specific components
├── clients/         — Client management components
├── contracts/       — Contract components
├── invoices/        — Invoice components
├── portal/          — Client portal components
├── ai-coder/        — AI Coder chat components
└── project-wizard/  — Multi-step project creation

lib/
├── firebase/        — Firebase config + service functions
├── types/           — TypeScript type definitions
├── utils/           — Utility functions
├── data/            — Static data (sidebar nav items)
└── ai-coder/        — AI Coder server-side logic

hooks/               — Custom React hooks (useProjects, useClients, etc.)
contexts/            — React contexts (AuthContext)
```

## User Roles

- **Owner** (`"owner"`) — Full dashboard access, admin features
- **Client** (`"client"`) — Limited to client portal, their projects only

## Key Patterns

- Components use `"use client"` directive for client-side interactivity
- Hooks follow `useXxx` naming convention
- Firestore data is accessed via `onSnapshot` for real-time updates
- Forms use React Hook Form + Zod validation
- Toast notifications via `sonner`
- Theme support via `next-themes` (light/dark mode)
