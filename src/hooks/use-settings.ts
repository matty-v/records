import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SheetsDbClient } from '@/services/sheetsdb'
import { API_BASE_URL, CONFIG_SHEET_NAME } from '@/config/constants'

export function useSettings() {
  const queryClient = useQueryClient()
  const [isInitializing, setIsInitializing] = useState(false)
  const [status, setStatus] = useState('')

  const initializeSheets = useCallback(async (sheetId: string): Promise<boolean> => {
    setIsInitializing(true)
    setStatus('')

    try {
      const client = new SheetsDbClient({
        baseUrl: API_BASE_URL,
        spreadsheetId: sheetId,
      })

      await client.health()

      const existingSheets = await client.listSheets()
      const existingNames = existingSheets.map((s) => s.title)

      // Create _config sheet if it doesn't exist
      if (!existingNames.includes(CONFIG_SHEET_NAME)) {
        await client.createSheet(CONFIG_SHEET_NAME)
        // Create a placeholder row to establish columns, then delete it
        const configColumns = { sheetName: '', columnName: '', columnType: '', columnOrder: '', autoPopulate: '' }
        const { rowIndex } = await client.createRow(CONFIG_SHEET_NAME, configColumns)
        await client.deleteRow(CONFIG_SHEET_NAME, rowIndex)
      } else {
        // Migrate: ensure _config has the autoPopulate column header
        const rows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
        if (rows.length > 0 && !('autoPopulate' in rows[0])) {
          // Add a placeholder row with the new column, then delete it
          const placeholder = { sheetName: '', columnName: '', columnType: '', columnOrder: '', autoPopulate: '' }
          const { rowIndex } = await client.createRow(CONFIG_SHEET_NAME, placeholder)
          await client.deleteRow(CONFIG_SHEET_NAME, rowIndex)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['schema'] })
      queryClient.invalidateQueries({ queryKey: ['records'] })

      return true
    } catch (error) {
      console.error('Failed to initialize sheets:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to connect'}`)
      return false
    } finally {
      setIsInitializing(false)
    }
  }, [queryClient])

  return {
    initializeSheets,
    isInitializing,
    status,
    setStatus,
  }
}
