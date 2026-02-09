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
        "You are enhancing UI components. Use the existing shadcn/ui components and Tailwind CSS classes. Match the existing design system. Ensure all changes are responsive and accessible.",
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
        "You are adding a new feature. Follow existing patterns in the codebase. Create new files as needed but reuse existing components and utilities. Place new components in the appropriate subdirectory.",
      allowNewFiles: true,
      requiresApproval: true,
    },
    {
      id: "bug-fix",
      name: "Bug Fix",
      description: "Fix reported bugs and issues",
      icon: "Bug",
      prompt:
        "You are fixing a bug. Make the minimal change necessary to fix the issue. Add comments explaining the fix. Do not refactor unrelated code.",
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
  // Pipeline only needs: clone + branch + CLI + commit + push (~70s typical).
  sandbox: {
    provider: "e2b",
    templateId: process.env.E2B_TEMPLATE_ID || "claude-code-sandbox",
    timeoutMs: 300_000, // 5 min — plenty for clone + CLI + push
  },

  // ── Deploy ──
  deploy: {
    provider: "vercel",
    waitForPreview: true,
  },
})
