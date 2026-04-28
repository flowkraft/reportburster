package com.flowkraft.ai.prompts;

import java.util.List;

public final class PdfSampleA4PayslipXslfo {

    private PdfSampleA4PayslipXslfo() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "PDF_SAMPLE_A4_PAYSLIP_XSLFO",
            "Generate XSL-FO FreeMarker Template for PDF Report",
            "Generates a complete XSL-FO (.xsl) FreeMarker template for Apache FOP PDF rendering, based on user requirements.",
            List.of("xslfo", "fop", "pdf", "template", "freemarker"),
            "PDF Generation (from XSL-FO)",
            """
Write a FreeMarker template in XSL-FO (XSL Formatting Objects) format for Apache FOP PDF rendering. Return only the complete template code — no partial snippets or explanations.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

DATA MODEL:
A companion script (Groovy or SQL) prepares the data and passes it to this template as a FreeMarker model — one Map<String, Object> per document. The Map keys are the column/field names (case-insensitive). Variables are also available by index (${var0}, ${col0}, etc.) but prefer named columns.

Because data comes from database queries, field types vary at runtime:
- Numeric columns arrive as native Java numbers — `?number` will FAIL on them. Use directly or check with `?is_number`.
- Text columns arrive as strings.
- Date columns arrive as Java date objects — check with `?is_date` before formatting.
- Calculated totals may arrive as either numbers or pre-formatted strings — always be defensive.
- Any field can be null — always use `!` defaults (${amount!0}, ${name!""}).

SIMPLE REPORTS (one row = one document, e.g. payslip, certificate, statement):
- All fields available directly: ${EmployeeName}, ${Salary}, etc.

MASTER-DETAIL REPORTS (e.g. invoice with line items, order with products):
- Master fields available directly: ${OrderID}, ${CustomerName}, etc.
- Detail rows in a nested list: iterate with <#list details as item> and access fields as ${item.field_name}.
- Totals/summaries are pre-computed by the script and available as direct variables (e.g. ${Subtotal}, ${GrandTotal}) — do NOT calculate in the template.

XSL-FO DOCUMENT STRUCTURE:
- Root element: `<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">`
- Define a single `<fo:simple-page-master>` for A4 portrait (`page-height="29.7cm"`, `page-width="21cm"`).
- Page margins: `1.5cm` left/right, `1cm` top/bottom.
- All content within a single `<fo:page-sequence>` flowing into `xsl-region-body`.

STYLING RULES:
- **Fonts**: Standard fonts (Helvetica, Arial, sans-serif). Use `font-weight="bold"` for headers/labels. Font sizes in absolute units (e.g., `10pt`, `16pt`).
- **Spacing**: Explicit `space-after`, `space-before`, and `padding` in absolute units. Never rely on default spacing.
- **Tables**: Always use `table-layout="fixed"` with explicit `fo:table-column` widths.
- **Borders**: Solid borders for table cells (e.g., `border="1pt solid #dce0e6"`).
- **Alignment**: `text-align="end"` for financial amounts. `text-align="center"` for headers.
- **Colors**: High-contrast, print-friendly. Use light backgrounds for header/footer rows (e.g., `background-color="#f2f4f7"`).

FREEMARKER INTEGRATION:
- Use ${column_name} placeholders matching the actual data columns listed below.
- For dates: `<#if myDate?is_date>${myDate?string("MM/dd/yyyy")}<#else>${myDate!""}</#if>`
- For numbers needing formatting: `<#if amount?is_number>${amount?string(",##0.00")}<#else>${amount!""}</#if>`
- For nested lists: `<#list details as item>...${item.field_name}...</#list>`
- For null safety: always use ${value!""} or ${value!0}
- For conditional blocks: `<#if notes?has_content>...</#if>`

CRITICAL: FreeMarker + Apache FOP Rules:
These rules prevent silent rendering failures. FreeMarker's default error handler dumps stack traces into the XSL-FO output without stopping, which corrupts the XML and causes FOP to silently drop content.

- **`?number` is ONLY for strings.** If the value is already a number at runtime, `?number` throws a silent error and corrupts the output. Since you cannot know the runtime type, the safe pattern is: use values directly (`${amount}`) or use the type-safe check `<#if amount?is_number>${amount?string(",##0.00")}<#else>${amount}</#if>`.
- **Always use null-safe defaults.** Any value can be null at runtime. Use the `!` operator: `${amount!0}` for numeric fields, `${notes!""}` for text fields.
- **Do NOT use `fo:block-container` for layout positioning.** It has known rendering issues in Apache FOP with percentage widths and margins. Instead, use a plain `fo:table` with an empty spacer column. For right-aligned totals, use a 3-column table: 60% empty + 20% label + 20% value.
- **Do NOT do math in the template.** All calculations (totals, tax, subtotals) should be pre-computed and passed as ready-to-display values. The template should only display, never calculate.

XML VALIDITY:
- The entire output must be well-formed XML. All tags must be properly closed.

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]"""
        );
    }
}
