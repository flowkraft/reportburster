package com.flowkraft.jobman.dtos;

import java.util.List;
import java.util.Objects;

/**
 * DTO representing the result of a spawned process execution.
 * Replaces SystemService.ProcessOutputResult.
 */
public class ProcessOutputResultDto {
    private boolean success;
    private List<String> stdOutErrLines; // Renamed for clarity vs original

    // Default constructor for JSON deserialization
    public ProcessOutputResultDto() {
    }

    public ProcessOutputResultDto(boolean success, List<String> stdOutErrLines) {
        this.success = success;
        this.stdOutErrLines = stdOutErrLines;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public List<String> getStdOutErrLines() {
        return stdOutErrLines;
    }

    public void setStdOutErrLines(List<String> stdOutErrLines) {
        this.stdOutErrLines = stdOutErrLines;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProcessOutputResultDto that = (ProcessOutputResultDto) o;
        return success == that.success && Objects.equals(stdOutErrLines, that.stdOutErrLines);
    }

    @Override
    public int hashCode() {
        return Objects.hash(success, stdOutErrLines);
    }

    @Override
    public String toString() {
        return "ProcessOutputResultDto{" +
               "success=" + success +
               ", stdOutErrLines=" + stdOutErrLines +
               '}';
    }
}