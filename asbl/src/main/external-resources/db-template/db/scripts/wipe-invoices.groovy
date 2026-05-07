// @description Drops all seed_inv_* tables from the target database (convention-based — survives schema evolution)
// Bindings provided by GenericSeedExecutor:
//   dbSql  — groovy.sql.Sql connected to the target database
//   vendor — String (uppercase): POSTGRES, MYSQL, MARIADB, SQLSERVER, ORACLE, DB2, SUPABASE,
//                                CLICKHOUSE, SQLITE, DUCKDB
//   log    — SLF4J Logger
//   params — Map (unused by this template)

log.info("=== Wipe Seeded Invoice Data: Starting for {} ===", vendor)

boolean isClickHouse    = (vendor == 'CLICKHOUSE')
boolean isMysqlFamily   = (vendor in ['MYSQL', 'MARIADB'])
boolean isPostgresFamily = (vendor in ['POSTGRES', 'SUPABASE', 'POSTGRESQL'])
boolean isSqlServer     = (vendor == 'SQLSERVER')
boolean isOracle        = (vendor == 'ORACLE')
boolean isDb2           = (vendor in ['DB2', 'IBMDB2'])
boolean isSqlite        = (vendor == 'SQLITE')

// ── 1. Discover existing seed_inv_* tables (vendor-specific catalog) ──────────
// Children first so DROP can proceed without FK violations

List<String> tables = []

try {
    if (isOracle) {
        dbSql.eachRow("SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE 'SEED_INV_%' ORDER BY TABLE_NAME DESC") { row ->
            tables << row.TABLE_NAME
        }
    } else if (isSqlServer) {
        dbSql.eachRow("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_NAME LIKE 'seed_inv_%' ORDER BY TABLE_NAME DESC") { row ->
            tables << row.TABLE_NAME
        }
    } else if (isClickHouse) {
        dbSql.eachRow("SELECT name FROM system.tables WHERE name LIKE 'seed_inv_%' ORDER BY name DESC") { row ->
            tables << row.name
        }
    } else if (isSqlite) {
        // SQLite has no INFORMATION_SCHEMA — use sqlite_master
        dbSql.eachRow("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'seed_inv_%' ORDER BY name DESC") { row ->
            tables << row.name
        }
    } else {
        // PostgreSQL, MySQL, MariaDB, DB2, DuckDB, Supabase
        dbSql.eachRow("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'seed_inv_%' ORDER BY TABLE_NAME DESC") { row ->
            tables << (row.TABLE_NAME ?: row.table_name)
        }
    }
} catch (Exception e) {
    log.warn("Could not query catalog for {} ({}). Falling back to fixed table list.", vendor, e.getMessage())
    // Fall back to the canonical four tables in child-first order
    tables = ['seed_inv_invoice_line', 'seed_inv_invoice', 'seed_inv_product', 'seed_inv_customer']
}

if (tables.isEmpty()) {
    log.info("No seed_inv_* tables found — nothing to wipe.")
    return
}

log.info("Tables to drop: {}", tables)

// ── 2. Disable FK constraints, drop tables, re-enable ────────────────────────

def safeDdl = { String sql ->
    try { dbSql.execute(sql) }
    catch (Exception e) { log.debug("DDL skipped: {}", e.getMessage()) }
}

def doDrop = {
    if (isMysqlFamily) {
        dbSql.execute("SET FOREIGN_KEY_CHECKS = 0")
        tables.each { t -> safeDdl("DROP TABLE IF EXISTS ${t}".toString()) }
        dbSql.execute("SET FOREIGN_KEY_CHECKS = 1")
    } else if (isPostgresFamily) {
        tables.each { t -> safeDdl("DROP TABLE IF EXISTS ${t} CASCADE".toString()) }
    } else if (isSqlServer) {
        tables.each { t ->
            safeDdl("IF OBJECT_ID('${t}','U') IS NOT NULL DROP TABLE ${t}".toString())
        }
    } else if (isOracle) {
        tables.each { t ->
            safeDdl("DROP TABLE ${t} CASCADE CONSTRAINTS PURGE".toString())
        }
    } else if (isClickHouse) {
        tables.each { t -> safeDdl("DROP TABLE IF EXISTS ${t}".toString()) }
    } else {
        // DB2, SQLite, DuckDB, and fallback
        tables.each { t -> safeDdl("DROP TABLE IF EXISTS ${t}".toString()) }
    }
}

// DROP TABLE is DDL on every vendor (Oracle / MySQL / MariaDB / SQL Server / DB2 /
// PostgreSQL / SQLite / DuckDB / ClickHouse) — it auto-commits and cannot participate
// in a rollback. Wrapping it in dbSql.withTransaction would be misleading dressing,
// so we just run the drops directly. Each individual DROP is wrapped in safeDdl to
// tolerate "table doesn't exist" / FK-blocked / locked-by-other-session conditions.
doDrop()

log.info("=== Wipe Seeded Invoice Data: COMPLETED — dropped {} table(s) for vendor {} ===", tables.size(), vendor)
