import EntryDetail from '@/features/entry/components/EntryDetail'

export default function EntryDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <EntryDetail id={params.id} />
}
