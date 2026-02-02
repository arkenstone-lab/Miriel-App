import { View } from 'react-native'
import type { ReactNode } from 'react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { SidebarNav } from './SidebarNav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isDesktop } = useResponsiveLayout()

  if (!isDesktop) {
    return <>{children}</>
  }

  return (
    <View className="flex-1 flex-row bg-gray-50 dark:bg-gray-950">
      <SidebarNav />
      <View className="flex-1">{children}</View>
    </View>
  )
}
