import { useState } from 'react'
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
import type { SheetSchema } from '@/lib/types'

interface RecordFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SheetSchema
  onSubmit: (data: Record<string, string>) => void
  isSubmitting: boolean
}

export function RecordFormModal({
  open,
  onOpenChange,
  schema,
  onSubmit,
  isSubmitting,
}: RecordFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
    setValues({})
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setValues({})
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add to <span className="glow-cyan">{schema.sheetName}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.columns.filter((col) => !col.autoPopulate).map((col) => (
            <div key={col.columnName} className="space-y-2">
              <Label htmlFor={col.columnName} className="text-muted-foreground">
                {col.columnName}
              </Label>
              {col.columnType === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id={col.columnName}
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
                  id={col.columnName}
                  type={col.columnType === 'number' ? 'number' : col.columnType === 'date' ? 'date' : 'text'}
                  step={col.columnType === 'number' ? 'any' : undefined}
                  value={values[col.columnName] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: e.target.value }))
                  }
                  placeholder={col.columnName}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
