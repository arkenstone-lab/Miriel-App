import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TAGGING_PROMPT = `다음 기록에서 프로젝트명, 사람 이름, 주요 이슈를 추출해주세요.
JSON 형식으로만 응답하세요: { "projects": [], "people": [], "issues": [] }
각 항목은 문자열 배열입니다. 해당 항목이 없으면 빈 배열로 남겨주세요.`

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { text } = await req.json()
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      const tags = mockTagging(text)
      return new Response(JSON.stringify({ tags }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: TAGGING_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content
    if (!content) {
      const tags = mockTagging(text)
      return new Response(JSON.stringify({ tags }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const parsed: TaggingResult = JSON.parse(content)
    const tags = formatTags(parsed)

    return new Response(JSON.stringify({ tags }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
