export interface Summary {
  id: string
  user_id: string
  period: 'daily' | 'weekly' | 'monthly'
  period_start: string
  text: string
  entry_links: string[]
  sentences_data?: SummarySentence[]
  created_at: string
}

export interface SummarySentence {
  text: string
  entry_ids: string[]
}
