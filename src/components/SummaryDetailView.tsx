import { View, Text, ScrollView } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { EvidenceChip } from './EvidenceChip'
import { Badge } from '@/components/ui/Badge'
import type { Summary, SummarySentence } from '@/features/summary/types'

interface SummaryDetailViewProps {
  summary: Summary
}

function formatPeriodLabel(summary: Summary): string {
  if (summary.period === 'weekly') {
    const start = new Date(summary.period_start + 'T00:00:00')
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}`
    return `${fmt(start)} ~ ${fmt(end)} 주간 회고`
  }
  return `${summary.period_start} 일간 요약`
}

export function SummaryDetailView({ summary }: SummaryDetailViewProps) {
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
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center mb-1">
          <FontAwesome
            name={summary.period === 'weekly' ? 'calendar' : 'file-text-o'}
            size={16}
            color="#4f46e5"
          />
          <Text className="ml-2 text-xs font-medium text-indigo-600 uppercase tracking-wider">
            {summary.period === 'weekly' ? '주간 회고' : '일간 요약'}
          </Text>
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {formatPeriodLabel(summary)}
        </Text>
        <View className="flex-row items-center mb-6">
          <Badge
            label={`근거 기록 ${summary.entry_links.length}개`}
            variant="indigo"
          />
        </View>

        {/* Sentences with evidence */}
        {displaySentences.map((sentence, index) => (
          <View key={index} className="mb-5">
            <View className="flex-row mb-2">
              <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-indigo-600">{index + 1}</Text>
              </View>
              <Text className="text-base text-gray-900 leading-6 flex-1">
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
