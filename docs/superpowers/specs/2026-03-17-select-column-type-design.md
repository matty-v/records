# Select Column Type

## Summary

Add `select` as a new column type supporting single-select string values. Options are defined in the `_config` sheet and users can add new options on the fly from the form input.

## Types & Schema

- Add `'select'` to the `ColumnType` union in `types.ts`: `'text' | 'number' | 'date' | 'boolean' | 'select'`
- Add optional `options?: string` field to `ColumnDefinition` — a comma-separated string (e.g., `"Red,Green,Blue"`)
- Append `'select'` to `COLUMN_TYPES` array in `constants.ts`
- `parseConfigRows()` in `schema-utils.ts` reads the `options` field from `_config` sheet rows
- `serializeConfigRow()` in `schema-utils.ts` includes `options` when writing back
- No Dexie schema version bump needed — `options` is not indexed and flows through the existing `...col` spread in `refreshSchemaFromRemote`

Values are stored as plain strings in the sheet (e.g., `"Red"`), consistent with all other column types.

**Validation:** Commas are not allowed in option values. The "Add new..." input and the manage columns options input must reject values containing commas.

## Column Management UI

**`manage-columns-dialog.tsx`**: When a column's type is set to `select`, render an additional text input for defining the comma-separated options string. This input appears below the type selector and is only visible when `columnType === 'select'`.

**`add-sheet-dialog.tsx`**: Same behavior — when adding a new sheet with a `select` column, show the options input inline.

## Form Input

In both `record-form-modal.tsx` and `record-detail-modal.tsx`, when `columnType === 'select'`:

- Render a Radix `Select` component with each option from the column's `options` string (split by comma, trimmed)
- Include an "Add new..." item at the bottom of the dropdown
- When "Add new..." is selected, show an inline text input to type the new value
- On confirm:
  1. Set the new value as the field's current value
  2. Append the new value to the column's `options` in the schema
  3. Sync the schema update to the `_config` sheet

**Schema mutation data flow:** The form modals do not currently have a way to mutate schema. Add a new callback prop `onOptionsChange(columnName: string, newOptions: string)` passed from `home.tsx` through to both modals. `home.tsx` already owns schema mutations via `handleSaveColumns` and the `useSchema` hook. The `onOptionsChange` handler will:
1. Update the column's `options` field in the local schema state
2. Call the existing `saveColumns` mutation to sync the updated `_config` rows to the sheet
3. React Query cache invalidation happens automatically via the existing mutation flow

- If the `options` string is empty/undefined, the dropdown shows only the "Add new..." item

## Display & Normalization

**Table display** (`record-row-card.tsx` and `record-detail-modal.tsx`):
- `formatDisplayValue()` for `select` returns the string value as-is (same as `text`)
- Empty/missing values display as `'—'`
- Note: `formatDisplayValue` is duplicated in both files. Both need the `select` case.

**Normalization** (`cache.ts`):
- `normalizeValue()` for `select` returns the value unchanged — no transformation needed

## Charts

**New visualization types** (`chart-utils.ts`):

Select columns get their own visualization types, parallel to the boolean ones:

- `SelectDonutVisualization`: `{ type: 'selectDonut'; selectColumns: string[] }`
  - Counts occurrences of each unique value per select column
  - Each unique value gets its own donut slice
  - Data prep function: `prepareSelectDonutData(records, selectColumns)` returning `{ column: string; slices: { value: string; count: number }[] }[]`

- `SelectBarVisualization`: `{ type: 'selectBar'; dateColumn: string; selectColumn: string }`
  - Groups by date with one stacked segment per unique option value
  - Data prep function: `prepareSelectBarData(records, dateColumn, selectColumn)` returning `Record<string, string | number>[]`

**Detection logic** in `detectVisualizations()`:
- `select` columns + `date` column → `SelectBarVisualization`
- `select` columns + no `date` column → `SelectDonutVisualization`

Empty/missing values are excluded from chart data.

**Chart rendering** (`chart-view.tsx`):
- Add `SelectDonutChartCard` and `SelectBarChartCard` components alongside the existing `DonutChartCard` and `BarChartCard`

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `'select'` to `ColumnType`, add `options?: string` to `ColumnDefinition` |
| `src/config/constants.ts` | Add `'select'` to `COLUMN_TYPES` |
| `src/lib/schema-utils.ts` | Parse and serialize `options` field |
| `src/components/manage-columns-dialog.tsx` | Show options input when column type is `select` |
| `src/components/add-sheet-dialog.tsx` | Show options input when column type is `select` |
| `src/components/record-form-modal.tsx` | Add select input with "Add new..." flow, accept `onOptionsChange` prop |
| `src/components/record-detail-modal.tsx` | Add select input with "Add new..." flow, accept `onOptionsChange` prop |
| `src/pages/home.tsx` | Wire `onOptionsChange` callback to schema mutation |
| `src/components/record-row-card.tsx` | Handle `'select'` in `formatDisplayValue()` |
| `src/lib/cache.ts` | Handle `'select'` in `normalizeValue()` |
| `src/lib/chart-utils.ts` | Add `SelectDonutVisualization`, `SelectBarVisualization`, detection logic, and data prep functions |
| `src/components/chart-view.tsx` | Add `SelectDonutChartCard` and `SelectBarChartCard` rendering |

## Tests to Update

| File | Change |
|------|--------|
| `src/lib/__tests__/schema-utils.test.ts` | Test parsing/serializing the `options` field |
| `src/lib/__tests__/normalize-value.test.ts` | Test `select` type passthrough |
| `src/lib/__tests__/chart-utils.test.ts` | Test new `detectVisualizations` cases and data prep functions |
