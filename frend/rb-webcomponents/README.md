# DataPallas Web Components

Reusable web components for data visualization. Works in **any framework**: Angular, React, Vue, Grails, WordPress, plain HTML.

## Quick Start

Use any component with just 3 attributes:

```html
<rb-report 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key">
</rb-report>
```

That's it! The component:
1. Fetches configuration from the server
2. Renders a parameter form (if configured)  
3. Fetches data when user submits
4. Displays visualizations (table, chart, pivot) based on server config

**Server is the single source of truth.** All configuration comes from Groovy DSL files on the server.

---

## Available Components

| Component | Description |
|-----------|-------------|
| `<rb-report>` | Unified report component with parameters + visualizations |
| `<rb-tabulator>` | Data table with sorting, filtering, pagination |
| `<rb-chart>` | Charts (bar, line, pie, etc.) |
| `<rb-pivot-table>` | Pivot table with aggregation |
| `<rb-parameters>` | Parameter form |

All components use the same 3 attributes:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `report-code` | `string` | Yes | Report folder name (e.g., `"sales-summary"`) |
| `api-base-url` | `string` | Yes | Base URL for API (e.g., `"http://localhost:9090/api/reporting"`) |
| `api-key` | `string` | Yes | API key for authentication |

---

## Installation

### Load via Script Tag

```html
<!-- UMD format (works everywhere) -->
<script src="path/to/rb-webcomponents.umd.js"></script>

<!-- ES module format (modern browsers) -->
<script type="module" src="path/to/rb-webcomponents.es.js"></script>
```

### Build from Source

```bash
npm install
npm run build
# Copy dist/rb-webcomponents.umd.js to your project
```

---

## Component Usage

### Unified Report (`<rb-report>`)

Shows parameters form + all visualizations (table, chart, pivot) in one component:

```html
<rb-report 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key">
</rb-report>
```

### Data Table (`<rb-tabulator>`)

Just the table visualization:

```html
<rb-tabulator 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key">
</rb-tabulator>
```

### Chart (`<rb-chart>`)

Just the chart visualization:

```html
<rb-chart 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key"
    style="height: 300px;">
</rb-chart>
```

### Pivot Table (`<rb-pivot-table>`)

Just the pivot table:

```html
<rb-pivot-table 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key">
</rb-pivot-table>
```

### Parameter Form (`<rb-parameters>`)

Just the parameters form:

```html
<rb-parameters 
    report-code="sales-summary"
    api-base-url="http://localhost:9090/api/reporting"
    api-key="your-api-key">
</rb-parameters>
```

---

## Refreshing Data

All components expose a `fetchData(params)` method:

```javascript
const table = document.getElementById('myTable');

// Refresh with new parameters
table.fetchData({ startDate: '2025-01-01', endDate: '2025-12-31' });
```

---

## Integration Examples

### Angular

```typescript
@Component({
  template: `
    <rb-report 
        [attr.report-code]="reportCode"
        [attr.api-base-url]="apiBaseUrl"
        [attr.api-key]="apiKey">
    </rb-report>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReportViewComponent {
  reportCode = 'sales-summary';
  apiBaseUrl = 'http://localhost:9090/api/reporting';
  apiKey = 'your-api-key';
}
```

### Grails

```gsp
<!DOCTYPE html>
<html>
<head>
    <asset:javascript src="rb-webcomponents.umd.js"/>
</head>
<body>
    <rb-report 
        report-code="sales-summary"
        api-base-url="${grailsApplication.config.DataPallas.apiUrl}"
        api-key="${session.apiKey}">
    </rb-report>
</body>
</html>
```

### WordPress

```php
<?php
// In your theme's functions.php
function enqueue_rb_components() {
    wp_enqueue_script(
        'rb-webcomponents',
        get_template_directory_uri() . '/js/rb-webcomponents.umd.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_rb_components');
```

```php
<!-- In your template -->
<rb-report 
    report-code="sales-summary"
    api-base-url="<?php echo esc_attr(get_option('rb_api_url')); ?>"
    api-key="<?php echo esc_attr(get_user_meta(get_current_user_id(), 'rb_api_key', true)); ?>">
</rb-report>
```

### Plain HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script src="rb-webcomponents.umd.js"></script>
</head>
<body>
    <rb-tabulator 
        report-code="sales-summary"
        api-base-url="http://localhost:9090/api/reporting"
        api-key="abc123">
    </rb-tabulator>
    
    <script>
        // Optional: Refresh data with new parameters
        document.querySelector('rb-tabulator').fetchData({ year: 2025 });
    </script>
</body>
</html>
```

---

## API Endpoints

Components communicate with the DataPallas Spring Boot server:

### GET `/api/reporting/reports/{reportCode}/config`

Returns full configuration (parsed from Groovy DSL):

```json
{
    "reportCode": "sales-summary",
    "reportName": "Sales Summary Report",
    "hasParameters": true,
    "hasTabulator": true,
    "hasChart": true,
    "hasPivotTable": false,
    "parameters": [...],
    "tabulatorOptions": {...},
    "chartOptions": {...},
    "pivotTableOptions": {...}
}
```

### POST `/api/reporting/reports/{reportCode}/data`

Request body: `{ "startDate": "2025-01-01", ... }`

Response: Array of data rows

---

## Server Configuration (Groovy DSL)

Reports are configured via Groovy DSL files on the server:

```
config/reports/sales-summary/
├── settings.xml
├── reporting.xml
├── sales-summary-report-parameters-spec.groovy
├── sales-summary-tabulator-config.groovy
├── sales-summary-chart-config.groovy
└── sales-summary-pivot-config.groovy
```

### Example: Parameters DSL

```groovy
parameters {
    parameter(id: 'startDate', type: 'date') {
        label 'Start Date'
        defaultValue '2025-01-01'
        required true
    }
    parameter(id: 'endDate', type: 'date') {
        label 'End Date'
        required true
        min { ref: 'startDate' }
    }
}
```

### Example: Tabulator DSL

```groovy
tabulator {
    pagination true
    paginationSize 20
    columns {
        column(field: 'region', title: 'Region')
        column(field: 'sales', title: 'Sales', formatter: 'money')
    }
}
```

### Example: Chart DSL

```groovy
chart {
    type 'bar'
    labelField 'region'
    datasets {
        dataset(field: 'sales', label: 'Total Sales', color: '#3b82f6')
    }
}
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Host Application (Angular / Grails / WordPress / HTML)      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  <rb-tabulator report-code="X" api-base-url="Y" api-key="Z"> │
│  └────────────────────────────────────────────────────────┘  │
│         │                                                     │
│         │ 1. GET /reports/{code}/config                       │
│         │ 2. POST /reports/{code}/data                        │
│         ▼                                                     │
└──────────────────────────────────────────────────────────────┘
          │
          │ HTTP
          ▼
┌──────────────────────────────────────────────────────────────┐
│  DataPallas Spring Boot Server                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Groovy DSL Files (Single Source of Truth)               │ │
│  │  - parameters-spec.groovy                                │ │
│  │  - tabulator-config.groovy                               │ │
│  │  - chart-config.groovy                                   │ │
│  │  - pivot-config.groovy                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Key Design Principle:** Server is the single source of truth. Web components fetch config and data from the server - you only need to provide `report-code`, `api-base-url`, and `api-key`.

---

## Development

```bash
npm install     # Install dependencies
npm run dev     # Dev server with HMR
npm run build   # Production build
npm run check   # TypeScript validation
```

### Build Outputs

- `dist/rb-webcomponents.umd.js` - Universal (works everywhere)
- `dist/rb-webcomponents.es.js` - ES modules (modern bundlers)

---

## Contributor Rule — Svelte reactive-write discipline

**Do not write to a template-bound top-level `let` from inside `render()`,
`renderX()`, or an `afterUpdate` callback.** Doing so triggers an infinite
render loop that freezes the browser.

### Why

Every assignment to a top-level `let` that is read from the template (or from
a `$:` block, or from another reactive expression) calls Svelte's
`$invalidate` — which marks the component dirty → scheduled `afterUpdate` →
fires the same callback again → re-writes the variable → loops forever. The
`_dirty` counter trick we tried earlier makes it worse, because the counter
variable is itself a top-level `let` that the callback mutates.

### Example — WRONG (CPU will peg)

```svelte
<script>
  let container;
  let error = null;  // ← read from template below

  function render() {
    error = null;   // ← triggers $invalidate → next afterUpdate → render() → loop
    // ... build DOM ...
    if (somethingBad) error = "bad";  // ← same story
  }

  afterUpdate(() => { render(); });
</script>

{#if error}<div class="err">{error}</div>{/if}
<div bind:this={container}></div>
```

### Example — RIGHT

```svelte
<script>
  let container;
  let error = null;  // only written from onMount's async fetch path

  function render() {
    if (!container) return;
    container.innerHTML = "";             // direct DOM — not reactive
    if (somethingBad) {
      container.innerHTML = '<div class="err">bad</div>';  // direct DOM
      return;
    }
    // ... build SVG / HTML into container.innerHTML or via appendChild ...
  }

  afterUpdate(() => { render(); });
</script>

{#if error}<div class="err">{error}</div>{/if}
<div bind:this={container}></div>
```

### The allowed exceptions

A top-level `let` that is **never read from the template, from a `$:`
block, or from another reactive expression** is NOT reactive — Svelte's
compiler does not generate `$invalidate` calls for it. You can safely write
to it from `afterUpdate`. Example: `_afterUpdateCount` and
`_lastAfterUpdateLogTime` in `RbChart` / `RbTabulator` are used only for
internal logging and are safe.

### The quick audit

For every `.wc.svelte` file:
1. List top-level `let` declarations.
2. For each, ask: is this variable read from the template, a `{#if}`,
   `class:`, `style:`, `$:` block, or another reactive expression?
3. If YES, grep for assignments to it inside any function called from
   `render()`/`renderX()`/`afterUpdate`. If found, that's a loop risk.
4. Either (a) hoist the write outside the render cycle, (b) use
   `container.innerHTML = ...` / imperative DOM instead, or (c) verify the
   write is idempotent AND guarded (e.g. only fires once, like `isReady = true`
   inside a single-fire callback).

### Current status

As of the reliability audit, none of the `.wc.svelte` components have a
template-bound reactive write inside their `render()`/`afterUpdate` path.
Row-2 components (`RbSankey`, `RbGauge`, `RbTrend`, `RbProgress`, `RbDetail`)
were refactored to use `container.innerHTML` for error states. `RbMap` uses
an async `renderMap` which yields the event loop and allows the `_dirty`
counter debounce to work. `RbChart` / `RbTabulator`'s `_afterUpdateCount`
writes are to non-template lets (safe).

---

## License

MIT © DataPallas

