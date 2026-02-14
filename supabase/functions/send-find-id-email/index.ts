import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowed = ['http://localhost:8081', 'http://localhost:19006', 'https://miriel.app']
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const EMAIL_TEMPLATES = {
  ko: {
    subject: 'Miriel — 아이디 안내',
    heading: 'Miriel — 아이디 안내',
    greeting: '안녕하세요, 요청하신 아이디 정보입니다.',
    label: '회원님의 아이디',
    footer: '본인이 요청하지 않으셨다면, 계정이 노출되었을 수 있습니다. 즉시 비밀번호를 변경하시고, 문제가 지속되면 support@miriel.app으로 문의해주세요.',
  },
  en: {
    subject: 'Miriel — Your Username',
    heading: 'Miriel — Your Username',
    greeting: 'Hello, here is the username you requested.',
    label: 'Your Username',
    footer: 'If you did not request this, your account may be compromised. Please change your password immediately and contact support@miriel.app if the issue persists.',
  },
} as const

function buildEmailHtml(lang: 'ko' | 'en', username: string): string {
  const t = EMAIL_TEMPLATES[lang]
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
    <h2 style="color:#0891b2;margin-bottom:24px;">${t.heading}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${t.greeting}</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${t.label}</p>
      <p style="color:#0891b2;font-size:24px;font-weight:700;margin:0;">${username}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.5;">${t.footer}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">Miriel by Arkenstone Labs &mdash; miriel.app</p>
  </div>
</body>
</html>`
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, lang } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailLang: 'ko' | 'en' = lang === 'ko' ? 'ko' : 'en'

    // Use service_role to query profiles + auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Look up username via RPC (same logic as get_username_by_email)
    const { data: username, error: rpcError } = await supabaseAdmin.rpc(
      'get_username_by_email',
      { p_email: email.toLowerCase().trim() },
    )

    if (rpcError || !username) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Try sending email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      // Fallback for development: return username directly
      return new Response(JSON.stringify({ username, fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const t = EMAIL_TEMPLATES[emailLang]
    const emailHtml = buildEmailHtml(emailLang, username)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Miriel <noreply@miriel.app>',
        reply_to: 'support@miriel.app',
        to: [email.trim()],
        subject: t.subject,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errBody = await resendResponse.text()
      console.error('Resend error:', errBody)
      return new Response(JSON.stringify({ error: 'email_send_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
