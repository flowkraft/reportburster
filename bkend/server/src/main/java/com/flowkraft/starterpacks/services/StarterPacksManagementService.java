package com.flowkraft.starterpacks.services;

import com.flowkraft.starterpacks.dtos.ExecuteCommandResponseDto;
import com.sourcekraft.documentburster.MainProgram;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Executes starter pack commands by calling MainProgram.execute() —
 * the exact same code path as running reportburster.bat from the CLI.
 *
 * MainProgram (picocli) → ServiceCommand.call() → CliJob.doService()
 *   → _createJobFile() (drives WebSocket progress tracking)
 *   → ServicesManager.execute() (runs Docker commands)
 *   → _deleteJobFile()
 *
 * BLOCKING: The HTTP response waits for the command to complete,
 * matching the old ProcessService.spawn() behavior exactly.
 * Runs on a dedicated thread pool to avoid reactor thread interruption.
 */
@Service
public class StarterPacksManagementService {

    private static final Logger log = LoggerFactory.getLogger(StarterPacksManagementService.class);

    // Dedicated thread pool — commands block for minutes (docker compose up + wait for DB ready).
    // Must NOT run on reactor threads (they get interrupted → InterruptedException).
    private final ExecutorService executor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "starter-pack-cmd");
        t.setDaemon(true);
        return t;
    });

    /**
     * Execute a starter pack command. Blocks until the command completes,
     * matching the old shellService.runBatFile() → ProcessService.spawn() behavior.
     *
     * The command string uses the same format as the CLI:
     *   "service database start northwind postgres 5432"
     *
     * If the "service" prefix is missing, it's prepended automatically.
     */
    public Mono<ExecuteCommandResponseDto> executeCommand(String command) {
        log.info("Executing command: {}", command);

        String cleanCommand = command.trim();
        if (cleanCommand.isEmpty()) {
            return Mono.just(new ExecuteCommandResponseDto("Error: empty command.", "error"));
        }

        // Ensure "service" prefix is present — MainProgram picocli expects it
        if (!cleanCommand.toLowerCase().startsWith("service ")) {
            cleanCommand = "service " + cleanCommand;
        }

        // Split into args array for MainProgram.execute() — same as reportburster.bat
        final String[] args = cleanCommand.split("\\s+");
        final String cmd = command;

        // Block until command completes — same timing as old ProcessService.spawn().
        // Runs on dedicated thread pool to avoid reactor InterruptedException.
        return Mono.fromCallable(() -> {
            try {
                new MainProgram().execute(args);
                log.info("Command completed: {}", cmd);
                return new ExecuteCommandResponseDto("Done: " + cmd, "ok");
            } catch (Throwable e) {
                log.error("Command failed: {}", e.getMessage(), e);
                return new ExecuteCommandResponseDto("Error: " + e.getMessage(), "error");
            }
        }).subscribeOn(Schedulers.fromExecutor(executor));
    }
}
