import { create } from 'zustand'
import { apiFetch, apiPublicFetch, setTokens, clearTokens, getAccessToken } from '@/lib/api'
import { AppError } from '@/lib/errors'

interface SignUpParams {
  username: string
  email: string
  password: string
  verificationToken: string
  inviteCode?: string
}

interface UserData {
  id: string
  email: string
  username: string
  phone?: string | null
  user_metadata: Record<string, any>
  created_at?: string
}

interface AuthState {
  user: UserData | null
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (usernameOrEmail: string, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<void>
  signOut: () => Promise<void>
  forceSignOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  initialize: async () => {
    try {
      const token = await getAccessToken()
      if (!token) {
        set({ user: null, initialized: true })
        return
      }

      // Validate token by fetching user info
      const user = await apiFetch<UserData>('/auth/me')
      set({ user, initialized: true })
    } catch {
      // Token invalid or expired (refresh also failed)
      await clearTokens()
      set({ user: null, initialized: true })
    }
  },

  signIn: async (usernameOrEmail: string, password: string) => {
    try {
      const data = await apiPublicFetch<{
        user: UserData
        access_token: string
        refresh_token: string
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: usernameOrEmail, password }),
      })

      await setTokens(data.access_token, data.refresh_token)
      set({ user: data.user })
    } catch (err: any) {
      if (err.body?.error === 'invalid_credentials') {
        throw new AppError('AUTH_003')
      }
      throw new AppError('AUTH_002', err)
    }
  },

  signUp: async ({ username, email, password, verificationToken, inviteCode }: SignUpParams) => {
    // Validate email verification token
    const tokenResult = await apiPublicFetch<{ valid: boolean }>('/auth/validate-email-token', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        verification_token: verificationToken,
      }),
    })

    if (!tokenResult.valid) {
      throw new AppError('AUTH_017')
    }

    try {
      const data = await apiPublicFetch<{
        user: UserData
        access_token: string
        refresh_token: string
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
          verification_token: verificationToken,
          ...(inviteCode ? { invite_code: inviteCode.trim() } : {}),
        }),
      })

      await setTokens(data.access_token, data.refresh_token)
      set({ user: data.user })
    } catch (err: any) {
      if (err.body?.error === 'email_already_registered') throw new AppError('AUTH_008')
      if (err.body?.error === 'username_already_taken') throw new AppError('AUTH_005')
      if (err.body?.error === 'invalid_invite_code') throw new AppError('AUTH_021')
      throw new AppError('AUTH_006', err)
    }
  },

  signOut: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    } finally {
      await clearTokens()
      set({ user: null })
    }
  },

  forceSignOut: () => {
    clearTokens()
    set({ user: null })
  },
}))
