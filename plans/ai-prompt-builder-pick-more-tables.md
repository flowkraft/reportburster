# AI Prompt Builder — "Pick More Tables" Feature Plan

## Summary

Add `mode` prop to existing `SchemaBrowser`. Default `left-panel` = unchanged. New `ai-prompt` mode = read-only connection, checkboxes on tables/cubes, returns selected metadata. AiHelpDialog gets a "Pick more tables" button that opens SchemaBrowser in `ai-prompt` mode inside a modal. Selected items' metadata goes into the AI prompt the same way the existing single table does.

## Changes

### 1. `SchemaBrowser.tsx` — Add `mode` prop

- Default `mode="left-panel"` — zero behavior change
- `mode="ai-prompt"`:
  - Connection picker shown as **read-only** (disabled select showing current connection)
  - Each table row gets a **checkbox** on the left
  - Each cube row gets a **checkbox** on the left
  - Clicking a table/cube name toggles its checkbox (instead of addWidgetFromTable/addWidgetFromCube)
  - Expand/collapse columns still works
  - Search still works
  - Footer: "N selected" count + "Pick Tables" button that calls `onPick({ tableNames, cubeIds })`
  - Schema and cubes received via props (no internal fetch)

### 2. `AiHelpDialog.tsx` — Add "Pick more tables" button

- New `+ Pick more tables` button at the right of the context bar
- Opens SchemaBrowser in `ai-prompt` mode inside a modal overlay
- Context bar updates: `Using: Customers, Table1, Table2 · clickhouse · Mode: SQL from table`
  - ≤2 names: show all inline
  - >2 names: show first 2 + `...` with full list as tooltip
- Passes `additionalTableNames` to `buildAiPrompt`

### 3. `ai-prompt-builder.ts` — Multi-table support

- New `additionalTableNames?: string[]` in `BuildPromptOptions`
- New `formatSchemaForTables(schema, names[])` helper — same format as existing `formatSchemaForTable` but for multiple tables
- `buildAiPrompt` combines `[tableName, ...additionalTableNames]` into one schema JSON

### 4. `QueryBuilder.tsx` — Pass cubes to AiHelpDialog

- Fetch cubes on mount, filter for current connection
- Pass `cubes` prop to AiHelpDialog

## Sync

All changed files copied to:
1. `frend/reporting/testground/e2e/_apps/flowkraft/_ai-hub/ui-startpage/`
2. `asbl/target/package/verified-db-noexe/ReportBurster/_apps/flowkraft/_ai-hub/ui-startpage/`
