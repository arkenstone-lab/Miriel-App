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
    subject: 'Miriel - @@CODE@@ 인증 코드',
    heading: 'Miriel 이메일 인증',
    greeting: '안녕하세요! 아래 인증 코드를 입력해주세요.',
    codeLabel: '인증 코드',
    expiry: '이 코드는 10분간 유효합니다.',
    footer: '본인이 요청하지 않으셨다면 이 메일을 무시해주세요.',
  },
  en: {
    subject: 'Miriel - @@CODE@@ Verification Code',
    heading: 'Miriel Email Verification',
    greeting: 'Hello! Please enter the verification code below.',
    codeLabel: 'Verification Code',
    expiry: 'This code is valid for 10 minutes.',
    footer: 'If you did not request this, please ignore this email.',
  },
} as const

function buildEmailHtml(lang: 'ko' | 'en', code: string): string {
  const t = EMAIL_TEMPLATES[lang]
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
    <h2 style="color:#0891b2;margin-bottom:24px;">${t.heading}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${t.greeting}</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${t.codeLabel}</p>
      <p style="color:#0891b2;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${code}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.5;">${t.expiry}</p>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin-top:16px;">${t.footer}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">Miriel by Arkenstone Labs &mdash; miriel.app</p>
  </div>
</body>
</html>`
}

function generateCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1000000).padStart(6, '0')
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, lang } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailLang: 'ko' | 'en' = lang === 'ko' ? 'ko' : 'en'

    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown'

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check if email is already registered
    const { data: existingUsername } = await supabaseAdmin.rpc(
      'get_username_by_email',
      { p_email: normalizedEmail },
    )
    if (existingUsername) {
      return new Response(JSON.stringify({ error: 'email_already_registered' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    // Rate limit 1: max 3 codes per email in 10 minutes
    const { count: emailCount } = await supabaseAdmin
      .from('email_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .gt('created_at', tenMinAgo)

    if ((emailCount ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: 'rate_limit' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit 2: max 10 codes per IP in 10 minutes (prevent email bombing)
    if (clientIp !== 'unknown') {
      const { count: ipCount } = await supabaseAdmin
        .from('email_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .gt('created_at', tenMinAgo)

      if ((ipCount ?? 0) >= 10) {
        return new Response(JSON.stringify({ error: 'rate_limit' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Cleanup expired records for this email
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('email', normalizedEmail)
      .lt('expires_at', new Date().toISOString())

    // Generate code and insert
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email: normalizedEmail,
        code,
        ip_address: clientIp,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      // Dev fallback: return code directly
      return new Response(JSON.stringify({ sent: true, dev_code: code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const t = EMAIL_TEMPLATES[emailLang]
    const emailHtml = buildEmailHtml(emailLang, code)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Miriel <noreply@miriel.app>',
        reply_to: 'support@miriel.app',
        to: [normalizedEmail],
        subject: t.subject.replace('@@CODE@@', code),
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
