import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Settings, TableProperties, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourceSelector } from '@/components/source-selector'
import { SheetTabs } from '@/components/sheet-tabs'
import { RecordTable } from '@/components/record-table'
import { RecordFormModal } from '@/components/record-form-modal'
import { RecordDetailModal } from '@/components/record-detail-modal'
import { AddSheetDialog } from '@/components/add-sheet-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ManageColumnsDialog } from '@/components/manage-columns-dialog'
import { SettingsDialog } from '@/components/settings-dialog'
import { useSources } from '@/hooks/use-sources'
import { useSchema } from '@/hooks/use-schema'
import { useSheets } from '@/hooks/use-sheets'
import { useRecords } from '@/hooks/use-records'
import { useSettings } from '@/hooks/use-settings'
import { useBlockingOverlay } from '@/components/blocking-overlay'
import { ViewModeToggle, type ViewMode } from '@/components/view-mode-toggle'
import { ChartView } from '@/components/chart-view'

import { getSheetsClient } from '@/lib/records-api'
import { refreshSchemaFromRemote, refreshRecordsFromRemote } from '@/lib/cache'
import { db } from '@/lib/db'
import { serializeConfigRow } from '@/lib/schema-utils'
import { CONFIG_SHEET_NAME } from '@/config/constants'
import { detectVisualizations } from '@/lib/chart-utils'
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

  const visualizations = currentSchema ? detectVisualizations(currentSchema) : []
  const hasCharts = visualizations.length > 0

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!activeSource) return
    setIsRefreshing(true)
    try {
      // Wipe local IndexedDB cache
      await db.records.filter((r) => r.sourceId === activeSource.id).delete()
      await db.schemas.filter((s) => s.localId.startsWith(`${activeSource.id}:`)).delete()

      // Pull fresh data from remote
      await refreshSchemaFromRemote(activeSource.id, activeSource.spreadsheetId)

      if (activeSheet) {
        await refreshRecordsFromRemote(activeSource.id, activeSource.spreadsheetId, activeSheet)
      }

      // Invalidate all React Query caches
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      queryClient.invalidateQueries({ queryKey: ['records'] })

    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [activeSource, activeSheet, queryClient])

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showManageColumns, setShowManageColumns] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isSavingColumns, setIsSavingColumns] = useState(false)
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const handleCreateRecord = useCallback(async (data: Record<string, string>) => {
    await withOverlay(async () => {
      await createRecord.mutateAsync(data)
      setShowAddForm(false)
    }, 'Creating record...')
  }, [createRecord, withOverlay])

  const handleUpdateRecord = useCallback(async (id: string, data: Record<string, string>) => {
    await withOverlay(async () => {
      await updateRecord.mutateAsync({ id, data })
      setSelectedRecord(null)
    }, 'Updating record...')
  }, [updateRecord, withOverlay])

  const handleDeleteRecord = useCallback(async (id: string) => {
    await withOverlay(async () => {
      await deleteRecord.mutateAsync(id)
      setSelectedRecord(null)
    }, 'Deleting record...')
  }, [deleteRecord, withOverlay])

  const handleCreateSheet = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType; autoPopulate?: 'currentDate'; options?: string }[]
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

        // Ensure _config sheet has the needed header columns
        // API only creates headers on empty sheets, so we must
        // recreate _config if new columns are needed
        const needsAutoPopulate = columns.some((c) => c.autoPopulate)
        const needsOptions = columns.some((c) => c.options)
        if (needsAutoPopulate || needsOptions) {
          const configHeaders = await client.getSchema(CONFIG_SHEET_NAME)
          const missingHeaders: string[] = []
          if (needsAutoPopulate && !configHeaders.includes('autoPopulate')) {
            missingHeaders.push('autoPopulate')
          }
          if (needsOptions && !configHeaders.includes('options')) {
            missingHeaders.push('options')
          }
          if (missingHeaders.length > 0) {
            const existingRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
            await client.deleteSheet(CONFIG_SHEET_NAME)
            await client.createSheet(CONFIG_SHEET_NAME)

            // Create placeholder row with all columns to establish headers
            const allHeaders: Record<string, string> = {
              sheetName: '', columnName: '', columnType: '', columnOrder: '',
            }
            for (const h of missingHeaders) { allHeaders[h] = '' }
            // Include any existing headers too
            for (const h of configHeaders) { allHeaders[h] = '' }
            const { rowIndex: phIdx } = await client.createRow(CONFIG_SHEET_NAME, allHeaders)
            await client.deleteRow(CONFIG_SHEET_NAME, phIdx)

            // Re-insert existing config data
            if (existingRows.length > 0) {
              await client.bulkCreateRows(CONFIG_SHEET_NAME, existingRows)
            }
          }
        }

        // Write column definitions to _config
        for (let i = 0; i < columns.length; i++) {
          const configRow = serializeConfigRow({
            sheetName,
            columnName: columns[i].name,
            columnType: columns[i].type,
            columnOrder: i + 1,
            ...(columns[i].autoPopulate ? { autoPopulate: columns[i].autoPopulate } : {}),
            ...(columns[i].options ? { options: columns[i].options } : {}),
          })
          await client.createRow(CONFIG_SHEET_NAME, configRow)
        }

        // Refresh schema from remote so IndexedDB cache includes autoPopulate
        await refreshSchemaFromRemote(activeSource.id, activeSource.spreadsheetId)
        queryClient.invalidateQueries({ queryKey: ['schema'] })
        setShowAddSheet(false)
        setActiveSheet(sheetName)
      }, 'Creating sheet...')
    } catch (error) {
      console.error('Failed to create sheet:', error)
    } finally {
      setIsCreatingSheet(false)
    }
  }, [activeSource, withOverlay, queryClient, setActiveSheet])

  const handleSaveColumns = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType; options?: string; autoPopulate?: 'currentDate' }[]
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
            ...(columns[i].autoPopulate ? { autoPopulate: columns[i].autoPopulate } : {}),
            ...(columns[i].options ? { options: columns[i].options } : {}),
          })
          await client.createRow(CONFIG_SHEET_NAME, configRow)
        }

        // Check if new columns need to be added to the actual sheet
        const currentHeaders = await client.getSchema(sheetName)
        const newColumnNames = columns
          .map((c) => c.name)
          .filter((name) => !currentHeaders.includes(name))

        if (newColumnNames.length > 0) {
          // API only creates headers on empty sheets, so we must
          // recreate the sheet to establish new column headers
          const existingRows = await client.getRows<Record<string, string>>(sheetName)
          await client.deleteSheet(sheetName)
          await client.createSheet(sheetName)

          // Create placeholder row with all columns to establish headers
          const placeholder: Record<string, string> = { id: '' }
          columns.forEach((c) => { placeholder[c.name] = '' })
          const { rowIndex: phIdx } = await client.createRow(sheetName, placeholder)
          await client.deleteRow(sheetName, phIdx)

          // Re-insert existing data
          if (existingRows.length > 0) {
            await client.bulkCreateRows(sheetName, existingRows)
          }
        }

        await refreshSchemaFromRemote(activeSource.id, activeSource.spreadsheetId)
        queryClient.invalidateQueries({ queryKey: ['schema'] })
        setShowManageColumns(false)
      }, 'Saving columns...')
    } catch (error) {
      console.error('Failed to save columns:', error)
    } finally {
      setIsSavingColumns(false)
    }
  }, [activeSource, withOverlay, queryClient])

  const handleOptionsChange = useCallback(async (columnName: string, newOptions: string) => {
    if (!activeSource || !currentSchema) return
    const columns = currentSchema.columns.map((col) => ({
      name: col.columnName,
      type: col.columnType,
      options: col.columnName === columnName ? newOptions : col.options,
      autoPopulate: col.autoPopulate,
    }))
    await handleSaveColumns(currentSchema.sheetName, columns)
  }, [activeSource, currentSchema, handleSaveColumns])

  const handleDeleteSheet = useCallback(async (sheetName: string) => {
    if (!activeSource) return
    setSheetToDelete(null)
    try {
      await withOverlay(async () => {
        const client = getSheetsClient(activeSource.spreadsheetId)

        // Delete _config rows for this sheet (reverse order to preserve indices)
        const configRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
        const sheetConfigRows = configRows
          .map((row, idx) => ({ row, rowIndex: idx + 2 }))
          .filter(({ row }) => row.sheetName === sheetName)

        for (const { rowIndex } of [...sheetConfigRows].reverse()) {
          await client.deleteRow(CONFIG_SHEET_NAME, rowIndex)
        }

        // Delete the actual sheet
        await client.deleteSheet(sheetName)

        // Clear local caches for this sheet
        await db.records.filter((r) => r.sourceId === activeSource.id && r.sheetName === sheetName).delete()
        await db.schemas.filter((s) => s.localId.startsWith(`${activeSource.id}:${sheetName}:`)).delete()

        // Invalidate React Query caches
        queryClient.invalidateQueries({ queryKey: ['schema'] })
        queryClient.invalidateQueries({ queryKey: ['records'] })

        // Switch to first remaining sheet
        const remaining = sheetNames.filter((n) => n !== sheetName)
        if (remaining.length > 0) {
          setActiveSheet(remaining[0])
        }

      }, 'Deleting sheet...')
    } catch (error) {
      console.error('Failed to delete sheet:', error)
    }
  }, [activeSource, withOverlay, queryClient, sheetNames, setActiveSheet])

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
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing || !activeSource}>
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {currentSchema && (
            <Button variant="ghost" size="icon" onClick={() => setShowManageColumns(true)}>
              <TableProperties className="h-5 w-5" />
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
          onSheetChange={(name) => { setActiveSheet(name); setViewMode('table') }}
        />
        <Button variant="ghost" size="sm" onClick={() => setShowAddSheet(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {currentSchema && hasCharts && (
        <div className="mb-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      )}

      {/* Records */}
      {currentSchema ? (
        viewMode === 'chart' && hasCharts ? (
          <ChartView visualizations={visualizations} records={records} />
        ) : (
          <RecordTable
            records={records}
            schema={currentSchema}
            isLoading={isLoading}
            onRecordClick={setSelectedRecord}
          />
        )
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
      {currentSchema && viewMode === 'table' && (
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
            onOptionsChange={handleOptionsChange}
            isSubmitting={createRecord.isPending}
          />
          <RecordDetailModal
            open={!!selectedRecord}
            onOpenChange={(open) => { if (!open) setSelectedRecord(null) }}
            record={selectedRecord}
            schema={currentSchema}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
            onOptionsChange={handleOptionsChange}
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
        canDeleteSheet={sheetNames.length > 0}
        onDeleteSheet={setSheetToDelete}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        activeSource={activeSource}
        onUpdateSource={updateSource}
        onInitializeSheets={initializeSheets}
        isInitializing={isInitializing}
      />

      <Dialog open={!!sheetToDelete} onOpenChange={(open) => { if (!open) setSheetToDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete sheet "{sheetToDelete}"?</DialogTitle>
            <DialogDescription>
              This will permanently delete the sheet and all its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => sheetToDelete && handleDeleteSheet(sheetToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
