package com.sourcekraft.documentburster.common.analytics.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for pivot table operations.
 * Contains the raw data and aggregated results from the pivot query.
 */
public class PivotResponse {

    private List<Map<String, Object>> data = new ArrayList<>();
    private Map<String, Object> aggregatedData = new HashMap<>();
    private PivotMetadata metadata = new PivotMetadata();

    // Constructors
    public PivotResponse() {
    }

    public PivotResponse(List<Map<String, Object>> data) {
        this.data = data;
    }

    // Getters and Setters
    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }

    public Map<String, Object> getAggregatedData() {
        return aggregatedData;
    }

    public void setAggregatedData(Map<String, Object> aggregatedData) {
        this.aggregatedData = aggregatedData;
    }

    public PivotMetadata getMetadata() {
        return metadata;
    }

    public void setMetadata(PivotMetadata metadata) {
        this.metadata = metadata;
    }

    /**
     * Metadata about the pivot operation execution.
     */
    public static class PivotMetadata {
        private long executionTimeMs;
        private int rowCount;
        private String aggregatorUsed;
        private boolean cached = false;
        private List<String> availableColumns;

        public long getExecutionTimeMs() {
            return executionTimeMs;
        }

        public void setExecutionTimeMs(long executionTimeMs) {
            this.executionTimeMs = executionTimeMs;
        }

        public int getRowCount() {
            return rowCount;
        }

        public void setRowCount(int rowCount) {
            this.rowCount = rowCount;
        }

        public String getAggregatorUsed() {
            return aggregatorUsed;
        }

        public void setAggregatorUsed(String aggregatorUsed) {
            this.aggregatorUsed = aggregatorUsed;
        }

        public boolean isCached() {
            return cached;
        }

        public void setCached(boolean cached) {
            this.cached = cached;
        }

        public List<String> getAvailableColumns() {
            return availableColumns;
        }

        public void setAvailableColumns(List<String> availableColumns) {
            this.availableColumns = availableColumns;
        }

        @Override
        public String toString() {
            return "PivotMetadata{" +
                    "executionTimeMs=" + executionTimeMs +
                    ", rowCount=" + rowCount +
                    ", aggregatorUsed='" + aggregatorUsed + '\'' +
                    ", cached=" + cached +
                    '}';
        }
    }

    @Override
    public String toString() {
        return "PivotResponse{" +
                "dataSize=" + data.size() +
                ", metadata=" + metadata +
                '}';
    }
}
