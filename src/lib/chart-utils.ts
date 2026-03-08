import type { SheetSchema } from './types'

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

export type Visualization =
  | LineVisualization
  | BarVisualization
  | SummaryVisualization
  | DonutVisualization

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

  const hasDate = dateColumns.length > 0
  const hasNumeric = numericColumns.length > 0
  const hasBoolean = booleanColumns.length > 0

  const visualizations: Visualization[] = []

  if (hasDate) {
    const dateColumn = dateColumns[0]

    if (hasNumeric) {
      visualizations.push({ type: 'line', dateColumn, valueColumns: numericColumns })
    }
    if (hasBoolean) {
      visualizations.push({ type: 'bar', dateColumn, booleanColumns })
    }
  } else {
    if (hasNumeric) {
      visualizations.push({ type: 'summary', valueColumns: numericColumns })
    }
    if (hasBoolean) {
      visualizations.push({ type: 'donut', booleanColumns })
    }
  }

  return visualizations
}

