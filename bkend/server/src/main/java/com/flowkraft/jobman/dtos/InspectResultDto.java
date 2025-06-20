package com.flowkraft.jobman.dtos;

import java.time.Instant;
import java.util.Objects;

/**
 * DTO representing the inspection details of a file system entry.
 * Replaces SystemService.InspectResult.
 */
public class InspectResultDto {
    private String name;
    private String type; // "dir" or "file"
    private Long size; // Only applicable for files
    private String md5; // If checksum requested
    private Integer mode; // If mode requested
    private Instant accessTime; // If times requested
    private Instant modifyTime; // If times requested
    private Instant changeTime; // If times requested
    private Instant birthTime; // If times requested

    // Default constructor
    public InspectResultDto() {}

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }
    public String getMd5() { return md5; }
    public void setMd5(String md5) { this.md5 = md5; }
    public Integer getMode() { return mode; }
    public void setMode(Integer mode) { this.mode = mode; }
    public Instant getAccessTime() { return accessTime; }
    public void setAccessTime(Instant accessTime) { this.accessTime = accessTime; }
    public Instant getModifyTime() { return modifyTime; }
    public void setModifyTime(Instant modifyTime) { this.modifyTime = modifyTime; }
    public Instant getChangeTime() { return changeTime; }
    public void setChangeTime(Instant changeTime) { this.changeTime = changeTime; }
    public Instant getBirthTime() { return birthTime; }
    public void setBirthTime(Instant birthTime) { this.birthTime = birthTime; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InspectResultDto that = (InspectResultDto) o;
        return Objects.equals(name, that.name) && Objects.equals(type, that.type) && Objects.equals(size, that.size) && Objects.equals(md5, that.md5) && Objects.equals(mode, that.mode) && Objects.equals(accessTime, that.accessTime) && Objects.equals(modifyTime, that.modifyTime) && Objects.equals(changeTime, that.changeTime) && Objects.equals(birthTime, that.birthTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, type, size, md5, mode, accessTime, modifyTime, changeTime, birthTime);
    }

    @Override
    public String toString() {
        // Consider using a library like Jackson for a more robust toString if needed
        return "InspectResultDto{" + // Basic toString
               "name='" + name + '\'' +
               ", type='" + type + '\'' +
               ", size=" + size +
               // ... include other fields as needed
               '}';
    }
}