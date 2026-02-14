import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { Session, User } from '@supabase/supabase-js'

interface SignUpParams {
  username: string
  email: string
  password: string
  verificationToken: string
}

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (usernameOrEmail: string, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<void>
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

  signIn: async (usernameOrEmail: string, password: string) => {
    let email: string

    if (usernameOrEmail.includes('@')) {
      // Direct email login
      email = usernameOrEmail.trim().toLowerCase()
    } else {
      // Resolve username → email via RPC
      const { data, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: usernameOrEmail,
      })
      if (rpcError) throw new AppError('AUTH_002', rpcError)
      if (!data) throw new AppError('AUTH_001')
      email = data
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new AppError('AUTH_003', error)
  },

  signUp: async ({ username, email, password, verificationToken }: SignUpParams) => {
    // Validate email verification token server-side
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
      'validate-email-token',
      { body: { email: email.trim().toLowerCase(), verification_token: verificationToken } },
    )
    if (tokenError || !tokenData?.valid) {
      throw new AppError('AUTH_017')
    }

    // Check username availability
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (checkError) throw new AppError('AUTH_004', checkError)
    if (existing) throw new AppError('AUTH_005')

    // Create auth user with email confirmation disabled (already verified via code)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          pendingUsername: username.toLowerCase(),
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
      })
      if (profileError) throw new AppError('AUTH_009', profileError)
    }
    // No session (email confirmation ON) — profile created on first login via loadUserData
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new AppError('AUTH_010', error)
  },
}))
