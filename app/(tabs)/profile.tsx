import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useGamificationStats } from '@/features/gamification/hooks'
import { useTodos } from '@/features/todo/hooks'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { LevelProgressCard } from '@/components/dashboard/LevelProgressCard'
import { TodoCompletionCard } from '@/components/dashboard/TodoCompletionCard'
import { BadgeGrid } from '@/components/dashboard/BadgeGrid'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { LoadingState } from '@/components/ui/LoadingState'

export default function ProfileScreen() {
  const { t } = useTranslation('settings')
  const { t: tOnboarding } = useTranslation('onboarding')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { isDesktop } = useResponsiveLayout()
  const router = useRouter()

  const { nickname, username, gender, occupation, interests, avatarUrl } = useSettingsStore()
  const { user } = useAuthStore()
  const { data: stats, isLoading } = useGamificationStats()
  const { data: allTodos } = useTodos()
  const { data: doneTodos } = useTodos('done')

  if (isLoading || !stats) return <LoadingState />

  const displayName = nickname || username || '?'
  const initial = displayName.charAt(0).toUpperCase()

  const totalTodos = allTodos?.length ?? 0
  const completedTodos = doneTodos?.length ?? 0

  // Build persona chips
  const personaChips: string[] = []
  if (gender) {
    personaChips.push(tOnboarding(`persona.gender${gender.charAt(0).toUpperCase() + gender.slice(1)}` as any))
  }
  if (occupation) {
    personaChips.push(occupation)
  }
  interests.forEach((key) => {
    personaChips.push(tOnboarding(`persona.interestOptions.${key}` as any))
  })

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className={`w-full mx-auto ${isDesktop ? 'max-w-lg' : ''} px-5 pt-6 pb-10`}>
        {/* User Info */}
        <View className="items-center mb-6">
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-20 h-20 rounded-full mb-3"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {initial}
              </Text>
            </View>
          )}

          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {nickname || t('account.nicknamePlaceholder')}
          </Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {username ? `@${username}` : ''}
          </Text>

          {/* Persona chips */}
          {personaChips.length > 0 && (
            <View className="flex-row flex-wrap justify-center mt-3" style={{ gap: 6 }}>
              {personaChips.map((chip, idx) => (
                <View
                  key={idx}
                  className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                >
                  <Text className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Edit Profile button */}
          <TouchableOpacity
            onPress={() => router.push('/edit-profile' as any)}
            activeOpacity={0.7}
            className="mt-4 px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700"
          >
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('profile.editProfile')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievements */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('profile.achievements')}
          </Text>
          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <StreakCard streak={stats.streak} />
            <LevelProgressCard level={stats.level} />
          </View>

          {/* Todo completion */}
          <View className="mb-3">
            <TodoCompletionCard completed={completedTodos} total={totalTodos} />
          </View>

          <StatsRow
            totalEntries={stats.totalEntries}
            todosCompleted={stats.todosCompleted}
            totalSummaries={stats.totalSummaries}
          />
          <View className="mt-3">
            <BadgeGrid badges={stats.badges} />
          </View>
        </View>

        {/* Go to Settings */}
        <TouchableOpacity
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-3.5 flex-row items-center justify-center mb-4"
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="cog"
            size={16}
            color={isDark ? '#9ca3af' : '#6b7280'}
            style={{ marginRight: 8 }}
          />
          <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {t('profile.goToSettings')}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">
          {t('version')} 0.1.0
        </Text>
      </View>
    </ScrollView>
  )
}
