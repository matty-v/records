import { getSheetsClient } from './records-api'
import { getRowIndex, setRowIndex, deleteRowIndex } from './row-index-cache'
import type { RecordRow } from './types'

async function resolveRowIndex(
  sheetName: string,
  recordId: string,
  spreadsheetId: string
): Promise<number> {
  const cached = getRowIndex(sheetName, recordId)
  if (cached !== undefined) return cached

  const client = getSheetsClient(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await client.getRows<any>(sheetName)
  const index = rows.findIndex((r: { id?: string }) => r.id === recordId)
  if (index < 0) {
    throw new Error('Record not found in remote sheet')
  }
  const rowIndex = index + 2
  setRowIndex(sheetName, recordId, rowIndex)
  return rowIndex
}

export async function syncCreateToRemote(
  record: RecordRow,
  sheetName: string,
  spreadsheetId: string
): Promise<{ rowIndex: number }> {
  const client = getSheetsClient(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.createRow(sheetName, record as any)
  setRowIndex(sheetName, record.id, result.rowIndex)
  return { rowIndex: result.rowIndex }
}

export async function syncUpdateToRemote(
  record: RecordRow,
  sheetName: string,
  spreadsheetId: string
): Promise<void> {
  const rowIndex = await resolveRowIndex(sheetName, record.id, spreadsheetId)
  const client = getSheetsClient(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await client.updateRow(sheetName, rowIndex, record as any)
}

export async function syncDeleteToRemote(
  sheetName: string,
  recordId: string,
  spreadsheetId: string
): Promise<void> {
  const rowIndex = await resolveRowIndex(sheetName, recordId, spreadsheetId)
  const client = getSheetsClient(spreadsheetId)
  await client.deleteRow(sheetName, rowIndex)
  deleteRowIndex(sheetName, recordId)
}
