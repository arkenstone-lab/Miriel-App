import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { EarnedBadge } from '@/features/gamification/types'

interface BadgeGridProps {
  badges: EarnedBadge[]
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { t } = useTranslation('dashboard')
  const earned = badges.filter((b) => b.earned)
  const total = badges.length

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-gray-900">{t('badges.title')}</Text>
        <Text className="text-xs text-gray-400">
          {t('badges.earned', { earned: earned.length, total })}
        </Text>
      </View>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            className={`items-center justify-center w-14 h-14 rounded-xl ${
              badge.earned ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <Text className={`text-xl ${badge.earned ? '' : 'opacity-30'}`}>
              {badge.earned ? badge.emoji : '🔒'}
            </Text>
            <Text
              className={`text-[8px] mt-0.5 ${
                badge.earned ? 'text-amber-700' : 'text-gray-400'
              }`}
              numberOfLines={1}
            >
              {badge.title}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  )
}
