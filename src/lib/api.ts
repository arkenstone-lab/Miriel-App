import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

const TOKEN_KEYS = {
  access: '@miriel/access_token',
  refresh: '@miriel/refresh_token',
} as const

// Token management
let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null

export async function getAccessToken(): Promise<string | null> {
  if (memoryAccessToken) return memoryAccessToken
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEYS.access)
    }
    return await AsyncStorage.getItem(TOKEN_KEYS.access)
  } catch {
    return null
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (memoryRefreshToken) return memoryRefreshToken
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEYS.refresh)
    }
    return await AsyncStorage.getItem(TOKEN_KEYS.refresh)
  } catch {
    return null
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  memoryAccessToken = access
  memoryRefreshToken = refresh
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEYS.access, access)
      localStorage.setItem(TOKEN_KEYS.refresh, refresh)
    } else {
      await AsyncStorage.multiSet([
        [TOKEN_KEYS.access, access],
        [TOKEN_KEYS.refresh, refresh],
      ])
    }
  } catch {
    // Storage write failed — tokens still in memory
  }
}

export async function clearTokens(): Promise<void> {
  memoryAccessToken = null
  memoryRefreshToken = null
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEYS.access)
      localStorage.removeItem(TOKEN_KEYS.refresh)
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEYS.access, TOKEN_KEYS.refresh])
    }
  } catch {
    // Ignore
  }
}

// Refresh lock to prevent concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) return false

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!res.ok) {
        await clearTokens()
        return false
      }

      const data = await res.json()
      await setTokens(data.access_token, data.refresh_token)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Type-safe fetch wrapper
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_URL}${path}`
  let res = await fetch(url, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const newToken = await getAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(url, { ...options, headers })
    } else {
      // Force sign out — import dynamically to avoid circular dependency
      const { useAuthStore } = await import('@/stores/authStore')
      useAuthStore.getState().forceSignOut()
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const err = new Error(body.error || `HTTP ${res.status}`)
    ;(err as any).status = res.status
    ;(err as any).body = body
    throw err
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// Unauthenticated fetch (for login/signup/verification)
export async function apiPublicFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const err = new Error(body.error || `HTTP ${res.status}`)
    ;(err as any).status = res.status
    ;(err as any).body = body
    throw err
  }

  return res.json() as Promise<T>
}

export function getApiUrl(): string {
  return API_URL
}
