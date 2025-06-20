package com.flowkraft.jobman.dtos;

import java.util.Objects;

/**
 * DTO representing criteria for file operations (e.g., setting content, mode).
 * Replaces SystemService.FileCriteria.
 */
public class FileCriteriaDto {
    // Content can be complex (JSON, text), using Object and letting Jackson handle it.
    // Consider using String if content is always text.
    private Object content;
    private Integer jsonIndent; // If content is JSON
    private String mode;

    // Default constructor
    public FileCriteriaDto() {}

    // Getters and Setters
    public Object getContent() { return content; }
    public void setContent(Object content) { this.content = content; }
    public Integer getJsonIndent() { return jsonIndent; }
    public void setJsonIndent(Integer jsonIndent) { this.jsonIndent = jsonIndent; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileCriteriaDto that = (FileCriteriaDto) o;
        return Objects.equals(content, that.content) && Objects.equals(jsonIndent, that.jsonIndent) && Objects.equals(mode, that.mode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(content, jsonIndent, mode);
    }

     @Override
    public String toString() {
        return "FileCriteriaDto{" +
               "content=" + content + // Be careful logging large content
               ", jsonIndent=" + jsonIndent +
               ", mode='" + mode + '\'' +
               '}';
    }
}