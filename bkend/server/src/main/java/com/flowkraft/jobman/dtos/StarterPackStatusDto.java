package com.flowkraft.jobman.dtos;

import java.util.Objects;

/**
 * DTO representing the status of a single Starter Pack. Used for responses from
 * the /api/jobman/starter-packs/status endpoint.
 */
public class StarterPackStatusDto {
	private String id;
	private String status; // e.g., "running", "stopped", "pending", "error", "unknown"
	private String lastOutput;

	// Default constructor for JSON deserialization (e.g., Jackson)
	public StarterPackStatusDto() {
	}

	// Constructor for creating instances in the service
	public StarterPackStatusDto(String id, String status, String lastOutput) {
		this.id = id;
		this.status = status;
		this.lastOutput = lastOutput;
	}

	// Getters
	public String getId() {
		return id;
	}

	public String getStatus() {
		return status;
	}

	public String getLastOutput() {
		return lastOutput;
	}

	// Setters (useful for frameworks like Jackson)
	public void setId(String id) {
		this.id = id;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public void setLastOutput(String lastOutput) {
		this.lastOutput = lastOutput;
	}

	// equals, hashCode, and toString for completeness and debugging
	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		StarterPackStatusDto that = (StarterPackStatusDto) o;
		return Objects.equals(id, that.id) && Objects.equals(status, that.status)
				&& Objects.equals(lastOutput, that.lastOutput);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, status, lastOutput);
	}

	@Override
	public String toString() {
		return "StarterPackStatusDto{" + "id='" + id + '\'' + ", status='" + status + '\'' + ", lastOutput='"
				+ lastOutput + '\'' + '}';
	}
}