# Sheet Visualizations — Design

## Overview

Add a "Chart" view to each sheet, toggled via a segmented control below the sheet tabs. The app auto-detects which visualization to show based on the column types present in the sheet.

## UI

**Segmented control** — a `[Table | Chart]` pill toggle rendered between the sheet tabs and the record list. Only shown when the sheet has chartable columns (at least one numeric or boolean column). Defaults to "Table".

**Chart view** replaces the record table when active. It renders one of the following based on the sheet's schema:

| Columns present | Visualization |
|---|---|
| Date + numeric | Line chart — date on X axis, one line per numeric column |
| Date + boolean | Bar chart — date on X axis, stacked true/false counts (grouped by day) |
| Numeric only | Summary stats — card per numeric column showing sum, avg, min, max |
| Boolean only | Donut chart — true vs false breakdown per boolean column |
| Text only | No chart view (toggle hidden) |

When multiple column type combinations exist (e.g., date + numeric + boolean), prioritize: line chart for the numeric columns, with boolean charts below.

## Tech

- **Recharts** for line, bar, and donut charts
- Chart components styled to match the dark theme (cyan/purple accents, transparent backgrounds)
- Auto-detection logic lives in a pure function `detectVisualizations(schema, records)` — easily testable, returns a list of visualization descriptors
- A new `ChartView` component consumes those descriptors and renders the appropriate Recharts components

## Data flow

The chart view uses the same `records` array already fetched by `useRecords`. The detection function groups/aggregates records client-side (e.g., summing by date for time series, counting booleans). No new API calls needed.

## What's NOT in scope

- User-configurable chart overrides (future work)
- Persisting the selected view mode
- Export/share charts
