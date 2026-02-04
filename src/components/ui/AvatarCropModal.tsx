import { useState, useCallback } from 'react'
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'nativewind'

// react-easy-crop is web-only; guard at render level
let Cropper: any = null
if (Platform.OS === 'web') {
  Cropper = require('react-easy-crop').default
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/** Use canvas to crop the image and return a data URI */
async function getCroppedDataUri(
  imageSrc: string,
  crop: CropArea,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )
  return canvas.toDataURL('image/jpeg', 0.85)
}

interface Props {
  visible: boolean
  imageUri: string
  onCrop: (croppedUri: string) => void
  onCancel: () => void
}

export function AvatarCropModal({ visible, imageUri, onCrop, onCancel }: Props) {
  const { t } = useTranslation('settings')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_: any, pixels: CropArea) => {
    setCroppedPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedPixels) return
    const uri = await getCroppedDataUri(imageUri, croppedPixels)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    onCrop(uri)
  }

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    onCancel()
  }

  // Web-only component
  if (Platform.OS !== 'web' || !Cropper) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
          style={{ width: 400, maxWidth: '90%' }}
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-2">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
              {t('profile.cropTitle')}
            </Text>
          </View>

          {/* Cropper area */}
          <View style={{ position: 'relative', width: '100%', height: 320, backgroundColor: isDark ? '#111827' : '#f3f4f6' }}>
            <Cropper
              image={imageUri}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </View>

          {/* Zoom slider */}
          <View className="px-5 py-3">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e: any) => setZoom(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#22d3ee' }}
            />
          </View>

          {/* Buttons */}
          <View className="flex-row border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              className="flex-1 py-3.5 items-center border-r border-gray-200 dark:border-gray-700"
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text className="text-base text-gray-500 dark:text-gray-400">
                {t('modal.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3.5 items-center"
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-cyan-600 dark:text-cyan-400">
                {t('profile.cropConfirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
