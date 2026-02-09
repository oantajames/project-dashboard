/**
 * AI Coder — Chat API Route
 *
 * POST /api/ai-coder/chat
 *
 * Handles chat messages from the admin UI using AI SDK's streamText.
 * Validates auth, applies rules, and streams Claude's response with tool calls.
 */

// Allow long-running tool execution (e.g. triggerCodeChange: sandbox + clone + CLI + preview).
// Vercel Pro max is 300; set to match or stay under your plan limit.
export const maxDuration = 300

import { streamText, convertToModelMessages, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { verifyAdminUser } from "@/lib/ai-coder/auth"
import { getSkillById } from "@/lib/ai-coder/config"
import { getMergedConfig } from "@/lib/ai-coder/config-store"
import { validatePrompt, buildSystemPrompt } from "@/lib/ai-coder/rules-engine"
import { createTools } from "@/lib/ai-coder/tools"

export async function POST(req: Request) {
  // 1. Verify admin authentication
  // TODO: Re-enable auth once Firebase Admin token verification is fixed
  // const user = await verifyAdminUser(req)
  // if (!user) {
  //   return new Response(JSON.stringify({ error: "Unauthorized. Owner role required." }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   })
  // }
  const user = { uid: "dev", email: "james@tryomni.com", displayName: "James", role: "owner" }

  // 2. Load merged config (static defaults + Firestore overrides)
  const config = await getMergedConfig()

  // 3. Parse the request body (AI SDK sends messages + custom body)
  const body = await req.json()
  const { messages, skillId, screenContext } = body

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Messages array is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 4. Resolve the selected skill (default to first skill if not specified)
  const resolvedSkillId = skillId || config.skills[0].id
  let skill
  try {
    skill = getSkillById(config, resolvedSkillId)
  } catch {
    return new Response(JSON.stringify({ error: `Unknown skill: ${resolvedSkillId}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 5. Validate the latest user message against rules
  // AI SDK v6 sends UIMessage format with `parts` array, not `content`
  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user")
  if (lastUserMessage) {
    let content = ""

    // v6 UIMessage format: { parts: [{ type: "text", text: "..." }] }
    if (Array.isArray(lastUserMessage.parts)) {
      content = lastUserMessage.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join(" ")
    }
    // Fallback: older format with `content` as string
    else if (typeof lastUserMessage.content === "string") {
      content = lastUserMessage.content
    }
    // Fallback: older format with `content` as array of parts
    else if (Array.isArray(lastUserMessage.content)) {
      content = lastUserMessage.content
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join(" ")
    }

    const validation = validatePrompt(content, skill, config)
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // 6. Build the system prompt with rules + skill context + optional screen context
  const systemPrompt = buildSystemPrompt(skill, config, screenContext)

  // 7. Create the tool set with user context
  const tools = createTools(config, user.displayName)

  // 8. Convert UI messages (v6 parts format) to model messages for streamText
  // NOTE: convertToModelMessages is async — must be awaited
  const modelMessages = await convertToModelMessages(messages)

  // 9. Stream the response using AI SDK
  // stopWhen controls how many tool-call round-trips the model can do.
  // Default is stepCountIs(1) which stops after one tool call. We allow up to 5
  // so the model can: get context → plan → trigger code change → check status → summarize.
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
