import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'
import { AppError } from './errors'

const BUCKET = 'avatars'
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/** Derive file extension from MIME type */
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mime] || 'jpg'
}

/**
 * Open image picker and return the selected asset.
 * On native, allowsEditing shows the system crop UI.
 * On web, allowsEditing is ignored — crop is handled separately.
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
 * Upload an image (by URI) to Supabase Storage and return the public URL.
 * Enforces 2 MB file size limit.
 */
export async function uploadAvatar(
  userId: string,
  uri: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new AppError('PROFILE_004')
  }

  const ext = extFromMime(mimeType)
  const path = `${userId}/avatar.${ext}`

  // Convert URI to blob
  const response = await fetch(uri)
  const blob = await response.blob()

  // Check file size (2 MB limit)
  if (blob.size > MAX_AVATAR_SIZE) {
    throw new AppError('PROFILE_003')
  }

  // On web, wrap as File for reliable Supabase Storage upload
  const uploadBody = Platform.OS === 'web'
    ? new File([blob], `avatar.${ext}`, { type: mimeType })
    : blob

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, uploadBody, {
      upsert: true,
      contentType: mimeType,
    })

  if (error) throw new AppError('PROFILE_001', error)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

/**
 * Delete the user's avatar from Supabase Storage.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(userId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }
}
