/**
 * AI Provider abstraction for Edge Functions.
 *
 * ## Environment Variables
 *   AI_PROVIDER  — "gemini" | "openai" (default: "gemini")
 *   GEMINI_API_KEY — Google AI key (required when AI_PROVIDER=gemini)
 *   OPENAI_API_KEY — OpenAI key (required when AI_PROVIDER=openai)
 *
 * ## Switching models
 *   Change `AI_PROVIDER` secret — zero code changes required.
 *
 * ## Adding a new provider
 *   1. Create `createXxxProvider(key)` returning the Provider interface below.
 *   2. Add a case in `resolveProvider()`.
 *   3. Set the env var.
 */

// ── Types ──────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface Provider {
  call(
    systemPrompt: string,
    userMessage: string,
    options?: CallOptions,
  ): Promise<string>
  callMultiTurn(
    systemPrompt: string,
    messages: ChatMessage[],
    options?: CallOptions,
  ): Promise<string>
}

interface CallOptions {
  temperature?: number
  jsonMode?: boolean
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Call the configured AI provider. Throws on failure — callers must handle errors.
 */
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: CallOptions,
): Promise<string> {
  const provider = resolveProvider()
  return provider.call(systemPrompt, userMessage, options)
}

/**
 * Call the configured AI provider with multi-turn conversation history.
 * Throws on failure — callers must handle errors.
 */
export async function callAIMultiTurn(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: CallOptions,
): Promise<string> {
  const provider = resolveProvider()
  return provider.callMultiTurn(systemPrompt, messages, options)
}

// ── Provider resolution ────────────────────────────────────────────

function resolveProvider(): Provider {
  const name = (Deno.env.get('AI_PROVIDER') || 'gemini').toLowerCase()

  switch (name) {
    case 'gemini': {
      const key = Deno.env.get('GEMINI_API_KEY')
      if (!key) throw new Error('[ai] GEMINI_API_KEY is not set')
      return createGeminiProvider(key)
    }
    case 'openai': {
      const key = Deno.env.get('OPENAI_API_KEY')
      if (!key) throw new Error('[ai] OPENAI_API_KEY is not set')
      return createOpenAIProvider(key)
    }
    default:
      throw new Error(`[ai] Unknown AI_PROVIDER: ${name}`)
  }
}

// ── Retry helper ───────────────────────────────────────────────────

const MAX_RETRIES = 3
const BASE_DELAY = 500

async function withRetry(fn: () => Promise<string>): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(`[ai] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message)

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('[ai] All retries exhausted')
}

// ── Gemini provider (Gemini 2.0 Flash) ─────────────────────────────

function geminiRequest(
  apiKey: string,
  systemPrompt: string,
  contents: { role: string; parts: { text: string }[] }[],
  options?: CallOptions,
): () => Promise<string> {
  return async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.3,
    }
    if (options?.jsonMode !== false) {
      generationConfig.responseMimeType = 'application/json'
    }

    const requestBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }

    let response: Response
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      )
    } catch (fetchErr) {
      clearTimeout(timeout)
      throw new Error(`[gemini] Network error: ${fetchErr}`)
    }

    clearTimeout(timeout)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '(no body)')
      const msg = `[gemini] HTTP ${response.status}: ${errorBody}`
      console.error(msg)
      throw new Error(msg)
    }

    const result = await response.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      const detail = JSON.stringify(result).slice(0, 500)
      throw new Error(`[gemini] Empty response from API: ${detail}`)
    }
    return text
  }
}

function createGeminiProvider(apiKey: string): Provider {
  return {
    call: (systemPrompt, userMessage, options) =>
      withRetry(geminiRequest(
        apiKey,
        systemPrompt,
        [{ role: 'user', parts: [{ text: userMessage }] }],
        options,
      )),
    callMultiTurn: (systemPrompt, messages, options) =>
      withRetry(geminiRequest(
        apiKey,
        systemPrompt,
        messages.map((m) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        options,
      )),
  }
}

// ── OpenAI provider (GPT-4o) ───────────────────────────────────────

function openaiRequest(
  apiKey: string,
  messages: { role: string; content: string }[],
  options?: CallOptions,
): () => Promise<string> {
  return async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const body: Record<string, unknown> = {
      model: 'gpt-4o',
      messages,
      temperature: options?.temperature ?? 0.3,
    }
    if (options?.jsonMode !== false) {
      body.response_format = { type: 'json_object' }
    }

    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (fetchErr) {
      clearTimeout(timeout)
      throw new Error(`[openai] Network error: ${fetchErr}`)
    }

    clearTimeout(timeout)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '(no body)')
      const msg = `[openai] HTTP ${response.status}: ${errorBody}`
      console.error(msg)
      throw new Error(msg)
    }

    const result = await response.json()
    const text = result.choices?.[0]?.message?.content
    if (!text) {
      const detail = JSON.stringify(result).slice(0, 500)
      throw new Error(`[openai] Empty response from API: ${detail}`)
    }
    return text
  }
}

function createOpenAIProvider(apiKey: string): Provider {
  return {
    call: (systemPrompt, userMessage, options) =>
      withRetry(openaiRequest(
        apiKey,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        options,
      )),
    callMultiTurn: (systemPrompt, messages, options) =>
      withRetry(openaiRequest(
        apiKey,
        [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        options,
      )),
  }
}
