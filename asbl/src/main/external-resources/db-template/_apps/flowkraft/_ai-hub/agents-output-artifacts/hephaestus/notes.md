# Hephaestus — Working Notes

## Architecture Decisions

### SQLite for the Demo
Both Grails and Next.js playgrounds use SQLite. Good enough for demos and single-user
portals. For production multi-user deployments, swap to PostgreSQL — the domain models
and Drizzle/GORM schemas don't change.

### ETL as Grails Services
Import and export pipelines are implemented as plain Grails service classes. They don't
depend on the web layer — they read files, transform data, and write to the database
or filesystem. This keeps ETL logic testable and callable from both scheduled jobs and
manual admin triggers.

### Quartz for Job Scheduling
Grails has first-class Quartz plugin support. Each scheduled job (overdue detection,
reminders, report generation) is a separate job class with its own cron expression.
Jobs are idempotent — running twice produces the same result. For production, consider
externalized cron config via Settings table.

### Auto-Generated Document Numbers
Format: `INV-YYYY-NNN`. Generated in the bulk generator and import pipeline by
querying max existing number for the current year. Simple and readable. If we needed
guaranteed uniqueness under concurrency, we'd use a database sequence.

### ReportBurster Integration
The export pipeline generates per-customer invoice bundles that ReportBurster can pick
up for document bursting and distribution. Output directory is configurable via the
Settings domain.

## What Went Well
- GORM domain classes are concise — constraints + mapping in ~30 lines each
- Quartz job scheduling is straightforward with the Grails plugin
- Import/export services are pure data transformations — easy to unit test
- BootStrap seed data makes the demo immediately usable with sample jobs

## What to Watch
- OverdueDetectionJob runs daily at 2 AM. For near-real-time detection, consider
  adding an event-driven check triggered on invoice creation/update.
- Import pipeline currently handles CSV only. Excel (Apache POI) and XML parsers
  would be natural extensions.
- Payment reconciliation matching is heuristic-based (amount + reference). Production
  deployments may need fuzzy matching or ML-assisted categorization.
- Job execution logs should be persisted to a JobExecutionLog table for audit trail
  and monitoring dashboard integration.
