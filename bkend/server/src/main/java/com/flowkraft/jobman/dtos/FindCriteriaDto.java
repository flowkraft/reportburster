package com.flowkraft.jobman.dtos;

import java.util.List;
import java.util.Objects;

/**
 * DTO representing criteria for finding files/directories.
 * Can replace SystemService.FindCriteria if endpoint is changed to use @RequestBody.
 */
public class FindCriteriaDto {
    private List<String> matching;
    private boolean files = true; // Default value matching original constructor
    private boolean directories = false; // Default value matching original constructor
    private boolean recursive = false; // Default value matching original constructor
    private boolean ignoreCase = false; // Default value matching original constructor

    // Default constructor
    public FindCriteriaDto() {}

    // Constructor matching original FindCriteria logic
    public FindCriteriaDto(List<String> matching, Boolean files, Boolean directories, Boolean recursive, Boolean ignoreCase) {
        this.matching = matching;
        this.files = files != null ? files : true;
        this.directories = directories != null ? directories : false;
        this.recursive = recursive != null ? recursive : false;
        this.ignoreCase = ignoreCase != null ? ignoreCase : false;
    }

    // Getters and Setters
    public List<String> getMatching() { return matching; }
    public void setMatching(List<String> matching) { this.matching = matching; }
    public boolean isFiles() { return files; }
    public void setFiles(boolean files) { this.files = files; }
    public boolean isDirectories() { return directories; }
    public void setDirectories(boolean directories) { this.directories = directories; }
    public boolean isRecursive() { return recursive; }
    public void setRecursive(boolean recursive) { this.recursive = recursive; }
    public boolean isIgnoreCase() { return ignoreCase; }
    public void setIgnoreCase(boolean ignoreCase) { this.ignoreCase = ignoreCase; }

     @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FindCriteriaDto that = (FindCriteriaDto) o;
        return files == that.files && directories == that.directories && recursive == that.recursive && ignoreCase == that.ignoreCase && Objects.equals(matching, that.matching);
    }

    @Override
    public int hashCode() {
        return Objects.hash(matching, files, directories, recursive, ignoreCase);
    }

    @Override
    public String toString() {
        return "FindCriteriaDto{" +
               "matching=" + matching +
               ", files=" + files +
               ", directories=" + directories +
               ", recursive=" + recursive +
               ", ignoreCase=" + ignoreCase +
               '}';
    }
}