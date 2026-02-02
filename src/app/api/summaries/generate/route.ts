import { createClient } from '@/lib/supabase/server'
import { generateDailySummary } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date } = await request.json()
  const targetDate = date || new Date().toISOString().split('T')[0]

  // Fetch entries for the date
  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('id, raw_text')
    .eq('date', targetDate)
    .order('created_at', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { error: '해당 날짜에 기록이 없습니다.' },
      { status: 400 }
    )
  }

  // Generate summary
  const result = await generateDailySummary(entries)

  // Collect all referenced entry IDs
  const entryLinks = Array.from(
    new Set(result.sentences.flatMap((s) => s.entry_ids))
  )

  // Build summary text with inline references
  const summaryText = result.sentences
    .map((s) => s.text)
    .join('\n')

  // Delete existing summary for this date (regeneration)
  await supabase
    .from('summaries')
    .delete()
    .eq('period', 'daily')
    .eq('period_start', targetDate)

  // Insert new summary
  const { data: summary, error: insertError } = await supabase
    .from('summaries')
    .insert({
      user_id: user.id,
      period: 'daily',
      period_start: targetDate,
      text: summaryText,
      entry_links: entryLinks,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    summary,
    sentences: result.sentences,
  }, { status: 201 })
}
