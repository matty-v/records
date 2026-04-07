# Sheet Visualizations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auto-detected chart visualizations to sheets, toggled via a segmented control.

**Architecture:** A pure function `detectVisualizations()` analyzes schema column types and returns visualization descriptors. A `ChartView` component renders the appropriate Recharts charts. The home page adds a `[Table | Chart]` segmented toggle that swaps between `RecordTable` and `ChartView`. The toggle is only shown when the sheet has chartable columns.

**Tech Stack:** Recharts, React, TypeScript, Tailwind, Vitest

---

### Task 1: Install Recharts

**Files:**
- Modify: `package.json`

**Step 1: Install recharts**

Run: `npm install recharts`

**Step 2: Verify install**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency"
```

---

### Task 2: Visualization Detection Logic

**Files:**
- Create: `src/lib/chart-utils.ts`
- Create: `src/lib/__tests__/chart-utils.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/chart-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { detectVisualizations } from '../chart-utils'
import type { SheetSchema, RecordRow } from '../types'

function makeSchema(columns: Array<{ name: string; type: string }>): SheetSchema {
  return {
    sheetName: 'Test',
    columns: columns.map((c, i) => ({
      sheetName: 'Test',
      columnName: c.name,
      columnType: c.type as any,
      columnOrder: i + 1,
    })),
  }
}

describe('detectVisualizations', () => {
  it('returns line chart for date + numeric columns', () => {
    const schema = makeSchema([
      { name: 'date', type: 'date' },
      { name: 'weight', type: 'number' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      {
        type: 'line',
        dateColumn: 'date',
        valueColumns: ['weight'],
      },
    ])
  })

  it('returns line chart with multiple numeric columns', () => {
    const schema = makeSchema([
      { name: 'date', type: 'date' },
      { name: 'weight', type: 'number' },
      { name: 'reps', type: 'number' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      {
        type: 'line',
        dateColumn: 'date',
        valueColumns: ['weight', 'reps'],
      },
    ])
  })

  it('returns bar chart for date + boolean columns', () => {
    const schema = makeSchema([
      { name: 'date', type: 'date' },
      { name: 'completed', type: 'boolean' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      {
        type: 'bar',
        dateColumn: 'date',
        booleanColumns: ['completed'],
      },
    ])
  })

  it('returns both line and bar for date + numeric + boolean', () => {
    const schema = makeSchema([
      { name: 'date', type: 'date' },
      { name: 'weight', type: 'number' },
      { name: 'completed', type: 'boolean' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      type: 'line',
      dateColumn: 'date',
      valueColumns: ['weight'],
    })
    expect(result[1]).toEqual({
      type: 'bar',
      dateColumn: 'date',
      booleanColumns: ['completed'],
    })
  })

  it('returns summary for numeric only (no date)', () => {
    const schema = makeSchema([
      { name: 'weight', type: 'number' },
      { name: 'reps', type: 'number' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      {
        type: 'summary',
        valueColumns: ['weight', 'reps'],
      },
    ])
  })

  it('returns donut for boolean only (no date)', () => {
    const schema = makeSchema([
      { name: 'completed', type: 'boolean' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      {
        type: 'donut',
        booleanColumns: ['completed'],
      },
    ])
  })

  it('returns empty array for text-only schema', () => {
    const schema = makeSchema([
      { name: 'title', type: 'text' },
      { name: 'notes', type: 'text' },
    ])
    const result = detectVisualizations(schema)
    expect(result).toEqual([])
  })

  it('returns empty array for empty schema', () => {
    const schema = makeSchema([])
    const result = detectVisualizations(schema)
    expect(result).toEqual([])
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: FAIL — `detectVisualizations` not found

**Step 3: Write the implementation**

Create `src/lib/chart-utils.ts`:

```typescript
import type { SheetSchema } from './types'

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

export function detectVisualizations(schema: SheetSchema): Visualization[] {
  const dateColumns = schema.columns.filter((c) => c.columnType === 'date')
  const numericColumns = schema.columns.filter((c) => c.columnType === 'number')
  const booleanColumns = schema.columns.filter((c) => c.columnType === 'boolean')

  const hasDate = dateColumns.length > 0
  const hasNumeric = numericColumns.length > 0
  const hasBoolean = booleanColumns.length > 0

  const result: Visualization[] = []

  if (hasDate && hasNumeric) {
    result.push({
      type: 'line',
      dateColumn: dateColumns[0].columnName,
      valueColumns: numericColumns.map((c) => c.columnName),
    })
  }

  if (hasDate && hasBoolean) {
    result.push({
      type: 'bar',
      dateColumn: dateColumns[0].columnName,
      booleanColumns: booleanColumns.map((c) => c.columnName),
    })
  }

  if (!hasDate && hasNumeric) {
    result.push({
      type: 'summary',
      valueColumns: numericColumns.map((c) => c.columnName),
    })
  }

  if (!hasDate && hasBoolean) {
    result.push({
      type: 'donut',
      booleanColumns: booleanColumns.map((c) => c.columnName),
    })
  }

  return result
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: All 8 tests PASS

**Step 5: Commit**

```bash
git add src/lib/chart-utils.ts src/lib/__tests__/chart-utils.test.ts
git commit -m "feat: add detectVisualizations logic with tests"
```

---

### Task 3: Chart Data Aggregation Helpers

**Files:**
- Modify: `src/lib/chart-utils.ts`
- Modify: `src/lib/__tests__/chart-utils.test.ts`

**Step 1: Write the failing tests**

Append to `src/lib/__tests__/chart-utils.test.ts`:

```typescript
import { prepareLineData, prepareBooleanBarData, computeSummaryStats, prepareBooleanDonutData } from '../chart-utils'

describe('prepareLineData', () => {
  it('groups numeric values by date and sorts chronologically', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', date: '2026-03-02T10:00', weight: '180' },
      { id: '2', sourceId: 's', sheetName: 'T', date: '2026-03-01T09:00', weight: '175' },
      { id: '3', sourceId: 's', sheetName: 'T', date: '2026-03-03T08:00', weight: '178' },
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result).toEqual([
      { date: '2026-03-01', weight: 175 },
      { date: '2026-03-02', weight: 180 },
      { date: '2026-03-03', weight: 178 },
    ])
  })

  it('averages multiple values on the same date', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', date: '2026-03-01T09:00', weight: '170' },
      { id: '2', sourceId: 's', sheetName: 'T', date: '2026-03-01T18:00', weight: '180' },
    ]
    const result = prepareLineData(records, 'date', ['weight'])
    expect(result).toEqual([
      { date: '2026-03-01', weight: 175 },
    ])
  })
})

describe('prepareBooleanBarData', () => {
  it('counts true/false per date', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', date: '2026-03-01T10:00', done: 'true' },
      { id: '2', sourceId: 's', sheetName: 'T', date: '2026-03-01T11:00', done: 'false' },
      { id: '3', sourceId: 's', sheetName: 'T', date: '2026-03-02T09:00', done: 'true' },
    ]
    const result = prepareBooleanBarData(records, 'date', ['done'])
    expect(result).toEqual([
      { date: '2026-03-01', done_true: 1, done_false: 1 },
      { date: '2026-03-02', done_true: 1, done_false: 0 },
    ])
  })
})

describe('computeSummaryStats', () => {
  it('computes sum, avg, min, max for numeric columns', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', weight: '100', reps: '10' },
      { id: '2', sourceId: 's', sheetName: 'T', weight: '200', reps: '20' },
      { id: '3', sourceId: 's', sheetName: 'T', weight: '150', reps: '15' },
    ]
    const result = computeSummaryStats(records, ['weight', 'reps'])
    expect(result).toEqual([
      { column: 'weight', sum: 450, avg: 150, min: 100, max: 200, count: 3 },
      { column: 'reps', sum: 45, avg: 15, min: 10, max: 20, count: 3 },
    ])
  })

  it('skips non-numeric values', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', weight: '100' },
      { id: '2', sourceId: 's', sheetName: 'T', weight: '' },
      { id: '3', sourceId: 's', sheetName: 'T', weight: '200' },
    ]
    const result = computeSummaryStats(records, ['weight'])
    expect(result).toEqual([
      { column: 'weight', sum: 300, avg: 150, min: 100, max: 200, count: 2 },
    ])
  })
})

describe('prepareBooleanDonutData', () => {
  it('counts true vs false for each boolean column', () => {
    const records: RecordRow[] = [
      { id: '1', sourceId: 's', sheetName: 'T', done: 'true' },
      { id: '2', sourceId: 's', sheetName: 'T', done: 'true' },
      { id: '3', sourceId: 's', sheetName: 'T', done: 'false' },
    ]
    const result = prepareBooleanDonutData(records, ['done'])
    expect(result).toEqual([
      { column: 'done', trueCount: 2, falseCount: 1 },
    ])
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementations**

Append to `src/lib/chart-utils.ts`:

```typescript
import type { RecordRow } from './types'

function extractDate(value: string): string {
  // Extract YYYY-MM-DD from "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
  return value.slice(0, 10)
}

export function prepareLineData(
  records: RecordRow[],
  dateColumn: string,
  valueColumns: string[]
): Record<string, string | number>[] {
  // Group by date
  const groups = new Map<string, Map<string, number[]>>()

  for (const record of records) {
    const dateVal = record[dateColumn]
    if (!dateVal) continue
    const date = extractDate(dateVal)

    if (!groups.has(date)) {
      groups.set(date, new Map())
    }
    const group = groups.get(date)!

    for (const col of valueColumns) {
      const num = parseFloat(record[col])
      if (isNaN(num)) continue
      if (!group.has(col)) group.set(col, [])
      group.get(col)!.push(num)
    }
  }

  // Average values per date, sort chronologically
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, colMap]) => {
      const row: Record<string, string | number> = { date }
      for (const col of valueColumns) {
        const vals = colMap.get(col) || []
        row[col] = vals.length > 0
          ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100
          : 0
      }
      return row
    })
}

export function prepareBooleanBarData(
  records: RecordRow[],
  dateColumn: string,
  booleanColumns: string[]
): Record<string, string | number>[] {
  const groups = new Map<string, Record<string, number>>()

  for (const record of records) {
    const dateVal = record[dateColumn]
    if (!dateVal) continue
    const date = extractDate(dateVal)

    if (!groups.has(date)) {
      const row: Record<string, number> = {}
      for (const col of booleanColumns) {
        row[`${col}_true`] = 0
        row[`${col}_false`] = 0
      }
      groups.set(date, row)
    }
    const row = groups.get(date)!

    for (const col of booleanColumns) {
      const val = record[col]?.toLowerCase()
      if (val === 'true') row[`${col}_true`]++
      else if (val === 'false') row[`${col}_false`]++
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }))
}

export interface SummaryStats {
  column: string
  sum: number
  avg: number
  min: number
  max: number
  count: number
}

export function computeSummaryStats(
  records: RecordRow[],
  valueColumns: string[]
): SummaryStats[] {
  return valueColumns.map((col) => {
    const values: number[] = []
    for (const record of records) {
      const num = parseFloat(record[col])
      if (!isNaN(num)) values.push(num)
    }
    if (values.length === 0) {
      return { column: col, sum: 0, avg: 0, min: 0, max: 0, count: 0 }
    }
    const sum = Math.round(values.reduce((s, v) => s + v, 0) * 100) / 100
    return {
      column: col,
      sum,
      avg: Math.round((sum / values.length) * 100) / 100,
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

export function prepareBooleanDonutData(
  records: RecordRow[],
  booleanColumns: string[]
): BooleanDonutData[] {
  return booleanColumns.map((col) => {
    let trueCount = 0
    let falseCount = 0
    for (const record of records) {
      const val = record[col]?.toLowerCase()
      if (val === 'true') trueCount++
      else if (val === 'false') falseCount++
    }
    return { column: col, trueCount, falseCount }
  })
}
```

Note: Add `RecordRow` to the existing import at the top of `chart-utils.ts`:
```typescript
import type { SheetSchema, RecordRow } from './types'
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/chart-utils.ts src/lib/__tests__/chart-utils.test.ts
git commit -m "feat: add chart data aggregation helpers with tests"
```

---

### Task 4: View Mode Toggle Component

**Files:**
- Create: `src/components/view-mode-toggle.tsx`

**Step 1: Create the component**

Create `src/components/view-mode-toggle.tsx`:

```tsx
import { cn } from '@/lib/utils'

export type ViewMode = 'table' | 'chart'

interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-lg border border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] p-0.5">
      <button
        onClick={() => onChange('table')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
          mode === 'table'
            ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)]'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Table
      </button>
      <button
        onClick={() => onChange('chart')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
          mode === 'chart'
            ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)]'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Chart
      </button>
    </div>
  )
}
```

**Step 2: Run lint to verify**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/view-mode-toggle.tsx
git commit -m "feat: add ViewModeToggle segmented control component"
```

---

### Task 5: ChartView Component

**Files:**
- Create: `src/components/chart-view.tsx`

**Step 1: Create the component**

Create `src/components/chart-view.tsx`:

```tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Visualization } from '@/lib/chart-utils'
import {
  prepareLineData,
  prepareBooleanBarData,
  computeSummaryStats,
  prepareBooleanDonutData,
} from '@/lib/chart-utils'
import type { RecordRow } from '@/lib/types'

const CHART_COLORS = ['#00d4ff', '#a78bfa', '#ec4899', '#34d399', '#fbbf24']

interface ChartViewProps {
  visualizations: Visualization[]
  records: RecordRow[]
}

function LineChartViz({ viz, records }: { viz: Extract<Visualization, { type: 'line' }>; records: RecordRow[] }) {
  const data = prepareLineData(records, viz.dateColumn, viz.valueColumns)
  if (data.length === 0) return <EmptyChart />

  return (
    <div className="tech-card rounded-xl p-4">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis dataKey="date" stroke="rgba(100,150,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis stroke="rgba(100,150,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(18,24,33,0.95)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          {viz.valueColumns.length > 1 && <Legend />}
          {viz.valueColumns.map((col, i) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function BooleanBarViz({ viz, records }: { viz: Extract<Visualization, { type: 'bar' }>; records: RecordRow[] }) {
  const data = prepareBooleanBarData(records, viz.dateColumn, viz.booleanColumns)
  if (data.length === 0) return <EmptyChart />

  return (
    <div className="tech-card rounded-xl p-4">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis dataKey="date" stroke="rgba(100,150,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis stroke="rgba(100,150,255,0.5)" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(18,24,33,0.95)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend />
          {viz.booleanColumns.map((col, i) => (
            <Fragment key={col}>
              <Bar
                dataKey={`${col}_true`}
                name={`${col} (yes)`}
                stackId={col}
                fill={CHART_COLORS[i * 2 % CHART_COLORS.length]}
              />
              <Bar
                dataKey={`${col}_false`}
                name={`${col} (no)`}
                stackId={col}
                fill={CHART_COLORS[(i * 2 + 1) % CHART_COLORS.length]}
                opacity={0.4}
              />
            </Fragment>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SummaryViz({ viz, records }: { viz: Extract<Visualization, { type: 'summary' }>; records: RecordRow[] }) {
  const stats = computeSummaryStats(records, viz.valueColumns)

  return (
    <div className="space-y-3">
      {stats.map((stat) => (
        <div key={stat.column} className="tech-card rounded-xl p-4">
          <h3 className="text-sm font-medium glow-cyan mb-3">{stat.column}</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Sum" value={stat.sum} />
            <StatItem label="Avg" value={stat.avg} />
            <StatItem label="Min" value={stat.min} />
            <StatItem label="Max" value={stat.max} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{stat.count} records</p>
        </div>
      ))}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-medium text-foreground">{value}</p>
    </div>
  )
}

function DonutViz({ viz, records }: { viz: Extract<Visualization, { type: 'donut' }>; records: RecordRow[] }) {
  const data = prepareBooleanDonutData(records, viz.booleanColumns)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pieData = [
          { name: 'Yes', value: item.trueCount },
          { name: 'No', value: item.falseCount },
        ]
        return (
          <div key={item.column} className="tech-card rounded-xl p-4">
            <h3 className="text-sm font-medium glow-cyan mb-2 text-center">{item.column}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#00d4ff" />
                  <Cell fill="rgba(100,150,255,0.2)" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(18,24,33,0.95)',
                    border: '1px solid rgba(0,212,255,0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="tech-card rounded-xl p-8 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Not enough data to chart</p>
    </div>
  )
}

export function ChartView({ visualizations, records }: ChartViewProps) {
  if (visualizations.length === 0) return null

  return (
    <div className="space-y-4">
      {visualizations.map((viz, i) => {
        switch (viz.type) {
          case 'line':
            return <LineChartViz key={i} viz={viz} records={records} />
          case 'bar':
            return <BooleanBarViz key={i} viz={viz} records={records} />
          case 'summary':
            return <SummaryViz key={i} viz={viz} records={records} />
          case 'donut':
            return <DonutViz key={i} viz={viz} records={records} />
        }
      })}
    </div>
  )
}
```

Note: Add `import { Fragment } from 'react'` at the top of the file.

**Step 2: Run lint and build to verify**

Run: `npm run lint && npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/chart-view.tsx
git commit -m "feat: add ChartView component with line, bar, summary, donut charts"
```

---

### Task 6: Integrate Toggle and ChartView into HomePage

**Files:**
- Modify: `src/pages/home.tsx:1-10` (imports)
- Modify: `src/pages/home.tsx:82-89` (state)
- Modify: `src/pages/home.tsx:298-326` (sheet tabs area + records area)

**Step 1: Add imports to `home.tsx`**

Add these imports at the top of `src/pages/home.tsx`:

```typescript
import { ViewModeToggle, type ViewMode } from '@/components/view-mode-toggle'
import { ChartView } from '@/components/chart-view'
import { detectVisualizations } from '@/lib/chart-utils'
```

**Step 2: Add view mode state and visualization detection**

After the existing `const [sheetToDelete, setSheetToDelete]` line (~line 89), add:

```typescript
const [viewMode, setViewMode] = useState<ViewMode>('table')
```

After the existing `useRecords` call (~line 52), add:

```typescript
const visualizations = currentSchema ? detectVisualizations(currentSchema) : []
const hasCharts = visualizations.length > 0
```

**Step 3: Reset view mode when sheet changes**

In the sheet tabs section, update `onSheetChange` to reset the view mode. Change:

```tsx
<SheetTabs
  sheetNames={sheetNames}
  activeSheet={activeSheet}
  onSheetChange={setActiveSheet}
/>
```

To:

```tsx
<SheetTabs
  sheetNames={sheetNames}
  activeSheet={activeSheet}
  onSheetChange={(name) => { setActiveSheet(name); setViewMode('table') }}
/>
```

**Step 4: Add toggle between sheet tabs and records**

After the sheet tabs `</div>` (after line 308), add:

```tsx
{/* View Mode Toggle */}
{currentSchema && hasCharts && (
  <div className="mb-4">
    <ViewModeToggle mode={viewMode} onChange={setViewMode} />
  </div>
)}
```

**Step 5: Conditionally render table or chart**

Replace the records section (lines 311-326):

```tsx
{/* Records */}
{currentSchema ? (
  viewMode === 'chart' && hasCharts ? (
    <ChartView visualizations={visualizations} records={records} />
  ) : (
    <RecordTable
      records={records}
      schema={currentSchema}
      isLoading={isLoading}
      onRecordClick={setSelectedRecord}
    />
  )
) : (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <p className="text-sm font-light">No sheets configured</p>
    <p className="text-xs mt-1">Create a sheet to get started</p>
    <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddSheet(true)}>
      <Plus className="h-4 w-4 mr-1" /> Create Sheet
    </Button>
  </div>
)}
```

**Step 6: Hide FAB in chart mode**

Change the FAB conditional from:

```tsx
{currentSchema && (
```

To:

```tsx
{currentSchema && viewMode === 'table' && (
```

**Step 7: Run lint, tests, and build**

Run: `npm run lint && npm test && npm run build`
Expected: All pass

**Step 8: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: integrate chart toggle and ChartView into home page"
```

---

### Task 7: Manual Testing and Polish

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test each visualization type**

- Open a sheet with date + number columns → verify line chart renders
- Open a sheet with date + boolean columns → verify bar chart renders
- Open a sheet with number columns only → verify summary stats render
- Open a sheet with boolean columns only → verify donut chart renders
- Open a sheet with text columns only → verify toggle is hidden
- Switch sheets → verify view mode resets to "table"
- Verify FAB is hidden in chart mode

**Step 3: Fix any styling issues found during testing**

Adjust chart colors, spacing, or responsive behavior as needed.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: polish chart styling after manual testing"
```
