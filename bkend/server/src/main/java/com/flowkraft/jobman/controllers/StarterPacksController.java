package com.flowkraft.jobman.controllers;

// Import necessary DTOs from the dtos package
import com.flowkraft.jobman.dtos.ExecuteCommandRequestDto;
import com.flowkraft.jobman.dtos.ExecuteCommandResponseDto;
import com.flowkraft.jobman.dtos.StarterPackStatusDto;
import com.flowkraft.jobman.services.StarterPacksManagementService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

/**
 * Controller for managing Starter Packs (e.g., sample databases, services).
 * Provides endpoints to get status and execute start/stop commands.
 */
@RestController
@RequestMapping(value = "/api/jobman/starter-packs", // Dedicated base path
		produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class StarterPacksController {

	private static final Logger log = LoggerFactory.getLogger(StarterPacksController.class);

	private final StarterPacksManagementService starterPacksManagementService;

	@Autowired
	public StarterPacksController(StarterPacksManagementService starterPacksManagementService) {
		this.starterPacksManagementService = starterPacksManagementService;
	}

	/**
	 * Retrieves the current status of all defined starter packs.
	 *
	 * @return A Flux emitting status DTOs for each starter pack.
	 */
	@GetMapping("/status")
	public Flux<StarterPackStatusDto> getAllStarterPackStatuses() {
		log.info("Received request for all starter pack statuses.");
		// Assuming starterPacksManagementService.getAllStatuses() returns
		// Flux<StarterPackStatusDto>
		return starterPacksManagementService.getAllStatuses()
				.doOnError(e -> log.error("Error fetching starter pack statuses", e))
				.onErrorResume(e -> Flux.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
						"Failed to retrieve starter pack statuses", e)));
	}

	/**
	 * Executes a command (typically start or stop) for a starter pack. The command
	 * string is expected to be in the format recognized by the underlying
	 * management script/logic.
	 *
	 * @param request The request body containing the command string
	 *                (ExecuteCommandRequest DTO).
	 * @return A Mono emitting the immediate execution result
	 *         (ExecuteCommandResponse DTO).
	 */
	@PostMapping("/execute")
	public Mono<ResponseEntity<ExecuteCommandResponseDto>> executeStarterPackCommand(
			@Valid @RequestBody ExecuteCommandRequestDto request) { // Use DTO for request body
		log.info("Received request to execute starter pack command: [{}]", request.getCommand());

		if (request.getCommand() == null || request.getCommand().trim().isEmpty()) {
			log.warn("Received empty command in execute request.");
			// Use DTO for error response
			ExecuteCommandResponseDto errorResponse = new ExecuteCommandResponseDto("Error: Command cannot be empty.",
					"error");
			return Mono.just(ResponseEntity.badRequest().body(errorResponse));
		}

		// Assuming starterPacksManagementService.executeCommand returns
		// Mono<ExecuteCommandResponse>
		return starterPacksManagementService.executeCommand(request.getCommand()).map(response -> {
			log.info("Command execution successful (immediate result): Status={}, Output='{}'", response.getNewStatus(),
					response.getOutput());
			return ResponseEntity.ok(response); // Return DTO in response
		}).doOnError(e -> log.error("Error executing starter pack command: [{}]", request.getCommand(), e))
				.onErrorResume(e -> {
					// Provide a structured error response using the DTO
					ExecuteCommandResponseDto errorResponse = new ExecuteCommandResponseDto(
							"Error executing command: " + e.getMessage(), "error" // Indicate error status
					);
					// Consider mapping specific exceptions to different HTTP statuses if needed
					return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
				});
	}

	// Removed the commented-out DTO examples as they should be in separate files.
}