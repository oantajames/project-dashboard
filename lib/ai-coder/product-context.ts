/**
 * Tiny Viber — Product Context Defaults
 *
 * Static default values for each product context field.
 * These are the baseline — user edits from Tiny Brain (stored in Firestore)
 * override individual fields at runtime via the config store merge.
 *
 * Also exports a helper to concatenate all fields into a single string
 * for injection into system prompts and sandbox CLAUDE.md files.
 */

import type { AICoderProductContext } from "./types"

// ── Static Defaults ──

export const DEFAULT_PRODUCT_CONTEXT: AICoderProductContext = {
  productDescription: `Freelance Dashboard is a project management platform for freelance designers and developers. It helps solo freelancers and small studios manage their clients, projects, invoices, contracts, and team collaboration from a single interface.

Target user: Solo freelancer or small studio owner.
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Firebase/Firestore, shadcn/ui, Phosphor Icons.
Auth: Firebase Authentication with role-based access (owner vs client).
Hosting: Vercel (auto-deploys from GitHub).
AI Agent: "Tiny Viber" — an in-app AI assistant that creates code changes via PRs.`,

  dataModel: `Projects are the central entity. Everything connects through them.

- Client — A company or person you do work for. Has contacts. Linked to invoices and contracts.
- Project — Belongs to a client. Contains brief/intake, workstreams, tasks, notes, files, and a PRD.
- Invoice — Belongs to a client, optionally linked to a project. Has line items. Auto-generated number (INV-YYYY-NNN).
- Contract — Belongs to a client, optionally linked to a project. Rich text via TipTap. Status: draft → sent → signed.
- Task — Belongs to a project, optionally grouped under a workstream. Supports drag-and-drop ordering.
- Workstream — Groups tasks within a project (e.g., "Design", "Development").
- Project Notes — Rich text notes attached to a project.
- Project Files — Uploaded assets (PDF, images, Figma, etc.) attached to a project.
- PRD — Versioned product requirements document per project.

Every document has an ownerId for multi-tenancy. Client-role users only see data linked to their clientId.`,

  firestorePatterns: `When someone says "backend", "server", "database", or "API", they mean Firestore. There is no REST API or SQL database.

Architecture:
- Flat top-level collections (no subcollections)
- Realtime updates via onSnapshot in React hooks
- Server timestamps for createdAt/updatedAt
- Client-side reads via hooks, not API routes

File structure:
- One service file per collection: lib/firebase/services/{collection}.ts
- One hook file per domain: hooks/use{Domain}.ts

Function naming: create{Entity}, get{Entity}ById, get{Entity}s, update{Entity}, delete{Entity}
Helper: docTo{Entity}() to convert Firestore snapshots to typed objects
IDs: doc(collection(db, COLLECTION)).id
Timestamps: serverTimestamp() for writes, .toDate() for reads
Convert undefined to null before Firestore writes
Use writeBatch for multi-document atomic updates (e.g., reordering)`,

  styleGuide: `Modern, minimal, professional design. Clean layouts with subtle interactions.

Components: Always use shadcn/ui from components/ui/. Never create custom primitives when one exists.
Icons: Phosphor Icons (@phosphor-icons/react). Use weight="duotone" for emphasis.
Font: Geist. Headings: text-lg font-semibold. Body: text-sm. Labels: text-xs text-muted-foreground.
Cards: rounded-2xl border border-border bg-background. Hover: hover:shadow-lg/5 transition-shadow.
Buttons: shadcn Button with variant (default, outline, ghost, destructive).
Spacing: p-4 for cards, p-6 for page sections, gap-2 to gap-4 between elements.
Borders: Subtle (border-border/40 or border-border/60).
Status colors: Teal=active, Zinc=planned, Orange=backlog, Blue=completed, Rose=cancelled.
Dark mode: Use semantic tokens (bg-background, text-foreground). No hardcoded colors.
No custom CSS: Tailwind utility classes only.`,

  scopeRules: `Stay in scope. Only implement what was asked. Do NOT refactor unrelated code.
Ask before guessing. If a request is ambiguous, ask a clarifying question first.
Explain blockers. If a request touches blocked files or needs new dependencies, explain why and suggest alternatives.
Default to simple. When multiple approaches exist, choose the simpler one and ask if the user wants more.
Clarify vague requests. For "make it look better" or "fix the page", ask which specific part and what's wrong.
Small scope = fast delivery. Keep changes minimal and correct rather than ambitious and risky.`,
}

// ── Prompt Builder ──

/**
 * Concatenates all product context fields into a single markdown string
 * suitable for injection into system prompts and CLAUDE.md files.
 */
export function buildProductContextPrompt(ctx: AICoderProductContext): string {
  return [
    "# Product Context\n\n" + ctx.productDescription,
    "# Data Model\n\n" + ctx.dataModel,
    "# Firestore Patterns\n\n" + ctx.firestorePatterns,
    "# Style Guide\n\n" + ctx.styleGuide,
    "# Scope Rules\n\n" + ctx.scopeRules,
  ].join("\n\n---\n\n")
}

/**
 * Merges user-edited product context (from Firestore) with static defaults.
 * Only non-empty overrides replace the defaults.
 */
export function mergeProductContext(
  overrides?: Partial<AICoderProductContext> | null
): AICoderProductContext {
  if (!overrides) return { ...DEFAULT_PRODUCT_CONTEXT }

  return {
    productDescription:
      overrides.productDescription?.trim() || DEFAULT_PRODUCT_CONTEXT.productDescription,
    dataModel:
      overrides.dataModel?.trim() || DEFAULT_PRODUCT_CONTEXT.dataModel,
    firestorePatterns:
      overrides.firestorePatterns?.trim() || DEFAULT_PRODUCT_CONTEXT.firestorePatterns,
    styleGuide:
      overrides.styleGuide?.trim() || DEFAULT_PRODUCT_CONTEXT.styleGuide,
    scopeRules:
      overrides.scopeRules?.trim() || DEFAULT_PRODUCT_CONTEXT.scopeRules,
  }
}
