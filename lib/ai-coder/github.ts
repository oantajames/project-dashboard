/**
 * AI Coder — GitHub Integration
 *
 * Handles branch creation, pull requests, status checks, and preview URLs
 * using the Octokit SDK.
 */

import { Octokit } from "octokit"
import type { AICoderConfig, AICoderSkill } from "./types"

// ── Client ──

function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set")
  }
  return new Octokit({ auth: token })
}

function parseRepo(config: AICoderConfig) {
  const [owner, repo] = config.project.repo.split("/")
  if (!owner || !repo) {
    throw new Error(`Invalid repo format: "${config.project.repo}". Expected "owner/repo".`)
  }
  return { owner, repo }
}

// ── Pull Request Creation ──

interface CreatePRParams {
  branchName: string
  title: string
  summary: string
  filesChanged: string[]
  skill: AICoderSkill
  userName: string
  config: AICoderConfig
}

/**
 * Creates a pull request from the AI-generated branch against the default branch.
 */
export async function createPullRequest(params: CreatePRParams) {
  const { branchName, title, summary, filesChanged, skill, userName, config } = params
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(config)

  // Build PR body from template
  const body = config.git.prTemplate
    .replace("{{summary}}", summary)
    .replace("{{files}}", filesChanged.map((f) => `- \`${f}\``).join("\n"))
    .replace("{{skill}}", `${skill.name} (${skill.id})`)
    .replace("{{user}}", userName)

  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `${config.git.commitPrefix} ${title}`,
    body,
    head: branchName,
    base: config.project.defaultBranch,
  })

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
  }
}

// ── PR Status ──

export interface PRStatus {
  state: "open" | "closed" | "merged"
  mergeable: boolean | null
  checksStatus: "pending" | "success" | "failure" | "neutral"
  reviewState: "approved" | "changes_requested" | "pending" | "none"
}

/**
 * Gets the current status of a pull request including checks and reviews.
 */
export async function getPRStatus(prNumber: number, config: AICoderConfig): Promise<PRStatus> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(config)

  // Fetch PR data
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  })

  // Determine PR state
  const state = pr.merged ? "merged" : pr.state as "open" | "closed"

  // Fetch check runs for the PR's head commit
  let checksStatus: PRStatus["checksStatus"] = "pending"
  try {
    const { data: checks } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: pr.head.sha,
    })

    if (checks.total_count === 0) {
      checksStatus = "neutral"
    } else if (checks.check_runs.every((c) => c.conclusion === "success")) {
      checksStatus = "success"
    } else if (checks.check_runs.some((c) => c.conclusion === "failure")) {
      checksStatus = "failure"
    }
  } catch {
    checksStatus = "neutral"
  }

  // Fetch reviews
  let reviewState: PRStatus["reviewState"] = "none"
  try {
    const { data: reviews } = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    })

    const latestReview = reviews[reviews.length - 1]
    if (latestReview) {
      if (latestReview.state === "APPROVED") reviewState = "approved"
      else if (latestReview.state === "CHANGES_REQUESTED") reviewState = "changes_requested"
      else reviewState = "pending"
    }
  } catch {
    reviewState = "none"
  }

  return {
    state,
    mergeable: pr.mergeable,
    checksStatus,
    reviewState,
  }
}

// ── Preview URL ──

/**
 * Attempts to find the Vercel preview deployment URL from PR deployments.
 */
export async function getPreviewUrl(prNumber: number, config: AICoderConfig): Promise<string | null> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(config)

  try {
    // Get the PR to find the head SHA
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    })

    // Check deployment statuses on the commit
    const { data: statuses } = await octokit.rest.repos.listCommitStatusesForRef({
      owner,
      repo,
      ref: pr.head.sha,
    })

    // Look for Vercel deployment status
    const vercelStatus = statuses.find(
      (s) => s.context.includes("vercel") || s.context.includes("Vercel")
    )

    if (vercelStatus?.target_url) {
      return vercelStatus.target_url
    }

    // Fallback: check deployments API
    const { data: deployments } = await octokit.rest.repos.listDeployments({
      owner,
      repo,
      sha: pr.head.sha,
    })

    if (deployments.length > 0) {
      const { data: deployStatuses } = await octokit.rest.repos.listDeploymentStatuses({
        owner,
        repo,
        deployment_id: deployments[0].id,
      })

      const active = deployStatuses.find((s) => s.state === "success")
      if (active?.environment_url) {
        return active.environment_url
      }
    }

    return null
  } catch {
    return null
  }
}

// ── Merge PR ──

/**
 * Merges a pull request if auto-merge is enabled and all checks pass.
 */
export async function mergePR(prNumber: number, config: AICoderConfig): Promise<boolean> {
  if (!config.git.autoMerge) {
    return false
  }

  const octokit = getOctokit()
  const { owner, repo } = parseRepo(config)

  try {
    // Verify checks have passed
    const status = await getPRStatus(prNumber, config)
    if (status.checksStatus !== "success") {
      return false
    }

    await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: "squash",
    })

    return true
  } catch {
    return false
  }
}
