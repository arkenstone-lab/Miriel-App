import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useRouter, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface NavItem {
  labelKey: string
  icon: React.ComponentProps<typeof FontAwesome>['name']
  path: string
}

const navItems: NavItem[] = [
  { labelKey: 'tab.home', icon: 'home', path: '/(tabs)' },
  { labelKey: 'tab.timeline', icon: 'list', path: '/(tabs)/timeline' },
  { labelKey: 'tab.summary', icon: 'file-text-o', path: '/(tabs)/summary' },
  { labelKey: 'tab.todos', icon: 'check-square-o', path: '/(tabs)/todos' },
  { labelKey: 'tab.profile', icon: 'user-circle-o', path: '/(tabs)/profile' },
]

export function SidebarNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuthStore()
  const { t } = useTranslation('common')
  const { t: tSettings } = useTranslation('settings')
  const [signOutModalVisible, setSignOutModalVisible] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (path: string) => {
    if (path === '/(tabs)') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index'
    }
    return pathname === path || pathname === path.replace('/(tabs)', '')
  }

  // Show confirmation before signing out, with loading indicator during API call
  const confirmSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
      setSignOutModalVisible(false)
    }
  }

  return (
    <View className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Logo */}
      <View className="px-5 py-6 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{t('sidebar.brand')}</Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('sidebar.tagline')}</Text>
      </View>

      {/* New Entry Button */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          className="bg-cyan-600 rounded-xl py-3 flex-row items-center justify-center"
          onPress={() => router.push('/entries/new')}
          activeOpacity={0.7}
        >
          <FontAwesome name="plus" size={14} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">{t('sidebar.newEntry')}</Text>
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
                active ? 'bg-cyan-50 dark:bg-gray-800/50' : ''
              }`}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={item.icon}
                size={18}
                color={active ? '#06b6d4' : '#9ca3af'}
              />
              <Text
                className={`ml-3 text-sm font-medium ${
                  active ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Settings & Sign Out */}
      <View className="px-3 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
        <TouchableOpacity
          className="flex-row items-center px-3 py-2.5 rounded-lg mb-1"
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <FontAwesome name="cog" size={18} color="#9ca3af" />
          <Text className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('sidebar.settings')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-3 py-2.5 rounded-lg"
          onPress={() => setSignOutModalVisible(true)}
          activeOpacity={0.7}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size={18} color="#9ca3af" />
          ) : (
            <FontAwesome name="sign-out" size={18} color="#9ca3af" />
          )}
          <Text className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('sidebar.signOut')}</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Confirm Modal */}
      <ConfirmModal
        visible={signOutModalVisible}
        title={tSettings('account.signOutConfirmTitle')}
        message={tSettings('account.signOutConfirmMessage')}
        confirmLabel={tSettings('account.signOut')}
        cancelLabel={tSettings('modal.cancel')}
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutModalVisible(false)}
        destructive
        loading={signingOut}
      />
    </View>
  )
}
