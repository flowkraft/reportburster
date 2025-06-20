package com.flowkraft.jobman.dtos;

import java.util.Objects;

/**
 * DTO representing criteria for directory operations (e.g., ensuring existence, setting mode).
 * Replaces SystemService.DirCriteria.
 */
public class DirCriteriaDto {
    private boolean empty = false; // Default value
    private String mode;

    // Default constructor
    public DirCriteriaDto() {}

    // Getters and Setters
    public boolean isEmpty() { return empty; }
    public void setEmpty(boolean empty) { this.empty = empty; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DirCriteriaDto that = (DirCriteriaDto) o;
        return empty == that.empty && Objects.equals(mode, that.mode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(empty, mode);
    }

    @Override
    public String toString() {
        return "DirCriteriaDto{" +
               "empty=" + empty +
               ", mode='" + mode + '\'' +
               '}';
    }
}