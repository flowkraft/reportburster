package com.flowkraft.jobman.dtos;

import java.util.Objects;

/**
 * DTO representing the immediate response after attempting to execute a
 * command, typically for starter packs.
 */
public class ExecuteCommandResponseDto {
	private String output; // Immediate output from the command execution attempt
	private String newStatus; // The expected status after the command attempt (e.g., "pending", "error", or
								// final if immediate)

	// Default constructor for JSON deserialization
	public ExecuteCommandResponseDto() {
	}

	// Constructor for creating instances
	public ExecuteCommandResponseDto(String output, String newStatus) {
		this.output = output;
		this.newStatus = newStatus;
	}

	// Getters
	public String getOutput() {
		return output;
	}

	public String getNewStatus() {
		return newStatus;
	}

	// Setters
	public void setOutput(String output) {
		this.output = output;
	}

	public void setNewStatus(String newStatus) {
		this.newStatus = newStatus;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		ExecuteCommandResponseDto that = (ExecuteCommandResponseDto) o;
		return Objects.equals(output, that.output) && Objects.equals(newStatus, that.newStatus);
	}

	@Override
	public int hashCode() {
		return Objects.hash(output, newStatus);
	}

	@Override
	public String toString() {
		return "ExecuteCommandResponse{" + "output='" + output + '\'' + ", newStatus='" + newStatus + '\'' + '}';
	}
}