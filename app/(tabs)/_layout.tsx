import { View, Pressable, StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Tabs, useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
}) {
  return <FontAwesome size={22} style={{ marginBottom: 0 }} {...props} />
}

export default function TabLayout() {
  const router = useRouter()
  const { isDesktop } = useResponsiveLayout()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { t } = useTranslation('common')

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#06b6d4',
          tabBarInactiveTintColor: '#9ca3af',
          headerStyle: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: isDark ? '#f3f4f6' : '#111827',
          headerTitleStyle: { fontWeight: '600' },
          tabBarLabelStyle: { fontSize: 10 },
          tabBarStyle: isDesktop
            ? { display: 'none' }
            : {
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
                height: 66,
                paddingBottom: 12,
                paddingTop: 4,
              },
          ...(isDesktop ? { headerShown: false } : {}),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tab.home'),
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/settings' as any)}
                style={{ marginRight: 16 }}
              >
                <FontAwesome name="cog" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: t('tab.timeline'),
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{
            title: t('tab.summary'),
            tabBarIcon: ({ color }) => <TabBarIcon name="file-text-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="weekly"
          options={{
            title: t('tab.weeklyReview'),
            href: null,
          }}
        />
        <Tabs.Screen
          name="todos"
          options={{
            title: t('tab.todos'),
            tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tab.profile'),
            tabBarIcon: ({ color }) => <TabBarIcon name="user-circle-o" color={color} />,
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/settings' as any)}
                style={{ marginRight: 16 }}
              >
                <FontAwesome name="cog" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            ),
          }}
        />
      </Tabs>

      {/* Write Today FAB — mobile only */}
      {!isDesktop && (
        <Pressable
          onPress={() => router.push('/entries/new')}
          style={[
            styles.fab,
            {
              backgroundColor: '#06b6d4',
              shadowColor: '#06b6d4',
            },
          ]}
        >
          <FontAwesome name="pencil" size={22} color="#ffffff" />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 78,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
