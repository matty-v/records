import { db } from './db'
import { getSheetsClient, isApiReachable } from './records-api'
import { populateFromRows } from './row-index-cache'
import { parseConfigRows } from './schema-utils'
import { CONFIG_SHEET_NAME } from '@/config/constants'
import type { ColumnDefinition, RecordRow } from './types'

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

  for (const remote of remoteRows) {
    if (!remote.id) continue
    const record: RecordRow = {
      ...remote,
      sourceId,
      sheetName,
    }
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
