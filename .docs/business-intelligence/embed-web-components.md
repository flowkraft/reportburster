# Embed Web Components 🔗

Embed ReportBurster visuals directly into the ReportBurster Portal or any web application — place a component on a page and it will fetch configuration and data from the server and render the report view for you.

## Quick examples

Unified report (parameters + visuals):

```html
<rb-report report-code="sales-summary" api-base-url="https://server/api/jobman/reporting" api-key="MY_KEY"></rb-report>
```

Table only:

```html
<rb-tabulator report-code="sales-summary" api-base-url="https://server/api/jobman/reporting" api-key="MY_KEY"></rb-tabulator>
```

Chart only:

```html
<rb-chart report-code="sales-summary" api-base-url="https://server/api/jobman/reporting" api-key="MY_KEY" style="height:300px"></rb-chart>
```

Pivot table:

```html
<rb-pivot-table report-code="sales-summary" api-base-url="https://server/api/jobman/reporting" api-key="MY_KEY"></rb-pivot-table>
```

## Notes
- Components expose a `fetchData(params)` method for programmatic refresh. 
- Server is the single source of truth — config comes from Groovy DSL files (tabulator, chart, pivot config). See **Reference** for DSL snippets.
