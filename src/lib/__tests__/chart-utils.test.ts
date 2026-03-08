import { describe, it, expect } from 'vitest'
import {
  detectVisualizations,
  type Visualization,
} from '../chart-utils'
import type { SheetSchema } from '../types'

/* ------------------------------------------------------------------ */
/*  Task 2 – detectVisualizations                                     */
/* ------------------------------------------------------------------ */

describe('detectVisualizations', () => {
  it('returns empty array for empty schema (no columns)', () => {
    const schema: SheetSchema = { sheetName: 'Empty', columns: [] }
    expect(detectVisualizations(schema)).toEqual([])
  })

  it('returns empty array for text-only columns', () => {
    const schema: SheetSchema = {
      sheetName: 'Notes',
      columns: [
        { sheetName: 'Notes', columnName: 'title', columnType: 'text', columnOrder: 1 },
        { sheetName: 'Notes', columnName: 'body', columnType: 'text', columnOrder: 2 },
      ],
    }
    expect(detectVisualizations(schema)).toEqual([])
  })

  it('returns line chart for date + numeric columns', () => {
    const schema: SheetSchema = {
      sheetName: 'Metrics',
      columns: [
        { sheetName: 'Metrics', columnName: 'recorded', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Metrics', columnName: 'weight', columnType: 'number', columnOrder: 2 },
        { sheetName: 'Metrics', columnName: 'calories', columnType: 'number', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      { type: 'line', dateColumn: 'recorded', valueColumns: ['weight', 'calories'] },
    ])
  })

  it('returns bar chart for date + boolean columns', () => {
    const schema: SheetSchema = {
      sheetName: 'Habits',
      columns: [
        { sheetName: 'Habits', columnName: 'date', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Habits', columnName: 'exercised', columnType: 'boolean', columnOrder: 2 },
        { sheetName: 'Habits', columnName: 'meditated', columnType: 'boolean', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      { type: 'bar', dateColumn: 'date', booleanColumns: ['exercised', 'meditated'] },
    ])
  })

  it('returns both line AND bar for date + numeric + boolean', () => {
    const schema: SheetSchema = {
      sheetName: 'Mixed',
      columns: [
        { sheetName: 'Mixed', columnName: 'day', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Mixed', columnName: 'score', columnType: 'number', columnOrder: 2 },
        { sheetName: 'Mixed', columnName: 'passed', columnType: 'boolean', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ type: 'line', dateColumn: 'day', valueColumns: ['score'] })
    expect(result).toContainEqual({ type: 'bar', dateColumn: 'day', booleanColumns: ['passed'] })
  })

  it('returns summary stats for numeric-only columns (no date)', () => {
    const schema: SheetSchema = {
      sheetName: 'Stats',
      columns: [
        { sheetName: 'Stats', columnName: 'height', columnType: 'number', columnOrder: 1 },
        { sheetName: 'Stats', columnName: 'weight', columnType: 'number', columnOrder: 2 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      { type: 'summary', valueColumns: ['height', 'weight'] },
    ])
  })

  it('returns donut chart for boolean-only columns (no date)', () => {
    const schema: SheetSchema = {
      sheetName: 'Flags',
      columns: [
        { sheetName: 'Flags', columnName: 'active', columnType: 'boolean', columnOrder: 1 },
        { sheetName: 'Flags', columnName: 'verified', columnType: 'boolean', columnOrder: 2 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      { type: 'donut', booleanColumns: ['active', 'verified'] },
    ])
  })

  it('uses the first date column when multiple date columns exist', () => {
    const schema: SheetSchema = {
      sheetName: 'Multi',
      columns: [
        { sheetName: 'Multi', columnName: 'created', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Multi', columnName: 'updated', columnType: 'date', columnOrder: 2 },
        { sheetName: 'Multi', columnName: 'amount', columnType: 'number', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema) as Visualization[]
    const line = result.find((v) => v.type === 'line')
    expect(line).toBeDefined()
    if (line && line.type === 'line') {
      expect(line.dateColumn).toBe('created')
    }
  })

  it('ignores text columns when mixed with numeric and boolean (no date)', () => {
    const schema: SheetSchema = {
      sheetName: 'Mixed',
      columns: [
        { sheetName: 'Mixed', columnName: 'name', columnType: 'text', columnOrder: 1 },
        { sheetName: 'Mixed', columnName: 'count', columnType: 'number', columnOrder: 2 },
        { sheetName: 'Mixed', columnName: 'active', columnType: 'boolean', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ type: 'summary', valueColumns: ['count'] })
    expect(result).toContainEqual({ type: 'donut', booleanColumns: ['active'] })
  })
})
