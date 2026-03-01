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
import { Label } from '@/components/ui/label'
import type { RecordRow, SheetSchema } from '@/lib/types'

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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values[col.columnName] === 'true'}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [col.columnName]: e.target.checked ? 'true' : 'false',
                        }))
                      }
                      className="h-4 w-4 rounded border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] accent-[var(--accent-cyan)]"
                    />
                    <span className="text-sm text-foreground">
                      {values[col.columnName] === 'true' ? 'Yes' : 'No'}
                    </span>
                  </label>
                ) : (
                  <Input
                    type={col.columnType === 'number' ? 'number' : col.columnType === 'date' ? 'date' : 'text'}
                    step={col.columnType === 'number' ? 'any' : undefined}
                    value={values[col.columnName] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [col.columnName]: e.target.value }))
                    }
                  />
                )
              ) : (
                <p className="text-sm text-foreground">
                  {col.columnType === 'boolean'
                    ? record[col.columnName] === 'true' ? 'Yes' : 'No'
                    : record[col.columnName] || '—'}
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
