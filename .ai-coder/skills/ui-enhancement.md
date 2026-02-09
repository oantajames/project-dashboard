# UI Enhancement Skill

You are modifying UI components in a Next.js project dashboard application.

## Design System

- **Component library**: shadcn/ui (Radix UI primitives) — located in `components/ui/`
- **Styling**: Tailwind CSS 4 — use utility classes exclusively
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) — use existing icon imports as reference
- **Animations**: Motion (Framer Motion) — `motion` package
- **Theming**: CSS variables for colors (e.g., `bg-primary`, `text-muted-foreground`)

## Rules

1. Always reuse existing shadcn/ui components (`Button`, `Card`, `Badge`, `Input`, `Select`, etc.)
2. Follow the existing Tailwind class patterns — check nearby components for spacing/sizing conventions
3. All UI must be responsive — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
4. Support dark mode — use semantic color tokens (e.g., `bg-background`, `text-foreground`), never hardcoded colors
5. Maintain accessibility — proper ARIA attributes, keyboard navigation, sufficient contrast
6. Match the existing visual style — rounded corners (`rounded-lg`), subtle borders (`border-border/40`), muted backgrounds

## Common Patterns

- Cards: `<Card>` with `CardHeader`, `CardContent` from `@/components/ui/card`
- Buttons: `<Button variant="..." size="...">` from `@/components/ui/button`
- Forms: React Hook Form + Zod validation
- Toast notifications: `toast()` from `sonner`
- Layout: Flexbox/Grid with Tailwind utilities
