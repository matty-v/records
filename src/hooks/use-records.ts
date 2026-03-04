import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { refreshRecordsFromRemote } from '@/lib/cache'
import { syncCreateToRemote, syncUpdateToRemote, syncDeleteToRemote } from '@/lib/sync-remote'
import type { RecordRow, SheetSchema } from '@/lib/types'

export function useRecords(
  sourceId: string | null,
  spreadsheetId: string | null,
  sheetName: string | null,
  schema: SheetSchema | null
) {
  const queryClient = useQueryClient()

  const query = useQuery<RecordRow[]>({
    queryKey: ['records', sourceId, sheetName],
    queryFn: async () => {
      if (!sourceId || !spreadsheetId || !sheetName) return []

      // Try IndexedDB cache first
      const cached = await db.records
        .filter((r) => r.sourceId === sourceId && r.sheetName === sheetName)
        .toArray()

      if (cached.length > 0) return cached

      // No cache — fetch from remote once
      try {
        await refreshRecordsFromRemote(sourceId, spreadsheetId, sheetName)
        return db.records
          .filter((r) => r.sourceId === sourceId && r.sheetName === sheetName)
          .toArray()
      } catch {
        return []
      }
    },
    enabled: !!sourceId && !!spreadsheetId && !!sheetName,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const refreshFromRemote = async () => {
    if (!sourceId || !spreadsheetId || !sheetName) return
    await refreshRecordsFromRemote(sourceId, spreadsheetId, sheetName)
    // Refetch from IndexedDB only (queryFn reads cache)
    queryClient.invalidateQueries({ queryKey: ['records', sourceId, sheetName] })
  }

  const createRecord = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (!sourceId || !spreadsheetId || !sheetName) throw new Error('No active source/sheet')

      // Auto-populate fields
      const autoData = { ...data }
      if (schema) {
        for (const col of schema.columns) {
          if (col.autoPopulate === 'currentDate' && !autoData[col.columnName]) {
            autoData[col.columnName] = new Date().toISOString().split('T')[0]
          }
        }
      }

      const record: RecordRow = {
        id: uuidv4(),
        sourceId,
        sheetName,
        ...autoData,
      }

      // Write to IndexedDB + remote
      await db.records.put(record)
      await syncCreateToRemote(record, sheetName, spreadsheetId)

      return record
    },
    onSuccess: () => {
      // Re-read from IndexedDB (no remote call)
      queryClient.invalidateQueries({ queryKey: ['records', sourceId, sheetName] })
    },
  })

  const updateRecord = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      if (!sourceId || !spreadsheetId || !sheetName) throw new Error('No active source/sheet')

      const existing = await db.records.get(id)
      if (!existing) throw new Error('Record not found')

      const updated: RecordRow = { ...existing, ...data }
      await db.records.put(updated)
      await syncUpdateToRemote(updated, sheetName, spreadsheetId)

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', sourceId, sheetName] })
    },
  })

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      if (!sourceId || !spreadsheetId || !sheetName) throw new Error('No active source/sheet')

      await db.records.delete(id)
      await syncDeleteToRemote(sheetName, id, spreadsheetId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', sourceId, sheetName] })
    },
  })

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createRecord,
    updateRecord,
    deleteRecord,
    refreshFromRemote,
  }
}
