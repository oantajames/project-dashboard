/**
 * Tiny Viber — AI SDK Tool Definitions
 *
 * Tools called by Claude during the chat conversation:
 * - createPlan: output a structured plan/todo list (plan mode)
 * - updatePlan: mark plan items as in_progress/done/skipped
 * - getProjectContext: read-only codebase overview
 * - triggerCodeChange: runs AI agent, commits, pushes, creates PR — returns PR URL
 * - checkDeployStatus: polls PR / Vercel deployment status
 */

import { tool } from "ai"
import { z } from "zod"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminDb } from "./admin-db"
import { executeAndPush, generateBranchName } from "./orchestrator"
import { createPullRequest, getPRStatus, getPreviewUrl, mergePR } from "./github"
import { getSkillById } from "./config"
import type { AICoderConfig, PipelineStatus } from "./types"

export function createTools(config: AICoderConfig, userName: string) {
  return {
    // ── Plan Mode Tools ──

    /**
     * Creates a structured implementation plan with a todo list.
     * Lightweight pass-through — echoes the plan back with "pending" statuses.
     */
    createPlan: tool({
      description:
        "Create an implementation plan with a todo list. " +
        "Call this BEFORE making any code changes when using the New Feature skill. " +
        "The plan will be displayed to the user as a visual card with progress tracking.",
      inputSchema: z.object({
        title: z
          .string()
          .describe("Short title for the plan (e.g., 'Add Dark Mode Toggle')"),
        overview: z
          .string()
          .describe("One or two sentences describing the overall approach"),
        items: z
          .array(
            z.object({
              id: z.string().describe("Unique ID for this item (e.g., 'step-1')"),
              label: z.string().describe("Description of this implementation step"),
            })
          )
          .min(1)
          .describe("Ordered list of implementation steps"),
      }),
      execute: async ({ title, overview, items }) => {
        return {
          title,
          overview,
          items: items.map((item) => ({
            ...item,
            status: "pending" as const,
          })),
        }
      },
    }),

    /**
     * Updates the status of plan items. Call this to mark items as
     * in_progress, done, or skipped as work proceeds.
     */
    updatePlan: tool({
      description:
        "Update the status of items in the implementation plan. " +
        "Call this to mark items as 'in_progress' before coding and 'done' after the PR is created. " +
        "Pass the FULL items array with updated statuses.",
      inputSchema: z.object({
        title: z
          .string()
          .optional()
          .describe("Plan title (include for display consistency)"),
        items: z
          .array(
            z.object({
              id: z.string().describe("The item ID from createPlan"),
              label: z.string().describe("The item description"),
              status: z
                .enum(["pending", "in_progress", "done", "skipped"])
                .describe("Current status of this item"),
            })
          )
          .min(1)
          .describe("Full list of plan items with updated statuses"),
      }),
      execute: async ({ title, items }) => {
        return { title, items }
      },
    }),

    // ── Pipeline Tools ──

    /**
     * Main tool: runs the full pipeline (code → commit → push → PR).
     * Sandbox is killed after push. Vercel deploys a preview from the PR branch.
     * Writes an aiCoderRequests doc to Firestore so the webhook can update live status.
     */
    triggerCodeChange: tool({
      description:
        "Trigger an AI coding agent to implement a code change, push it, and create a pull request. " +
        "Call this AFTER explaining your plan to the user (or after calling createPlan). " +
        "The agent will modify files, commit, push to a branch, and open a PR. " +
        "Vercel will automatically deploy a preview for the PR. " +
        "If this tool returns status 'failed', do NOT call it again — inform the user and suggest they try again later.",
      inputSchema: z.object({
        summary: z
          .string()
          .describe("Brief one-line summary of the change (used for branch name and PR title)"),
        prompt: z
          .string()
          .describe(
            "Detailed prompt describing exactly what the coding agent should do. " +
            "Be specific about which files to modify and what changes to make."
          ),
        skillId: z
          .string()
          .describe("The skill ID to use for this change (e.g., 'ui-enhancement', 'bug-fix')"),
      }),
      execute: async ({ summary, prompt, skillId }, { toolCallId }) => {
        // Use the AI SDK toolCallId as the Firestore doc ID so the frontend
        // can subscribe to real-time pipeline progress during streaming.
        const requestId = toolCallId
        const adminDb = getAdminDb()
        const requestRef = adminDb.collection("aiCoderRequests").doc(requestId)

        // Helper: update the pipeline status in Firestore
        const updateStatus = async (
          status: PipelineStatus,
          extra?: Record<string, unknown>,
        ) => {
          try {
            await requestRef.set(
              { status, updatedAt: FieldValue.serverTimestamp(), ...extra },
              { merge: true }
            )
          } catch (err) {
            console.error("[TinyViber] Failed to update request status:", err)
          }
        }

        try {
          const skill = getSkillById(config, skillId)
          const branchName = generateBranchName(summary, config)

          // Create the Firestore doc at the START so the frontend can
          // subscribe immediately and see real-time pipeline progress.
          try {
            await requestRef.set({
              status: "validating",
              summary,
              branchName,
              skillId,
              checksStatus: "pending",
              previewUrl: null,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            })
          } catch (firestoreErr) {
            console.error("[TinyViber] Failed to create aiCoderRequests doc:", firestoreErr)
          }

          // Phase 1: Run AI agent in sandbox, commit, push
          // The onProgress callback keeps Firestore in sync with each step.
          const result = await executeAndPush({
            prompt,
            skill,
            config,
            branchName,
            onProgress: updateStatus,
          })

          // Phase 2: Create the PR on GitHub
          await updateStatus("creating_pr")
          const pr = await createPullRequest({
            branchName: result.branchName,
            title: summary,
            summary: prompt,
            filesChanged: result.filesChanged,
            skill,
            userName,
            config,
          })

          // Phase 3: Update the Firestore doc with PR info for webhook tracking
          await updateStatus("deploying", {
            prNumber: pr.prNumber,
            prUrl: pr.prUrl,
            commitSha: result.commitSha,
            filesChanged: result.filesChanged,
          })

          // Auto-merge if configured (non-blocking — fire and forget)
          if (config.git.autoMerge) {
            mergePR(pr.prNumber, config).catch(() => {
              // Non-fatal: auto-merge may fail if checks haven't passed yet.
              // The webhook or checkDeployStatus can retry later.
            })
          }

          return {
            status: "success" as const,
            requestId,
            prUrl: pr.prUrl,
            prNumber: pr.prNumber,
            branchName: result.branchName,
            commitSha: result.commitSha,
            filesChanged: result.filesChanged,
            summary,
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error occurred"

          // Mark the request as failed in Firestore
          await updateStatus("failed", { error: message })

          const isTimeout =
            message.includes("deadline_exceeded") ||
            message.includes("timed out") ||
            message.includes("timeout")
          return {
            status: "failed" as const,
            requestId,
            error: message,
            doNotRetry: true,
            instruction: isTimeout
              ? "Do NOT call triggerCodeChange again. The pipeline timed out. Tell the user what happened and that they can try again in a moment or with a simpler request."
              : "Do NOT call triggerCodeChange again. Tell the user what went wrong and suggest they try again or rephrase.",
          }
        }
      },
    }),

    /**
     * Poll tool: checks PR + Vercel deploy preview status.
     */
    checkDeployStatus: tool({
      description:
        "Check the deployment status of a pull request. " +
        "Use this to check if CI checks have passed and if a Vercel preview URL is available.",
      inputSchema: z.object({
        prNumber: z
          .number()
          .describe("The GitHub pull request number to check"),
      }),
      execute: async ({ prNumber }) => {
        try {
          const status = await getPRStatus(prNumber, config)
          const previewUrl = await getPreviewUrl(prNumber, config)

          return {
            status: "success" as const,
            prState: status.state,
            mergeable: status.mergeable,
            checksStatus: status.checksStatus,
            reviewState: status.reviewState,
            previewUrl: previewUrl || "Not available yet — Vercel may still be deploying.",
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error occurred"
          return {
            status: "failed" as const,
            error: message,
          }
        }
      },
    }),

    /**
     * Read-only tool: provides project context.
     */
    getProjectContext: tool({
      description:
        "Get an overview of the project structure and recent changes. " +
        "Call this before planning a code change to understand the codebase.",
      inputSchema: z.object({}),
      execute: async () => {
        return {
          projectName: config.project.name,
          repo: config.project.repo,
          skills: config.skills.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
          })),
          rules: {
            allowedPaths: config.rules.allowed,
            blockedPaths: config.rules.blocked,
            constraints: config.rules.constraints,
          },
        }
      },
    }),
  }
}
