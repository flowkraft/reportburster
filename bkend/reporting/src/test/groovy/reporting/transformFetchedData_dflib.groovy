//dflib failed repeatedly => we do it using standard java

import java.util.*
import java.util.stream.Collectors

// --- Input: Only ctx.reportData is expected from the outside (as List<LinkedHashMap<String, Object>>)

// 1) Extract header row and actual data rows
// Header row is the first element in the list
// LinkedHashMap<String, Object> headerRow = ctx.reportData.get(0)

// Data rows are all other elements
List<LinkedHashMap<String, Object>> dataRows = 
    ctx.reportData.size() > 1 ? ctx.reportData.subList(1, ctx.reportData.size()) : Collections.emptyList()

// 2) Group by Country and count occurrences
Map<String, Long> countryCounts = dataRows.stream()
    .map(row -> (String)row.get("Country"))
    .filter(Objects::nonNull)
    .collect(Collectors.groupingBy(
        country -> country,
        Collectors.counting()
    ))

// 3) Sort by count in descending order
List<Map.Entry<String, Long>> sortedEntries = new ArrayList<>(countryCounts.entrySet())
sortedEntries.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()))

// 4) Build result in expected format (List<LinkedHashMap<String, Object>>)
List<LinkedHashMap<String, Object>> result = new ArrayList<>()

// Add header row for our new structure
LinkedHashMap<String, Object> newHeaderRow = new LinkedHashMap<>()
newHeaderRow.put("Country", "Country")
newHeaderRow.put("CustomerCount", "CustomerCount")
result.add(newHeaderRow)

// Add data rows with the counts
for (Map.Entry<String, Long> entry : sortedEntries) {
    LinkedHashMap<String, Object> rowMap = new LinkedHashMap<>()
    rowMap.put("Country", entry.getKey())
    rowMap.put("CustomerCount", entry.getValue().toString())
    result.add(rowMap)
}

// 5) Replace the source data with our transformed data
ctx.reportData = result