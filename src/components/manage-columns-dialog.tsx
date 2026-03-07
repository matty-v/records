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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { COLUMN_TYPES } from '@/config/constants'
import type { ColumnType, SheetSchema } from '@/lib/types'

interface ColumnEdit {
  name: string
  type: ColumnType
  isNew?: boolean
}

interface ManageColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SheetSchema | null
  onSave: (sheetName: string, columns: ColumnEdit[]) => void
  isSaving: boolean
  canDeleteSheet: boolean
  onDeleteSheet: (name: string) => void
}

export function ManageColumnsDialog({
  open,
  onOpenChange,
  schema,
  onSave,
  isSaving,
  canDeleteSheet,
  onDeleteSheet,
}: ManageColumnsDialogProps) {
  const [columns, setColumns] = useState<ColumnEdit[]>([])

  useEffect(() => {
    if (schema) {
      setColumns(
        schema.columns.map((c) => ({ name: c.columnName, type: c.columnType }))
      )
    }
  }, [schema])

  if (!schema) return null

  const addColumn = () => {
    setColumns((prev) => [...prev, { name: '', type: 'text', isNew: true }])
  }

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof ColumnEdit, value: string) => {
    setColumns((prev) =>
      prev.map((col, i) => (i === index ? { ...col, [field]: value } : col))
    )
  }

  const handleSave = () => {
    const validColumns = columns.filter((c) => c.name.trim())
    onSave(schema.sheetName, validColumns)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Sheet: <span className="glow-cyan">{schema.sheetName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Columns</Label>
          {columns.map((col, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={col.name}
                onChange={(e) => updateColumn(index, 'name', e.target.value)}
                placeholder="Column name"
                className="flex-1"
                disabled={!col.isNew}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeColumn(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-1" /> Add Column
          </Button>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {canDeleteSheet && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                onOpenChange(false)
                onDeleteSheet(schema.sheetName)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Sheet
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
