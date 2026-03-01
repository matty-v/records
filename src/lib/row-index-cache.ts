/**
 * In-memory cache mapping composite keys (sheetName:id) to Google Sheets row indices.
 */

const cache = new Map<string, number>()

function makeKey(sheetName: string, id: string): string {
  return `${sheetName}:${id}`
}

export function getRowIndex(sheetName: string, id: string): number | undefined {
  return cache.get(makeKey(sheetName, id))
}

export function setRowIndex(sheetName: string, id: string, rowIndex: number): void {
  cache.set(makeKey(sheetName, id), rowIndex)
}

export function deleteRowIndex(sheetName: string, id: string): void {
  cache.delete(makeKey(sheetName, id))
}

export function populateFromRows(sheetName: string, rows: Array<{ id?: string }>): void {
  // Clear only entries for this sheet
  for (const key of cache.keys()) {
    if (key.startsWith(`${sheetName}:`)) {
      cache.delete(key)
    }
  }
  rows.forEach((row, index) => {
    if (row.id) {
      cache.set(makeKey(sheetName, row.id), index + 2)
    }
  })
}

export function clearRowIndexCache(): void {
  cache.clear()
}
