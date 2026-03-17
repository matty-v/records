# Select Column Type Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `select` column type with single-select dropdown, configurable options, on-the-fly option creation, and donut/bar chart visualizations.

**Architecture:** Extend the existing column type system (`ColumnType` union, `ColumnDefinition` interface, `_config` sheet schema) with a `'select'` variant and an `options` field. Create a shared `SelectWithAdd` component for the dropdown+add-new UX, used by both form modals. Chart logic gets parallel `selectDonut`/`selectBar` visualization types mirroring the boolean ones.

**Tech Stack:** React 18, TypeScript, Radix UI Select, Recharts, Vitest

---

## Chunk 1: Core Types, Schema, and Normalization

### Task 1: Types and Constants

**Files:**
- Modify: `src/lib/types.ts:1-9`
- Modify: `src/config/constants.ts:12`

- [ ] **Step 1: Update ColumnType union**

In `src/lib/types.ts`, change line 1:

```typescript
export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'select'
```

- [ ] **Step 2: Add options field to ColumnDefinition**

In `src/lib/types.ts`, add `options` to the interface (after `autoPopulate`):

```typescript
export interface ColumnDefinition {
  sheetName: string
  columnName: string
  columnType: ColumnType
  columnOrder: number
  autoPopulate?: 'currentDate'
  options?: string
}
```

- [ ] **Step 3: Add select to COLUMN_TYPES**

In `src/config/constants.ts`, change line 12:

```typescript
export const COLUMN_TYPES = ['text', 'number', 'date', 'boolean', 'select'] as const
```

- [ ] **Step 4: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors (existing code uses `ColumnType` but `'select'` is additive)

- [ ] **Step 5: Commit**

```bash
cd /home/mvoget/dev/records
git add src/lib/types.ts src/config/constants.ts
git commit -m "feat: add select to ColumnType union and COLUMN_TYPES"
```

---

### Task 2: Schema Utils — Parse and Serialize Options

**Files:**
- Modify: `src/lib/schema-utils.ts:3-13,29-37`
- Test: `src/lib/__tests__/schema-utils.test.ts`

- [ ] **Step 1: Write failing tests for options parsing**

Add to `src/lib/__tests__/schema-utils.test.ts` inside the `parseConfigRows` describe block:

```typescript
  it('includes options when present', () => {
    const rows = [
      { sheetName: 'Tasks', columnName: 'status', columnType: 'select', columnOrder: '1', options: 'Open,In Progress,Done' },
    ]
    const result = parseConfigRows(rows)
    expect(result[0].options).toBe('Open,In Progress,Done')
  })

  it('omits options when not present', () => {
    const rows = [
      { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: '1' },
    ]
    expect(parseConfigRows(rows)[0].options).toBeUndefined()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/schema-utils.test.ts`
Expected: The "includes options when present" test FAILS (options not parsed)

- [ ] **Step 3: Implement options parsing in parseConfigRows**

In `src/lib/schema-utils.ts`, update the `parseConfigRows` function. Replace the `.map` callback (lines 6-12) with:

```typescript
    .map((row) => ({
      sheetName: row.sheetName,
      columnName: row.columnName,
      columnType: (row.columnType || 'text') as ColumnType,
      columnOrder: parseInt(row.columnOrder || '0', 10),
      ...(row.autoPopulate === 'currentDate' ? { autoPopulate: 'currentDate' as const } : {}),
      ...(row.options ? { options: row.options } : {}),
    }))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/schema-utils.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Write failing tests for options serialization**

Add to `src/lib/__tests__/schema-utils.test.ts` inside the `serializeConfigRow` describe block:

```typescript
  it('includes options when present', () => {
    const col: ColumnDefinition = {
      sheetName: 'Tasks',
      columnName: 'status',
      columnType: 'select',
      columnOrder: 1,
      options: 'Open,In Progress,Done',
    }
    expect(serializeConfigRow(col).options).toBe('Open,In Progress,Done')
  })

  it('omits options when not present', () => {
    const col: ColumnDefinition = {
      sheetName: 'Tasks',
      columnName: 'title',
      columnType: 'text',
      columnOrder: 1,
    }
    expect(serializeConfigRow(col).options).toBeUndefined()
  })
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/schema-utils.test.ts`
Expected: "includes options when present" FAILS

- [ ] **Step 7: Implement options serialization in serializeConfigRow**

In `src/lib/schema-utils.ts`, update `serializeConfigRow` (lines 29-37) to:

```typescript
export function serializeConfigRow(col: ColumnDefinition): Record<string, string> {
  return {
    sheetName: col.sheetName,
    columnName: col.columnName,
    columnType: col.columnType,
    columnOrder: String(col.columnOrder),
    ...(col.autoPopulate ? { autoPopulate: col.autoPopulate } : {}),
    ...(col.options ? { options: col.options } : {}),
  }
}
```

- [ ] **Step 8: Run tests to verify all pass**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/schema-utils.test.ts`
Expected: ALL PASS (13 tests)

- [ ] **Step 9: Commit**

```bash
cd /home/mvoget/dev/records
git add src/lib/schema-utils.ts src/lib/__tests__/schema-utils.test.ts
git commit -m "feat: parse and serialize options field in schema utils"
```

---

### Task 3: Normalization — Select Passthrough

**Files:**
- Modify: `src/lib/cache.ts:9-31` (no change needed — falls through to `return value`)
- Test: `src/lib/__tests__/normalize-value.test.ts`

- [ ] **Step 1: Write test for select normalization**

Add to `src/lib/__tests__/normalize-value.test.ts` inside the `other types` describe block:

```typescript
    it('returns select values unchanged', () => {
      expect(normalizeValue('Open', 'select')).toBe('Open')
    })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/normalize-value.test.ts`
Expected: PASS (the existing code already falls through to `return value` for unknown types)

- [ ] **Step 3: Commit**

```bash
cd /home/mvoget/dev/records
git add src/lib/__tests__/normalize-value.test.ts
git commit -m "test: add select passthrough test for normalizeValue"
```

---

## Chunk 2: Chart Logic

### Task 4: Chart Utils — New Visualization Types and Data Prep

**Files:**
- Modify: `src/lib/chart-utils.ts`
- Test: `src/lib/__tests__/chart-utils.test.ts`

- [ ] **Step 1: Write failing tests for detectVisualizations with select columns**

Add to `src/lib/__tests__/chart-utils.test.ts` inside the `detectVisualizations` describe block:

```typescript
  it('returns selectDonut for select-only columns (no date)', () => {
    const schema: SheetSchema = {
      sheetName: 'Tasks',
      columns: [
        { sheetName: 'Tasks', columnName: 'title', columnType: 'text', columnOrder: 1 },
        { sheetName: 'Tasks', columnName: 'status', columnType: 'select', columnOrder: 2 },
        { sheetName: 'Tasks', columnName: 'priority', columnType: 'select', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toEqual([
      { type: 'selectDonut', selectColumns: ['status', 'priority'] },
    ])
  })

  it('returns selectBar for select + date columns', () => {
    const schema: SheetSchema = {
      sheetName: 'Tasks',
      columns: [
        { sheetName: 'Tasks', columnName: 'created', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Tasks', columnName: 'status', columnType: 'select', columnOrder: 2 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toContainEqual({ type: 'selectBar', dateColumn: 'created', selectColumn: 'status' })
  })

  it('returns selectBar per select column when multiple exist with date', () => {
    const schema: SheetSchema = {
      sheetName: 'Tasks',
      columns: [
        { sheetName: 'Tasks', columnName: 'created', columnType: 'date', columnOrder: 1 },
        { sheetName: 'Tasks', columnName: 'status', columnType: 'select', columnOrder: 2 },
        { sheetName: 'Tasks', columnName: 'priority', columnType: 'select', columnOrder: 3 },
      ],
    }
    const result = detectVisualizations(schema)
    expect(result).toContainEqual({ type: 'selectBar', dateColumn: 'created', selectColumn: 'status' })
    expect(result).toContainEqual({ type: 'selectBar', dateColumn: 'created', selectColumn: 'priority' })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: FAIL — `selectDonut` and `selectBar` types don't exist

- [ ] **Step 3: Add visualization type definitions**

In `src/lib/chart-utils.ts`, after the `DonutVisualization` interface (line 27), add:

```typescript
export interface SelectDonutVisualization {
  type: 'selectDonut'
  selectColumns: string[]
}

export interface SelectBarVisualization {
  type: 'selectBar'
  dateColumn: string
  selectColumn: string
}
```

Update the `Visualization` union (lines 29-33) to:

```typescript
export type Visualization =
  | LineVisualization
  | BarVisualization
  | SummaryVisualization
  | DonutVisualization
  | SelectDonutVisualization
  | SelectBarVisualization
```

- [ ] **Step 4: Add select detection to detectVisualizations**

In `src/lib/chart-utils.ts`, inside `detectVisualizations`, after the `booleanColumns` filter (around line 50), add:

```typescript
  const selectColumns = schema.columns
    .filter((c) => c.columnType === 'select')
    .map((c) => c.columnName)

  const hasSelect = selectColumns.length > 0
```

Inside the `if (hasDate)` block, after the boolean push (around line 65), add:

```typescript
    if (hasSelect) {
      for (const col of selectColumns) {
        visualizations.push({ type: 'selectBar', dateColumn, selectColumn: col })
      }
    }
```

Inside the `else` block, after the boolean donut push (around line 73), add:

```typescript
    if (hasSelect) {
      visualizations.push({ type: 'selectDonut', selectColumns })
    }
```

- [ ] **Step 5: Run tests to verify detection tests pass**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Write failing tests for prepareSelectDonutData**

Add to `src/lib/__tests__/chart-utils.test.ts`, importing the new function at the top:

```typescript
// Update import to include:
import {
  detectVisualizations,
  prepareLineData,
  prepareBooleanBarData,
  computeSummaryStats,
  prepareBooleanDonutData,
  prepareSelectDonutData,
  prepareSelectBarData,
  type Visualization,
} from '../chart-utils'
```

Add new describe block:

```typescript
describe('prepareSelectDonutData', () => {
  it('counts occurrences of each unique value per select column', () => {
    const records = [
      makeRecord({ status: 'Open' }),
      makeRecord({ status: 'Done' }),
      makeRecord({ status: 'Open' }),
      makeRecord({ status: 'Done' }),
      makeRecord({ status: 'Done' }),
    ]
    const result = prepareSelectDonutData(records, ['status'])
    expect(result).toEqual([
      {
        column: 'status',
        slices: [
          { value: 'Open', count: 2 },
          { value: 'Done', count: 3 },
        ],
      },
    ])
  })

  it('handles multiple select columns', () => {
    const records = [
      makeRecord({ status: 'Open', priority: 'High' }),
      makeRecord({ status: 'Done', priority: 'Low' }),
    ]
    const result = prepareSelectDonutData(records, ['status', 'priority'])
    expect(result).toHaveLength(2)
    expect(result[0].column).toBe('status')
    expect(result[1].column).toBe('priority')
  })

  it('skips empty values', () => {
    const records = [
      makeRecord({ status: 'Open' }),
      makeRecord({ status: '' }),
      makeRecord({ status: 'Done' }),
    ]
    const result = prepareSelectDonutData(records, ['status'])
    const totalCount = result[0].slices.reduce((sum, s) => sum + s.count, 0)
    expect(totalCount).toBe(2)
  })

  it('returns empty slices for empty records', () => {
    const result = prepareSelectDonutData([], ['status'])
    expect(result).toEqual([{ column: 'status', slices: [] }])
  })
})
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: FAIL — `prepareSelectDonutData` not defined

- [ ] **Step 8: Implement prepareSelectDonutData**

Add to `src/lib/chart-utils.ts` after `prepareBooleanDonutData`:

```typescript
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
```

- [ ] **Step 9: Run tests to verify donut tests pass**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: ALL PASS

- [ ] **Step 10: Write failing tests for prepareSelectBarData**

Add to `src/lib/__tests__/chart-utils.test.ts`:

```typescript
describe('prepareSelectBarData', () => {
  it('counts occurrences of each value per date', () => {
    const records = [
      makeRecord({ date: '2024-01-01T10:00:00', status: 'Open' }),
      makeRecord({ date: '2024-01-01T10:00:00', status: 'Open' }),
      makeRecord({ date: '2024-01-01T10:00:00', status: 'Done' }),
      makeRecord({ date: '2024-01-02T10:00:00', status: 'Done' }),
    ]
    const result = prepareSelectBarData(records, 'date', 'status')
    expect(result).toEqual([
      { date: '2024-01-01 10:00', Open: 2, Done: 1 },
      { date: '2024-01-02 10:00', Done: 1 },
    ])
  })

  it('sorts by date chronologically', () => {
    const records = [
      makeRecord({ date: '2024-03-15T12:00:00', status: 'Open' }),
      makeRecord({ date: '2024-01-01T08:00:00', status: 'Done' }),
    ]
    const result = prepareSelectBarData(records, 'date', 'status')
    expect(result[0].date).toBe('2024-01-01 08:00')
    expect(result[1].date).toBe('2024-03-15 12:00')
  })

  it('skips records with missing date', () => {
    const records = [
      makeRecord({ date: '', status: 'Open' }),
      makeRecord({ status: 'Done' }),
      makeRecord({ date: '2024-01-01', status: 'Open' }),
    ]
    const result = prepareSelectBarData(records, 'date', 'status')
    expect(result).toHaveLength(1)
  })

  it('skips empty select values', () => {
    const records = [
      makeRecord({ date: '2024-01-01T10:00:00', status: '' }),
      makeRecord({ date: '2024-01-01T10:00:00', status: 'Open' }),
    ]
    const result = prepareSelectBarData(records, 'date', 'status')
    expect(result).toEqual([{ date: '2024-01-01 10:00', Open: 1 }])
  })

  it('returns empty array for empty records', () => {
    expect(prepareSelectBarData([], 'date', 'status')).toEqual([])
  })
})
```

- [ ] **Step 11: Run tests to verify they fail**

Run: `cd /home/mvoget/dev/records && npx vitest run src/lib/__tests__/chart-utils.test.ts`
Expected: FAIL — `prepareSelectBarData` not defined

- [ ] **Step 12: Implement prepareSelectBarData**

Add to `src/lib/chart-utils.ts` after `prepareSelectDonutData`:

```typescript
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
```

- [ ] **Step 13: Run all tests to verify everything passes**

Run: `cd /home/mvoget/dev/records && npx vitest run`
Expected: ALL PASS

- [ ] **Step 14: Commit**

```bash
cd /home/mvoget/dev/records
git add src/lib/chart-utils.ts src/lib/__tests__/chart-utils.test.ts
git commit -m "feat: add selectDonut and selectBar visualization types and data prep"
```

---

### Task 5: Chart View — Rendering Select Charts

**Files:**
- Modify: `src/components/chart-view.tsx`

- [ ] **Step 1: Update imports**

In `src/components/chart-view.tsx`, update the imports from `chart-utils`:

```typescript
import type { Visualization } from '@/lib/chart-utils'
import {
  prepareLineData,
  prepareBooleanBarData,
  computeSummaryStats,
  prepareBooleanDonutData,
  prepareSelectDonutData,
  prepareSelectBarData,
} from '@/lib/chart-utils'
```

- [ ] **Step 2: Add switch cases in ChartView**

In `src/components/chart-view.tsx`, inside the `switch (viz.type)` block (around line 66), add before the `default` case:

```typescript
          case 'selectDonut':
            return <SelectDonutChartCard key={i} viz={viz} records={records} />
          case 'selectBar':
            return <SelectBarChartCard key={i} viz={viz} records={records} />
```

- [ ] **Step 3: Implement SelectDonutChartCard**

Add to `src/components/chart-view.tsx` after the existing `DonutChartCard` function:

```typescript
/* ------------------------------------------------------------------ */
/*  Select donut chart                                                 */
/* ------------------------------------------------------------------ */

function SelectDonutChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'selectDonut' }>
  records: RecordRow[]
}) {
  const donutData = prepareSelectDonutData(records, viz.selectColumns)

  if (donutData.every((d) => d.slices.length === 0)) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {donutData.map((d) => {
          const pieData = d.slices.map((s) => ({ name: s.value, value: s.count }))

          return (
            <div key={d.column} className="text-center">
              <h3 className="glow-cyan text-sm font-semibold mb-1">
                {d.column}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement SelectBarChartCard**

Add to `src/components/chart-view.tsx` after `SelectDonutChartCard`:

```typescript
/* ------------------------------------------------------------------ */
/*  Select bar chart                                                   */
/* ------------------------------------------------------------------ */

function SelectBarChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'selectBar' }>
  records: RecordRow[]
}) {
  const data = prepareSelectBarData(records, viz.dateColumn, viz.selectColumn)

  if (data.length === 0) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  // Collect all unique values to create bars
  const uniqueValues = new Set<string>()
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (key !== 'date') uniqueValues.add(key)
    }
  }
  const values = [...uniqueValues]

  return (
    <div className="tech-card rounded-xl p-4">
      <h3 className="glow-cyan text-sm font-semibold mb-2">{viz.selectColumn}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDateTick}
          />
          <YAxis
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          {values.map((val, idx) => (
            <Bar
              key={val}
              dataKey={val}
              stackId="select"
              fill={COLORS[idx % COLORS.length]}
              name={val}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/chart-view.tsx
git commit -m "feat: add SelectDonutChartCard and SelectBarChartCard to chart view"
```

---

## Chunk 3: Column Management UI

### Task 6: Manage Columns Dialog — Options Input

**Files:**
- Modify: `src/components/manage-columns-dialog.tsx`

- [ ] **Step 1: Add options to ColumnEdit interface**

In `src/components/manage-columns-dialog.tsx`, update the `ColumnEdit` interface (line 23-27):

```typescript
interface ColumnEdit {
  name: string
  type: ColumnType
  options?: string
  isNew?: boolean
}
```

- [ ] **Step 2: Map options from schema in useEffect**

Update the `useEffect` (lines 50-57) to include options:

```typescript
  useEffect(() => {
    if (schema) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumns(
        schema.columns.map((c) => ({ name: c.columnName, type: c.columnType, options: c.options }))
      )
    }
  }, [schema])
```

- [ ] **Step 3: Add options input below each type selector**

In `src/components/manage-columns-dialog.tsx`, replace the column row JSX (lines 91-122). Each row `div` should become:

```typescript
          {columns.map((col, index) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  value={col.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  placeholder="Column name"
                  className="flex-1"
                  disabled={!col.isNew}
                />
                <Select
                  value={col.type}
                  onValueChange={(v) => updateColumn(index, 'type', v)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeColumn(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {col.type === 'select' && (
                <Input
                  value={col.options || ''}
                  onChange={(e) => updateColumn(index, 'options', e.target.value)}
                  placeholder="Options (comma-separated, e.g. Red,Green,Blue)"
                  className="ml-0 text-xs"
                />
              )}
            </div>
          ))}
```

- [ ] **Step 4: Pass options through onSave**

The `handleSave` function (line 75-78) and `onSave` prop already pass the full `ColumnEdit` objects. Verify the `onSave` prop type in the interface includes the `options` field. Update the `ManageColumnsDialogProps` interface's `onSave` type (line 33):

```typescript
  onSave: (sheetName: string, columns: ColumnEdit[]) => void
```

This is already correct — `ColumnEdit` now includes `options`, so no additional change is needed since `handleSave` passes `validColumns` which are `ColumnEdit[]`.

- [ ] **Step 5: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/manage-columns-dialog.tsx
git commit -m "feat: add options input in manage columns dialog for select type"
```

---

### Task 7: Add Sheet Dialog — Options Input

**Files:**
- Modify: `src/components/add-sheet-dialog.tsx`

- [ ] **Step 1: Add options to ColumnDraft interface**

In `src/components/add-sheet-dialog.tsx`, update the `ColumnDraft` interface (lines 23-27):

```typescript
export interface ColumnDraft {
  name: string
  type: ColumnType
  autoPopulate?: 'currentDate'
  options?: string
}
```

- [ ] **Step 2: Add options input below each type selector**

Replace the column row JSX (lines 108-140) with the same pattern. Each row becomes:

```typescript
            {columns.map((col, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    value={col.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                    placeholder="Column name"
                    className="flex-1"
                  />
                  <Select
                    value={col.type}
                    onValueChange={(v) => updateColumn(index, 'type', v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {columns.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColumn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {col.type === 'select' && (
                  <Input
                    value={col.options || ''}
                    onChange={(e) => updateColumn(index, 'options', e.target.value)}
                    placeholder="Options (comma-separated, e.g. Red,Green,Blue)"
                    className="ml-0 text-xs"
                  />
                )}
              </div>
            ))}
```

- [ ] **Step 3: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/add-sheet-dialog.tsx
git commit -m "feat: add options input in add sheet dialog for select type"
```

---

## Chunk 4: Form Inputs, Select Component, and Home Wiring

### Task 8: SelectWithAdd Component

**Files:**
- Create: `src/components/ui/select-with-add.tsx`

- [ ] **Step 1: Create the SelectWithAdd component**

Create `src/components/ui/select-with-add.tsx`:

```typescript
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Check, X } from 'lucide-react'

interface SelectWithAddProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  onAddOption: (newOption: string) => void
  placeholder?: string
  id?: string
}

export function SelectWithAdd({
  options,
  value,
  onChange,
  onAddOption,
  placeholder,
  id,
}: SelectWithAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    if (trimmed.includes(',')) {
      setError('Commas are not allowed')
      return
    }
    onAddOption(trimmed)
    onChange(trimmed)
    setNewValue('')
    setError('')
    setIsAdding(false)
  }

  const handleCancel = () => {
    setNewValue('')
    setError('')
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <Input
            value={newValue}
            onChange={(e) => { setNewValue(e.target.value); setError('') }}
            placeholder="New option..."
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <Button type="button" variant="ghost" size="icon" onClick={handleAdd}>
            <Check className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={(v) => {
      if (v === '__add_new__') {
        setIsAdding(true)
      } else {
        onChange(v)
      }
    }}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
        <SelectItem value="__add_new__">
          <span className="flex items-center gap-1 text-[var(--accent-cyan)]">
            <Plus className="h-3 w-3" /> Add new...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/ui/select-with-add.tsx
git commit -m "feat: create SelectWithAdd component for select column input"
```

---

### Task 9: Record Form Modal — Select Input

**Files:**
- Modify: `src/components/record-form-modal.tsx`

- [ ] **Step 1: Add imports and onOptionsChange prop**

In `src/components/record-form-modal.tsx`, add the import:

```typescript
import { SelectWithAdd } from '@/components/ui/select-with-add'
```

Update the `RecordFormModalProps` interface (lines 15-21) to add the callback:

```typescript
interface RecordFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: SheetSchema
  onSubmit: (data: Record<string, string>) => void
  onOptionsChange?: (columnName: string, newOptions: string) => void
  isSubmitting: boolean
}
```

Add `onOptionsChange` to the destructured props:

```typescript
export function RecordFormModal({
  open,
  onOpenChange,
  schema,
  onSubmit,
  onOptionsChange = () => {},
  isSubmitting,
}: RecordFormModalProps) {
```

- [ ] **Step 2: Add select input branch**

In the form field rendering (lines 57-100), add a `select` branch. Replace the ternary chain:

```typescript
              {col.columnType === 'boolean' ? (
                <button
                  type="button"
                  id={col.columnName}
                  role="switch"
                  aria-checked={values[col.columnName] === 'true'}
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      [col.columnName]: prev[col.columnName] === 'true' ? 'false' : 'true',
                    }))
                  }
                  className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
                    values[col.columnName] === 'true'
                      ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]'
                      : 'border-[rgba(100,150,255,0.3)] bg-[rgba(18,24,33,0.5)]'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      values[col.columnName] === 'true' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              ) : col.columnType === 'number' ? (
                <NumberStepper
                  id={col.columnName}
                  value={values[col.columnName] || ''}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: val }))
                  }
                  placeholder={col.columnName}
                />
              ) : col.columnType === 'select' ? (
                <SelectWithAdd
                  id={col.columnName}
                  options={(col.options || '').split(',').map((o) => o.trim()).filter(Boolean)}
                  value={values[col.columnName] || ''}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: val }))
                  }
                  onAddOption={(newOpt) => {
                    const current = col.options || ''
                    const updated = current ? `${current},${newOpt}` : newOpt
                    onOptionsChange(col.columnName, updated)
                  }}
                  placeholder={col.columnName}
                />
              ) : (
                <Input
                  id={col.columnName}
                  type={col.columnType === 'date' ? 'datetime-local' : 'text'}
                  value={values[col.columnName] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [col.columnName]: e.target.value }))
                  }
                  placeholder={col.columnName}
                />
              )}
```

- [ ] **Step 3: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors (`onOptionsChange` is optional, so `home.tsx` doesn't need changes yet)

- [ ] **Step 4: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/record-form-modal.tsx
git commit -m "feat: add select input to record form modal"
```

---

### Task 10: Record Detail Modal — Select Input

**Files:**
- Modify: `src/components/record-detail-modal.tsx`

- [ ] **Step 1: Add imports and onOptionsChange prop**

In `src/components/record-detail-modal.tsx`, add the import:

```typescript
import { SelectWithAdd } from '@/components/ui/select-with-add'
```

Update `RecordDetailModalProps` (lines 36-45) to add the callback:

```typescript
interface RecordDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: RecordRow | null
  schema: SheetSchema
  onUpdate: (id: string, data: Record<string, string>) => void
  onDelete: (id: string) => void
  onOptionsChange?: (columnName: string, newOptions: string) => void
  isUpdating: boolean
  isDeleting: boolean
}
```

Add `onOptionsChange` to the destructured props with a default no-op: `onOptionsChange = () => {}`.

- [ ] **Step 2: Add select branches in both view and edit modes**

In the **edit mode** ternary chain (lines 96-135), add a `select` branch after `number`:

```typescript
                ) : col.columnType === 'select' ? (
                  <SelectWithAdd
                    options={(col.options || '').split(',').map((o) => o.trim()).filter(Boolean)}
                    value={values[col.columnName] || ''}
                    onChange={(val) =>
                      setValues((prev) => ({ ...prev, [col.columnName]: val }))
                    }
                    onAddOption={(newOpt) => {
                      const current = col.options || ''
                      const updated = current ? `${current},${newOpt}` : newOpt
                      onOptionsChange(col.columnName, updated)
                    }}
                    placeholder={col.columnName}
                  />
```

Insert this between the `col.columnType === 'number'` branch and the default `Input` branch.

The **view mode** (line 136-139) uses `formatDisplayValue` which already falls through to `return value` for `select` — no change needed.

- [ ] **Step 3: Verify build**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit`
Expected: No type errors (`onOptionsChange` is optional)

- [ ] **Step 4: Commit**

```bash
cd /home/mvoget/dev/records
git add src/components/record-detail-modal.tsx
git commit -m "feat: add select input to record detail modal"
```

---

### Task 11: Home Page Wiring

**Files:**
- Modify: `src/pages/home.tsx`

- [ ] **Step 1: Update handleSaveColumns to accept options and autoPopulate**

In `src/pages/home.tsx`, update the `handleSaveColumns` signature (lines 173-175):

```typescript
  const handleSaveColumns = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType; options?: string; autoPopulate?: 'currentDate' }[]
  ) => {
```

Update the `serializeConfigRow` call inside (lines 196-201) to pass both options and autoPopulate:

```typescript
          const configRow = serializeConfigRow({
            sheetName,
            columnName: columns[i].name,
            columnType: columns[i].type,
            columnOrder: i + 1,
            ...(columns[i].autoPopulate ? { autoPopulate: columns[i].autoPopulate } : {}),
            ...(columns[i].options ? { options: columns[i].options } : {}),
          })
```

- [ ] **Step 2: Update handleCreateSheet to accept options**

In `src/pages/home.tsx`, update the `handleCreateSheet` signature (lines 119-121):

```typescript
  const handleCreateSheet = useCallback(async (
    sheetName: string,
    columns: { name: string; type: ColumnType; autoPopulate?: 'currentDate'; options?: string }[]
  ) => {
```

Update the `serializeConfigRow` call inside (lines 150-156) to pass options:

```typescript
          const configRow = serializeConfigRow({
            sheetName,
            columnName: columns[i].name,
            columnType: columns[i].type,
            columnOrder: i + 1,
            ...(columns[i].autoPopulate ? { autoPopulate: columns[i].autoPopulate } : {}),
            ...(columns[i].options ? { options: columns[i].options } : {}),
          })
```

Also add a check for the `options` header column in _config. Consolidate with the existing `autoPopulate` header check (around line 139) so both use a single `configRows` fetch:

```typescript
        // Ensure _config sheet has the needed header columns
        const needsAutoPopulate = columns.some((c) => c.autoPopulate)
        const needsOptions = columns.some((c) => c.options)
        if (needsAutoPopulate || needsOptions) {
          const configRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)
          const missingHeaders: Record<string, string> = {}
          if (needsAutoPopulate && (configRows.length === 0 || !('autoPopulate' in configRows[0]))) {
            missingHeaders.autoPopulate = ''
          }
          if (needsOptions && (configRows.length === 0 || !('options' in configRows[0]))) {
            missingHeaders.options = ''
          }
          if (Object.keys(missingHeaders).length > 0) {
            const placeholder = { sheetName: '', columnName: '', columnType: '', columnOrder: '', ...missingHeaders }
            const { rowIndex: phIdx } = await client.createRow(CONFIG_SHEET_NAME, placeholder)
            await client.deleteRow(CONFIG_SHEET_NAME, phIdx)
          }
        }
```

This replaces the existing `autoPopulate` header check block (lines 139-146).

- [ ] **Step 3: Add handleOptionsChange callback**

Add a new callback in `src/pages/home.tsx` after `handleSaveColumns`:

```typescript
  const handleOptionsChange = useCallback(async (columnName: string, newOptions: string) => {
    if (!activeSource || !currentSchema) return
    const columns = currentSchema.columns.map((col) => ({
      name: col.columnName,
      type: col.columnType,
      options: col.columnName === columnName ? newOptions : col.options,
      autoPopulate: col.autoPopulate,
    }))
    await handleSaveColumns(currentSchema.sheetName, columns)
  }, [activeSource, currentSchema, handleSaveColumns])
```

- [ ] **Step 4: Wire onOptionsChange to RecordFormModal**

In the JSX (around line 358), add the prop to `RecordFormModal`:

```typescript
          <RecordFormModal
            open={showAddForm}
            onOpenChange={setShowAddForm}
            schema={currentSchema}
            onSubmit={handleCreateRecord}
            onOptionsChange={handleOptionsChange}
            isSubmitting={createRecord.isPending}
          />
```

- [ ] **Step 5: Wire onOptionsChange to RecordDetailModal**

In the JSX (around line 365), add the prop to `RecordDetailModal`:

```typescript
          <RecordDetailModal
            open={!!selectedRecord}
            onOpenChange={(open) => { if (!open) setSelectedRecord(null) }}
            record={selectedRecord}
            schema={currentSchema}
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord}
            onOptionsChange={handleOptionsChange}
            isUpdating={updateRecord.isPending}
            isDeleting={deleteRecord.isPending}
          />
```

- [ ] **Step 6: Ensure _config options header in handleSaveColumns**

In `handleSaveColumns`, the existing code already fetches `configRows` at line 184. Add an options header check using that same variable, right after the fetch and before the delete loop:

```typescript
        const configRows = await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME)

        // Ensure _config sheet has the options header column
        if (columns.some((c) => c.options) && (configRows.length === 0 || !('options' in configRows[0]))) {
          const placeholder = { sheetName: '', columnName: '', columnType: '', columnOrder: '', options: '' }
          const { rowIndex: phIdx } = await client.createRow(CONFIG_SHEET_NAME, placeholder)
          await client.deleteRow(CONFIG_SHEET_NAME, phIdx)
          // Re-fetch configRows since indices shifted
          configRows.length = 0
          configRows.push(...await client.getRows<Record<string, string>>(CONFIG_SHEET_NAME))
        }

        const sheetConfigRows = configRows
          // ... rest of existing logic
```

- [ ] **Step 7: Verify build and all tests pass**

Run: `cd /home/mvoget/dev/records && npx tsc --noEmit && npm test`
Expected: No type errors, ALL tests PASS

- [ ] **Step 8: Commit**

```bash
cd /home/mvoget/dev/records
git add src/pages/home.tsx
git commit -m "feat: wire onOptionsChange through home page to form modals"
```

---

## Chunk 5: Final Verification

### Task 12: Full Build and Test

- [ ] **Step 1: Run full lint**

Run: `cd /home/mvoget/dev/records && npm run lint`
Expected: No lint errors

- [ ] **Step 2: Run full test suite**

Run: `cd /home/mvoget/dev/records && npm test`
Expected: ALL PASS

- [ ] **Step 3: Run production build**

Run: `cd /home/mvoget/dev/records && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Final commit if any fixes were needed**

Only if previous steps required fixes:

```bash
cd /home/mvoget/dev/records
git add -A
git commit -m "fix: address lint/build issues in select column type feature"
```
