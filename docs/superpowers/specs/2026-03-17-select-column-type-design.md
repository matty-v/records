# Select Column Type

## Summary

Add `select` as a new column type supporting single-select string values. Options are defined in the `_config` sheet and users can add new options on the fly from the form input.

## Types & Schema

- Add `'select'` to the `ColumnType` union in `types.ts`: `'text' | 'number' | 'date' | 'boolean' | 'select'`
- Add optional `options?: string` field to `ColumnDefinition` — a comma-separated string (e.g., `"Red,Green,Blue"`)
- Append `'select'` to `COLUMN_TYPES` array in `constants.ts`
- `parseConfigRows()` in `schema-utils.ts` reads the `options` field from `_config` sheet rows
- `serializeConfigRow()` in `schema-utils.ts` includes `options` when writing back

Values are stored as plain strings in the sheet (e.g., `"Red"`), consistent with all other column types.

## Form Input

In both `record-form-modal.tsx` and `record-detail-modal.tsx`, when `columnType === 'select'`:

- Render a Radix `Select` component with each option from the column's `options` string (split by comma, trimmed)
- Include an "Add new..." item at the bottom of the dropdown
- When "Add new..." is selected, show an inline text input to type the new value
- On confirm:
  1. Set the new value as the field's current value
  2. Append the new value to the column's `options` in the schema
  3. Sync the schema update to `_config` sheet via the existing schema mutation flow
- If the `options` string is empty/undefined, the dropdown shows only the "Add new..." item

## Display & Normalization

**Table display** (`record-row-card.tsx`):
- `formatDisplayValue()` for `select` returns the string value as-is (same as `text`)
- Empty/missing values display as `'—'`

**Normalization** (`cache.ts`):
- `normalizeValue()` for `select` returns the value unchanged — no transformation needed

## Charts

**Chart detection** (`chart-utils.ts`):
- Select columns produce a **donut chart** counting occurrences of each option value
- Each unique value gets its own slice
- If a sheet has both `select` and `date` columns, produce a **stacked bar chart** grouping by date with one stack segment per option value
- Empty/missing values are excluded from chart data

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `'select'` to `ColumnType`, add `options?: string` to `ColumnDefinition` |
| `src/config/constants.ts` | Add `'select'` to `COLUMN_TYPES` |
| `src/lib/schema-utils.ts` | Parse and serialize `options` field |
| `src/components/record-form-modal.tsx` | Add select input with "Add new..." flow |
| `src/components/record-detail-modal.tsx` | Add select input with "Add new..." flow |
| `src/components/record-row-card.tsx` | Handle `'select'` in `formatDisplayValue()` |
| `src/lib/cache.ts` | Handle `'select'` in `normalizeValue()` |
| `src/lib/chart-utils.ts` | Add donut and stacked bar chart support for `select` |
