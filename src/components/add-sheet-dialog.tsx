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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { COLUMN_TYPES } from '@/config/constants'
import type { ColumnType } from '@/lib/types'

export interface ColumnDraft {
  name: string
  type: ColumnType
  autoPopulate?: 'currentDate'
  options?: string
}

interface AddSheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (sheetName: string, columns: ColumnDraft[]) => void
  isSubmitting: boolean
}

export function AddSheetDialog({ open, onOpenChange, onSubmit, isSubmitting }: AddSheetDialogProps) {
  const [sheetName, setSheetName] = useState('')
  const [columns, setColumns] = useState<ColumnDraft[]>([{ name: '', type: 'text' }])
  const [addAutoDate, setAddAutoDate] = useState(true)

  const addColumn = () => {
    setColumns((prev) => [...prev, { name: '', type: 'text' }])
  }

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof ColumnDraft, value: string) => {
    setColumns((prev) =>
      prev.map((col, i) => (i === index ? { ...col, [field]: value } : col))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validColumns = columns.filter((c) => c.name.trim())
    if (!sheetName.trim() || validColumns.length === 0) return
    const allColumns: ColumnDraft[] = addAutoDate
      ? [{ name: 'created at', type: 'date', autoPopulate: 'currentDate' }, ...validColumns]
      : validColumns
    onSubmit(sheetName.trim(), allColumns)
    setSheetName('')
    setColumns([{ name: '', type: 'text' }])
    setAddAutoDate(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSheetName('')
      setColumns([{ name: '', type: 'text' }])
      setAddAutoDate(true)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheetName">Sheet Name</Label>
            <Input
              id="sheetName"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="e.g. expenses"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addAutoDate}
              onChange={(e) => setAddAutoDate(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] accent-[var(--accent-cyan)]"
            />
            <span className="text-sm text-muted-foreground">
              Add "created at" date column (auto-populated)
            </span>
          </label>

          <div className="space-y-2">
            <Label>Columns</Label>
            {columns.map((col, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    value={col.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                    placeholder="Column name"
                    className="flex-1"
                  />
                  <Select
                    value={col.type}
                    onValueChange={(v) => updateColumn(index, 'type', v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {columns.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColumn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {col.type === 'select' && (
                  <Input
                    value={col.options || ''}
                    onChange={(e) => updateColumn(index, 'options', e.target.value)}
                    placeholder="Options (comma-separated, e.g. Red,Green,Blue)"
                    className="ml-0 text-xs"
                  />
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-1" /> Add Column
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !sheetName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Sheet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
