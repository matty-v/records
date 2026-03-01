import type { ColumnDefinition, ColumnType, SheetSchema } from './types'

export function parseConfigRows(rows: Record<string, string>[]): ColumnDefinition[] {
  return rows
    .filter((row) => row.sheetName && row.columnName)
    .map((row) => ({
      sheetName: row.sheetName,
      columnName: row.columnName,
      columnType: (row.columnType || 'text') as ColumnType,
      columnOrder: parseInt(row.columnOrder || '0', 10),
    }))
}

export function groupBySheet(columns: ColumnDefinition[]): SheetSchema[] {
  const map = new Map<string, ColumnDefinition[]>()
  for (const col of columns) {
    const existing = map.get(col.sheetName) || []
    existing.push(col)
    map.set(col.sheetName, existing)
  }

  return Array.from(map.entries()).map(([sheetName, cols]) => ({
    sheetName,
    columns: cols.sort((a, b) => a.columnOrder - b.columnOrder),
  }))
}

export function serializeConfigRow(col: ColumnDefinition): Record<string, string> {
  return {
    sheetName: col.sheetName,
    columnName: col.columnName,
    columnType: col.columnType,
    columnOrder: String(col.columnOrder),
  }
}
