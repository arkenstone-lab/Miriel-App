import { View, Text, ScrollView } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { EvidenceChip } from './EvidenceChip'
import { Badge } from '@/components/ui/Badge'
import type { Summary, SummarySentence } from '@/features/summary/types'

interface SummaryDetailViewProps {
  summary: Summary
}

/** Builds a human-readable period label like "2/1 ~ 2/7 Weekly Review". */
function useFormatPeriodLabel() {
  const { t } = useTranslation('summary')

  return (summary: Summary): string => {
    if (summary.period === 'weekly') {
      const start = new Date(summary.period_start + 'T00:00:00')
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
      return t('weekly.periodLabel', { range: `${fmt(start)} ~ ${fmt(end)}` })
    }
    return t('daily.periodLabel', { date: summary.period_start })
  }
}

export function SummaryDetailView({ summary }: SummaryDetailViewProps) {
  const { t } = useTranslation('summary')
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const formatPeriodLabel = useFormatPeriodLabel()

  const sentences: SummarySentence[] = summary.sentences_data || []

  // Fallback: if no sentences_data, split text by newlines and use entry_links
  const displaySentences: SummarySentence[] =
    sentences.length > 0
      ? sentences
      : summary.text.split('\n').filter(Boolean).map((text) => ({
          text,
          entry_ids: summary.entry_links,
        }))

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center mb-1">
          <FontAwesome
            name={summary.period === 'weekly' ? 'calendar' : 'file-text-o'}
            size={16}
            color={isDark ? '#818cf8' : '#4f46e5'}
          />
          <Text className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {summary.period === 'weekly' ? t('weekly.label') : t('daily.label')}
          </Text>
        </View>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {formatPeriodLabel(summary)}
        </Text>
        <View className="flex-row items-center mb-6">
          <Badge
            label={t('evidenceBadge', { count: summary.entry_links.length })}
            variant="indigo"
          />
        </View>

        {/* Sentences with evidence */}
        {displaySentences.map((sentence, index) => (
          <View key={index} className="mb-5">
            <View className="flex-row mb-2">
              <View className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-800/40 items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</Text>
              </View>
              <Text className="text-base text-gray-900 dark:text-gray-100 leading-6 flex-1">
                {sentence.text}
              </Text>
            </View>

            {/* Evidence chips */}
            {sentence.entry_ids.length > 0 && (
              <View className="flex-row flex-wrap ml-9">
                {sentence.entry_ids.map((entryId) => (
                  <EvidenceChip key={entryId} entryId={entryId} />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
