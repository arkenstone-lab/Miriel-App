import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { LevelInfo } from '@/features/gamification/types'

interface LevelProgressCardProps {
  level: LevelInfo
}

export function LevelProgressCard({ level }: LevelProgressCardProps) {
  const { t } = useTranslation('dashboard')
  const progressPercent = Math.round(level.progress * 100)
  const isMaxLevel = level.level === 8

  return (
    <Card className="flex-1">
      <View className="items-center">
        <View className="bg-indigo-100 w-10 h-10 rounded-full items-center justify-center mb-1">
          <Text className="text-lg font-bold text-indigo-600">{level.level}</Text>
        </View>
        <Text className="text-sm font-semibold text-gray-900">{level.title}</Text>
      </View>
      <View className="mt-3">
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <Text className="text-[10px] text-gray-400 text-center mt-1">
          {isMaxLevel
            ? t('level.maxXP', { xp: level.currentXP })
            : t('level.progressXP', { current: level.currentXP, next: level.xpForNextLevel })
          }
        </Text>
      </View>
    </Card>
  )
}
