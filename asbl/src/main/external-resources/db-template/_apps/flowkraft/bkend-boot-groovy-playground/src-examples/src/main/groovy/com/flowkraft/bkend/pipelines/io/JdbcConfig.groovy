package com.flowkraft.bkend.pipelines.io

import org.apache.beam.sdk.io.jdbc.JdbcIO

/**
 * Reusable JDBC configuration for Apache Beam pipelines.
 *
 * Centralizes database connection settings so pipeline scripts
 * don't repeat connection strings everywhere.
 *
 * Usage in a pipeline:
 *   .apply("WriteToDB", JdbcIO.<String[]>write()
 *       .withDataSourceConfiguration(JdbcConfig.defaultConfig())
 *       .withStatement("INSERT INTO ...")
 *       ...)
 *
 * Customize:
 *   - Change the default driver/URL/credentials below
 *   - Add more named configs (e.g., warehouseConfig(), analyticsConfig())
 *   - Use environment variables for production credentials
 */
class JdbcConfig {

    /**
     * Default database configuration.
     * Uses SQLite as shipped with DataPallas — change for your database.
     */
    static JdbcIO.DataSourceConfiguration defaultConfig() {
        return JdbcIO.DataSourceConfiguration.create(
            "org.sqlite.JDBC",
            "jdbc:sqlite:/datapallas/db/sample-northwind-sqlite/northwind.db"
        )
        // For databases that need credentials:
        // .withUsername(System.getenv("DB_USER") ?: "your_username")
        // .withPassword(System.getenv("DB_PASS") ?: "your_password")
    }

    // ─────────────────────────────────────────────────────────────────
    // ADD MORE CONFIGS AS NEEDED:
    //
    // static JdbcIO.DataSourceConfiguration warehouseConfig() {
    //     return JdbcIO.DataSourceConfiguration.create(
    //         "com.clickhouse.jdbc.ClickHouseDriver",
    //         "jdbc:clickhouse://localhost:8123/analytics"
    //     )
    //     .withUsername("default")
    //     .withPassword("")
    // }
    //
    // static JdbcIO.DataSourceConfiguration postgresConfig() {
    //     return JdbcIO.DataSourceConfiguration.create(
    //         "org.postgresql.Driver",
    //         "jdbc:postgresql://localhost:5432/mydb"
    //     )
    //     .withUsername(System.getenv("PG_USER"))
    //     .withPassword(System.getenv("PG_PASS"))
    // }
    // ─────────────────────────────────────────────────────────────────
}
