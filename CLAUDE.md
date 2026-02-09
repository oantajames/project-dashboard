# Freelance Dashboard — Product & Rules

## Product Overview

Freelance Dashboard is a project management platform for freelance designers and developers.
It helps solo freelancers and small studios manage their clients, projects, invoices,
contracts, and team collaboration from a single interface.

- **Target user:** Solo freelancer or small studio owner
- **Tech stack:** Next.js 16, React 19, Tailwind CSS v4, Firebase/Firestore, shadcn/ui, Phosphor Icons
- **Auth:** Firebase Authentication with role-based access (owner vs client)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **AI Agent:** "Tiny Viber" — an in-app AI assistant that creates code changes via PRs

## Data Model

Projects are the central entity. Everything connects through them.

- **Client** — A company or person you do work for. Has contacts (name, email, role). Linked to invoices and contracts.
- **Project** — Belongs to a client. Contains a brief/intake, workstreams, tasks, notes, files, and a PRD.
- **Invoice** — Belongs to a client, optionally linked to a project. Has line items with quantity and unit price. Invoice numbers are auto-generated as `INV-YYYY-NNN`.
- **Contract** — Belongs to a client, optionally linked to a project. Rich text content edited via TipTap. Has status flow: draft → sent → signed.
- **Task** — Belongs to a project, optionally grouped under a workstream. Supports drag-and-drop reordering via an `order` field.
- **Workstream** — Groups tasks within a project (e.g., "Design", "Development"). Also ordered.
- **Project Notes** — Rich text notes attached to a project. Authored by a user.
- **Project Files** — Uploaded assets (PDF, images, Figma files, etc.) attached to a project.
- **PRD** — Versioned product requirements document for a project. Contains ordered sections (overview, goals, scope, features, timeline).

### Entity Relationships

```
Client
  ├── Projects (one-to-many)
  ├── Invoices (one-to-many)
  ├── Contracts (one-to-many)
  └── Invited Users (via invites)

Project (central entity)
  ├── Client (belongs to)
  ├── Tasks (one-to-many)
  ├── Workstreams (one-to-many, group tasks)
  ├── Project Notes (one-to-many)
  ├── Project Files (one-to-many)
  ├── PRD (one-to-one)
  └── Brief/Intake (embedded in project document)
```

### Multi-tenancy

Every document has an `ownerId` field linking it to the admin user who created it. Client-role users can only see data linked to their `clientId`.

## Backend / Server = Firestore

**When someone says "backend", "server", "database", or "API" in this project, they mean Firestore.** There is no REST API, no SQL database, and no Express/Node server. All data operations go through the Firebase client SDK.

### Firestore Architecture

- **Flat collections** — All data lives in top-level Firestore collections (no subcollections).
- **Realtime updates** — React hooks use `onSnapshot` for live data. No polling.
- **Server timestamps** — All documents use `serverTimestamp()` for `createdAt` and `updatedAt`.
- **Client-side reads** — Data is fetched via hooks, not API routes. The only API routes are for the AI agent pipeline.

### Collection Names

| Collection | Description |
|---|---|
| `users` | User profiles with roles |
| `clients` | Client companies |
| `projects` | Project records |
| `tasks` | Project tasks |
| `workstreams` | Task groups within projects |
| `project_notes` | Rich text notes |
| `project_files` | Uploaded file metadata |
| `contracts` | Client contracts |
| `invoices` | Client invoices |
| `prds` | Product requirement docs |
| `invites` | Client invite tokens |
| `aiCoderSessions` | Tiny Viber chat sessions |
| `aiCoderRequests` | AI pipeline execution records |
| `aiCoderConfig` | Agent configuration overrides |

## Firestore Implementation Patterns

Follow these patterns exactly when creating or modifying Firestore operations.

### File Structure

- One service file per collection: `lib/firebase/services/{collection}.ts`
- One hook file per domain: `hooks/use{Domain}.ts`

### Function Naming

- `create{Entity}(data)` — Create a new document
- `get{Entity}ById(id)` — Fetch a single document
- `get{Entity}s()` or `get{Entity}sByProjectId(id)` — Fetch multiple documents
- `update{Entity}(id, data)` — Update an existing document
- `delete{Entity}(id)` — Delete a document
- `docTo{Entity}(doc)` — Convert a Firestore doc snapshot to a typed object

### ID Generation

```typescript
function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}
```

### Timestamp Handling

- **Writes:** Always use `serverTimestamp()` for `createdAt` and `updatedAt`
- **Reads:** Convert via `(data.field as Timestamp)?.toDate() || new Date()`
- **Undefined to null:** Convert `undefined` values to `null` before writing (Firestore rejects `undefined`)

### Realtime Hooks Pattern

```typescript
useEffect(() => {
  const q = query(collection(db, COLLECTION), where("projectId", "==", id))
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => docTo{Entity}(d))
    setState(data)
  })
  return () => unsubscribe()
}, [id])
```

### Batch Writes

Use `writeBatch` for operations that update multiple documents atomically (e.g., reordering tasks).

## UI Aesthetic Rules

The design is modern, minimal, and professional. Clean layouts with subtle interactions.

### Component Library

- **Always** use shadcn/ui components from `components/ui/`
- **Never** create custom UI primitives when a shadcn component exists
- Icons: **Phosphor Icons** (`@phosphor-icons/react`). Use `weight="duotone"` for emphasis, default weight for UI chrome.

### Typography

- Font: Geist (sans-serif)
- Page headings: `text-2xl font-semibold` or `text-lg font-semibold`
- Body text: `text-sm`
- Labels and captions: `text-xs text-muted-foreground`
- Small metadata: `text-[10px]` or `text-[11px]`

### Layout & Spacing

- Card padding: `p-4` (compact) or `p-6` (spacious)
- Page sections: `px-6 py-4`
- Element gaps: `gap-2` (tight), `gap-3` (default), `gap-4` (spacious)
- Section dividers: `border-t border-border/60`

### Cards

- Shape: `rounded-2xl border border-border bg-background`
- Hover: `hover:shadow-lg/5 transition-shadow`
- Subtle variant: `border-border/60 bg-muted/10`

### Buttons

Use shadcn `<Button>` with the appropriate variant:
- Primary action: `variant="default"`
- Secondary: `variant="outline"`
- Subtle: `variant="ghost"`
- Danger: `variant="destructive"`

### Borders

- Standard: `border border-border`
- Subtle: `border-border/40` or `border-border/60`
- Dashed placeholder: `border-dashed border-border/60`

### Status Colors

| Status | Color |
|---|---|
| Active | Teal (`bg-teal-600`, `text-teal-700`) |
| Planned | Zinc (`bg-zinc-900`) |
| Backlog | Orange (`bg-orange-600`) |
| Completed | Blue (`bg-blue-600`) |
| Cancelled | Rose (`bg-rose-600`) |

### Dark Mode

All colors must work in both light and dark modes. Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) instead of hardcoded colors.

### No Custom CSS

Use Tailwind utility classes only. No inline styles, CSS modules, or `<style>` tags.

## Scope Management

- **Stay in scope.** Only implement what was asked. Do NOT refactor unrelated code, rename unrelated variables, or "improve" files you weren't asked to touch.
- **Ask before guessing.** If a request is ambiguous or could mean multiple things, ask a clarifying question before writing any code.
- **Explain blockers.** If a request touches blocked files or needs new dependencies, explain why you can't do it and suggest an alternative approach.
- **Default to simple.** When a feature could be built in a simple or complex way, default to the simpler version and ask if the user wants more.
- **Clarify vague requests.** For requests like "make it look better" or "fix the page", ask: "Which specific part? What's wrong with it currently?"
- **Small scope = fast delivery.** This is a small, focused coding agent. Keep changes minimal and correct rather than ambitious and risky.
