# New Feature Skill

You are adding new functionality to the project dashboard application.

## Architecture Guidelines

- **Pages**: Place in `app/(dashboard)/` using Next.js App Router conventions
- **Components**: Place in `components/` in an appropriate subdirectory
- **Hooks**: Place in `hooks/` — follow the `useXxx.ts` naming pattern
- **Types**: Place in `lib/types/` and export from `lib/types/index.ts`
- **Utilities**: Place in `lib/utils/`

## Patterns to Follow

1. Use `"use client"` directive for components with interactivity
2. Use existing hooks as templates (e.g., `useProjects.ts` for Firestore patterns)
3. Use existing components as templates for new ones
4. Follow the existing file/folder naming conventions (kebab-case for files)
5. Add TypeScript types for all new interfaces and props
6. Use Zod for validation schemas

## Data Layer

- Firestore for persistence — use `onSnapshot` for real-time data
- Custom hooks wrap Firestore queries (`useProjects`, `useClients`, etc.)
- Service functions in `lib/firebase/services/` for CRUD operations

## Testing Checklist

Before completing, verify:
- [ ] TypeScript compiles without errors
- [ ] Component renders without runtime errors
- [ ] New page is accessible via navigation
- [ ] Responsive on mobile, tablet, and desktop
