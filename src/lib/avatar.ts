import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'

const BUCKET = 'avatars'

/**
 * Open image picker, upload selected image to Supabase Storage,
 * and return the public URL. Returns null if the user cancels.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || !result.assets[0]) return null

  const uri = result.assets[0].uri
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`

  // Convert URI to blob via fetch
  const response = await fetch(uri)
  const blob = await response.blob()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    })

  if (error) throw error

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
