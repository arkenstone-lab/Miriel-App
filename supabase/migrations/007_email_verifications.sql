-- Email verification codes for signup flow
-- Used by Edge Functions: send-verification-code, verify-email-code, validate-email-token
-- RLS enabled, no policies = service_role only access

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  verification_token uuid,
  verified boolean not null default false,
  ip_address text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index email_verifications_lookup_idx
  on public.email_verifications(email, expires_at desc);

create index email_verifications_ip_idx
  on public.email_verifications(ip_address, created_at desc);

alter table public.email_verifications enable row level security;
-- No RLS policies = only service_role can access (Edge Functions use service_role key)
