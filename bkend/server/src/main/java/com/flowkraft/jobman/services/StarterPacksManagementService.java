package com.flowkraft.jobman.services;

import com.flowkraft.jobman.dtos.ExecuteCommandResponseDto;
import com.flowkraft.jobman.dtos.StarterPackStatusDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers; // For simulating blocking operations

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Service responsible for managing the lifecycle and status of Starter Packs.
 * Interacts with the underlying system (e.g., Docker, scripts) to start, stop,
 * and check the status of defined packs.
 */
@Service
public class StarterPacksManagementService {

    private static final Logger log = LoggerFactory.getLogger(StarterPacksManagementService.class);

    // --- Internal Representation of Starter Pack Definitions ---
    // In a real app, load this from config (e.g., application.yml) or a database.
    private static class PackDefinition {
        final String id;
        final String family;
        final String packName;
        final String target;
        final String startCmd; // Full command string for starting
        final String stopCmd;  // Full command string for stopping
        // Add other relevant details if needed (e.g., health check URL/port)

        PackDefinition(String id, String family, String packName, String target, String startCmd, String stopCmd) {
            this.id = id;
            this.family = family;
            this.packName = packName;
            this.target = target;
            this.startCmd = startCmd;
            this.stopCmd = stopCmd;
        }

        // Helper to find definition based on command parts
        boolean matchesCommand(String family, String action, String packName, String target) {
            // Basic matching, adjust if command structure is different
            return this.family.equalsIgnoreCase(family) &&
                   this.packName.equalsIgnoreCase(packName) &&
                   (this.target == null || this.target.equalsIgnoreCase(target)); // Handle optional target
        }
    }

    private final List<PackDefinition> definedPacks;

    // Simulate the current state - In a real app, this state would be derived
    // by querying Docker, system processes, ports, etc.
    // Using ConcurrentHashMap for thread safety if accessed concurrently.
    private final Map<String, String> currentPackStatuses = new ConcurrentHashMap<>(); // Key: pack.id, Value: status string

    public StarterPacksManagementService() {
        // Initialize definitions (replace with config loading)
        definedPacks = Arrays.asList(
            new PackDefinition("db-northwind-postgres", "database", "northwind", "postgresql", "database start northwind postgresql 5432", "database stop northwind postgresql"),
            new PackDefinition("db-northwind-mysql", "database", "northwind", "mysql", "database start northwind mysql 3306", "database stop northwind mysql"),
            new PackDefinition("db-northwind-sqlserver", "database", "northwind", "sqlserver", "database start northwind sqlserver 1433", "database stop northwind sqlserver"),
            new PackDefinition("db-northwind-mariadb", "database", "northwind", "mariadb", "database start northwind mariadb 3306", "database stop northwind mariadb"),
            new PackDefinition("db-northwind-oracle", "database", "northwind", "oracle", "database start northwind oracle 1521", "database stop northwind oracle"),
            new PackDefinition("db-northwind-ibmdb2", "database", "northwind", "ibmdb2", "database start northwind ibmdb2 50000", "database stop northwind ibmdb2")
            // Add other packs here
        );

        // Initialize simulated statuses (optional, status check should be the source of truth)
        definedPacks.forEach(p -> currentPackStatuses.put(p.id, "stopped")); // Default to stopped
    }

    /**
     * Retrieves the current status of all defined starter packs.
     * This involves checking the actual state of each pack (e.g., Docker container status).
     *
     * @return A Flux emitting status DTOs for each starter pack.
     */
    public Flux<StarterPackStatusDto> getAllStatuses() {
        log.debug("Fetching statuses for {} defined packs.", definedPacks.size());
        // Use Flux.fromIterable to process each definition
        return Flux.fromIterable(definedPacks)
                // Use flatMap to asynchronously check the status of each pack
                .flatMap(this::checkPackStatus)
                .doOnError(e -> log.error("Error during status check for one or more packs", e));
    }

    /**
     * Executes a command (start or stop) for a specific starter pack.
     * Parses the command string to identify the pack and action.
     *
     * @param command The full command string (e.g., "database start northwind postgresql 5432").
     * @return A Mono emitting the immediate execution result.
     */
    public Mono<ExecuteCommandResponseDto> executeCommand(String command) {
        log.info("Attempting to execute command: {}", command);
        String[] parts = command.trim().split("\\s+"); // Split command by whitespace

        // Basic command parsing - adjust based on your exact command structure
        // Example: database start northwind postgresql [port]
        if (parts.length < 4) {
            log.warn("Invalid command format: {}", command);
            return Mono.just(new ExecuteCommandResponseDto("Error: Invalid command format.", "error"));
        }

        String family = parts[0];
        String action = parts[1]; // "start" or "stop"
        String packName = parts[2];
        String target = parts[3]; // May include port for start, just target for stop

        // Find the matching pack definition
        Optional<PackDefinition> packOpt = definedPacks.stream()
                .filter(p -> p.matchesCommand(family, action, packName, target))
                .findFirst();

        if (!packOpt.isPresent()) {
            log.warn("No matching starter pack definition found for command: {}", command);
            return Mono.just(new ExecuteCommandResponseDto("Error: No matching pack definition found.", "error"));
        }

        PackDefinition packToManage = packOpt.get();

        // Validate action
        if (!"start".equalsIgnoreCase(action) && !"stop".equalsIgnoreCase(action)) {
             log.warn("Invalid action '{}' in command: {}", action, command);
            return Mono.just(new ExecuteCommandResponseDto("Error: Invalid action '" + action + "'. Must be 'start' or 'stop'.", "error"));
        }

        // Update simulated status optimistically to pending
        currentPackStatuses.put(packToManage.id, "pending");

        // Run the command asynchronously and return immediate response
        return runPackCommand(packToManage, action.toLowerCase())
                .doOnSuccess(response -> log.info("Successfully initiated command '{}' for pack '{}'", action, packToManage.id))
                .doOnError(e -> {
                    log.error("Error initiating command '{}' for pack '{}'", action, packToManage.id, e);
                    // Update simulated status to error on initiation failure
                    currentPackStatuses.put(packToManage.id, "error");
                })
                .onErrorResume(e -> Mono.just(new ExecuteCommandResponseDto("Error initiating command: " + e.getMessage(), "error")));
    }

    // --- Private Helper Methods ---

    /**
     * Simulates checking the status of a single starter pack.
     * In a real implementation, this would interact with Docker, system processes, etc.
     * This operation might be blocking, so run it on a dedicated scheduler.
     *
     * @param definition The pack definition.
     * @return A Mono emitting the status DTO.
     */
    private Mono<StarterPackStatusDto> checkPackStatus(PackDefinition definition) {
        return Mono.fromCallable(() -> {
            log.debug("Checking status for pack: {}", definition.id);
            // --- Simulation Logic ---
            // Replace this with actual status checking (e.g., call StarterPackCLI.java status, docker ps, check port)
            String currentSimulatedStatus = currentPackStatuses.getOrDefault(definition.id, "unknown");

            // Simulate potential transition from pending after some time
            if ("pending".equals(currentSimulatedStatus)) {
                 // Keep it pending for a bit, or randomly decide if it finished/failed
                 if (Math.random() > 0.3) { // 70% chance it's still pending for demo
                     // Stay pending
                 } else if (Math.random() > 0.5) { // 50% of the remainder succeed
                     currentSimulatedStatus = "running"; // Or stopped if it was a stop command
                     currentPackStatuses.put(definition.id, currentSimulatedStatus);
                 } else { // The rest fail
                     currentSimulatedStatus = "error";
                     currentPackStatuses.put(definition.id, currentSimulatedStatus);
                 }
            }
            // --- End Simulation ---

            // In a real scenario, get actual last output from the check command/Docker logs
            String lastOutput = "Status check result for " + definition.id + ": " + currentSimulatedStatus;
            if ("error".equals(currentSimulatedStatus)) {
                lastOutput = "Simulated error during operation for " + definition.id;
            } else if ("running".equals(currentSimulatedStatus)) {
                 lastOutput = "Simulated connection details for " + definition.id + ": host=localhost, port=" + extractPort(definition.startCmd) + ", user=admin";
            }


            log.trace("Status for pack {}: {}", definition.id, currentSimulatedStatus);
            return new StarterPackStatusDto(definition.id, currentSimulatedStatus, lastOutput);
        })
        .subscribeOn(Schedulers.boundedElastic()) // Use a scheduler suitable for potentially blocking I/O
        .onErrorResume(e -> {
            log.error("Failed to check status for pack {}", definition.id, e);
            // Return an error status DTO
            return Mono.just(new StarterPackStatusDto(definition.id, "error", "Failed to retrieve status: " + e.getMessage()));
        });
    }

     /**
     * Simulates running the actual start/stop command asynchronously.
     * In a real implementation, this would use ProcessBuilder or a Docker client API.
     *
     * @param definition The pack definition.
     * @param action     "start" or "stop".
     * @return A Mono emitting the immediate response (output + pending status).
     */
    private Mono<ExecuteCommandResponseDto> runPackCommand(PackDefinition definition, String action) {
        return Mono.fromRunnable(() -> {
            String commandToRun = "start".equals(action) ? definition.startCmd : definition.stopCmd;
            log.info("Simulating execution of: '{}' for pack {}", commandToRun, definition.id);

            // --- Simulation Logic ---
            // Replace this with actual command execution (e.g., ProcessBuilder)
            // This runnable should *initiate* the async operation.
            // For example, using ProcessBuilder:
            /*
            try {
                ProcessBuilder pb = new ProcessBuilder("path/to/reportburster.bat", commandToRun.split("\\s+"));
                pb.redirectErrorStream(true); // Combine stdout/stderr
                Process process = pb.start();
                // Don't wait here, the process runs in the background.
                // You might store the Process object if you need to manage it later.
                log.info("Started background process for command: {}", commandToRun);

                // Simulate a delay before it might finish or fail (for status check demo)
                 CompletableFuture.runAsync(() -> {
                     try {
                         int exitCode = process.waitFor();
                         String finalStatus = (exitCode == 0) ? ("start".equals(action) ? "running" : "stopped") : "error";
                         currentPackStatuses.put(definition.id, finalStatus);
                         log.info("Background process for '{}' finished with code {}. Status set to {}", commandToRun, exitCode, finalStatus);
                     } catch (InterruptedException e) {
                         Thread.currentThread().interrupt();
                         log.error("Interrupted while waiting for process {}", commandToRun, e);
                         currentPackStatuses.put(definition.id, "error");
                     }
                 });

            } catch (IOException e) {
                log.error("Failed to start process for command: {}", commandToRun, e);
                currentPackStatuses.put(definition.id, "error"); // Mark as error if process fails to start
                // Re-throw or handle appropriately - maybe wrap in RuntimeException for Mono.error
                throw new RuntimeException("Failed to start process: " + e.getMessage(), e);
            }
            */
            // Simple simulation: Just log and assume it started pending
             try { TimeUnit.MILLISECONDS.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } // Simulate work
            log.info("Initiation simulation complete for: {}", commandToRun);
            // --- End Simulation ---
        })
        .subscribeOn(Schedulers.boundedElastic()) // Run the blocking initiation on a suitable scheduler
        .then(Mono.just(new ExecuteCommandResponseDto("Executing " + action + "...", "pending"))); // Return immediate response
    }

    /**
     * Helper to extract port from a start command string (basic example).
     */
    private String extractPort(String startCmd) {
        if (startCmd == null) return "N/A";
        String[] parts = startCmd.split("\\s+");
        if (parts.length > 4) {
            try {
                Integer.parseInt(parts[parts.length - 1]); // Check if last part is a number
                return parts[parts.length - 1];
            } catch (NumberFormatException e) {
                // Last part is not a port number
            }
        }
        // Fallback or more specific logic needed if port isn't always last
        if (startCmd.contains("postgresql")) return "5432";
        if (startCmd.contains("mysql")) return "3306";
        if (startCmd.contains("sqlserver")) return "1433";
        if (startCmd.contains("mariadb")) return "3306";
        if (startCmd.contains("oracle")) return "1521";
        if (startCmd.contains("ibmdb2")) return "50000";
        return "N/A";
    }
}