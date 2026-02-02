import { createClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { week_start } = await request.json()

  // Calculate week range (Monday to Sunday)
  const start = week_start
    ? new Date(week_start + 'T00:00:00')
    : getMonday(new Date())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startStr = formatDate(start)
  const endStr = formatDate(end)

  // Fetch entries for the week
  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('id, raw_text')
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { error: '해당 주간에 기록이 없습니다.' },
      { status: 400 }
    )
  }

  // Generate weekly summary
  const result = await generateWeeklySummary(entries)

  const entryLinks = Array.from(
    new Set(result.sentences.flatMap((s) => s.entry_ids))
  )

  const summaryText = result.sentences
    .map((s) => s.text)
    .join('\n')

  // Delete existing weekly summary for this week (regeneration)
  await supabase
    .from('summaries')
    .delete()
    .eq('period', 'weekly')
    .eq('period_start', startStr)

  // Insert new summary
  const { data: summary, error: insertError } = await supabase
    .from('summaries')
    .insert({
      user_id: user.id,
      period: 'weekly',
      period_start: startStr,
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

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
