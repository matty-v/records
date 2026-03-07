import { describe, it, expect } from 'vitest'
import { parseConfigRows, groupBySheet, serializeConfigRow } from '../schema-utils'
import type { ColumnDefinition } from '../types'

describe('parseConfigRows', () => {
  it('parses valid config rows', () => {
    const rows = [
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: '1' },
      { sheetName: 'Tasks', columnName: 'due', columnType: 'date', columnOrder: '2' },
    ]
    const result = parseConfigRows(rows)
    expect(result).toEqual([
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: 1 },
      { sheetName: 'Tasks', columnName: 'due', columnType: 'date', columnOrder: 2 },
    ])
  })

  it('filters out rows missing sheetName or columnName', () => {
    const rows = [
      { sheetName: '', columnName: 'title', columnType: 'text', columnOrder: '1' },
      { sheetName: 'Tasks', columnName: '', columnType: 'text', columnOrder: '2' },
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: '3' },
    ]
    expect(parseConfigRows(rows)).toHaveLength(1)
  })

  it('defaults columnType to text and columnOrder to 0', () => {
    const rows = [{ sheetName: 'Tasks', columnName: 'title', columnType: '', columnOrder: '' }]
    const result = parseConfigRows(rows)
    expect(result[0].columnType).toBe('text')
    expect(result[0].columnOrder).toBe(0)
  })

  it('includes autoPopulate when set to currentDate', () => {
    const rows = [
      { sheetName: 'Tasks', columnName: 'created', columnType: 'date', columnOrder: '1', autoPopulate: 'currentDate' },
    ]
    expect(parseConfigRows(rows)[0].autoPopulate).toBe('currentDate')
  })

  it('omits autoPopulate when not currentDate', () => {
    const rows = [
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: '1', autoPopulate: '' },
    ]
    expect(parseConfigRows(rows)[0].autoPopulate).toBeUndefined()
  })
})

describe('groupBySheet', () => {
  it('groups columns by sheet name and sorts by columnOrder', () => {
    const columns: ColumnDefinition[] = [
      { sheetName: 'Tasks', columnName: 'due', columnType: 'date', columnOrder: 2 },
      { sheetName: 'Notes', columnName: 'body', columnType: 'text', columnOrder: 1 },
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: 1 },
    ]
    const result = groupBySheet(columns)
    expect(result).toHaveLength(2)

    const tasks = result.find((s) => s.sheetName === 'Tasks')!
    expect(tasks.columns[0].columnName).toBe('title')
    expect(tasks.columns[1].columnName).toBe('due')
  })

  it('returns empty array for empty input', () => {
    expect(groupBySheet([])).toEqual([])
  })
})

describe('serializeConfigRow', () => {
  it('serializes a column definition to string values', () => {
    const col: ColumnDefinition = {
      sheetName: 'Tasks',
      columnName: 'title',
      columnType: 'text',
      columnOrder: 1,
    }
    expect(serializeConfigRow(col)).toEqual({
      sheetName: 'Tasks',
      columnName: 'title',
      columnType: 'text',
      columnOrder: '1',
    })
  })

  it('includes autoPopulate when present', () => {
    const col: ColumnDefinition = {
      sheetName: 'Tasks',
      columnName: 'created',
      columnType: 'date',
      columnOrder: 1,
      autoPopulate: 'currentDate',
    }
    expect(serializeConfigRow(col).autoPopulate).toBe('currentDate')
  })
})
