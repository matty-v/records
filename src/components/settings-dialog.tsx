import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SheetsSettingsPanel } from '@/components/sheets'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'
import type { RecordSource } from '@/lib/types'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSource: RecordSource | null
  onUpdateSource: (id: string, updates: Partial<Omit<RecordSource, 'id'>>) => void
  onInitializeSheets: (sheetId: string) => Promise<boolean>
  isInitializing: boolean
  activeSheet: string | null
  canDeleteSheet: boolean
  onDeleteSheet: (name: string) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  activeSource,
  onUpdateSource,
  onInitializeSheets,
  isInitializing,
  activeSheet,
  canDeleteSheet,
  onDeleteSheet,
}: SettingsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempInput, setTempInput] = useState('')
  const [status, setStatus] = useState('')

  if (!activeSource) return null

  const handleSave = async () => {
    const success = await onInitializeSheets(tempInput)
    if (success) {
      onUpdateSource(activeSource.id, { spreadsheetId: tempInput })
      setIsEditing(false)
      setStatus('Success! Spreadsheet updated.')
    } else {
      setStatus('Error: Failed to connect to spreadsheet.')
    }
  }

  const handleDeleteSheet = () => {
    if (activeSheet) {
      onOpenChange(false)
      onDeleteSheet(activeSheet)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Google Sheets</h3>
            <SheetsSettingsPanel
              serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
              spreadsheetId={activeSource.spreadsheetId}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              tempInputValue={tempInput}
              onTempInputChange={setTempInput}
              onSave={handleSave}
              isSaving={isInitializing}
              status={status}
            />
          </div>

          {activeSheet && canDeleteSheet && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Active Sheet</h3>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSheet}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete "{activeSheet}"
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
