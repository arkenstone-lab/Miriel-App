import { View } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Tabs, useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />
}

export default function TabLayout() {
  const router = useRouter()
  const { isDesktop } = useResponsiveLayout()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('common')

  const settingsButton = () => (
    <Pressable
      onPress={() => router.push('/settings')}
      style={{ marginRight: 16 }}
    >
      <FontAwesome name="cog" size={20} color="#9ca3af" />
    </Pressable>
  )

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
        headerTintColor: isDark ? '#f3f4f6' : '#111827',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : { backgroundColor: isDark ? '#111827' : '#ffffff', borderTopColor: isDark ? '#1f2937' : '#e5e7eb' },
        ...(isDesktop
          ? { headerShown: false }
          : { headerRight: settingsButton }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: t('tab.timeline'),
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 16 }}>
              <Pressable onPress={() => router.push('/entries/new')}>
                <FontAwesome name="plus" size={20} color="#4f46e5" />
              </Pressable>
              <Pressable onPress={() => router.push('/settings')}>
                <FontAwesome name="cog" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: t('tab.dailySummary'),
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: t('tab.weeklyReview'),
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: t('tab.todos'),
          tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
        }}
      />
    </Tabs>
  )
}
