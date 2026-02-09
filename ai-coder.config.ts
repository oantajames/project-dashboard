/**
 * AI Coder — Project Configuration
 *
 * Defines the rules, skills, and settings for the AI code modification pipeline.
 * Admin users can request changes through the chat interface, constrained by these rules.
 */

import { defineConfig } from "@/lib/ai-coder/config"

export default defineConfig({
  // ── Project Identity ──
  project: {
    name: "Project Dashboard",
    repo: process.env.GITHUB_REPO || "yourorg/project-dashboard",
    defaultBranch: "main",
  },

  // ── Rules (guardrails for what the AI can modify) ──
  rules: {
    allowed: [
      "components/**",
      "app/(dashboard)/**",
      "lib/utils/**",
      "lib/data/**",
      "public/**",
    ],
    blocked: [
      "lib/firebase/**",
      "lib/ai-coder/**",
      "contexts/AuthContext.tsx",
      "firestore.rules",
      "firebase.json",
      ".env*",
      "ai-coder.config.ts",
      "app/api/**",
    ],
    constraints: [
      "Do NOT modify authentication or authorization logic",
      "Do NOT add new npm dependencies without explicit approval",
      "Always use existing shadcn/ui components from components/ui/",
      "Maintain TypeScript strict mode — no `any` types",
      "Follow existing code patterns and naming conventions",
      "Use Tailwind CSS for all styling — no inline styles or CSS modules",
      "Use Phosphor Icons (@phosphor-icons/react) for new icons",
      "When the user says 'backend', 'server', or 'database', they mean Firestore — there is no REST API or SQL",
      "Follow the existing Firestore service pattern: one file per collection in lib/firebase/services/",
      "Use onSnapshot for realtime data in hooks, not one-time fetches",
      "All new Firestore documents must include ownerId, createdAt, and updatedAt fields",
      "If the request is unclear or ambiguous, ask a clarifying question before implementing",
      "Default to the simpler implementation when multiple approaches exist",
    ],
    maxFilesPerChange: 10,
    allowNewFiles: true,
    allowDeleteFiles: false,
    allowDependencyChanges: false,
  },

  // ── Skills (predefined capabilities) ──
  skills: [
    {
      id: "ui-enhancement",
      name: "UI Enhancement",
      description: "Modify UI components, layouts, and styling",
      icon: "Palette",
      prompt:
        "You are enhancing UI components. Follow these rules strictly:\n" +
        "- Use existing shadcn/ui components from components/ui/. Never create custom primitives.\n" +
        "- Use Tailwind CSS utility classes only. No inline styles or CSS modules.\n" +
        "- Icons: Phosphor Icons only. Use weight='duotone' for emphasis.\n" +
        "- Cards: rounded-2xl border border-border bg-background with hover:shadow-lg/5.\n" +
        "- Spacing: p-4 for cards, p-6 for pages, gap-2 to gap-4.\n" +
        "- Colors: Use semantic tokens (bg-background, text-foreground, text-muted-foreground).\n" +
        "- Dark mode: All changes must work in both light and dark mode.\n" +
        "- Match the existing Geist font typography scale (text-lg/text-sm/text-xs).\n" +
        "Ensure all changes are responsive and accessible.",
      allowedPaths: ["components/**", "app/**"],
    },
    {
      id: "copy-update",
      name: "Copy & Content",
      description: "Update text, labels, and content",
      icon: "TextAa",
      prompt:
        "You are updating text content only. Make minimal changes to the code — only modify string literals and text content. Do not restructure components or change logic.",
      allowedPaths: ["components/**", "app/**"],
      maxFilesPerChange: 5,
    },
    {
      id: "new-feature",
      name: "New Feature",
      description: "Add new pages, components, or functionality",
      icon: "PlusCircle",
      prompt:
        "You are adding a new feature. You MUST follow this workflow:\n" +
        "1. FIRST, call createPlan with a clear title, overview, and a numbered list of implementation steps.\n" +
        "2. Before coding, call updatePlan to mark all steps as 'in_progress'.\n" +
        "3. Call triggerCodeChange with a detailed prompt covering ALL plan items.\n" +
        "4. After the PR is created, call updatePlan to mark all items as 'done'.\n\n" +
        "Follow existing patterns in the codebase. Create new files as needed but reuse existing components and utilities. Place new components in the appropriate subdirectory.",
      allowNewFiles: true,
      requiresApproval: true,
    },
    {
      id: "bug-fix",
      name: "Bug Fix",
      description: "Fix reported bugs and issues",
      icon: "Bug",
      prompt:
        "You are fixing a bug. Follow these rules:\n" +
        "- Make the minimal change necessary to fix the issue.\n" +
        "- Add a brief comment explaining the fix.\n" +
        "- Do NOT refactor unrelated code.\n" +
        "- Check if the bug might be in a Firestore query (missing index, wrong field name, missing where clause).\n" +
        "- Check if the bug might be a timing issue with onSnapshot listeners or serverTimestamp.\n" +
        "- If the root cause is unclear, explain what you found and ask the user for more context.",
    },
    {
      id: "data-backend",
      name: "Data & Backend",
      description: "Add or modify Firestore collections, queries, and data hooks",
      icon: "Database",
      prompt:
        "You are modifying Firestore data operations. Follow the existing patterns exactly:\n" +
        "- Service files: lib/firebase/services/{collection}.ts with create/get/update/delete functions.\n" +
        "- Hooks: hooks/use{Domain}.ts with onSnapshot for realtime data.\n" +
        "- Every document needs: ownerId, createdAt (serverTimestamp), updatedAt (serverTimestamp).\n" +
        "- Use docTo{Entity}() helpers to convert Firestore snapshots to typed objects.\n" +
        "- Generate IDs with: doc(collection(db, COLLECTION)).id\n" +
        "- Convert undefined to null before writes.\n" +
        "- Use writeBatch for multi-document atomic updates.\n" +
        "- If adding a new collection, also create the corresponding service file AND hook.\n" +
        "- If adding a composite query (where + orderBy), note that a Firestore index may be needed.",
      allowedPaths: ["lib/firebase/services/**", "hooks/**", "lib/data/**"],
      requiresApproval: true,
    },
  ],

  // ── Git Settings ──
  git: {
    branchPrefix: "ai/",
    commitPrefix: "ai:",
    prTemplate: `## AI-Generated Change

**Summary:** {{summary}}

### Modified Files
{{files}}

### Skill Used
{{skill}}

---
_Generated via AI Coder by {{user}}_`,
    autoMerge: true,
    requiredChecks: [],
  },

  // ── Sandbox ──
  // timeoutMs: per-command limit (e.g. Claude CLI run).
  // Complex multi-file tasks can take 5-8 min in the CLI alone,
  // so give 10 min headroom to avoid premature deadline_exceeded errors.
  sandbox: {
    provider: "e2b",
    templateId: process.env.E2B_TEMPLATE_ID || "claude-code-sandbox",
    timeoutMs: 600_000, // 10 min — complex tasks need more headroom
  },

  // ── Deploy ──
  deploy: {
    provider: "vercel",
    waitForPreview: true,
  },
})
