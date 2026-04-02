package com.flowkraft.analytics.engine.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for associative exploration.
 * Contains per-field lists of associated and excluded values.
 */
public class ExploreResponse {

    /** Per-field state: which values are associated vs excluded */
    private Map<String, FieldState> fieldStates = new LinkedHashMap<>();

    private ExploreMetadata metadata = new ExploreMetadata();

    // Constructors
    public ExploreResponse() {}

    public ExploreResponse(Map<String, FieldState> fieldStates) {
        this.fieldStates = fieldStates;
    }

    // Getters and Setters
    public Map<String, FieldState> getFieldStates() { return fieldStates; }
    public void setFieldStates(Map<String, FieldState> fieldStates) { this.fieldStates = fieldStates; }

    public ExploreMetadata getMetadata() { return metadata; }
    public void setMetadata(ExploreMetadata metadata) { this.metadata = metadata; }

    /**
     * State for a single field: which distinct values are associated (exist in filtered rows)
     * and which are excluded (exist in unfiltered rows but not in filtered rows).
     */
    public static class FieldState {
        private List<String> associated = new ArrayList<>();
        private List<String> excluded = new ArrayList<>();

        public FieldState() {}

        public FieldState(List<String> associated, List<String> excluded) {
            this.associated = associated;
            this.excluded = excluded;
        }

        public List<String> getAssociated() { return associated; }
        public void setAssociated(List<String> associated) { this.associated = associated; }

        public List<String> getExcluded() { return excluded; }
        public void setExcluded(List<String> excluded) { this.excluded = excluded; }
    }

    /**
     * Metadata about the explore operation.
     */
    public static class ExploreMetadata {
        private long executionTimeMs;
        private String engine;
        private boolean cached;
        private String hint;

        public long getExecutionTimeMs() { return executionTimeMs; }
        public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

        public String getEngine() { return engine; }
        public void setEngine(String engine) { this.engine = engine; }

        public boolean isCached() { return cached; }
        public void setCached(boolean cached) { this.cached = cached; }

        public String getHint() { return hint; }
        public void setHint(String hint) { this.hint = hint; }
    }
}
