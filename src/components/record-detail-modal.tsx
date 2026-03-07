import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Label } from '@/components/ui/label'
import type { ColumnDefinition, RecordRow, SheetSchema } from '@/lib/types'

function formatDisplayValue(value: string | undefined, col: ColumnDefinition): string {
  if (!value) return '—'
  if (col.columnType === 'boolean') {
    return value.toLowerCase() === 'true' ? 'Yes' : 'No'
  }
  if (col.columnType === 'date') {
    // Handle both "YYYY-MM-DD" (legacy) and "YYYY-MM-DDTHH:mm" formats
    const hasTime = value.includes('T')
    const d = new Date(hasTime ? value : value + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
      if (hasTime) {
        opts.hour = 'numeric'
        opts.minute = '2-digit'
      }
      return d.toLocaleString(undefined, opts)
    }
  }
  return value
}

interface RecordDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: RecordRow | null
  schema: SheetSchema
  onUpdate: (id: string, data: Record<string, string>) => void
  onDelete: (id: string) => void
  isUpdating: boolean
  isDeleting: boolean
}

export function RecordDetailModal({
  open,
  onOpenChange,
  record,
  schema,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: RecordDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (record) {
      const v: Record<string, string> = {}
      for (const col of schema.columns) {
        v[col.columnName] = record[col.columnName] || ''
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(v)
    }
    setIsEditing(false)
  }, [record, schema])

  if (!record) return null

  const handleSave = () => {
    onUpdate(record.id, values)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(record.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Record' : 'Record Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {schema.columns.map((col) => (
            <div key={col.columnName} className="space-y-1">
              <Label className="text-muted-foreground text-xs">{col.columnName}</Label>
              {isEditing ? (
                col.columnType === 'boolean' ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={values[col.columnName] === 'true'}
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        [col.columnName]: prev[col.columnName] === 'true' ? 'false' : 'true',
                      }))
                    }
                    className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
                      values[col.columnName] === 'true'
                        ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]'
                        : 'border-[rgba(100,150,255,0.3)] bg-[rgba(18,24,33,0.5)]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        values[col.columnName] === 'true' ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : col.columnType === 'number' ? (
                  <NumberStepper
                    value={values[col.columnName] || ''}
                    onChange={(val) =>
                      setValues((prev) => ({ ...prev, [col.columnName]: val }))
                    }
                  />
                ) : (
                  <Input
                    type={col.columnType === 'date' ? 'datetime-local' : 'text'}
                    value={values[col.columnName] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [col.columnName]: e.target.value }))
                    }
                  />
                )
              ) : (
                <p className="text-sm text-foreground">
                  {formatDisplayValue(record[col.columnName], col)}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
