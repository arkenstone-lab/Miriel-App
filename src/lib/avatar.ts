import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'
import { AppError } from './errors'

const BUCKET = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

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
 * Open image picker with crop UI, upload selected image to Supabase Storage,
 * and return the public URL. Returns null if the user cancels.
 *
 * - Crop: expo-image-picker allowsEditing + aspect [1,1]
 * - File size limit: 2 MB
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || !result.assets[0]) return null

  const asset = result.assets[0]
  const mimeType = asset.mimeType || 'image/jpeg'
  const ext = extFromMime(mimeType)
  const path = `${userId}/avatar.${ext}`

  // Check file size from asset metadata first
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    throw new AppError('PROFILE_003')
  }

  // Convert URI to blob
  const response = await fetch(asset.uri)
  const blob = await response.blob()

  // Double-check size from blob (fileSize may not be available on all platforms)
  if (blob.size > MAX_FILE_SIZE) {
    throw new AppError('PROFILE_003')
  }

  // On web, convert to ArrayBuffer for reliable Supabase upload
  // (blob URLs and data URIs can cause issues with direct blob upload)
  const uploadBody: Blob | ArrayBuffer =
    Platform.OS === 'web' ? await blob.arrayBuffer() : blob

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, uploadBody, {
      upsert: true,
      contentType: mimeType,
    })

  if (error) throw new AppError('PROFILE_001', error)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  // Append timestamp to bust cache after re-upload
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
