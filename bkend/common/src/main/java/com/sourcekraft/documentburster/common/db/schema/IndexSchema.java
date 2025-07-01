package com.sourcekraft.documentburster.common.db.schema;

import java.util.Objects;

/**
 * Represents metadata about a specific index on a database table.
 * Index information helps LLMs understand uniqueness constraints and potential
 * query optimization strategies (though they usually focus more on PK/FK for joins).
 */
public class IndexSchema {
    /**
     * The name of the index.
     */
    public String indexName;

    /**
     * The name of the column included in the index.
     * For multi-column indexes, there will be multiple IndexSchema entries
     * with the same indexName but different reportColumnNames and ordinalPositions.
     */
    public String columnName;

    /**
     * Indicates whether the index enforces uniqueness.
     * True if the index is unique, false otherwise.
     * Derived from the NON_UNIQUE flag in JDBC metadata.
     */
    public boolean isUnique;

    /**
     * The type of the index (e.g., clustered, hashed, other).
     * Values correspond to constants in {@link java.sql.DatabaseMetaData} like
     * {@code tableIndexClustered}, {@code tableIndexHashed}, {@code tableIndexOther}.
     * {@code tableIndexStatistic} is usually filtered out.
     */
    public short type;

    /**
     * The position of the column within the index (1-based).
     * Relevant for multi-column indexes.
     */
    public short ordinalPosition;

    /**
     * Supplementary textual notes explaining the purpose or rationale
     * for this index (e.g., "Improves performance of user lookups by email").
     * This is typically not fetched directly from standard JDBC metadata.
     */
    public String notes; // Renamed from description

    // Could add filter condition if available/needed: public String filterCondition;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IndexSchema that = (IndexSchema) o;
        // Compare by index name and column name for uniqueness within a table context
        return Objects.equals(indexName, that.indexName) &&
               Objects.equals(columnName, that.columnName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(indexName, columnName);
    }

     /**
      * Provides a string representation for debugging.
      */
     @Override
     public String toString() {
        return "IndexSchema{" +
               "indexName='" + indexName + '\'' +
               ", columnName='" + columnName + '\'' +
               ", isUnique=" + isUnique +
               ", type=" + type +
               ", ordinalPosition=" + ordinalPosition +
               ", notes='" + notes + '\'' +
               '}';
     }
}