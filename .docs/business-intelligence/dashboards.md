# Dashboards 🖼️

Compose `rb-tabulator`, `rb-chart`, `rb-pivot-table` and `rb-parameters` to build interactive dashboards for executives, sales teams or operations.

## Build blocks
- **Data panels:** `rb-tabulator` for exploration
- **Visual panels:** `rb-chart` for trends and comparisons
- **Summary panels:** pivot tables for aggregation
- **Filters / Controls:** `rb-parameters` to drive queries

## Quick layout example

```html
<div class="dashboard-grid">
  <rb-parameters report-code="sales-summary" ...></rb-parameters>
  <rb-chart report-code="sales-summary" ...></rb-chart>
  <rb-tabulator report-code="sales-summary" ...></rb-tabulator>
</div>
```

Best practices: keep panels focused, paginate large datasets, and prefer server-side aggregation for heavy queries.
