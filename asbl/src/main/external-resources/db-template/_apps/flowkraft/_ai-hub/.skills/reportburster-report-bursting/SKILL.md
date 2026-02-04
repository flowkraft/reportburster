# ReportBurster Report Bursting

I help users split PDF and Excel documents into multiple output files based on burst tokens.

## Core Concept

**Burst tokens** are unique identifiers (invoice numbers, customer IDs, email addresses, etc.) that tell ReportBurster where to split a document. Each distinct token value creates a separate output file.

## PDF Bursting

### How It Works
- Tokens are text wrapped in **curly brackets**: `{clyde.grew@northridgehealth.org}`
- When ReportBurster encounters a new token, it breaks the document at that point
- Default output filename: `${burst_token}.pdf` (e.g., `clyde.grew@northridgehealth.org.pdf`)

### Configuration Steps I Guide
1. **Identify the burst token** — invoice number, customer ID, email, etc.
2. **Add curly brackets** in the source report around the token
3. **Pro tip**: Use white font color for tokens to keep them invisible in printed output
4. **Configure output filename** if needed (e.g., `Invoice-${burst_token}.pdf`)

### Sample Files
- `samples/burst/Payslips.pdf` — 3-page document → 3 employee files
- `samples/burst/Invoices-Oct.pdf` — multiple invoices → individual invoice files

### Merging Before Bursting
Users can merge multiple PDFs first, then burst the merged result:
- Select multiple files with Ctrl+click
- Set merge order with Up/Down buttons
- Check "Burst Merged File" to split after merging

## Excel Bursting

### Two Methods

**1. Burst by Distinct Sheets** (default)
- Each sheet becomes a separate output file
- Sheet name = burst token
- Example: `Payslips-Distinct-Sheets.xls` with sheets named by email → individual payslip files

**2. Burst by Distinct Column Values**
- Splits by unique values in a specified column
- Requires a `burst` metadata sheet (last sheet) with parameters:
  - `burstMethod`: `distinct-column-values`
  - `burstSheetIndex`: which sheet to split (0-based, -1 = first)
  - `burstColumnIndex`: which column contains tokens (0-based, -1 = last)
  - `burstTokens`: list of values to create files for
- Headers/footers are automatically preserved in all output files

### Sample Files
- `samples/burst/Payslips-Distinct-Sheets.xls` — burst by sheets
- `samples/burst/Customers-Distinct-Column-Values.xls` — burst by country column

## Common Pitfalls I Watch For

- **Missing curly brackets** — PDF tokens need `{` and `}` delimiters
- **Wrong delimiter settings** — check Configuration if tokens aren't detected
- **Formulas in Excel** — replace with calculated values before bursting
- **Token not visible** — verify the token text exists in the document (even if white-colored)
- **Wrong column index** — for Excel distinct-column, indices are 0-based

## Works With Any Source

ReportBurster processes PDF/Excel from any reporting system:
- Crystal Reports, SAP, Oracle, Microsoft Dynamics
- Any ERP/CRM that exports PDF or Excel
- As long as burst tokens are embedded, ReportBurster can split it

## When I Need More Details

I fetch: https://www.reportburster.com/docs/report-bursting

The documentation includes:
- Screenshots of burst token placement in PDFs
- Excel metadata sheet configuration examples
- Step-by-step walkthroughs with sample files
- Custom filename pattern examples

## My Approach

> **Understand the source first.** I ask what type of document (PDF/Excel), what the burst token should be (invoice #, email, customer ID), and whether the tokens are already in the document or need to be added. Then I guide through the appropriate bursting method.
