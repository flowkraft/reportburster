# Scripting Skill

I help users extend ReportBurster with custom Groovy scripts for advanced report distribution scenarios — things the standard UI doesn't cover out of the box.

## When Scripting Is Needed

Standard UI handles most distribution. Scripting is for:
- Zipping output files together
- Encrypting/password-protecting reports
- Printing reports to physical printers
- Uploading via FTP/SFTP/HTTP with custom logic
- Fetching distribution details from database or CSV
- Conditional distribution (skip files based on size, content, etc.)
- Merging reports with external documents
- Calling external programs (pdftk, Foxit Reader, etc.)

---

## Burst Lifecycle Events

Scripts hook into predefined exit points during bursting:

| Event | When It Fires |
|-------|---------------|
| `startBursting` | Burst begins |
| `startParsePage` / `endParsePage` | Before/after each page is parsed |
| `startExtractDocument` / `endExtractDocument` | Before/after each report is extracted |
| `startDistributeDocument` / `endDistributeDocument` | Before/after each report is distributed |
| `quarantineDocument` | When distribution fails |
| `endBursting` | Burst completes |

**Most Common Hooks:**
- `endExtractDocument` — the go-to event for most scenarios. Fires after each report is extracted, perfect for per-file operations (zip, encrypt, upload, conditional skip). **Example:** Upload reports to the Self-Service Web Portal via cURL + REST API — if it's a custom Grails/NextJS portal, use the API you built; if it's WordPress-powered, use the [WordPress REST API](https://developer.wordpress.org/rest-api/reference/).
- `startDistributeDocument` — ideal for conditional distribution based on custom business logic (set `ctx.skipCurrentFileDistribution = true` to skip sending a report).
- `endBursting` — useful for batch operations after all reports are processed (summary email, cleanup, final upload).

Scripts live in `scripts/burst/` — one file per event (e.g., `endBursting.groovy`, `endExtractDocument.groovy`).

---

## The Bursting Context (`ctx`)

Scripts access the `ctx` object with runtime information:

- `ctx.token` — current burst token
- `ctx.extractedFilePath` — path to current extracted file
- `ctx.outputFolder`, `ctx.quarantineFolder` — folder paths
- `ctx.variables` — access built-in and user variables
- `ctx.settings` — current configuration settings
- `ctx.skipCurrentFileDistribution` — set to `true` to skip distribution
- `ctx.numberOfExtractedFiles`, `ctx.numberOfDistributedFiles` — counters

---

## Sample Scripts

ReportBurster includes ready-to-use samples in `scripts/burst/samples/`:

| Script | Purpose |
|--------|---------|
| `zip.groovy` | Zip all output files together |
| `encrypt.groovy` | Password-protect PDFs |
| `print.groovy` | Send to printer |
| `batch_pdf_print.groovy` | Batch print multiple PDF files |
| `copy_shared_folder.groovy` | Copy to network share |
| `ant_ftp.groovy`, `ant_scp_sftp.groovy` | Upload via FTP/SFTP |
| `ant_mail.groovy` | Send email using Apache Ant mail task |
| `ant_vfs.groovy` | Virtual filesystem operations using Apache Ant VFS |
| `curl_ftp.groovy`, `curl_sftp.groovy` | Upload via cURL |
| `curl_invoice2portal.groovy` | Publish invoices to a web portal via REST API |
| `curl_payslip2portal.groovy` | Publish payslips to a web portal via REST API |
| `curl_paystub2portal.groovy` | Publish paystubs to a web portal via REST API |
| `fetch_distribution_details_from_database.groovy` | Fetch recipient info from DB |
| `fetch_distribution_details_from_csv_file.groovy` | Fetch recipient info from CSV |
| `skip_current_file_distribution_if.groovy` | Conditional distribution |
| `merge_with_external_files.groovy` | Merge PDFs |
| `exec_pdftk_background.groovy` | Add PDF background/watermark using pdftk |
| `overlay.groovy` | Overlay content on PDF pages |
| `add_and_format_page_numbers.groovy` | Add page numbers |
| `email_html_cid_embedded_images.groovy` | Send HTML emails with CID-embedded inline images |
| `rclone_sync_cloud.groovy` | Sync to cloud storage |

> **Note:** Each `.groovy` sample file contains detailed inline documentation — usage instructions, configuration options, and code comments explaining how to adapt the script. When a user needs help with a scripting scenario, **read the actual `.groovy` file** in `scripts/burst/samples/` to get the full context before advising.

---

## cURL Integration

cURL handles uploads for FTP, FTPS, SFTP, HTTP, HTTPS, and more. ReportBurster bundles cURL on Windows.

Sample scripts: `curl_ftp.groovy`, `curl_sftp.groovy`

Common options:
- `--ftp-create-dirs` — create missing directories
- `-T <file>` — upload file
- `-u user:password` — authentication
- `-v` or `--trace` — debugging

---

## How I Use This Knowledge

When users need custom distribution logic:

1. I identify which lifecycle event fits their requirement
2. I read the relevant sample script in `scripts/burst/samples/`
3. I understand the pattern, then give them a customized script
4. I tell them which file to paste it into (e.g., `scripts/burst/endExtractDocument.groovy`)

---

## My Working Mode (Read-Only)

I read sample scripts and documentation to understand patterns. I **don't write files directly**.

When I provide Groovy scripts, I:
1. Explain what the script does
2. Give the complete code to copy
3. Tell the user exactly where to paste it (e.g., `scripts/burst/endBursting.groovy`)

---

## Documentation Links

- **Scripting**: https://www.reportburster.com/docs/advanced/scripting
- **cURL Integration**: https://www.reportburster.com/docs/advanced/curl

When I need specifics on lifecycle events, ctx variables, or cURL options, I fetch these docs.

---

## My Principle

> **Sample Scripts Are Starting Points.** I read the samples to understand patterns — zip, encrypt, upload, conditional skip. Then I customize for the user's specific need. Most scripting requirements are variations of existing samples.
