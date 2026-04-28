# src-examples

Ready-to-use Groovy scripts for common automation and data processing tasks. These files are **not part of the running app** — they are templates you copy into `src/` when you need them.

The folder structure mirrors `src/` exactly — same packages, same layout. Copy what you need and it works immediately.

## How to Use

1. **Browse** this folder to find what you need
2. **Copy** the file(s) into the matching path under `src/`
3. **Customize** — edit paths, connection strings, cron expressions, etc.
4. **Rebuild** the app (`./mvnw clean package` or restart with `docker compose up --build`)

That's it. Once a file is in `src/`, it becomes part of your app — compiled, Spring-managed, production-ready.

## What's Available

### Cron Jobs (`crons/`)

| File | Description |
|---|---|
| `crons.groovy` | Scheduled tasks — Excel refresh + dbt transforms. Uncomment `@Scheduled` to activate. |

### Helpers (`helpers/`)

| File | Description |
|---|---|
| `DbtHelper.groovy` | Runs dbt transforms via `docker compose run dbt-transform run`. |
| `ExcelHelper.groovy` | Refreshes Power Query / Power Pivot / ODBC in Excel workbooks (Windows only, uses JACOB COM). |

### Data Pipelines (`pipelines/`)

Built with [Apache Beam](https://beam.apache.org/) — a unified model for batch and streaming data processing.

| File | Type | Description |
|---|---|---|
| `batch/CustomerIngestionPipeline.groovy` | Batch | Read customer CSV, transform, write to database. |
| `batch/InvoiceReportPipeline.groovy` | Batch | Read invoice CSV, validate, write to database. Uses reusable transforms. |
| `streaming/EventStreamPipeline.groovy` | Streaming | Watch for new event files, process in time windows. |
| `streaming/FileWatcherPipeline.groovy` | Streaming | Watch a directory for new CSVs, ingest into database. |
| `transforms/CsvParserFn.groovy` | Reusable DoFn | Parse CSV lines into String arrays. Skip headers, handle delimiters. |
| `transforms/ValidationFn.groovy` | Reusable DoFn | Validate rows — check required fields, minimum field count. |
| `io/JdbcConfig.groovy` | Reusable config | Centralized JDBC connection settings for pipelines. |

### Controllers (`controllers/`)

| File | Description |
|---|---|
| `PipelineController.groovy` | REST endpoints to trigger pipelines on demand (`POST /api/pipelines/...`). |

## Quick Start Examples

### Add Scheduled Excel Refresh

```
# Copy the files you need
cp src-examples/src/main/groovy/com/flowkraft/bkend/crons/crons.groovy \
   src/main/groovy/com/flowkraft/bkend/crons/
cp src-examples/src/main/groovy/com/flowkraft/bkend/helpers/ExcelHelper.groovy \
   src/main/groovy/com/flowkraft/bkend/helpers/

# Edit crons.groovy — set your file paths and uncomment @Scheduled:
#   @Scheduled(cron = "0 0 5 * * MON-FRI")   // 5 AM every weekday

# Rebuild
./mvnw clean package -DskipTests
```

### Add a Batch Data Pipeline

```
# Copy the entire pipelines folder (includes transforms, io, batch, streaming)
cp -r src-examples/src/main/groovy/com/flowkraft/bkend/pipelines/ \
      src/main/groovy/com/flowkraft/bkend/pipelines/

# Edit CustomerIngestionPipeline.groovy — set your CSV path and DB config

# To run it on a schedule, also copy crons.groovy and add a new method:
#   @Scheduled(cron = "0 0 2 * * *")  // 2 AM every day
#   void runCustomerIngestion() {
#       CustomerIngestionPipeline.run('/data/daily-export.csv')
#   }

# Rebuild
./mvnw clean package -DskipTests
```

### Add REST Endpoints for Pipelines

```
# Copy pipelines + controllers
cp -r src-examples/src/main/groovy/com/flowkraft/bkend/pipelines/ \
      src/main/groovy/com/flowkraft/bkend/pipelines/
cp -r src-examples/src/main/groovy/com/flowkraft/bkend/controllers/ \
      src/main/groovy/com/flowkraft/bkend/controllers/

# Rebuild, then trigger via HTTP:
curl -X POST http://localhost:8080/api/pipelines/customer-ingestion \
     -H "Content-Type: application/json" \
     -d '{"inputPath": "/data/customers.csv"}'
```

## Cron Scheduling Reference

`crons.groovy` uses Spring's `@Scheduled` annotation. Uncomment `@Scheduled` to activate.

**Cron format**: `second minute hour day-of-month month day-of-week`

| Schedule | Expression |
|---|---|
| Every weekday at 5 AM | `0 0 5 * * MON-FRI` |
| Every hour at :30 | `0 30 * * * *` |
| Every 15 minutes | `0 0/15 * * * *` |
| 2 AM every day (nightly) | `0 0 2 * * *` |
| Midnight every night | `0 0 0 * * *` |
| Every Monday at 6 AM | `0 0 6 * * MON` |

## Apache Beam Reference

Three Apache Beam JARs are included in `pom.xml`:

| JAR | What It Provides |
|---|---|
| `beam-sdks-java-core` | Pipeline, PCollection, transforms (Map, Filter, GroupByKey, etc.) |
| `beam-runners-direct-java` | Local execution — single JVM, no cluster needed |
| `beam-sdks-java-io-jdbc` | Read/write any JDBC database (SQLite, PostgreSQL, MySQL, etc.) |

The core SDK also includes `TextIO` (CSV/text files), `FileIO` (advanced file ops), and `AvroIO` (Avro format) — no extra JARs needed.

**Need more connectors?** Use `@Grab` in your Groovy file to pull additional JARs at runtime:

```groovy
@Grab('org.apache.beam:beam-sdks-java-io-kafka:2.72.0')         // Kafka
@Grab('org.apache.beam:beam-sdks-java-io-parquet:2.72.0')       // Parquet files
@Grab('org.apache.beam:beam-sdks-java-io-mongodb:2.72.0')       // MongoDB
@Grab('org.apache.beam:beam-sdks-java-io-elasticsearch:2.72.0') // Elasticsearch
```

## Creating Your Own

1. Create a `.groovy` file in `src/main/groovy/com/flowkraft/bkend/` (any subfolder)
2. Add `package com.flowkraft.bkend.yourfolder` at the top
3. Use any dependency from `pom.xml` directly, or `@Grab` for extras
4. For scheduled tasks: add `@Component` + `@Scheduled` (see `crons/crons.groovy`)
5. For data pipelines: follow the Beam pattern in `pipelines/`

The examples in this folder are starting points — copy, modify, and make them your own.
