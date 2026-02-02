/** Structured metadata extracted from an entry by AI. */
export interface ProcessedEntryMetadata {
  projects: string[]
  people: string[]
  issues: string[]
}

/** A to-do suggested by AI from entry text. */
export interface SuggestedTodo {
  text: string
  due_hint?: string
}

/**
 * Standardized output schema for AI-processed entries.
 * Formalizes the response format from Edge Functions (tagging, todo extraction).
 */
export interface ProcessedEntry {
  entry_id: string
  metadata: ProcessedEntryMetadata
  sentiment?: 'positive' | 'neutral' | 'negative'
  suggested_todos: SuggestedTodo[]
  tags: string[]
  processed_at: string
}

/** Validates and normalizes a partial AI response into a full ProcessedEntry. */
export function normalizeProcessedEntry(
  entryId: string,
  raw: Partial<ProcessedEntry>
): ProcessedEntry {
  return {
    entry_id: entryId,
    metadata: {
      projects: raw.metadata?.projects ?? [],
      people: raw.metadata?.people ?? [],
      issues: raw.metadata?.issues ?? [],
    },
    sentiment: raw.sentiment ?? 'neutral',
    suggested_todos: (raw.suggested_todos ?? []).map((t) => ({
      text: t?.text ?? '',
      due_hint: t?.due_hint,
    })),
    tags: raw.tags ?? [],
    processed_at: raw.processed_at ?? new Date().toISOString(),
  }
}

/** Converts structured ProcessedEntry metadata into flat tag strings for storage. */
export function processedEntryToTags(processed: ProcessedEntry): string[] {
  const tags: string[] = [...processed.tags]

  for (const project of processed.metadata.projects) {
    const tag = `project:${project}`
    if (!tags.includes(tag)) tags.push(tag)
  }
  for (const person of processed.metadata.people) {
    const tag = `person:${person}`
    if (!tags.includes(tag)) tags.push(tag)
  }
  for (const issue of processed.metadata.issues) {
    const tag = `issue:${issue}`
    if (!tags.includes(tag)) tags.push(tag)
  }

  return tags
}
