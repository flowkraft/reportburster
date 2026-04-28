package com.flowkraft.ai.prompts;

import java.util.List;

public final class PdfHtmlTemplateGenerator {

    private PdfHtmlTemplateGenerator() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "PDF_HTML_TEMPLATE_GENERATOR",
            "Generate PDF Report Template (from HTML)",
            "Generates a complete XHTML template optimized for PDF conversion using OpenHTMLToPDF, based on user requirements and actual data columns.",
            List.of("pdf", "html2pdf", "template"),
            "PDF Generation (from HTML)",
            """
Generate a complete, self-contained XHTML document for conversion to a PDF report using OpenHTMLToPDF — a CSS 2.1 renderer backed by Apache PDFBox.
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

## HTML→PDF TECHNICAL RULES (OpenHTMLToPDF — CSS 2.1 only, no JS, XHTML required)

1. **Valid XHTML:** All tags properly nested and closed (e.g., `<br/>`, `<hr/>`). Use `&amp;` for all ampersand characters — never raw `&`. Do not use `&nbsp;`.
2. **Internal CSS:** All CSS in `<style type="text/css">` in `<head>` — no external references, no `@font-face`.
3. **Absolute units ONLY:** All measurements (layout, fonts, margins, padding, borders) must use `px` or `pt`. **DO NOT USE** `%`, `em`, or `rem`.
4. **Box model:** Apply `* { box-sizing: border-box; }` at the start of CSS.
5. **Fixed layout:** Use `div` elements with fixed pixel widths. Use `display: table` / `display: table-cell` for column layouts (not floats).
6. **A4 portrait:** Use `@page { size: A4 portrait; margin: 25mm; }`. Adjust page size and margins as needed based on the business requirement.
7. **Print-safe fonts:** `font-family: Arial, Helvetica, sans-serif;` with all sizes in `pt`. High-contrast, solid colors only.
8. **Page breaks:** Apply `page-break-inside: avoid;` on main content containers. Use `page-break-before`/`page-break-after` for multi-page documents.
9. **CSS 2.1 ONLY:** No flexbox, no grid, no CSS variables (`var()`), no transforms, no `calc()`.
10. **No JavaScript** — the renderer does not execute scripts.
11. **Images:** Use absolute file paths or base64 data URIs — no remote URLs.

## FREEMARKER RULES

- Use ${column_name} placeholders matching the actual data columns listed below
- For null safety: ${value!""} for strings, ${value!0} for numbers
- For dates: <#if myDate?is_date>${myDate?string("MM/dd/yyyy")}<#else>${myDate!""}</#if>
- For numbers needing formatting: <#if amount?is_number>${amount?string(",##0.00")}<#else>${amount!""}</#if>
- For nested lists: <#list details as item><tr>...</tr></#list>
- For conditional content: <#if field?has_content>...</#if>
- NEVER use ${value?number} — values are already their native types at runtime

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

If you need help with CSS properties supported by OpenHTMLToPDF, refer to: https://github.com/danfickle/openhtmltopdf/wiki/Big-CSS-reference"""
        );
    }
}
