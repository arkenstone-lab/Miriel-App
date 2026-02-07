-- 005: Security hardening
-- Fix: profiles SELECT policy leaks phone numbers to anyone
-- Fix: missing DELETE policies on summaries and todos

-- ============================================
-- 1. Tighten profiles RLS (phone is PII)
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Only the owner can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Public view for username-only (no phone, no PII)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================
-- 2. Add missing DELETE policies
-- ============================================

-- summaries: users can delete their own summaries
CREATE POLICY "Users can delete own summaries"
  ON public.summaries FOR DELETE
  USING (auth.uid() = user_id);

-- summaries: users can update their own summaries (also missing)
CREATE POLICY "Users can update own summaries"
  ON public.summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- todos: users can delete their own todos
CREATE POLICY "Users can delete own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. Username case normalization
-- ============================================

-- Ensure usernames are always stored lowercase
CREATE OR REPLACE FUNCTION public.normalize_username()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username := lower(NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_username ON public.profiles;
CREATE TRIGGER trg_normalize_username
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_username();

-- Case-insensitive unique index (prevents 'Alice' and 'alice' coexisting)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username));

-- ============================================
-- 4. Restrict SECURITY DEFINER RPCs from anon
-- Prevents unauthenticated email/username enumeration
-- ============================================

-- Revoke anon access (keep authenticated for find-id/find-password which require login context)
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_username_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_username_available(text) FROM anon;
