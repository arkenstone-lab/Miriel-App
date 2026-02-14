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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'email_and_code_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.trim()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find matching non-expired, non-verified record
    const { data: record, error: queryError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', normalizedCode)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (queryError) {
      console.error('Query error:', queryError)
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!record) {
      // Check if there's an expired record to give a better error
      const { data: expired } = await supabaseAdmin
        .from('email_verifications')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('code', normalizedCode)
        .eq('verified', false)
        .lte('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle()

      if (expired) {
        return new Response(JSON.stringify({ error: 'expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'invalid_code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark as verified and generate token
    const verificationToken = crypto.randomUUID()
    const { error: updateError } = await supabaseAdmin
      .from('email_verifications')
      .update({
        verified: true,
        verification_token: verificationToken,
      })
      .eq('id', record.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      verified: true,
      verification_token: verificationToken,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
