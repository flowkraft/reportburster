import org.apache.calcite.jdbc.CalciteConnection
import org.apache.calcite.schema.SchemaPlus
import org.apache.calcite.DataContext
import org.apache.calcite.linq4j.Enumerable
import org.apache.calcite.linq4j.Enumerator
import org.apache.calcite.schema.ScannableTable
import org.apache.calcite.schema.impl.AbstractTable
import org.apache.calcite.rel.type.RelDataTypeFactory
import org.apache.calcite.rel.type.RelDataType
import org.apache.calcite.sql.type.SqlTypeName

import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import java.sql.Statement
import java.util.Collections
import java.util.LinkedHashMap
import java.util.List
import java.util.Map
import java.util.Properties

// --- Input: Only ctx.reportData is expected from the outside ---
List<LinkedHashMap<String, Object>> raw = ctx.reportData

// 1) Skip the header row from ctx.reportData
List<LinkedHashMap<String, Object>> inputData = raw.size() > 1
    ? raw.subList(1, raw.size())
    : Collections.emptyList()

// --- In‑memory table definition (same as before) ---
class InMemoryTable extends AbstractTable implements ScannableTable {
    private final List<LinkedHashMap<String, Object>> data
    InMemoryTable(List<LinkedHashMap<String, Object>> data) {
        this.data = data
    }
    // Provide the row type (column names and types) to Calcite
    @Override RelDataType getRowType(RelDataTypeFactory typeFactory) {
        def builder = typeFactory.builder()
        if (!data.isEmpty()) {
            LinkedHashMap<String,Object> first = data.get(0)
            for (String col : first.keySet()) {
                // All fields come in as strings
                builder.add(col, SqlTypeName.VARCHAR)
            }
        }
        return builder.build()
    }
    @Override Enumerable<Object[]> scan(DataContext root) {
        return new org.apache.calcite.linq4j.AbstractEnumerable<Object[]>() {
            @Override Enumerator<Object[]> enumerator() {
                Iterator<LinkedHashMap<String, Object>> it = data.iterator()
                return new Enumerator<Object[]>() {
                    Object[] current
                    @Override boolean moveNext() {
                        if (!it.hasNext()) return false
                        LinkedHashMap<String, Object> row = it.next()
                        // ROW VALUES IN THE ORDER OF MAP.INSERTION
                        current = row.values().toArray()
                        return true
                    }
                    @Override Object[] current() { current }
                    @Override void reset() { throw new UnsupportedOperationException() }
                    @Override void close() {}
                }
            }
        }
    }
}

// --- Calcite Setup & Execution ---
Connection connection = null
Statement statement = null
ResultSet rs = null
List<LinkedHashMap<String, Object>> resultData = new ArrayList<>()

try {
    // Explicitly set case sensitivity and quoting strategy
    Properties info = new Properties()
    info.setProperty("caseSensitive", "true")
    
    // Get base Calcite connection with case sensitivity enabled
    connection = DriverManager.getConnection("jdbc:calcite:caseSensitive=true", info)
    CalciteConnection calciteConnection = connection.unwrap(CalciteConnection.class)

    // Get the root schema from the connection
    SchemaPlus rootSchema = calciteConnection.getRootSchema()

    // Add our in-memory table definition to the schema
    rootSchema.add("INPUT_DATA", new InMemoryTable(inputData))

    // Use quoted column names throughout the query to maintain case sensitivity
    statement = calciteConnection.createStatement()
    rs = statement.executeQuery(
        "SELECT \"Country\" AS Country, COUNT(*) AS CustomerCount " +
        "FROM INPUT_DATA " +
        "GROUP BY \"Country\" " +
        "ORDER BY CustomerCount DESC"
    )

    // Read rows into resultData
    while (rs.next()) {
        LinkedHashMap<String, Object> row = new LinkedHashMap<>()
        row.put("Country", rs.getString("Country"))
        row.put("CustomerCount", rs.getObject("CustomerCount").toString())
        resultData.add(row)
    }

} finally {
    // Clean up resources
    if (rs != null) try { rs.close() } catch (Exception e) { /* ignore */ }
    if (statement != null) try { statement.close() } catch (Exception e) { /* ignore */ }
    if (connection != null) try { connection.close() } catch (Exception e) { /* ignore */ }
}

// --- Final Steps ---

// 3) Re‑insert the header row
LinkedHashMap<String, Object> header = new LinkedHashMap<>()
header.put("Country", "Country")
header.put("CustomerCount", "CustomerCount")
resultData.add(0, header)

// Replace reportData – now has header + data rows
ctx.reportData = resultData