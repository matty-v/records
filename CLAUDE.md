# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + Vite production build (`tsc -b && vite build`) |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build locally |

Vitest is installed but no test scripts are configured yet. When adding tests, use `vitest` (already a devDep).

## Architecture

**Records** is a React/TypeScript PWA that provides structured data entry backed by Google Sheets via a REST API.

### Data Flow

1. **App.tsx** checks if any "sources" (spreadsheet connections) exist in LocalStorage
2. No sources → **SheetsSetupWizard** guides initial Google Sheet configuration
3. With sources → **HomePage** renders the main UI: source selector, sheet tabs, record table, and FAB for new records

### State Layers

- **LocalStorage**: Persists source list and active source ID (`use-sources.ts`)
- **IndexedDB (Dexie)**: Primary cache for records and schemas (`lib/db.ts`)
- **React Query**: Server state with 5-10 min stale times (`use-records.ts`, `use-schema.ts`)
- **REST API**: `https://sheetsapi-g56q77hy2a-uc.a.run.app` via `SheetsDbClient`

### Key Directories

- `src/hooks/` — Custom hooks for sources, records, schema, sheets, settings, toast
- `src/lib/` — Core logic: types, IndexedDB, API client instantiation, cache refresh, remote sync
- `src/services/sheetsdb/` — `SheetsDbClient` HTTP client (spreadsheet ID passed via `X-Spreadsheet-Id` header)
- `src/components/ui/` — Radix UI primitives styled with Tailwind (shadcn/ui pattern)
- `src/components/sheets/` — Google Sheets setup wizard and settings
- `src/components/` — Feature components: record table, forms, modals, dialogs
- `src/config/constants.ts` — API URL, localStorage keys, config sheet name, service account email

### Google Sheets Integration

- A special `_config` sheet stores column definitions (name, type, order) per sheet
- Column types: text, number, date, boolean
- Records have a UUID `id` column plus user-defined columns
- Row index is cached in-memory to map `(sheetName, recordId)` → `rowIndex` for updates/deletes

### Styling

- Always-dark theme with JetBrains Mono font
- Tailwind with CSS custom properties for theming (`--bg-primary: #0a0e14`, cyan/purple/pink accents)
- Custom `.tech-*` CSS classes for the futuristic UI aesthetic

## Deployment

- **Firebase Hosting** (project: `kinetic-object-322814`, site: `matty-records-pwa`)
- Push to `main` auto-deploys via GitHub Actions (`deploy.yml`)
- PRs get preview deployments (`preview.yml`, 7-day expiry)
- SPA rewrites: all routes → `/index.html`

## Path Alias

`@/*` maps to `./src/*` (configured in both tsconfig and vite).
