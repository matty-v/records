import { db } from './db'
import { getSheetsClient, isApiReachable } from './records-api'
import { populateFromRows } from './row-index-cache'
import { parseConfigRows } from './schema-utils'
import { CONFIG_SHEET_NAME } from '@/config/constants'
import type { ColumnDefinition, RecordRow } from './types'

/** Normalize a raw remote value based on column type. */
export function normalizeValue(value: string, columnType: string): string {
  if (!value) return value

  if (columnType === 'boolean') {
    // Google Sheets returns TRUE/FALSE
    return value.toLowerCase() === 'true' ? 'true' : 'false'
  }

  if (columnType === 'date') {
    // Google Sheets may return ISO strings like "2026-03-03T14:30:00.000Z"
    // Extract date+time portion, falling back to date-only for old records
    const dtMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
    if (dtMatch) {
      return `${dtMatch[1]}T${dtMatch[2]}`
    }
    const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) {
      return dateMatch[1]
    }
  }

  return value
}

export async function refreshRecordsFromRemote(
  sourceId: string,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  if (!(await isApiReachable())) {
    throw new Error('API is not reachable')
  }

  const client = getSheetsClient(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteRows = await client.getRows<any>(sheetName)

  populateFromRows(sheetName, remoteRows)

  await db.records
    .where('[sourceId+sheetName]')
    .equals([sourceId, sheetName])
    .delete()
    .catch(() => {
      // Compound index may not exist yet, fall back
      return db.records
        .filter((r) => r.sourceId === sourceId && r.sheetName === sheetName)
        .delete()
    })

  // Load schema to normalize values by type
  const schemaRows = await db.schemas
    .filter((s) => s.localId.startsWith(`${sourceId}:${sheetName}:`))
    .toArray()
  const colTypeMap = new Map(schemaRows.map((s) => [s.columnName, s.columnType]))

  for (const remote of remoteRows) {
    if (!remote.id) continue
    const normalized: Record<string, string> = {}
    for (const [key, val] of Object.entries(remote)) {
      const colType = colTypeMap.get(key)
      normalized[key] = colType ? normalizeValue(val as string, colType) : (val as string)
    }
    const record: RecordRow = {
      ...normalized,
      sourceId,
      sheetName,
    } as RecordRow
    await db.records.put(record)
  }
}

export async function refreshSchemaFromRemote(
  sourceId: string,
  spreadsheetId: string
): Promise<ColumnDefinition[]> {
  if (!(await isApiReachable())) {
    throw new Error('API is not reachable')
  }

  const client = getSheetsClient(spreadsheetId)
  const configRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
  const columns = parseConfigRows(configRows)

  // Clear existing schema for this source
  const existingSchemas = await db.schemas
    .filter((s) => s.localId.startsWith(`${sourceId}:`))
    .toArray()
  await db.schemas.bulkDelete(existingSchemas.map((s) => s.localId))

  // Write fresh schema
  for (const col of columns) {
    await db.schemas.put({
      ...col,
      localId: `${sourceId}:${col.sheetName}:${col.columnName}`,
    })
  }

  return columns
}
