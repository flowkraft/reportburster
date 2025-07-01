package com.flowkraft.jobman.dtos;

import jakarta.validation.constraints.NotBlank;
import java.util.Objects;

/**
 * DTO representing the request body for executing a command, typically for
 * starter packs.
 */
public class ExecuteCommandRequestDto {

	@NotBlank(message = "Command cannot be blank")
	private String command;

	// Default constructor for JSON deserialization
	public ExecuteCommandRequestDto() {
	}

	// Constructor for creating instances
	public ExecuteCommandRequestDto(String command) {
		this.command = command;
	}

	// Getter
	public String getCommand() {
		return command;
	}

	// Setter
	public void setCommand(String command) {
		this.command = command;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		ExecuteCommandRequestDto that = (ExecuteCommandRequestDto) o;
		return Objects.equals(command, that.command);
	}

	@Override
	public int hashCode() {
		return Objects.hash(command);
	}

	@Override
	public String toString() {
		return "ExecuteCommandRequest{" + "command='" + command + '\'' + '}';
	}
}