import { describe, it, expect } from 'vitest'
import {
  detectVisualizations,
  prepareLineData,
  prepareBooleanBarData,
  computeSummaryStats,
  prepareBooleanDonutData,
  type Visualization,
} from '../chart-utils'
import type { SheetSchema, RecordRow } from '../types'

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

/* ------------------------------------------------------------------ */
/*  Task 3 – Chart data aggregation helpers                            */
/* ------------------------------------------------------------------ */

function makeRecord(overrides: Record<string, string>): RecordRow {
  return { id: '1', sourceId: 's1', sheetName: 'Test', ...overrides }
}

describe('prepareLineData', () => {
  it('groups values by date and sorts chronologically', () => {
    const records = [
      makeRecord({ date: '2024-03-15T10:00:00', weight: '80' }),
      makeRecord({ date: '2024-03-14T09:00:00', weight: '79' }),
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result).toEqual([
      { date: '2024-03-14', weight: 79 },
      { date: '2024-03-15', weight: 80 },
    ])
  })

  it('averages multiple values on the same date', () => {
    const records = [
      makeRecord({ date: '2024-03-15T10:00:00', weight: '80' }),
      makeRecord({ date: '2024-03-15T20:00:00', weight: '82' }),
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result).toEqual([
      { date: '2024-03-15', weight: 81 },
    ])
  })

  it('handles multiple value columns', () => {
    const records = [
      makeRecord({ date: '2024-01-01', weight: '70', calories: '2000' }),
    ]
    const result = prepareLineData(records, 'date', ['weight', 'calories'])
    expect(result).toEqual([
      { date: '2024-01-01', weight: 70, calories: 2000 },
    ])
  })

  it('skips records with missing or empty date', () => {
    const records = [
      makeRecord({ date: '', weight: '80' }),
      makeRecord({ weight: '79' }),
      makeRecord({ date: '2024-01-01', weight: '78' }),
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ date: '2024-01-01', weight: 78 })
  })

  it('skips non-numeric values', () => {
    const records = [
      makeRecord({ date: '2024-01-01', weight: 'abc' }),
      makeRecord({ date: '2024-01-01', weight: '75' }),
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result[0].weight).toBe(75)
  })

  it('returns empty array for empty records', () => {
    expect(prepareLineData([], 'date', ['weight'])).toEqual([])
  })
})

describe('prepareBooleanBarData', () => {
  it('counts true/false per date per boolean column', () => {
    const records = [
      makeRecord({ date: '2024-01-01', exercised: 'true' }),
      makeRecord({ date: '2024-01-01', exercised: 'false' }),
      makeRecord({ date: '2024-01-01', exercised: 'true' }),
      makeRecord({ date: '2024-01-02', exercised: 'false' }),
    ]
    const result = prepareBooleanBarData(records, 'date', ['exercised'])
    expect(result).toEqual([
      { date: '2024-01-01', exercised_true: 2, exercised_false: 1 },
      { date: '2024-01-02', exercised_true: 0, exercised_false: 1 },
    ])
  })

  it('handles multiple boolean columns', () => {
    const records = [
      makeRecord({ date: '2024-01-01', exercised: 'true', meditated: 'false' }),
    ]
    const result = prepareBooleanBarData(records, 'date', ['exercised', 'meditated'])
    expect(result).toEqual([
      { date: '2024-01-01', exercised_true: 1, exercised_false: 0, meditated_true: 0, meditated_false: 1 },
    ])
  })

  it('sorts dates chronologically', () => {
    const records = [
      makeRecord({ date: '2024-03-15', exercised: 'true' }),
      makeRecord({ date: '2024-01-01', exercised: 'true' }),
    ]
    const result = prepareBooleanBarData(records, 'date', ['exercised'])
    expect(result[0].date).toBe('2024-01-01')
    expect(result[1].date).toBe('2024-03-15')
  })

  it('treats case-insensitive "TRUE" as true', () => {
    const records = [
      makeRecord({ date: '2024-01-01', exercised: 'TRUE' }),
      makeRecord({ date: '2024-01-01', exercised: 'True' }),
    ]
    const result = prepareBooleanBarData(records, 'date', ['exercised'])
    expect(result[0].exercised_true).toBe(2)
    expect(result[0].exercised_false).toBe(0)
  })

  it('skips empty boolean values', () => {
    const records = [
      makeRecord({ date: '2024-01-01', exercised: '' }),
      makeRecord({ date: '2024-01-01', exercised: 'true' }),
    ]
    const result = prepareBooleanBarData(records, 'date', ['exercised'])
    expect(result[0].exercised_true).toBe(1)
    expect(result[0].exercised_false).toBe(0)
  })

  it('returns empty array for empty records', () => {
    expect(prepareBooleanBarData([], 'date', ['exercised'])).toEqual([])
  })
})

describe('computeSummaryStats', () => {
  it('computes sum, avg, min, max, count for a single column', () => {
    const records = [
      makeRecord({ score: '10' }),
      makeRecord({ score: '20' }),
      makeRecord({ score: '30' }),
    ]
    const result = computeSummaryStats(records, ['score'])
    expect(result).toEqual([
      { column: 'score', sum: 60, avg: 20, min: 10, max: 30, count: 3 },
    ])
  })

  it('handles multiple columns', () => {
    const records = [
      makeRecord({ height: '170', weight: '70' }),
      makeRecord({ height: '180', weight: '80' }),
    ]
    const result = computeSummaryStats(records, ['height', 'weight'])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ column: 'height', sum: 350, avg: 175, min: 170, max: 180, count: 2 })
    expect(result[1]).toEqual({ column: 'weight', sum: 150, avg: 75, min: 70, max: 80, count: 2 })
  })

  it('skips non-numeric and empty values', () => {
    const records = [
      makeRecord({ score: '10' }),
      makeRecord({ score: 'abc' }),
      makeRecord({ score: '' }),
      makeRecord({ score: '20' }),
    ]
    const result = computeSummaryStats(records, ['score'])
    expect(result[0]).toEqual({ column: 'score', sum: 30, avg: 15, min: 10, max: 20, count: 2 })
  })

  it('returns zeros for column with no valid values', () => {
    const records = [
      makeRecord({ score: 'abc' }),
      makeRecord({ score: '' }),
    ]
    const result = computeSummaryStats(records, ['score'])
    expect(result[0]).toEqual({ column: 'score', sum: 0, avg: 0, min: 0, max: 0, count: 0 })
  })

  it('returns zeros for empty records', () => {
    const result = computeSummaryStats([], ['score'])
    expect(result[0]).toEqual({ column: 'score', sum: 0, avg: 0, min: 0, max: 0, count: 0 })
  })
})

describe('prepareBooleanDonutData', () => {
  it('counts true and false per boolean column', () => {
    const records = [
      makeRecord({ active: 'true' }),
      makeRecord({ active: 'false' }),
      makeRecord({ active: 'true' }),
    ]
    const result = prepareBooleanDonutData(records, ['active'])
    expect(result).toEqual([
      { column: 'active', trueCount: 2, falseCount: 1 },
    ])
  })

  it('handles multiple boolean columns', () => {
    const records = [
      makeRecord({ active: 'true', verified: 'false' }),
      makeRecord({ active: 'false', verified: 'true' }),
    ]
    const result = prepareBooleanDonutData(records, ['active', 'verified'])
    expect(result).toEqual([
      { column: 'active', trueCount: 1, falseCount: 1 },
      { column: 'verified', trueCount: 1, falseCount: 1 },
    ])
  })

  it('skips empty values', () => {
    const records = [
      makeRecord({ active: 'true' }),
      makeRecord({ active: '' }),
      makeRecord({ active: 'false' }),
    ]
    const result = prepareBooleanDonutData(records, ['active'])
    expect(result).toEqual([
      { column: 'active', trueCount: 1, falseCount: 1 },
    ])
  })

  it('treats case-insensitive "TRUE" as true', () => {
    const records = [
      makeRecord({ active: 'TRUE' }),
      makeRecord({ active: 'True' }),
      makeRecord({ active: 'false' }),
    ]
    const result = prepareBooleanDonutData(records, ['active'])
    expect(result[0].trueCount).toBe(2)
    expect(result[0].falseCount).toBe(1)
  })

  it('returns zero counts for empty records', () => {
    const result = prepareBooleanDonutData([], ['active'])
    expect(result).toEqual([
      { column: 'active', trueCount: 0, falseCount: 0 },
    ])
  })
})
