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
import { NumberStepper } from '@/components/ui/number-stepper'
import { SelectWithAdd } from '@/components/ui/select-with-add'
import { Label } from '@/components/ui/label'
import type { SheetSchema } from '@/lib/types'

interface RecordFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SheetSchema
  onSubmit: (data: Record<string, string>) => void
  onOptionsChange?: (columnName: string, newOptions: string) => void
  isSubmitting: boolean
}

export function RecordFormModal({
  open,
  onOpenChange,
  schema,
  onSubmit,
  onOptionsChange = () => {},
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
                <button
                  type="button"
                  id={col.columnName}
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
                  id={col.columnName}
                  value={values[col.columnName] || ''}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: val }))
                  }
                  placeholder={col.columnName}
                />
              ) : col.columnType === 'select' ? (
                <SelectWithAdd
                  id={col.columnName}
                  options={(col.options || '').split(',').map((o) => o.trim()).filter(Boolean)}
                  value={values[col.columnName] || ''}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: val }))
                  }
                  onAddOption={(newOpt) => {
                    const current = col.options || ''
                    const updated = current ? `${current},${newOpt}` : newOpt
                    onOptionsChange(col.columnName, updated)
                  }}
                  placeholder={col.columnName}
                />
              ) : (
                <Input
                  id={col.columnName}
                  type={col.columnType === 'date' ? 'datetime-local' : 'text'}
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
