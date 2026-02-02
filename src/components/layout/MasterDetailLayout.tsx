import { View, Text } from 'react-native'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

interface MasterDetailLayoutProps {
  master: ReactNode
  detail: ReactNode | null
  detailPlaceholder?: string
}

export function MasterDetailLayout({
  master,
  detail,
  detailPlaceholder,
}: MasterDetailLayoutProps) {
  const { isDesktop } = useResponsiveLayout()
  const { t } = useTranslation('common')

  if (!isDesktop) {
    return <>{master}</>
  }

  return (
    <View className="flex-1 flex-row">
      <View className="border-r border-gray-200 dark:border-gray-700" style={{ width: 380 }}>
        {master}
      </View>
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        {detail || (
          <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950">
            <Text className="text-gray-400 dark:text-gray-500 text-base">
              {detailPlaceholder ?? t('placeholder.selectItem')}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
