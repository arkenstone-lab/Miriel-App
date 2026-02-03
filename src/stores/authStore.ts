import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { Session, User } from '@supabase/supabase-js'

interface SignUpParams {
  username: string
  email: string
  phone?: string
  password: string
}

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<{ needsEmailVerification: boolean }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      session,
      user: session?.user ?? null,
      initialized: true,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })
  },

  signIn: async (username: string, password: string) => {
    // Resolve username → email via RPC (needs auth.users access)
    const { data: email, error: rpcError } = await supabase.rpc('get_email_by_username', {
      p_username: username,
    })
    if (rpcError) throw new AppError('AUTH_002', rpcError)
    if (!email) throw new AppError('AUTH_001')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new AppError('AUTH_003', error)
  },

  signUp: async ({ username, email, phone, password }: SignUpParams) => {
    // Check username availability via direct query (SELECT RLS = true, no RPC needed)
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (checkError) throw new AppError('AUTH_004', checkError)
    if (existing) throw new AppError('AUTH_005')

    // Create auth user — store username/phone in user_metadata for deferred profile creation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pendingUsername: username.toLowerCase(),
          pendingPhone: phone || null,
        },
      },
    })
    if (error) throw new AppError('AUTH_006', error)

    const userId = data.user?.id
    if (!userId) throw new AppError('AUTH_007')

    // Detect fake response for already-registered-but-unconfirmed email
    if (data.user?.identities && data.user.identities.length === 0) {
      throw new AppError('AUTH_008')
    }

    // If session exists (email confirmation OFF), insert profile immediately
    if (data.session) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        username: username.toLowerCase(),
        phone: phone || null,
      })
      if (profileError) throw new AppError('AUTH_009', profileError)
      return { needsEmailVerification: false }
    }

    // No session (email confirmation ON) — profile created on first login via loadUserData
    return { needsEmailVerification: true }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new AppError('AUTH_010', error)
  },
}))
