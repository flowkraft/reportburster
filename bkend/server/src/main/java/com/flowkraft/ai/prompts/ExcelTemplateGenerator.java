package com.flowkraft.ai.prompts;

import java.util.List;

public final class ExcelTemplateGenerator {

    private ExcelTemplateGenerator() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EXCEL_TEMPLATE_GENERATOR",
            "Generate Excel Report Template",
            "Generates an HTML template specifically designed for conversion to an Excel spreadsheet, based on user requirements and technical specifications.",
            List.of("excel", "html", "template", "spreadsheet"),
            "Excel Report Generation",
            """
Generate a complete, self-contained HTML document designed for conversion to an Excel spreadsheet using html-exporter — an HTML-to-Excel converter backed by Apache POI.
Return ONLY the HTML code in a single code block. The output must be ready to use without modifications.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

## DATA MODEL

A companion script (Groovy or SQL) prepares the data and passes it to this template as a FreeMarker model — one Map<String, Object> per document. The Map keys are the column/field names (case-insensitive). Variables are also available by index (${var0}, ${col0}, etc.) but prefer named columns.

Because data comes from database queries, field types vary at runtime:
- Numeric columns arrive as native Java numbers — `?number` will FAIL on them. Use directly or check with `?is_number`.
- Text columns arrive as strings.
- Date columns arrive as Java date objects — check with `?is_date` before formatting.
- Calculated totals may arrive as either numbers or pre-formatted strings — always be defensive.
- Any field can be null — always use `!` defaults (${amount!0}, ${name!""}).

### SIMPLE REPORTS (one row = one document, e.g. payslip, certificate, statement)
- All fields available directly: ${EmployeeName}, ${Salary}, etc.

### MASTER-DETAIL REPORTS (e.g. invoice with line items, order with products)
- Master fields available directly: ${OrderID}, ${CustomerName}, etc.
- Detail rows in a nested list: iterate with <#list details as item> and access fields as ${item.field_name}.
- Totals/summaries are pre-computed by the script and available as direct variables (e.g. ${Subtotal}, ${GrandTotal}) — do NOT calculate in the template.

## FORMAT RULES (html-exporter — HTML-to-Excel via Apache POI)

1. All CSS must be in a <style> block within <head> — no external CSS references
2. Use Excel-compatible CSS only (see technical docs below)
3. Colors: use long hex format (#ff0000 not #f00)
4. Border widths: `thin`, `medium`, or `thick` only
5. Use `data-*` attributes for Excel features (formulas, comments, freeze panes, etc.)
6. The HTML must be fully self-contained with no external dependencies

## FREEMARKER RULES

- Use ${column_name} placeholders matching the actual data columns listed below
- For dates displayed in Excel: use data-date-cell-format attribute
  <td data-date-cell-format="MM/dd/yyyy">${myDate!""}</td>
- For numbers with Excel formatting: use data-numeric-cell-format attribute
  <td data-numeric-cell-format="##0.00">${amount!0}</td>
- For null safety: always use ${value!""} for strings or ${value!0} for numbers
- For nested lists: <#list details as item><tr>...</tr></#list>
- For conditional content: <#if field?has_content>...</#if>
- NEVER use ${value?number} — values are already their native types at runtime

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

---

**TECHNICAL DOCUMENTATION — Excel-Specific Reference (html-exporter / Apache POI)**

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

html-exporter maps CSS styles to corresponding Excel formatting. The following CSS properties are supported:

- **Font:** `font-family`, `font-size`, `font-weight`, `font-style`, `text-decoration`
- **Alignment:** `text-align`, `vertical-align`
- **Colors:** `color`, `background-color`
- **Borders:** All border properties including color, style, and width

**CSS Notes:**

- Colors can be specified as literals (e.g., `red`, `black`) or hex values (must use long format: `#ff0000` not `#f00`)
- Border widths must be specified as `thin`, `medium`, or `thick`
- Supported border styles: `solid`, `dotted`, `dashed`, `double` (widths apply only to `solid` style)
- Shorthand CSS is supported (e.g., `border: thick solid red;`)
- Style inheritance: background colors and other properties cascade from parent elements (tables/rows) to children unless overridden
- Style precedence: inline styles override class declarations, which override global declarations

## Excel-Specific Attributes

The following data attributes allow you to access Excel-specific functionality:

| Attribute                     | Description                                                       | Example                                                                  |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `data-group`                  | Adds cell to named ranges for formula references                  | `<td data-group="sales_total, region_sum">486</td>`                      |
| `data-group-output`           | Replaces cell value with a formula operating on a specified range | `<td data-group-output="sales_total">0</td>`                             |
| `data-cell-comment`           | Adds a comment to a cell                                          | `<td data-cell-comment="This is a comment">Value</td>`                   |
| `data-cell-comment-dimension` | Sets the size of a comment (columns,rows)                         | `<td data-cell-comment-dimension="4,2">Value</td>`                       |
| `data-freeze-pane-cell`       | Defines the freeze pane position                                  | `<td data-freeze-pane-cell="true">Value</td>`                            |
| `data-new-sheet`              | Creates a new worksheet                                           | `<table data-new-sheet="true">...</table>`                               |
| `data-sheet-name`             | Names a worksheet                                                 | `<table data-sheet-name="Sales Report">...</table>`                      |
| `data-date-cell-format`       | Sets date/time format                                             | `<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>` |
| `data-text-cell`              | Forces cell content to be treated as text                         | `<td data-text-cell="true">13.54</td>`                                   |
| `data-numeric-cell-format`    | Sets numeric format                                               | `<td data-numeric-cell-format="##0.00">123.45</td>`                      |

## Examples

### Formula Support

<!-- Cell added to two different ranges for formula references -->
<td data-group="store_Dumfries_2_value, region_1_1_pg_5_value" class="numeric">
  486
</td>

<!-- Cell that contains a SUM formula referencing all cells in a specified range -->
<td data-group-output="region_1_1_pg_6_count" data-group="area_1_pg_6_count">
  32
</td>

### Cell Comments

<td data-cell-comment="An Excel Comment" data-cell-comment-dimension="4,2">
  some value
</td>

### Freeze Panes

<td data-freeze-pane-cell="true">some value</td>

### Merged Cells

<td rowspan="3" colspan="3">some value</td>

### Multiple Worksheets

<table data-sheet-name="Table 1">
  <!-- table data-->
</table>
<table data-new-sheet="true" data-sheet-name="Table 2">
  <!-- table data-->
</table>

### Date Handling

<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>

### Forcing Text Output

<td data-text-cell="true">13.54</td>

## Limitations

- When using border widths with non-solid styles, the width property is ignored
- Certain Excel features might not be available through the HTML interface

If you need help with HTML-to-Excel features supported by html-exporter, refer to: https://github.com/alanhay/html-exporter"""
        );
    }
}
