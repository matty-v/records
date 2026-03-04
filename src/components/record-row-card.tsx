import type { ColumnDefinition, RecordRow, SheetSchema } from '@/lib/types'

function formatDisplayValue(value: string | undefined, col: ColumnDefinition): string {
  if (!value) return '—'
  if (col.columnType === 'boolean') {
    return value.toLowerCase() === 'true' ? 'Yes' : 'No'
  }
  if (col.columnType === 'date') {
    const d = new Date(value + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }
  }
  return value
}

interface RecordRowCardProps {
  record: RecordRow
  schema: SheetSchema
  onClick: () => void
}

export function RecordRowCard({ record, schema, onClick }: RecordRowCardProps) {
  const columns = schema.columns
  const primaryCol = columns[0]
  const secondaryCols = columns.slice(1, 3)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl tech-card cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {primaryCol && (
            <p className="text-sm font-medium text-foreground truncate">
              {formatDisplayValue(record[primaryCol.columnName], primaryCol)}
            </p>
          )}
          {secondaryCols.length > 0 && (
            <div className="flex gap-3 mt-1">
              {secondaryCols.map((col) => (
                <span key={col.columnName} className="text-xs text-muted-foreground truncate">
                  <span className="text-[rgba(0,212,255,0.5)]">{col.columnName}:</span>{' '}
                  {formatDisplayValue(record[col.columnName], col)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
