import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Settings, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourceSelector } from '@/components/source-selector'
import { SheetTabs } from '@/components/sheet-tabs'
import { RecordTable } from '@/components/record-table'
import { RecordFormModal } from '@/components/record-form-modal'
import { RecordDetailModal } from '@/components/record-detail-modal'
import { AddSheetDialog } from '@/components/add-sheet-dialog'
import { ManageColumnsDialog } from '@/components/manage-columns-dialog'
import { SettingsDialog } from '@/components/settings-dialog'
import { useSources } from '@/hooks/use-sources'
import { useSchema } from '@/hooks/use-schema'
import { useSheets } from '@/hooks/use-sheets'
import { useRecords } from '@/hooks/use-records'
import { useSettings } from '@/hooks/use-settings'
import { useBlockingOverlay } from '@/components/blocking-overlay'
import { toast } from '@/hooks/use-toast'
import { getSheetsClient } from '@/lib/records-api'
import { refreshSchemaFromRemote } from '@/lib/cache'
import { serializeConfigRow } from '@/lib/schema-utils'
import { CONFIG_SHEET_NAME } from '@/config/constants'
import type { RecordRow, ColumnType } from '@/lib/types'

export function HomePage() {
  const queryClient = useQueryClient()
  const { sources, activeSource, setActiveSourceId, updateSource } = useSources()
  const { initializeSheets, isInitializing } = useSettings()
  const { withOverlay } = useBlockingOverlay()

  const { data: schemas = [] } = useSchema(
    activeSource?.id ?? null,
    activeSource?.spreadsheetId ?? null
  )
  const { sheetNames, activeSheet, setActiveSheet, currentSchema } = useSheets(schemas)
  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useRecords(activeSource?.id ?? null, activeSource?.spreadsheetId ?? null, activeSheet, currentSchema ?? null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showManageColumns, setShowManageColumns] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isSavingColumns, setIsSavingColumns] = useState(false)

  const handleCreateRecord = useCallback(async (data: Record<string, string>) => {
    await withOverlay(async () => {
      await createRecord.mutateAsync(data)
      setShowAddForm(false)
      toast({ title: 'Record created' })
    }, 'Creating record...')
  }, [createRecord, withOverlay])

  const handleUpdateRecord = useCallback(async (id: string, data: Record<string, string>) => {
    await withOverlay(async () => {
      await updateRecord.mutateAsync({ id, data })
      setSelectedRecord(null)
      toast({ title: 'Record updated' })
    }, 'Updating record...')
  }, [updateRecord, withOverlay])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await withOverlay(async () => {
      await deleteRecord.mutateAsync(id)
      setSelectedRecord(null)
      toast({ title: 'Record deleted' })
    }, 'Deleting record...')
  }, [deleteRecord, withOverlay])

  const handleCreateSheet = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType; autoPopulate?: 'currentDate' }[]
  ) => {
    if (!activeSource) return
    setIsCreatingSheet(true)
    try {
      await withOverlay(async () => {
        const client = getSheetsClient(activeSource.spreadsheetId)

        // Create the actual sheet
        await client.createSheet(sheetName)

        // Create placeholder row to establish column headers, then delete
        const placeholder: Record<string, string> = { id: '' }
        columns.forEach((c) => { placeholder[c.name] = '' })
        const { rowIndex } = await client.createRow(sheetName, placeholder)
        await client.deleteRow(sheetName, rowIndex)

        // Write column definitions to _config
        for (let i = 0; i < columns.length; i++) {
          const configRow = serializeConfigRow({
            sheetName,
            columnName: columns[i].name,
            columnType: columns[i].type,
            columnOrder: i + 1,
            ...(columns[i].autoPopulate ? { autoPopulate: columns[i].autoPopulate } : {}),
          })
          await client.createRow(CONFIG_SHEET_NAME, configRow)
        }

        // Refresh schema from remote so IndexedDB cache includes autoPopulate
        await refreshSchemaFromRemote(activeSource.id, activeSource.spreadsheetId)
        queryClient.invalidateQueries({ queryKey: ['schema'] })
        setShowAddSheet(false)
        setActiveSheet(sheetName)
        toast({ title: `Sheet "${sheetName}" created` })
      }, 'Creating sheet...')
    } catch (error) {
      toast({
        title: 'Failed to create sheet',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingSheet(false)
    }
  }, [activeSource, withOverlay, queryClient, setActiveSheet])

  const handleSaveColumns = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType }[]
  ) => {
    if (!activeSource) return
    setIsSavingColumns(true)
    try {
      await withOverlay(async () => {
        const client = getSheetsClient(activeSource.spreadsheetId)

        // Get existing _config rows for this sheet
        const configRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
        const sheetConfigRows = configRows
          .map((row, idx) => ({ row, rowIndex: idx + 2 }))
          .filter(({ row }) => row.sheetName === sheetName)

        // Delete old config rows (reverse order to preserve indices)
        for (const { rowIndex } of [...sheetConfigRows].reverse()) {
          await client.deleteRow(CONFIG_SHEET_NAME, rowIndex)
        }

        // Write new config rows
        for (let i = 0; i < columns.length; i++) {
          const configRow = serializeConfigRow({
            sheetName,
            columnName: columns[i].name,
            columnType: columns[i].type,
            columnOrder: i + 1,
          })
          await client.createRow(CONFIG_SHEET_NAME, configRow)
        }

        await refreshSchemaFromRemote(activeSource.id, activeSource.spreadsheetId)
        queryClient.invalidateQueries({ queryKey: ['schema'] })
        setShowManageColumns(false)
        toast({ title: 'Columns updated' })
      }, 'Saving columns...')
    } catch (error) {
      toast({
        title: 'Failed to save columns',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSavingColumns(false)
    }
  }, [activeSource, withOverlay, queryClient])

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <SourceSelector
          sources={sources}
          activeSource={activeSource}
          onSourceChange={setActiveSourceId}
        />
        <div className="flex gap-1">
          {currentSchema && (
            <Button variant="ghost" size="icon" onClick={() => setShowManageColumns(true)}>
              <Columns3 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <SheetTabs
          sheetNames={sheetNames}
          activeSheet={activeSheet}
          onSheetChange={setActiveSheet}
        />
        <Button variant="ghost" size="sm" onClick={() => setShowAddSheet(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Records */}
      {currentSchema ? (
        <RecordTable
          records={records}
          schema={currentSchema}
          isLoading={isLoading}
          onRecordClick={setSelectedRecord}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm font-light">No sheets configured</p>
          <p className="text-xs mt-1">Create a sheet to get started</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddSheet(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create Sheet
          </Button>
        </div>
      )}

      {/* FAB */}
      {currentSchema && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[var(--accent-cyan)] text-[#0a0e14] shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all duration-300 flex items-center justify-center z-40"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modals */}
      {currentSchema && (
        <>
          <RecordFormModal
            open={showAddForm}
            onOpenChange={setShowAddForm}
            schema={currentSchema}
            onSubmit={handleCreateRecord}
            isSubmitting={createRecord.isPending}
          />
          <RecordDetailModal
            open={!!selectedRecord}
            onOpenChange={(open) => { if (!open) setSelectedRecord(null) }}
            record={selectedRecord}
            schema={currentSchema}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
            isUpdating={updateRecord.isPending}
            isDeleting={deleteRecord.isPending}
          />
        </>
      )}

      <AddSheetDialog
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        onSubmit={handleCreateSheet}
        isSubmitting={isCreatingSheet}
      />

      <ManageColumnsDialog
        open={showManageColumns}
        onOpenChange={setShowManageColumns}
        schema={currentSchema}
        onSave={handleSaveColumns}
        isSaving={isSavingColumns}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        activeSource={activeSource}
        onUpdateSource={updateSource}
        onInitializeSheets={initializeSheets}
        isInitializing={isInitializing}
      />
    </div>
  )
}
