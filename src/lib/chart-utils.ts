import type { SheetSchema, RecordRow } from './types'

/* ------------------------------------------------------------------ */
/*  Visualization type definitions                                     */
/* ------------------------------------------------------------------ */

export interface LineVisualization {
  type: 'line'
  dateColumn: string
  valueColumns: string[]
}

export interface BarVisualization {
  type: 'bar'
  dateColumn: string
  booleanColumns: string[]
}

export interface SummaryVisualization {
  type: 'summary'
  valueColumns: string[]
}

export interface DonutVisualization {
  type: 'donut'
  booleanColumns: string[]
}

export interface SelectDonutVisualization {
  type: 'selectDonut'
  selectColumns: string[]
}

export interface SelectBarVisualization {
  type: 'selectBar'
  dateColumn: string
  selectColumn: string
}

export type Visualization =
  | LineVisualization
  | BarVisualization
  | SummaryVisualization
  | DonutVisualization
  | SelectDonutVisualization
  | SelectBarVisualization

/* ------------------------------------------------------------------ */
/*  Task 2 – detectVisualizations                                      */
/* ------------------------------------------------------------------ */

export function detectVisualizations(schema: SheetSchema): Visualization[] {
  const dateColumns = schema.columns
    .filter((c) => c.columnType === 'date')
    .map((c) => c.columnName)

  const numericColumns = schema.columns
    .filter((c) => c.columnType === 'number')
    .map((c) => c.columnName)

  const booleanColumns = schema.columns
    .filter((c) => c.columnType === 'boolean')
    .map((c) => c.columnName)

  const selectColumns = schema.columns
    .filter((c) => c.columnType === 'select')
    .map((c) => c.columnName)

  const hasDate = dateColumns.length > 0
  const hasNumeric = numericColumns.length > 0
  const hasBoolean = booleanColumns.length > 0
  const hasSelect = selectColumns.length > 0

  const visualizations: Visualization[] = []

  if (hasDate) {
    const dateColumn = dateColumns[0]

    if (hasNumeric) {
      visualizations.push({ type: 'line', dateColumn, valueColumns: numericColumns })
    }
    if (hasBoolean) {
      visualizations.push({ type: 'bar', dateColumn, booleanColumns })
    }
    if (hasSelect) {
      for (const col of selectColumns) {
        visualizations.push({ type: 'selectBar', dateColumn, selectColumn: col })
      }
    }
  } else {
    if (hasNumeric) {
      visualizations.push({ type: 'summary', valueColumns: numericColumns })
    }
    if (hasBoolean) {
      visualizations.push({ type: 'donut', booleanColumns })
    }
    if (hasSelect) {
      visualizations.push({ type: 'selectDonut', selectColumns })
    }
  }

  return visualizations
}

/* ------------------------------------------------------------------ */
/*  Task 3 – Chart data aggregation helpers                            */
/* ------------------------------------------------------------------ */

/** Extract YYYY-MM-DD HH:mm from a datetime string, or YYYY-MM-DD if no time component. */
function extractDateTime(dateStr: string): string {
  const tIndex = dateStr.indexOf('T')
  if (tIndex !== -1) {
    const date = dateStr.slice(0, 10)
    const time = dateStr.slice(11, 16) // HH:mm
    return `${date} ${time}`
  }
  return dateStr.slice(0, 10)
}

/** Parse a string to a number, returning null if not valid. */
function parseNumeric(value: string): number | null {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Groups numeric values by date (YYYY-MM-DD), sorts chronologically,
 * and averages multiple values on the same date.
 */
export function prepareLineData(
  records: RecordRow[],
  dateColumn: string,
  valueColumns: string[],
): Record<string, string | number>[] {
  const grouped = new Map<string, Map<string, number[]>>()

  for (const record of records) {
    const rawDate = record[dateColumn]
    if (!rawDate) continue
    const date = extractDateTime(rawDate)

    if (!grouped.has(date)) {
      grouped.set(date, new Map())
    }
    const dateGroup = grouped.get(date)!

    for (const col of valueColumns) {
      const num = parseNumeric(record[col])
      if (num === null) continue
      if (!dateGroup.has(col)) {
        dateGroup.set(col, [])
      }
      dateGroup.get(col)!.push(num)
    }
  }

  const sortedDates = [...grouped.keys()].sort()

  return sortedDates.map((date) => {
    const row: Record<string, string | number> = { date }
    const dateGroup = grouped.get(date)!

    for (const col of valueColumns) {
      const values = dateGroup.get(col)
      if (values && values.length > 0) {
        row[col] = values.reduce((a, b) => a + b, 0) / values.length
      }
    }

    return row
  })
}

/**
 * Counts true/false per date per boolean column.
 * Returns objects shaped as { date, colName_true: N, colName_false: N }.
 */
export function prepareBooleanBarData(
  records: RecordRow[],
  dateColumn: string,
  booleanColumns: string[],
): Record<string, string | number>[] {
  const grouped = new Map<string, Map<string, { trueCount: number; falseCount: number }>>()

  for (const record of records) {
    const rawDate = record[dateColumn]
    if (!rawDate) continue
    const date = extractDateTime(rawDate)

    if (!grouped.has(date)) {
      grouped.set(date, new Map())
    }
    const dateGroup = grouped.get(date)!

    for (const col of booleanColumns) {
      const val = record[col]
      if (val === undefined || val === '') continue

      if (!dateGroup.has(col)) {
        dateGroup.set(col, { trueCount: 0, falseCount: 0 })
      }
      const counts = dateGroup.get(col)!

      const isTrue = val.toLowerCase() === 'true'
      if (isTrue) {
        counts.trueCount++
      } else {
        counts.falseCount++
      }
    }
  }

  const sortedDates = [...grouped.keys()].sort()

  return sortedDates.map((date) => {
    const row: Record<string, string | number> = { date }
    const dateGroup = grouped.get(date)!

    for (const col of booleanColumns) {
      const counts = dateGroup.get(col)
      row[`${col}_true`] = counts ? counts.trueCount : 0
      row[`${col}_false`] = counts ? counts.falseCount : 0
    }

    return row
  })
}

export interface SummaryStats {
  column: string
  sum: number
  avg: number
  min: number
  max: number
  count: number
}

/**
 * Computes summary statistics per numeric column.
 * Skips non-numeric and empty values.
 */
export function computeSummaryStats(
  records: RecordRow[],
  valueColumns: string[],
): SummaryStats[] {
  return valueColumns.map((column) => {
    const values: number[] = []

    for (const record of records) {
      const num = parseNumeric(record[column])
      if (num !== null) {
        values.push(num)
      }
    }

    if (values.length === 0) {
      return { column, sum: 0, avg: 0, min: 0, max: 0, count: 0 }
    }

    const sum = values.reduce((a, b) => a + b, 0)
    return {
      column,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  })
}

export interface BooleanDonutData {
  column: string
  trueCount: number
  falseCount: number
}

/**
 * Counts true/false per boolean column across all records.
 */
export function prepareBooleanDonutData(
  records: RecordRow[],
  booleanColumns: string[],
): BooleanDonutData[] {
  return booleanColumns.map((column) => {
    let trueCount = 0
    let falseCount = 0

    for (const record of records) {
      const val = record[column]
      if (val === undefined || val === '') continue

      if (val.toLowerCase() === 'true') {
        trueCount++
      } else {
        falseCount++
      }
    }

    return { column, trueCount, falseCount }
  })
}

export interface SelectDonutData {
  column: string
  slices: { value: string; count: number }[]
}

/**
 * Counts occurrences of each unique value per select column.
 */
export function prepareSelectDonutData(
  records: RecordRow[],
  selectColumns: string[],
): SelectDonutData[] {
  return selectColumns.map((column) => {
    const counts = new Map<string, number>()

    for (const record of records) {
      const val = record[column]
      if (val === undefined || val === '') continue
      counts.set(val, (counts.get(val) || 0) + 1)
    }

    const slices = Array.from(counts.entries()).map(([value, count]) => ({ value, count }))
    return { column, slices }
  })
}

/**
 * Counts occurrences of each select value per date bucket.
 * Returns objects shaped as { date, value1: N, value2: N, ... }.
 */
export function prepareSelectBarData(
  records: RecordRow[],
  dateColumn: string,
  selectColumn: string,
): Record<string, string | number>[] {
  const grouped = new Map<string, Map<string, number>>()

  for (const record of records) {
    const rawDate = record[dateColumn]
    if (!rawDate) continue
    const date = extractDateTime(rawDate)

    const val = record[selectColumn]
    if (val === undefined || val === '') continue

    if (!grouped.has(date)) {
      grouped.set(date, new Map())
    }
    const dateGroup = grouped.get(date)!
    dateGroup.set(val, (dateGroup.get(val) || 0) + 1)
  }

  const sortedDates = [...grouped.keys()].sort()

  return sortedDates.map((date) => {
    const row: Record<string, string | number> = { date }
    const dateGroup = grouped.get(date)!
    for (const [val, count] of dateGroup) {
      row[val] = count
    }
    return row
  })
}
