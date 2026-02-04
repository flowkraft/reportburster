# Variables & Templating Skill

I guide users through ReportBurster's variable system — dynamic values extracted from reports at runtime that personalize every aspect of document delivery.

## Core Concept

Variables are placeholders that get replaced with actual values from each report being processed. They make your distribution dynamic and personalized without manual intervention.

**Syntax**: `${variable_name}`

---

## Two Types of Variables

### 1. Built-In Variables

Available automatically in all ReportBurster configurations:

| Variable | Description | Example |
|----------|-------------|---------|
| `${burst_token}` | The burst token for current file | `clyde.grew@northwind.com` |
| `${input_document_name}` | Input file name | `Payslips.pdf` |
| `${input_document_extension}` | File extension | `pdf`, `xls`, `xlsx` |
| `${burst_index}` | Index of burst file (1, 2, 3...) | `4` |
| `${output_folder}` | Where last file was extracted | `output/Payslips.pdf/2023.03.04_19.13.13` |
| `${extracted_file_path}` | Full path to last extracted file | `/path/to/output/file.pdf` |

**Date/Time Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}` | Custom format | `2023.06.30_14.25.30.123` |
| `${now_default_date}` | Default date | `Jun 30, 2023` |
| `${now_short_date}` | Short date | `6/30/23` |
| `${now_medium_date}` | Medium date | `Jun 30, 2023` |
| `${now_long_date}` | Long date | `June 30, 2023` |
| `${now_full_date}` | Full date | `Tuesday, June 30, 2023` |

### 2. User-Defined Variables

Custom values extracted from your reports: `${var0}` through `${var19}` (20 variables by default).

**PDF Reports**: Use XML-style tags in the document:
```
<0>Customer Name Here</0>
<1>Invoice Date Here</1>
<2>Sales Rep Name</2>
```

**Excel Reports**: Use `userVariables` column in the `burst` metadata sheet:
```
<0>Alfreds Futterkiste</0><1>Berlin</1>
```

---

## Where Variables Can Be Used

Variables work in these configuration fields:
- **Burst File Name** — customize output file names
- **Output Folder** — dynamic archive locations
- **Backup Folder** — dynamic backup paths
- **Quarantine Folder** — where failed documents go
- **Upload Commands** — FTP/SFTP/HTTP URLs
- **Email To, CC, BCC** — recipient addresses
- **Email Subject & Body** — personalized messages
- **Email Settings** — From Name, From Address, Host, User, Password, Port

---

## Common Patterns

### Default Burst File Name
```
${burst_token}.${input_document_extension}
```
→ `clyde.grew@northwind.com.pdf`

### Custom Invoice File Names
```
${var1}-${burst_token}-${var0}.pdf
```
→ `Alpha Electric-0011-Oct 10, 2023.pdf`

(Where var1 = Customer Name, burst_token = Invoice Number, var0 = Invoice Date)

### Default Output Folder (Timestamped)
```
${input_document_name}/${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}
```
→ `Payslips.pdf/2023.03.04_19.13.13`

### Archive by Year/Quarter
```
Financials/${now?string["yyyy"]}/Q${now?string["q"]}/${input_document_name}
```
→ `Financials/2023/Q2/Monthly_Report.pdf`

### Archive by Customer
```
Invoices/${burst_token}/${var0}
```
→ `Invoices/ACME_Corp/2023-06-15`

---

## Personalized Email Example

**Subject**: `Invoice ${burst_token} for ${var0}`

**Body**:
```
Hi ${var0},

Attached you can find the invoice for the month of ${var1}.

Thank you,
${var2}
```

At runtime, becomes:
```
Hi John,

Attached you can find the invoice for the month of July.

Thank you,
Michelle
```

---

## The White Font Trick

**Problem**: Variable tags like `<0>Customer Name</0>` are visible in the output documents.

**Solution**: Set the tag text to white (or background color) in your report designer:
- Tags are invisible to recipients
- ReportBurster still extracts the values
- Professional-looking output

**Alternative**: Place tags in hidden areas (headers, footers, off-page margins).

---

## Common Pitfalls

1. **Wrong syntax** — Use `${var0}` not `{var0}` or `$var0`
2. **Missing tags in PDF** — Variables stay as `${var0}` if `<0>value</0>` tag not found
3. **Tag not closed** — `<0>value` without `</0>` won't work
4. **Wrong variable number** — `var0` starts at 0, not 1
5. **Excel: wrong column** — User variables must be in `userVariables` column of `burst` metadata sheet
6. **Date format typo** — FreeMarker format strings are case-sensitive (`yyyy` not `YYYY`)
7. **Overwriting files** — Static output folders cause overwrites; use timestamped patterns

---

## Sample Files for Practice

- `samples/Payslips.pdf` — Simple burst tokens (email addresses)
- `samples/Invoices-Oct.pdf` — User-defined variables (customer name, invoice date)
- `samples/Customers-Distinct-Column-Values.xls` — Excel with userVariables column

**My recommendation**: Practice on samples before production to verify variable extraction works correctly.

---

## Documentation Link

- **Variables & Templating**: https://www.reportburster.com/docs/variables-interpolation-templating

When I need specifics on FreeMarker date formats or advanced templating patterns, I fetch this documentation.

---

## My Approach

**UI First** — I configure variables through the Configuration menu, showing users where each field accepts variables.  
**Test Before Production** — Always burst a sample report first to verify variable extraction.  
**White Font for Cleanliness** — I recommend hiding variable tags to keep output documents professional.
