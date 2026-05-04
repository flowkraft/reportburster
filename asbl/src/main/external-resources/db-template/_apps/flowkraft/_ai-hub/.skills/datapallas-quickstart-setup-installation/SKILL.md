# DataPallas QuickStart, Setup & Installation

I guide users through installing DataPallas and getting their first successful burst in 5 minutes.

## Prerequisites I Check For

### Java 17+
- DataPallas requires **Java 17 or higher**
- If Java is missing, DataPallas detects it automatically and offers guided installation
- On Windows, I guide users through the **Chocolatey → Java** installation flow:
  1. Run `DataPallas.exe` as Administrator
  2. Click "Install Chocolatey" when prompted
  3. Restart DataPallas after Chocolatey installs
  4. Click "Install Java" when prompted
  5. Restart DataPallas after Java installs

### Docker (for extra apps)
- Docker is needed for additional DataPallas apps (BI Analytics, Web Portal, etc.)
- Not required for core report bursting/distribution functionality

## Installation Steps I Guide

1. **Download** → https://s3.amazonaws.com/documentburster/newest/datapallas.zip
2. **Extract** → to a simple path like `C:/DataPallas` (avoid paths with spaces)
3. **Launch** → `DataPallas.exe` (Run as Administrator if Java needs installing)

## First Success: Burst the Sample Payslips.pdf

I always recommend users try the sample report first to see DataPallas in action:

- **Location:** `samples/Payslips.pdf`
- **What it does:** 3-page PDF with burst tokens (email addresses in curly braces `{...}`)
- **Output:** 3 separate files named after the employees' email addresses:
  - `clyde.grew@northridgehealth.org.pdf`
  - `kyle.butford@northridgehealth.org.pdf`
  - `alfreda.waldback@northridgehealth.org.pdf`

This demonstrates the core concept: one input document → multiple output documents based on burst tokens.

## Key Concepts I Explain

- **Burst tokens** — markers in the document (default: text inside `{` and `}`) that tell DataPallas where to split
- **Output folder** — where split files are saved (default: `output/`)
- **Naming pattern** — how output files are named (default: uses the burst token value)

## DataPallas: A Complete Reporting Platform

DataPallas is one of the most versatile reporting platforms available — **all-in-one, self-hosted**:

- **Report Generation** — generate reports from databases (SQL, DuckDB, etc.)
- **Report Bursting** — split documents based on burst tokens
- **Report Distribution** — deliver via email, FTP, cloud storage, SMS
- **Self-Service Portal** — web portal for users to access their documents
- **Embeddable Analytics** — OLAP, charts, pivot tables, datatables for dashboards

### Works With Your Existing Software

When users ask "Will DataPallas work with my system?" — the answer is **yes**.

For **report bursting/distribution**, DataPallas can process PDF and Excel files from any source:
- Crystal Reports, SAP, Oracle, Microsoft solutions, Lewis PAY-PACK, MYOB, and legacy systems
- If it can export PDF or Excel with burst tokens, DataPallas can burst and distribute it

For **report generation**, DataPallas connects directly to databases — no need for existing reporting software.

## Troubleshooting Essentials

When users have startup or setup problems, I know these key points:

### Setup Failures
- If UI-based prerequisite installation fails, check `readme-Prerequisites.txt` in the DataPallas folder
- This file contains the same steps but formatted for direct execution in Windows PowerShell/DOS
- Permission issues or specific Windows configurations can cause UI installation to fail — manual install via `readme-Prerequisites.txt` is the fallback

When I need more troubleshooting details, I fetch: https://datapallas.com/docs/troubleshooting
For installation specifics, I fetch: https://datapallas.com/docs/server/installation

## When I Need More Details

I fetch: https://datapallas.com/docs/quickstart

The documentation includes:
- Step-by-step screenshots for every installation phase
- Visual guide for the Chocolatey/Java installation flow
- Screenshots of the sample burst workflow

## My Approach

> **Get users to success fast.** I guide them through installation and their first burst before diving into configuration. Seeing `Payslips.pdf` split into 3 files builds confidence and understanding.
