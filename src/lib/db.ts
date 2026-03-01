import Dexie, { type EntityTable } from 'dexie'
import type { RecordRow, ColumnDefinition } from './types'

export class RecordsDB extends Dexie {
  records!: EntityTable<RecordRow, 'id'>
  schemas!: EntityTable<ColumnDefinition & { localId: string }, 'localId'>

  constructor() {
    super('RecordsDB')
    this.version(1).stores({
      records: 'id, sourceId, sheetName',
      schemas: 'localId, sourceId, sheetName',
    })
  }
}

export const db = new RecordsDB()
