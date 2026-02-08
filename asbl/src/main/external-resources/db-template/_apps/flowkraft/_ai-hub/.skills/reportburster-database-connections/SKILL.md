# Database Connections Skill

I guide users through ReportBurster database connections **via the UI**. But I actively read connection files myself to understand their database structure and help build better reports.

## Setting Up Database Connections

ReportBurster works with any JDBC-compatible database: PostgreSQL, MySQL, SQL Server, Oracle, MariaDB, SQLite, and more.

**Menu Path:** Configuration → Connections (Email, Databases) → New Database Connection

After saving, ReportBurster automatically fetches the database schema — this is where things get powerful for me.

---

## Reading Connection Files (For My Own Understanding)

While I guide users through the UI, I **actively read** the connection folder files to understand their database.

### Connection Folder Structure

Each connection creates a folder: `/reportburster/config/connections/<connection-slug>/`

**Always present:**

| File | Purpose |
|------|---------|
| `<connection-slug>.xml` | JDBC URL, host, port, vendor, credentials |

**Almost always present** (created when the user clicks "Test Connection" — technically optional, but in practice nearly every connection has them):

| File | Purpose |
|------|---------|
| `*-information-schema.json` | Raw database schema — tables, columns, types, foreign keys |
| `*-table-names.txt` | Lightweight list of all table/view names — one per line. **Read this first** to know what tables exist before grepping the full schema |

**Other optional files (worth looking for):**

| File | Purpose |
|------|---------|
| `*-domain-grouped-schema.json` | Tables organized by business domain — my gold mine for understanding context |
| `*.puml` or `*-er-diagram.puml` | PlantUML ER diagram — visual representation of table relationships |
| `*-ubiquitous-language.txt` | Domain-Driven Design ubiquitous language glossary — business terms mapped to database entities |

**⚠️ Large File Warning:** Schema files can be huge (thousands of lines for enterprise databases). **Always start with `*-table-names.txt`** — it lists every table/view name in a tiny file. Then grep the full `*-information-schema.json` for specific table names I found there. Never consume all tokens by loading a massive schema file in one go.

---

## How I Use This Knowledge

**Most common use case:** Users ask me for SQL queries or Groovy scripts to use as Data Source when configuring new reports.

When this happens, I read and search these schema files (using whatever tools I have available) to:
- Find relevant tables and columns for their report requirements
- Understand foreign key relationships for proper JOINs
- Discover business domains to suggest tables the user might not know exist
- Check column types before writing queries
- Reference the PlantUML ER diagram (if present) to visualize relationships
- Use the ubiquitous language file (if present) to map business terms to database entities

---

## Data Sources for Report Generation

Once connected, users can pull data via:
- **SQL Query** — direct SQL against the database
- **Groovy Script** — for complex data preparation, master-detail, crosstab reports
- **File Sources** — CSV, TSV, Excel, Fixed-Width when data isn't in a database

---

## Common Pitfalls

- Wrong JDBC driver for database type
- Firewall blocking database port
- Case sensitivity issues (PostgreSQL)
- Schema not refreshed after database changes (re-fetch in UI)
- Missing permissions to see all tables

---

## Documentation Link

- **Database Connections & Report Generation**: https://www.reportburster.com/docs/report-generation#database-connections

When I need specifics on output formats, templates, or data transformations, I fetch this documentation.

---

## My Principle

> **UI First for Users, Schema Files for Me.** I guide users through the UI to set up connections. But I actively read the connection folder files — especially the domain-grouped schema — to understand their data. The schema files are my database cheat sheet.

> **UI First for Users, Schema Files for Me.** I guide users through Configuration → Connections to set up databases. But I actively read the connection folder files — especially the domain-grouped schema — to understand their data landscape. This lets me help write better SQL queries, suggest relevant tables, and troubleshoot data issues intelligently. The schema files are my database cheat sheet.
