-- Add sentences_data JSONB column to summaries table
-- Stores per-sentence text + entry_ids for evidence linking
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS sentences_data jsonb DEFAULT '[]'::jsonb;
