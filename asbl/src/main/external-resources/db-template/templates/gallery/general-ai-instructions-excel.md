# ReportBurster Excel Exporter

ReportBurster transforms CSS styled HTML into Excel spreadsheets with robust formatting and features.

## Overview

ReportBurster allows you to generate professional Excel spreadsheets from HTML content, maintaining styling, formulas, and other Excel-specific features. 
The main advantage is the ability to use familiar HTML/CSS for report generation, combined with a good templating engine for producing high-quality Excel output.

## Features

- Complete CSS styling support
- Excel formulas
- Cell comments
- Freeze panes
- Merged cells
- Multiple worksheets
- Date/time formatting
- Numeric formatting
- Text cell forcing

## CSS Support

ReportBurster maps CSS styles to corresponding Excel formatting. The following CSS properties are supported:

- **Font:** `font-family`, `font-size`, `font-weight`, `font-style`, `text-decoration`
- **Alignment:** `text-align`, `vertical-align`
- **Colors:** `color`, `background-color`
- **Borders:** All border properties including color, style, and width

**CSS Notes:**
- Colors can be specified as literals (e.g., `red`, `black`) or hex values (must use long format: `#ff0000` not `#f00`)
- Border widths must be specified as `thin`, `medium`, or `thick`
- Supported border styles: `solid`, `dotted`, `dashed`, `double` (widths apply only to `solid` style)

## Excel-Specific Attributes

The following data attributes allow you to access Excel-specific functionality:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-group` | Adds cell to named ranges for formula references | `<td data-group="sales_total, region_sum">486</td>` |
| `data-group-output` | Replaces cell value with a formula operating on a specified range | `<td data-group-output="sales_total">0</td>` |
| `data-cell-comment` | Adds a comment to a cell | `<td data-cell-comment="This is a comment">Value</td>` |
| `data-cell-comment-dimension` | Sets the size of a comment (columns,rows) | `<td data-cell-comment-dimension="4,2">Value</td>` |
| `data-freeze-pane-cell` | Defines the freeze pane position | `<td data-freeze-pane-cell="true">Value</td>` |
| `data-new-sheet` | Creates a new worksheet | `<table data-new-sheet="true">...</table>` |
| `data-sheet-name` | Names a worksheet | `<table data-sheet-name="Sales Report">...</table>` |
| `data-date-cell-format` | Sets date/time format | `<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>` |
| `data-text-cell` | Forces cell content to be treated as text | `<td data-text-cell="true">13.54</td>` |
| `data-numeric-cell-format` | Sets numeric format | `<td data-numeric-cell-format="##0.00">123.45</td>` |

## Examples

### Formula Support

```html
<!-- Cell added to two different ranges for formula references -->
<td data-group="store_Dumfries_2_value, region_1_1_pg_5_value" class="numeric">486</td>

<!-- Cell that contains a SUM formula referencing all cells in a specified range -->
<td data-group-output="region_1_1_pg_6_count" data-group="area_1_pg_6_count">32</td>
```

### Cell Comments

```html
<td data-cell-comment="An Excel Comment" data-cell-comment-dimension="4,2">some value</td>
```

### Freeze Panes

```html
<td data-freeze-pane-cell="true">some value</td>
```

### Merged Cells

```html
<td rowspan="3" colspan="3">some value</td>
```

### Multiple Worksheets

```html
<table data-sheet-name="Table 1">
    <!-- table data-->
</table>
<table data-new-sheet="true" data-sheet-name="Table 2">
    <!-- table data-->
</table>
```

### Date Handling

```html
<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>
```

### Forcing Text Output

```html
<td data-text-cell="true">13.54</td>
```

## Limitations

- When using border widths with non-solid styles, the width property is ignored
- Certain Excel features might not be available through the HTML interface