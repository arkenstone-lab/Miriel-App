export interface Summary {
  id: string
  user_id: string
  period: 'daily' | 'weekly'
  period_start: string
  text: string
  entry_links: string[]
  created_at: string
}
