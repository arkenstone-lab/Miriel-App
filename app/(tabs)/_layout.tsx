import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Tabs, useRouter } from 'expo-router'
import { Pressable } from 'react-native'
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
  const { t } = useTranslation('common')

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600' },
        ...(isDesktop ? { tabBarStyle: { display: 'none' }, headerShown: false } : {}),
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
            <Pressable
              onPress={() => router.push('/entries/new')}
              style={{ marginRight: 16 }}
            >
              <FontAwesome name="plus" size={20} color="#4f46e5" />
            </Pressable>
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
