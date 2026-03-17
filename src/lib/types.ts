export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'select'

export interface ColumnDefinition {
  sheetName: string
  columnName: string
  columnType: ColumnType
  columnOrder: number
  autoPopulate?: 'currentDate'
  options?: string
}

export interface SheetSchema {
  sheetName: string
  columns: ColumnDefinition[]
}

export interface RecordRow {
  id: string
  sourceId: string
  sheetName: string
  [key: string]: string
}

export interface RecordSource {
  id: string
  name: string
  spreadsheetId: string
}
