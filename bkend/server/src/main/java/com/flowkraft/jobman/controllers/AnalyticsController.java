package com.flowkraft.jobman.controllers;

import com.flowkraft.jobman.services.ClickHouseAnalyticsService;
import com.flowkraft.jobman.services.DuckDBAnalyticsService;
import com.sourcekraft.documentburster.common.analytics.dto.PivotRequest;
import com.sourcekraft.documentburster.common.analytics.dto.PivotResponse;
import com.sourcekraft.documentburster.common.analytics.duckdb.DuckDBFileHandler;
import com.sourcekraft.documentburster.common.db.DatabaseConnectionManager;
import com.sourcekraft.documentburster.common.settings.model.ServerDatabaseSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for OLAP analytics operations.
 * Provides endpoints for server-side pivot table processing using DuckDB or ClickHouse.
 * 
 * Engine routing:
 * - engine="duckdb": Uses DuckDB for OLAP processing
 * - engine="clickhouse": Uses ClickHouse for OLAP processing
 * - engine not specified: Auto-detects from connection database type
 *   - duckdb connection → duckdb engine
 *   - clickhouse connection → clickhouse engine
 *   - other connections → browser (client-side processing)
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final DuckDBAnalyticsService duckDBService;
    private final ClickHouseAnalyticsService clickHouseService;
    private final DatabaseConnectionManager connectionManager;

    public AnalyticsController(DuckDBAnalyticsService duckDBService, 
                               ClickHouseAnalyticsService clickHouseService,
                               DatabaseConnectionManager connectionManager) {
        this.duckDBService = duckDBService;
        this.clickHouseService = clickHouseService;
        this.connectionManager = connectionManager;
    }

    /**
     * Auto-detect the appropriate OLAP engine from the database connection type.
     * 
     * @param connectionCode The connection code to look up
     * @return The detected engine: "duckdb", "clickhouse", or "browser"
     */
    private String detectEngineFromConnection(String connectionCode) {
        try {
            ServerDatabaseSettings dbSettings = connectionManager.getServerDatabaseSettings(connectionCode);
            String dbType = dbSettings.type != null ? dbSettings.type.toLowerCase() : "";
            
            switch (dbType) {
                case "duckdb":
                    log.debug("Auto-detected engine 'duckdb' from connection type '{}'", dbType);
                    return "duckdb";
                case "clickhouse":
                    log.debug("Auto-detected engine 'clickhouse' from connection type '{}'", dbType);
                    return "clickhouse";
                default:
                    log.debug("Connection type '{}' is not an OLAP database, falling back to 'browser' engine", dbType);
                    return "browser";
            }
        } catch (Exception e) {
            log.warn("Failed to detect engine from connection '{}': {}. Falling back to 'browser'", 
                    connectionCode, e.getMessage());
            return "browser";
        }
    }

    /**
     * Execute a pivot table query.
     *
     * POST /api/analytics/pivot
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "tableName": "orders",
     *   "engine": "duckdb",  // or "clickhouse" (optional, auto-detected from connection if omitted)
     *   "rows": ["country", "city"],
     *   "cols": ["product_category"],
     *   "vals": ["revenue"],
     *   "aggregatorName": "Sum",
     *   "filters": {
     *     "year": ["2023", "2024"]
     *   }
     * }
     *
     * @param request The pivot configuration
     * @return PivotResponse with aggregated data
     */
    @PostMapping("/pivot")
    public ResponseEntity<?> executePivot(@RequestBody PivotRequest request) {
        try {
            log.info("Received pivot request for table: {}, engine: {}", 
                    request.getTableName(), request.getEngine());

            // Validate request
            if (request.getConnectionCode() == null || request.getConnectionCode().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (request.getTableName() == null || request.getTableName().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("tableName is required"));
            }

            // Determine engine: use provided value or auto-detect from connection
            String engine;
            if (request.getEngine() != null && !request.getEngine().isEmpty()) {
                engine = request.getEngine().toLowerCase();
                log.debug("Using explicitly provided engine: {}", engine);
            } else {
                engine = detectEngineFromConnection(request.getConnectionCode());
                log.info("Auto-detected engine '{}' from connection '{}'", engine, request.getConnectionCode());
            }
            
            // Browser engine means client-side processing - return empty response
            if ("browser".equals(engine)) {
                log.debug("Engine is 'browser', returning indication for client-side processing");
                Map<String, Object> browserResponse = new HashMap<>();
                browserResponse.put("engine", "browser");
                browserResponse.put("message", "Connection type requires client-side (browser) pivot processing");
                return ResponseEntity.ok(browserResponse);
            }

            // Route to appropriate OLAP service based on engine
            PivotResponse response;
            switch (engine) {
                case "clickhouse":
                    log.debug("Routing to ClickHouse analytics service");
                    response = clickHouseService.executePivot(request);
                    break;
                case "duckdb":
                default:
                    log.debug("Routing to DuckDB analytics service");
                    response = duckDBService.executePivot(request);
                    break;
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid pivot request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid request: " + e.getMessage()));

        } catch (Exception e) {
            log.error("Error executing pivot query", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Query execution failed: " + e.getMessage()));
        }
    }

    /**
     * Get list of supported aggregators.
     *
     * GET /api/analytics/aggregators
     * GET /api/analytics/aggregators?engine=clickhouse
     *
     * @param engine Optional engine parameter (duckdb or clickhouse)
     * @return List of aggregator names
     */
    @GetMapping("/aggregators")
    public ResponseEntity<List<String>> getSupportedAggregators(
            @RequestParam(defaultValue = "duckdb") String engine) {
        List<String> aggregators;
        if ("clickhouse".equalsIgnoreCase(engine)) {
            aggregators = clickHouseService.getSupportedAggregators();
        } else {
            aggregators = duckDBService.getSupportedAggregators();
        }
        return ResponseEntity.ok(aggregators);
    }

    /**
     * Get aggregator display names for UI.
     *
     * GET /api/analytics/aggregators/display-names
     *
     * @return Map of aggregator names to display names
     */
    @GetMapping("/aggregators/display-names")
    public ResponseEntity<Map<String, String>> getAggregatorDisplayNames() {
        Map<String, String> displayNames = duckDBService.getAggregatorDisplayNames();
        return ResponseEntity.ok(displayNames);
    }

    /**
     * Health check endpoint.
     *
     * GET /api/analytics/health
     *
     * @return Health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Analytics (DuckDB + ClickHouse)");
        health.put("engines", Map.of(
            "duckdb", Map.of(
                "supportedAggregators", duckDBService.getSupportedAggregators().size(),
                "cache", duckDBService.getCacheStats()
            ),
            "clickhouse", Map.of(
                "supportedAggregators", clickHouseService.getSupportedAggregators().size(),
                "cache", clickHouseService.getCacheStats()
            )
        ));
        return ResponseEntity.ok(health);
    }

    /**
     * Get cache statistics.
     *
     * GET /api/analytics/cache/stats
     * GET /api/analytics/cache/stats?engine=clickhouse
     *
     * @param engine Optional engine parameter (duckdb or clickhouse)
     * @return Cache statistics
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats(
            @RequestParam(defaultValue = "duckdb") String engine) {
        Map<String, Object> stats;
        if ("clickhouse".equalsIgnoreCase(engine)) {
            stats = clickHouseService.getCacheStats();
        } else {
            stats = duckDBService.getCacheStats();
        }
        return ResponseEntity.ok(stats);
    }

    /**
     * Clear query cache.
     *
     * POST /api/analytics/cache/clear
     * POST /api/analytics/cache/clear?engine=clickhouse
     * POST /api/analytics/cache/clear?engine=all
     *
     * @param engine Optional engine parameter (duckdb, clickhouse, or all)
     * @return Success message
     */
    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, Object>> clearCache(
            @RequestParam(defaultValue = "duckdb") String engine) {
        Map<String, Object> response = new HashMap<>();
        
        if ("all".equalsIgnoreCase(engine)) {
            duckDBService.clearCache();
            clickHouseService.clearCache();
            response.put("message", "All caches cleared successfully");
            response.put("engines", List.of("duckdb", "clickhouse"));
        } else if ("clickhouse".equalsIgnoreCase(engine)) {
            clickHouseService.clearCache();
            response.put("message", "ClickHouse cache cleared successfully");
            response.put("engine", "clickhouse");
        } else {
            duckDBService.clearCache();
            response.put("message", "DuckDB cache cleared successfully");
            response.put("engine", "duckdb");
        }
        
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Query a file directly (CSV, Parquet, JSON).
     *
     * POST /api/analytics/query-file
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV",
     *   "query": "SELECT * FROM data WHERE amount > 100",
     *   "options": {
     *     "delimiter": ",",
     *     "header": "true"
     *   }
     * }
     *
     * @param request The file query configuration
     * @return Query results
     */
    @PostMapping("/query-file")
    public ResponseEntity<?> queryFile(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file query request");

            // Validate request
            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");
            String query = (String) request.get("query");

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }
            if (query == null || query.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("query is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format. Please specify format (CSV, PARQUET, or JSON)"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format. Must be CSV, PARQUET, or JSON"));
                }
            }

            // Get options if provided
            @SuppressWarnings("unchecked")
            Map<String, String> options = (Map<String, String>) request.getOrDefault("options", new HashMap<>());

            // Execute file query
            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat, options);
            List<Map<String, Object>> results = duckDBService.queryFile(connectionCode, config, query);

            Map<String, Object> response = new HashMap<>();
            response.put("data", results);
            response.put("rowCount", results.size());
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid file query request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid request: " + e.getMessage()));

        } catch (Exception e) {
            log.error("Error executing file query", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("File query failed: " + e.getMessage()));
        }
    }

    /**
     * Get schema information from a file.
     *
     * POST /api/analytics/file-schema
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV"
     * }
     *
     * @param request The file schema request
     * @return File schema
     */
    @PostMapping("/file-schema")
    public ResponseEntity<?> getFileSchema(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file schema request");

            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format"));
                }
            }

            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat);
            List<Map<String, String>> schema = duckDBService.getFileSchema(connectionCode, config);

            Map<String, Object> response = new HashMap<>();
            response.put("schema", schema);
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting file schema", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get file schema: " + e.getMessage()));
        }
    }

    /**
     * Get sample data from a file.
     *
     * POST /api/analytics/file-sample
     *
     * Request body example:
     * {
     *   "connectionCode": "my-connection",
     *   "filePath": "/path/to/data.csv",
     *   "format": "CSV",
     *   "limit": 10
     * }
     *
     * @param request The file sample request
     * @return Sample data
     */
    @PostMapping("/file-sample")
    public ResponseEntity<?> getFileSample(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received file sample request");

            String connectionCode = (String) request.get("connectionCode");
            String filePath = (String) request.get("filePath");
            String format = (String) request.get("format");
            Integer limit = request.containsKey("limit") ? (Integer) request.get("limit") : 10;

            if (connectionCode == null || connectionCode.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("connectionCode is required"));
            }
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("filePath is required"));
            }

            // Detect format if not provided
            DuckDBFileHandler.FileFormat fileFormat;
            if (format == null || format.isEmpty()) {
                fileFormat = DuckDBFileHandler.detectFormat(filePath);
                if (fileFormat == null) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Could not detect file format"));
                }
            } else {
                try {
                    fileFormat = DuckDBFileHandler.FileFormat.valueOf(format.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Invalid format"));
                }
            }

            DuckDBFileHandler.FileQueryConfig config = new DuckDBFileHandler.FileQueryConfig(filePath, fileFormat);
            List<Map<String, Object>> sample = duckDBService.getFileSample(connectionCode, config, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("data", sample);
            response.put("rowCount", sample.size());
            response.put("filePath", filePath);
            response.put("format", fileFormat.name());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting file sample", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get file sample: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", System.currentTimeMillis());
        return error;
    }
}
