import { View, Text, TouchableOpacity } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter, usePathname } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'

interface NavItem {
  label: string
  icon: React.ComponentProps<typeof FontAwesome>['name']
  path: string
}

const navItems: NavItem[] = [
  { label: '타임라인', icon: 'list', path: '/(tabs)' },
  { label: '일간 요약', icon: 'file-text-o', path: '/(tabs)/summary' },
  { label: '주간 회고', icon: 'calendar', path: '/(tabs)/weekly' },
  { label: '할 일', icon: 'check-square-o', path: '/(tabs)/todos' },
]

export function SidebarNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuthStore()

  const isActive = (path: string) => {
    if (path === '/(tabs)') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index'
    }
    return pathname === path || pathname === path.replace('/(tabs)', '')
  }

  return (
    <View className="w-60 bg-white border-r border-gray-200 h-full">
      {/* Logo */}
      <View className="px-5 py-6 border-b border-gray-100">
        <Text className="text-xl font-bold text-indigo-600">ReflectLog</Text>
        <Text className="text-xs text-gray-400 mt-0.5">AI 회고 저널</Text>
      </View>

      {/* New Entry Button */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-3 flex-row items-center justify-center"
          onPress={() => router.push('/entries/new')}
          activeOpacity={0.7}
        >
          <FontAwesome name="plus" size={14} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">새 기록</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <View className="px-3 pt-2 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <TouchableOpacity
              key={item.path}
              className={`flex-row items-center px-3 py-2.5 rounded-lg mb-1 ${
                active ? 'bg-indigo-50' : ''
              }`}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={item.icon}
                size={18}
                color={active ? '#4f46e5' : '#9ca3af'}
              />
              <Text
                className={`ml-3 text-sm font-medium ${
                  active ? 'text-indigo-700' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Sign Out */}
      <View className="px-3 pb-4 border-t border-gray-100 pt-3">
        <TouchableOpacity
          className="flex-row items-center px-3 py-2.5 rounded-lg"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <FontAwesome name="sign-out" size={18} color="#9ca3af" />
          <Text className="ml-3 text-sm font-medium text-gray-500">로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
