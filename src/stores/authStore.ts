import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
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

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}))
