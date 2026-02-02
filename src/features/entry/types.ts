export interface Entry {
  id: string
  user_id: string
  date: string
  raw_text: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CreateEntryInput {
  date?: string
  raw_text: string
  tags?: string[]
}

export interface UpdateEntryInput {
  raw_text?: string
  tags?: string[]
  date?: string
}
