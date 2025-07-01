package com.sourcekraft.documentburster.common.db; // Corrected package based on file path

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException; // Added for mkdirs exception
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature; 

import com.sourcekraft.documentburster.common.db.schema.ColumnSchema;
import com.sourcekraft.documentburster.common.db.schema.ForeignKeySchema;
import com.sourcekraft.documentburster.common.db.schema.IndexSchema;
import com.sourcekraft.documentburster.common.db.schema.SchemaInfo;
import com.sourcekraft.documentburster.common.db.schema.TableSchema;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.common.settings.model.DocumentBursterConnectionDatabaseSettings;
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;

/**
 * Fetches database schema information (tables, views, columns, keys, indexes)
 * using JDBC {@link DatabaseMetaData}.
 *
 * <p>The goal is to extract comprehensive metadata that can be provided to
 * Large Language Models (LLMs) to aid in generating accurate SQL queries
 * from natural language requirements. Rich metadata helps the LLM "understand"
 * the database structure, relationships, data types, and semantics.</p>
 *
 * <p>Key metadata elements and their importance for LLMs:</p>
 * <ul>
 *   <li><b>Table/View Names & Types:</b> Essential for targeting the right data sources.</li>
 *   <li><b>Column Names:</b> Basic requirement for selecting data.</li>
 *   <li><b>Data Types (JDBC & DB-specific):</b> Crucial for correct comparisons, function usage, and handling (e.g., quoting strings). Precision/scale for numerics aids accuracy.</li>
 *   <li><b>Nullability:</b> Informs the LLM about required fields and how to handle NULL checks.</li>
 *   <li><b>Column Remarks/Comments:</b> Highly valuable for semantic mapping. Allows the LLM to connect natural language terms (e.g., "customer name") to specific database columns (e.g., "CUST_FNAME").</li>
 *   <li><b>Default Values:</b> Helps understand expected data if not explicitly provided in INSERTs or queries.</li>
 *   <li><b>Primary Keys:</b> Identify unique records within a table.</li>
 *   <li><b>Foreign Keys:</b> Define relationships between tables, critical for generating correct JOIN conditions.</li>
 *   <li><b>Indexes:</b> Indicate uniqueness constraints (if unique) and potentially frequently queried/joined columns, offering hints for query optimization.</li>
 * </ul>
 */
public class DatabaseSchemaFetcher {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaFetcher.class);
    private final ObjectMapper objectMapper; // Jackson ObjectMapper for JSON handling

    /**
     * Constructs a fetcher and initializes the Jackson ObjectMapper for JSON handling.
     */
    public DatabaseSchemaFetcher() {
        this.objectMapper = new ObjectMapper();
        // Configure for pretty printing JSON output
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        // Optional: Configure to not fail on empty beans if needed
        // this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    /**
     * Fetches the database schema based on the provided connection settings.
     * Orchestrates the connection establishment, metadata retrieval, and connection closing.
     *
     * @param settings The server database settings containing connection details.
     * @return A {@link SchemaInfo} object populated with the fetched schema details.
     * @throws Exception If any error occurs during the process (connection, SQL, driver issues).
     */
    public SchemaInfo fetchSchema(String connectionFilePath) throws Exception {
    	Settings settings = new Settings(StringUtils.EMPTY);

		// 1. Load connection settings directly using JAXB (similar to doCheckEmail
		// pattern)
		DocumentBursterConnectionDatabaseSettings dbSettings = settings
				.loadSettingsConnectionDatabaseByPath(connectionFilePath);

		ServerDatabaseSettings serverSettings = dbSettings.connection.databaseserver;

    	
    	// ... (validation remains the same) ...
        if (settings == null || StringUtils.isBlank(serverSettings.type)) {
            throw new IllegalArgumentException("Database settings or type cannot be null or blank.");
        }

        String dbType = serverSettings.type.toLowerCase();
        log.info("Attempting to fetch schema for database type: {}", dbType);

        Connection connection = null;
        try {
            // --- Step 1: Establish Connection ---
            connection = getConnection(serverSettings);
            log.info("Successfully established connection for schema fetching.");

            // --- Step 2: Fetch Metadata ---
            DatabaseMetaData metaData = connection.getMetaData();
            SchemaInfo schemaInfo = new SchemaInfo();

            // --- Fetch Core Schema Elements ---
            // This method now fetches tables, views, columns, PKs, FKs, and indexes.
            fetchTablesAndColumns(metaData, schemaInfo, serverSettings);

            log.info("Successfully fetched schema metadata.");
            return schemaInfo;

        } catch (Exception e) {
            log.error("Failed to fetch database schema for type '{}'. Reason: {}", dbType, e.getMessage(), e);
            throw e; // Re-throw to signal failure
        } finally {
            // --- Step 3: Close Connection ---
            if (connection != null) {
                try {
                    connection.close();
                    log.debug("Database connection closed.");
                } catch (SQLException e) {
                    log.warn("Error closing database connection: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Saves the fetched schema information to a JSON file.
     * Uses Jackson ObjectMapper for serialization. Ensures parent directories exist.
     *
     * @param schemaInfo The {@link SchemaInfo} object to save.
     * @param outputPath The full path to the output JSON file.
     * @throws Exception If saving fails (I/O error, serialization error).
     */
    public void saveSchemaToJson(SchemaInfo schemaInfo, String outputPath) throws Exception {
        // ... (validation remains the same) ...
        if (schemaInfo == null) {
            throw new IllegalArgumentException("SchemaInfo object cannot be null.");
        }
        if (StringUtils.isBlank(outputPath)) {
            throw new IllegalArgumentException("Output JSON file path cannot be blank.");
        }

        File outputFile = new File(outputPath);
        // Ensure parent directory exists
        File parentDir = outputFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            log.info("Creating parent directory for JSON output: {}", parentDir.getAbsolutePath());
            if (!parentDir.mkdirs()) {
                // Use IOException for file system operation failure
                throw new IOException("Failed to create parent directory: " + parentDir.getAbsolutePath());
            }
        }


        log.info("Saving fetched schema to JSON file: {}", outputPath);
        try {
            objectMapper.writeValue(outputFile, schemaInfo);
            log.info("Schema successfully saved to {}", outputPath);
        } catch (Exception e) {
            log.error("Failed to write schema to JSON file '{}': {}", outputPath, e.getMessage(), e);
            throw new Exception("Failed to save schema to JSON.", e);
        }
    }

     /**
     * Loads schema information from a JSON file.
     * Uses Jackson ObjectMapper for deserialization.
     *
     * @param inputPath The full path to the input JSON file.
     * @return The loaded {@link SchemaInfo} object.
     * @throws Exception If loading fails (file not found, parsing error, I/O error).
     */
    public SchemaInfo loadSchemaFromJson(String inputPath) throws Exception {
        // ... (validation remains the same) ...
        if (StringUtils.isBlank(inputPath)) {
            throw new IllegalArgumentException("Input JSON file path cannot be blank.");
        }
        File inputFile = new File(inputPath);
        if (!inputFile.exists() || !inputFile.isFile()) {
             // Use specific FileNotFoundException
             throw new FileNotFoundException("Schema JSON file not found or is not a file: " + inputPath);
        }

        log.info("Loading schema from JSON file: {}", inputPath);
        try {
            SchemaInfo schemaInfo = objectMapper.readValue(inputFile, SchemaInfo.class);
            log.info("Schema successfully loaded from {}", inputPath);
            return schemaInfo;
        } catch (Exception e) {
            log.error("Failed to read or parse schema from JSON file '{}': {}", inputPath, e.getMessage(), e);
            throw new Exception("Failed to load schema from JSON.", e);
        }
    }


    // --- Private Helper Methods ---

    /**
     * Establishes a JDBC connection based on settings.
     * Loads the appropriate driver and uses {@link DriverManager} to connect.
     * Handles basic URL construction for supported database types.
     * (Consider refactoring connection logic into a shared utility if needed elsewhere).
     *
     * @param settings The database connection settings.
     * @return An active {@link Connection}.
     * @throws Exception If driver loading or connection fails.
     */
    private Connection getConnection(ServerDatabaseSettings settings) throws Exception {
        // ... (implementation remains the same) ...
        String dbType = settings.type.toLowerCase();
        Connection connection = null;

        // --- Driver Loading ---
        String driverClass = getDriverClass(dbType);
        String jdbcUrl = getJdbcUrl(settings);

        if (driverClass == null || jdbcUrl == null) {
             throw new UnsupportedOperationException("Database type '" + dbType + "' is not supported for connection.");
        }

        try {
            log.debug("Loading JDBC driver: {}", driverClass);
            Class.forName(driverClass);
            log.info("JDBC driver loaded successfully.");
        } catch (ClassNotFoundException e) {
            log.error("JDBC Driver ({}) not found. Ensure it's in the classpath.", driverClass, e);
            throw new RuntimeException("JDBC Driver not found: " + driverClass, e);
        }

        // --- Connection Attempt ---
        try {
            log.debug("Attempting to connect using JDBC URL: {}", jdbcUrl);
            // Add user/password for non-SQLite types
            if ("sqlite".equals(dbType)) {
                 connection = DriverManager.getConnection(jdbcUrl);
            } else {
                 // Basic example, might need Properties object for more options (SSL etc.)
                 connection = DriverManager.getConnection(jdbcUrl, settings.userid, settings.userpassword);
            }
            return connection;
        } catch (SQLException e) {
            log.error("SQL error during connection attempt: {} (SQLState: {}, ErrorCode: {})", e.getMessage(), e.getSQLState(), e.getErrorCode());
            throw new Exception("Failed to establish database connection.", e);
        }
    }

    /**
     * Determines the JDBC driver class name based on database type.
     * Contains a mapping from simple type names (e.g., "oracle") to fully qualified driver class names.
     *
     * @param dbType The lower-case database type string.
     * @return The driver class name, or null if the type is not supported.
     */
    private String getDriverClass(String dbType) {
        // ... (implementation remains the same) ...
        switch (dbType) {
            case "sqlite": return "org.sqlite.JDBC";
            case "oracle": return "oracle.jdbc.driver.OracleDriver"; // Example
            case "sqlserver": return "com.microsoft.sqlserver.jdbc.SQLServerDriver"; // Example
            case "postgresql": return "org.postgresql.Driver"; // Example
            case "mysql": return "com.mysql.cj.jdbc.Driver"; // Example (use cj driver)
            case "mariadb": return "org.mariadb.jdbc.Driver"; // Example
            case "ibmdb2": return "com.ibm.db2.jcc.DB2Driver"; // Example (Type 4)
            default:
                log.warn("No JDBC driver class configured for database type: {}", dbType);
                return null;
        }
    }

    /**
     * Constructs the JDBC URL based on database type and settings.
     * Provides basic URL formats for supported types.
     * **Note:** Real-world URL construction often requires handling more options (SSL, timeouts, etc.).
     *
     * @param settings The database connection settings.
     * @return The constructed JDBC URL, or null if the type is not supported.
     */
    private String getJdbcUrl(ServerDatabaseSettings settings) {
        // ... (implementation remains the same, but needs enhancement for production use) ...
         String dbType = settings.type.toLowerCase();
         switch (dbType) {
            case "sqlite":
                if (StringUtils.isBlank(settings.database)) return null; // Path is required
                // Ensure forward slashes for JDBC compatibility, even on Windows
                return "jdbc:sqlite:" + settings.database.replace("\\", "/");
            case "oracle":
                // Example: jdbc:oracle:thin:@//<host>:<port>/<service_name_or_sid>
                // Needs refinement for Service Name vs SID, TNSNames, etc.
                return String.format("jdbc:oracle:thin:@//%s:%s/%s", settings.host, settings.port, settings.database);
            case "sqlserver":
                 // Example: jdbc:sqlserver://<host>:<port>;databaseName=<database>;encrypt=...;trustServerCertificate=...
                 // Needs robust handling of settings.usessl and related properties.
                 String sslProps = settings.usessl ? ";encrypt=true;trustServerCertificate=true" : ";encrypt=false"; // Simplified example
                 return String.format("jdbc:sqlserver://%s:%s;databaseName=%s%s", settings.host, settings.port, settings.database, sslProps);
            case "postgresql":
                 // Example: jdbc:postgresql://<host>:<port>/<database>?ssl=true&sslmode=require...
                 // Needs robust handling of settings.usessl and sslmode.
                 String pgSsl = settings.usessl ? "?ssl=true&sslmode=prefer" : ""; // Simplified example
                 return String.format("jdbc:postgresql://%s:%s/%s%s", settings.host, settings.port, settings.database, pgSsl);
            case "mysql":
                 // Example: jdbc:mysql://<host>:<port>/<database>?useSSL=true&requireSSL=true...
                 // Needs robust handling of settings.usessl.
                 String mysqlSsl = settings.usessl ? "?useSSL=true&requireSSL=true" : "?useSSL=false"; // Simplified example
                 return String.format("jdbc:mysql://%s:%s/%s%s", settings.host, settings.port, settings.database, mysqlSsl);
            case "mariadb":
                 // Example: jdbc:mariadb://<host>:<port>/<database>?useSSL=true...
                 // Needs robust handling of settings.usessl.
                 String mariaSsl = settings.usessl ? "?useSSL=true" : "?useSSL=false"; // Simplified example
                 return String.format("jdbc:mariadb://%s:%s/%s%s", settings.host, settings.port, settings.database, mariaSsl);
            case "ibmdb2":
                 // Example: jdbc:db2://<host>:<port>/<database>:sslConnection=true;...
                 // Needs robust handling of settings.usessl.
                 String db2Ssl = settings.usessl ? ":sslConnection=true;" : ""; // Simplified example
                 return String.format("jdbc:db2://%s:%s/%s%s", settings.host, settings.port, settings.database, db2Ssl);
            default:
                log.warn("Cannot construct JDBC URL for unsupported database type: {}", dbType);
                return null;
        }
    }


    /**
     * Fetches metadata for tables, views, columns, primary keys, foreign keys, and indexes.
     * Iterates through tables and views obtained from {@link DatabaseMetaData#getTables(String, String, String, String[])},
     * then calls specific methods to fetch details for each object.
     * Includes filtering for system objects.
     *
     * @param metaData The {@link DatabaseMetaData} instance from the connection.
     * @param schemaInfo The {@link SchemaInfo} object to populate.
     * @param settings The database settings, used for determining catalog/schema and filtering.
     * @throws SQLException If a database access error occurs.
     */
    private void fetchTablesAndColumns(DatabaseMetaData metaData, SchemaInfo schemaInfo, ServerDatabaseSettings settings) throws SQLException {
        // Determine appropriate catalog and schema patterns for the specific database vendor.
        String catalog = getCatalog(settings, metaData);
        String schemaPattern = getSchemaPattern(settings, metaData);
        String tableNamePattern = "%"; // Wildcard for all tables/views
        String[] types = {"TABLE", "VIEW"}; // Fetch both tables and views

        log.debug("Fetching tables/views (catalog={}, schemaPattern={}, tableNamePattern={}, types={})...",
                  catalog, schemaPattern, tableNamePattern, String.join(",", types));

        try (ResultSet tablesResultSet = metaData.getTables(catalog, schemaPattern, tableNamePattern, types)) {
            while (tablesResultSet.next()) {
                String tableName = tablesResultSet.getString("TABLE_NAME");
                String tableType = tablesResultSet.getString("TABLE_TYPE");
                // Fetch table remarks directly from getTables result set.
                String tableRemarks = tablesResultSet.getString("REMARKS");

                // Filter out system tables/views based on naming conventions.
                // This is heuristic and might need refinement per database vendor.
                if (isSystemTableOrView(tableName, tableType, settings.type)) {
                     log.debug("Skipping potential system object: {} (Type: {})", tableName, tableType);
                     continue;
                }

                log.info("Processing object: {} (Type: {})", tableName, tableType);
                TableSchema tableSchema = new TableSchema();
                tableSchema.tableName = tableName;
                tableSchema.tableType = tableType;
                // Assign the fetched remarks to the TableSchema.
                tableSchema.remarks = tableRemarks;
                // The 'description' field remains null here; it's intended for supplementary info.

                // Fetch Columns for this table/view
                // Column metadata (types, nullability, remarks, defaults) is crucial for LLMs.
                fetchColumnsForTable(metaData, catalog, schemaPattern, tableName, tableSchema);

                // Fetch Primary Keys (usually only relevant for TABLE type)
                // PKs help LLMs identify unique records.
                if ("TABLE".equalsIgnoreCase(tableType)) {
                    fetchPrimaryKeysForTable(metaData, catalog, schemaPattern, tableName, tableSchema);
                }

                // Fetch Foreign Keys (usually only relevant for TABLE type)
                // FKs define relationships, essential for LLMs to generate JOINs.
                 if ("TABLE".equalsIgnoreCase(tableType)) {
                    fetchForeignKeysForTable(metaData, catalog, schemaPattern, tableName, tableSchema);
                 }

                // Fetch Indexes (usually only relevant for TABLE type)
                // Indexes provide uniqueness info and optimization hints for LLMs.
                 if ("TABLE".equalsIgnoreCase(tableType)) {
                    fetchIndexesForTable(metaData, catalog, schemaPattern, tableName, tableSchema);
                 }

                schemaInfo.tables.add(tableSchema);
            }
        }
    }

     /**
     * Helper method to determine the catalog name to use in {@link DatabaseMetaData} calls.
     * The concept of "catalog" varies between databases. Often null is appropriate.
     * This method provides a basic default and can be overridden or enhanced for specific vendors.
     *
     * @param settings The database settings.
     * @param metaData The DatabaseMetaData instance.
     * @return The catalog name (often null).
     * @throws SQLException If metadata access fails.
     */
    protected String getCatalog(ServerDatabaseSettings settings, DatabaseMetaData metaData) throws SQLException {
        // Default: null often works best across different databases.
        // Some databases might use settings.database as the catalog.
        // Example: For SQL Server, metaData.getConnection().getCatalog() might be relevant.
        return null;
    }

    /**
     * Helper method to determine the schema pattern to use in {@link DatabaseMetaData} calls.
     * The concept of "schema" varies (e.g., Oracle/DB2 User, PostgreSQL Schema, SQL Server Schema, MySQL/MariaDB Database).
     * This method provides a basic default and needs careful adjustment per vendor.
     *
     * @param settings The database settings.
     * @param metaData The DatabaseMetaData instance.
     * @return The schema pattern (e.g., null, username, "dbo", "public", "%").
     * @throws SQLException If metadata access fails.
     */
    protected String getSchemaPattern(ServerDatabaseSettings settings, DatabaseMetaData metaData) throws SQLException {
        // Default: null is often a safe starting point.
        // Vendor-specific logic is often required:
        String dbType = settings.type.toLowerCase();
        switch (dbType) {
             case "oracle":
                 // Often the username is the schema owner.
                 // return metaData.getUserName(); // Might require case sensitivity handling
                 return StringUtils.isNotBlank(settings.userid) ? settings.userid.toUpperCase() : null; // Safer default
             case "postgresql":
                 // Often 'public' or the username. Null might fetch from the default search path.
                 return null; // Or "public", or settings.userid
             case "sqlserver":
                 // Often 'dbo'. Null might work depending on user's default schema.
                 return null; // Or "dbo"
             case "mysql":
             case "mariadb":
                 // Schemas are often equivalent to databases (catalogs). Use null for schema pattern.
                 return null;
             case "ibmdb2":
                  // Often the username (uppercase).
                 return StringUtils.isNotBlank(settings.userid) ? settings.userid.toUpperCase() : null;
             default:
                 return null; // Default fallback
        }
        // Using '%' can be very slow on large databases. Targeted patterns are better.
    }


     /**
     * Helper method to heuristically identify system tables or views based on naming conventions.
     * This filtering is important to avoid cluttering the schema provided to LLMs with
     * internal database objects they shouldn't typically query directly.
     * **Note:** This requires ongoing refinement for different database versions and configurations.
     * Relying on specific catalog/schema patterns in {@code getTables} is often more reliable.
     *
     * @param name The name of the table or view.
     * @param type The type ("TABLE", "VIEW").
     * @param dbType The lower-case database type string.
     * @return True if the object is likely a system object, false otherwise.
     */
    private boolean isSystemTableOrView(String name, String type, String dbType) {
        String lowerCaseName = name.toLowerCase();
        // String lowerCaseType = type.toLowerCase(); // Type not currently used in filtering logic

        // General check for common system schema names if schema pattern wasn't specific enough
        if (lowerCaseName.startsWith("information_schema.") || lowerCaseName.equals("information_schema")) return true;
        if (lowerCaseName.startsWith("pg_catalog.") || lowerCaseName.equals("pg_catalog")) return true; // PostgreSQL
        if (lowerCaseName.startsWith("sys.") || lowerCaseName.equals("sys")) return true; // SQL Server, Oracle, DB2
        if (lowerCaseName.startsWith("system.") || lowerCaseName.equals("system")) return true; // Oracle
        if (lowerCaseName.equals("mysql") || lowerCaseName.startsWith("mysql.")) return true; // MySQL/MariaDB
        if (lowerCaseName.equals("performance_schema") || lowerCaseName.startsWith("performance_schema.")) return true; // MySQL/MariaDB

        // Vendor-specific prefix checks
        switch (dbType) { // dbType is already lower-case
            case "sqlite":
                return lowerCaseName.startsWith("sqlite_");
            case "postgresql":
                return lowerCaseName.startsWith("pg_"); // Covers pg_toast, pg_temp_, etc.
            case "oracle":
                // SYS/SYSTEM handled above. Check common dictionary view prefixes.
                return lowerCaseName.startsWith("all_") || lowerCaseName.startsWith("user_") || lowerCaseName.startsWith("dba_") || lowerCaseName.startsWith("v$") || lowerCaseName.startsWith("gv$");
            case "sqlserver":
                // 'sys' handled above.
                return false; // Other system objects often in 'sys' schema.
            case "ibmdb2":
                 // SYSIBM, SYSCAT, SYSSTAT should ideally be excluded by schema pattern. Check prefixes.
                 return lowerCaseName.startsWith("sysibm_") || lowerCaseName.startsWith("syscat_") || lowerCaseName.startsWith("sysstat_");
            case "mysql":
            case "mariadb":
                 // information_schema, mysql, performance_schema handled above.
                 return false;
            default:
                return false;
        }
    }


    /**
     * Fetches detailed column metadata for a specific table or view.
     * Retrieves name, data type (JDBC and DB-specific), size, precision/scale, nullability,
     * remarks (comments), and default values using {@link DatabaseMetaData#getColumns(String, String, String, String)}.
     * Populates the {@link ColumnSchema} objects within the provided {@link TableSchema}.
     *
     * @param metaData The DatabaseMetaData instance.
     * @param catalog The catalog name (may be null).
     * @param schemaPattern The schema pattern (may be null).
     * @param tableName The name of the table or view.
     * @param tableSchema The {@link TableSchema} object to add columns to.
     * @throws SQLException If a database access error occurs.
     */
    private void fetchColumnsForTable(DatabaseMetaData metaData, String catalog, String schemaPattern, String tableName, TableSchema tableSchema) throws SQLException {
        log.debug("Fetching columns for table/view: {}", tableName);
        try (ResultSet columnsResultSet = metaData.getColumns(catalog, schemaPattern, tableName, "%")) {
            while (columnsResultSet.next()) {
                ColumnSchema columnSchema = new ColumnSchema();
                columnSchema.columnName = columnsResultSet.getString("COLUMN_NAME");
                columnSchema.dataType = columnsResultSet.getInt("DATA_TYPE"); // java.sql.Types
                columnSchema.typeName = columnsResultSet.getString("TYPE_NAME");
                columnSchema.columnSize = columnsResultSet.getInt("COLUMN_SIZE");

                // Fetch precision (NUM_PREC_RADIX) and scale (DECIMAL_DIGITS) for numeric types.
                // Use getObject and cast to handle potential nulls safely.
                columnSchema.decimalDigits = (Integer) columnsResultSet.getObject("DECIMAL_DIGITS");
                columnSchema.numPrecRadix = (Integer) columnsResultSet.getObject("NUM_PREC_RADIX");

                // IS_NULLABLE column indicates nullability.
                columnSchema.isNullable = "YES".equalsIgnoreCase(columnsResultSet.getString("IS_NULLABLE"));

                // Fetch REMARKS (column comments) - vital for LLM semantic understanding.
                columnSchema.remarks = columnsResultSet.getString("REMARKS");

                // Fetch COLUMN_DEF (default value).
                columnSchema.defaultValue = columnsResultSet.getString("COLUMN_DEF");

                // Standardize null/empty strings if desired (optional)
                // if (columnSchema.remarks == null) columnSchema.remarks = "";
                // if (columnSchema.defaultValue == null) columnSchema.defaultValue = "";


                tableSchema.columns.add(columnSchema);
                log.trace("  Added column: {} (Type: {}, Size: {}, DecDigits: {}, PrecRadix: {}, Nullable: {}, Remarks: '{}', Default: '{}')",
                          columnSchema.columnName, columnSchema.typeName, columnSchema.columnSize, columnSchema.decimalDigits,
                          columnSchema.numPrecRadix, columnSchema.isNullable, columnSchema.remarks, columnSchema.defaultValue);
            }
        }
    }

    /**
     * Fetches primary key information for a table.
     * Uses {@link DatabaseMetaData#getPrimaryKeys(String, String, String)} to find PK columns.
     * Populates the {@code primaryKeyColumns} list in the {@link TableSchema}.
     *
     * @param metaData The DatabaseMetaData instance.
     * @param catalog The catalog name (may be null).
     * @param schemaPattern The schema pattern (may be null).
     * @param tableName The name of the table.
     * @param tableSchema The {@link TableSchema} object to update.
     * @throws SQLException If a database access error occurs.
     */
    private void fetchPrimaryKeysForTable(DatabaseMetaData metaData, String catalog, String schemaPattern, String tableName, TableSchema tableSchema) throws SQLException {
        log.debug("Fetching primary keys for table: {}", tableName);
        try (ResultSet pkResultSet = metaData.getPrimaryKeys(catalog, schemaPattern, tableName)) {
            while (pkResultSet.next()) {
                String pkColumnName = pkResultSet.getString("COLUMN_NAME");
                // String pkName = pkResultSet.getString("PK_NAME"); // Can get PK constraint name if needed
                tableSchema.primaryKeyColumns.add(pkColumnName);
                log.trace("  Added primary key column: {}", pkColumnName);
            }
        }
    }

    /**
     * Fetches foreign key information for a table.
     * Uses {@link DatabaseMetaData#getImportedKeys(String, String, String)} to find FKs
     * defined in *this* table that reference primary keys in *other* (or the same) tables.
     * Populates the {@code foreignKeys} list in the {@link TableSchema}.
     *
     * @param metaData The DatabaseMetaData instance.
     * @param catalog The catalog name (may be null).
     * @param schemaPattern The schema pattern (may be null).
     * @param tableName The name of the table (the one containing the foreign key).
     * @param tableSchema The {@link TableSchema} object to update.
     * @throws SQLException If a database access error occurs.
     */
    private void fetchForeignKeysForTable(DatabaseMetaData metaData, String catalog, String schemaPattern, String tableName, TableSchema tableSchema) throws SQLException {
        log.debug("Fetching foreign keys for table: {}", tableName);
        // getImportedKeys: Retrieves FKs in this table that reference PKs in other tables.
        try (ResultSet fkResultSet = metaData.getImportedKeys(catalog, schemaPattern, tableName)) {
            while (fkResultSet.next()) {
                ForeignKeySchema fkSchema = new ForeignKeySchema();
                fkSchema.fkName = fkResultSet.getString("FK_NAME"); // Foreign key constraint name
                fkSchema.fkColumnName = fkResultSet.getString("FKCOLUMN_NAME"); // Column in *this* table
                fkSchema.pkTableName = fkResultSet.getString("PKTABLE_NAME"); // Referenced PK table
                fkSchema.pkColumnName = fkResultSet.getString("PKCOLUMN_NAME"); // Referenced PK column
                // Can also get update/delete rules: fkResultSet.getShort("UPDATE_RULE"), fkResultSet.getShort("DELETE_RULE")
                // Can get sequence number for multi-column FKs: fkResultSet.getShort("KEY_SEQ")
                tableSchema.foreignKeys.add(fkSchema);
                 log.trace("  Added foreign key: {} ({}) -> {}({})",
                           fkSchema.fkName, fkSchema.fkColumnName, fkSchema.pkTableName, fkSchema.pkColumnName);
            }
        }
        // To get FKs that reference *this* table's PK, use metaData.getExportedKeys(...)
    }

    /**
     * Fetches index information for a specific table.
     * Uses {@link DatabaseMetaData#getIndexInfo(String, String, String, boolean, boolean)}
     * to retrieve details about indexes, including name, columns, uniqueness, and type.
     * Populates the {@code indexes} list in the {@link TableSchema}.
     * Includes basic filtering to skip index statistics reported by some drivers.
     *
     * @param metaData The DatabaseMetaData instance.
     * @param catalog The catalog name (may be null).
     * @param schemaPattern The schema pattern (may be null).
     * @param tableName The name of the table.
     * @param tableSchema The {@link TableSchema} object to add index information to.
     * @throws SQLException If a database access error occurs (though attempts to handle gracefully).
     */
    private void fetchIndexesForTable(DatabaseMetaData metaData, String catalog, String schemaPattern, String tableName, TableSchema tableSchema) throws SQLException {
        log.debug("Fetching indexes for table: {}", tableName);
        try {
             // Parameters for getIndexInfo:
             // unique=false: Retrieve information for all indexes (unique and non-unique).
             // approximate=true: Allow results even if they might be slightly out of date (often faster).
            try (ResultSet indexResultSet = metaData.getIndexInfo(catalog, schemaPattern, tableName, false, true)) {
                while (indexResultSet.next()) {
                    // Retrieve index details from the result set.
                    String indexName = indexResultSet.getString("INDEX_NAME");
                    short indexType = indexResultSet.getShort("TYPE"); // e.g., tableIndexStatistic, tableIndexClustered, etc.
                    String columnName = indexResultSet.getString("COLUMN_NAME");
                    boolean nonUnique = indexResultSet.getBoolean("NON_UNIQUE"); // JDBC reports NON_UNIQUE flag
                    short ordinalPosition = indexResultSet.getShort("ORDINAL_POSITION"); // Column position in index (1-based)
                    // String filterCondition = indexResultSet.getString("FILTER_CONDITION"); // Not standard, often null

                    // Filter out index statistics pseudo-indexes returned by some drivers.
                    if (indexType == DatabaseMetaData.tableIndexStatistic) {
                        log.trace("  Skipping index statistics reported as index: {}", indexName);
                        continue;
                    }

                    // Some drivers might report constraints (like PK) as indexes without a column name initially, skip these rows.
                    if (columnName == null && indexName != null) {
                         log.trace("  Skipping index entry with null column name (likely constraint): {}", indexName);
                         continue;
                    }
                    // Skip entries where index name itself is null (shouldn't happen often for actual indexes)
                     if (indexName == null) {
                         log.trace("  Skipping index entry with null index name.");
                         continue;
                     }


                    // Create and populate the IndexSchema object.
                    IndexSchema indexSchema = new IndexSchema();
                    indexSchema.indexName = indexName;
                    indexSchema.columnName = columnName;
                    indexSchema.isUnique = !nonUnique; // Convert NON_UNIQUE flag to isUnique
                    indexSchema.type = indexType;
                    indexSchema.ordinalPosition = ordinalPosition;
                    // indexSchema.filterCondition = filterCondition; // Assign if needed and available

                    tableSchema.indexes.add(indexSchema);
                    log.trace("  Added index: {} on column {} (Pos: {}, Unique: {}, Type: {})",
                              indexSchema.indexName, indexSchema.columnName, indexSchema.ordinalPosition,
                              indexSchema.isUnique, indexSchema.type);
                }
            }
        } catch (SQLException e) {
            // Log a warning if index retrieval fails. Some drivers might not fully support getIndexInfo
            // or lack permissions. Continue fetching other metadata if possible.
             log.warn("Could not retrieve index info for table {} (might be expected for some DBs/drivers or due to permissions): {}",
                      tableName, e.getMessage());
             // Do not re-throw; allow schema fetching to continue if possible.
        } catch (AbstractMethodError ame) {
             // Catch cases where the JDBC driver doesn't implement getIndexInfo at all.
             log.warn("JDBC driver does not support getIndexInfo for table {}: {}", tableName, ame.getMessage());
        }
    }
}