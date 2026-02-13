import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI } from '../_shared/ai.ts'
import { getCorsHeaders, jsonResponse, appendAiContext } from '../_shared/cors.ts'

// Prompt loaded from Supabase Edge Function secrets
const TAGGING_PROMPT = Deno.env.get('TAGGING_PROMPT') ?? ''

interface TaggingResult {
  projects: string[]
  people: string[]
  issues: string[]
}

function formatTags(result: TaggingResult): string[] {
  const tags: string[] = []
  result.projects.forEach((p) => tags.push(`프로젝트:${p}`))
  result.people.forEach((p) => tags.push(`사람:${p}`))
  result.issues.forEach((i) => tags.push(`이슈:${i}`))
  return tags
}

function mockTagging(text: string): string[] {
  const tags: string[] = []
  const projectPatterns = /프로젝트\s*[:\s]?\s*(\S+)/g
  const personPatterns = /([가-힣]{2,4})\s*(님|씨|대리|과장|팀장|부장|사원|매니저)/g
  const issuePatterns = /(버그|이슈|오류|에러|장애|문제|지연)/g

  let match
  while ((match = projectPatterns.exec(text)) !== null) {
    tags.push(`프로젝트:${match[1]}`)
  }
  while ((match = personPatterns.exec(text)) !== null) {
    tags.push(`사람:${match[1]}`)
  }
  while ((match = issuePatterns.exec(text)) !== null) {
    if (!tags.includes(`이슈:${match[1]}`)) {
      tags.push(`이슈:${match[1]}`)
    }
  }
  return tags
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401)
    }

    const { text, ai_context } = await req.json()
    if (!text) {
      return jsonResponse({ error: 'text is required' }, corsHeaders, 400)
    }

    if (text.length > 20000) {
      return jsonResponse({ error: 'text exceeds maximum length of 20000 characters' }, corsHeaders, 400)
    }

    const systemMessage = appendAiContext(TAGGING_PROMPT, ai_context)
    const content = await callAI(systemMessage, text)

    if (!content) {
      return jsonResponse({ tags: mockTagging(text) }, corsHeaders)
    }

    const parsed: TaggingResult = JSON.parse(content)
    const tags = formatTags(parsed)

    return jsonResponse({ tags }, corsHeaders)
  } catch (error) {
    return jsonResponse({ error: error.message }, corsHeaders, 500)
  }
})
