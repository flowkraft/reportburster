package com.flowkraft.starterpacks.dtos;

import java.util.Objects;

/**
 * DTO representing the immediate response after attempting to execute a
 * command, typically for starter packs.
 */
public class ExecuteCommandResponseDto {
	private String output;
	private String status;

	public ExecuteCommandResponseDto() {
	}

	public ExecuteCommandResponseDto(String output, String status) {
		this.output = output;
		this.status = status;
	}

	public String getOutput() {
		return output;
	}

	public String getStatus() {
		return status;
	}

	public void setOutput(String output) {
		this.output = output;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		ExecuteCommandResponseDto that = (ExecuteCommandResponseDto) o;
		return Objects.equals(output, that.output) && Objects.equals(status, that.status);
	}

	@Override
	public int hashCode() {
		return Objects.hash(output, status);
	}

	@Override
	public String toString() {
		return "ExecuteCommandResponse{" + "output='" + output + '\'' + ", status='" + status + '\'' + '}';
	}
}