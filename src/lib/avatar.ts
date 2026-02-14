import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { apiFetch, getApiUrl } from './api'
import { AppError } from './errors'

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * Open image picker and return the selected asset.
 */
export async function pickImageForAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS !== 'web',
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || !result.assets[0]) return null
  return result.assets[0]
}

/**
 * Upload an image (by URI) to Worker R2 and return the public URL.
 */
export async function uploadAvatar(
  userId: string,
  uri: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  // Convert URI to blob
  const response = await fetch(uri)
  const blob = await response.blob()

  if (blob.size > MAX_AVATAR_SIZE) {
    throw new AppError('PROFILE_003')
  }

  // Convert blob to base64 for JSON transport
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)

  await apiFetch('/storage/avatar', {
    method: 'POST',
    body: JSON.stringify({ base64, contentType: mimeType }),
  })

  return `${getApiUrl()}/storage/avatar/${userId}?t=${Date.now()}`
}

/**
 * Delete the user's avatar.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  await apiFetch('/storage/avatar', { method: 'DELETE' })
}
