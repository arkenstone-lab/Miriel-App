import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Tabs, useRouter } from 'expo-router'
import { Pressable } from 'react-native'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />
}

export default function TabLayout() {
  const router = useRouter()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '타임라인',
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
          title: '일간 요약',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: '주간 회고',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: '할 일',
          tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
        }}
      />
    </Tabs>
  )
}
