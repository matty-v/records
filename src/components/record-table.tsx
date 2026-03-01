import { RecordRowCard } from './record-row-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecordRow, SheetSchema } from '@/lib/types'

interface RecordTableProps {
  records: RecordRow[]
  schema: SheetSchema
  isLoading: boolean
  onRecordClick: (record: RecordRow) => void
}

export function RecordTable({ records, schema, isLoading, onRecordClick }: RecordTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm font-light">No records yet</p>
        <p className="text-xs mt-1">Tap + to add your first record</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <RecordRowCard
          key={record.id}
          record={record}
          schema={schema}
          onClick={() => onRecordClick(record)}
        />
      ))}
    </div>
  )
}
