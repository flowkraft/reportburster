import java.util.stream.*
import java.util.Map
import java.util.List
import java.util.LinkedHashMap
import java.util.function.Function
import java.util.Comparator

// Group customers by country and count them, skipping the header row:
Map<String, Long> countryCounts = ctx.reportData.stream()
    .skip(1)                            // <— skip the header row
    .map(row -> row.get("Country"))
    .collect(Collectors.groupingBy(
        Function.identity(),
        Collectors.counting()
    ))

// Sort by count descending
Map<String, Long> sortedCountryCounts = countryCounts.entrySet().stream()
    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
    .collect(Collectors.toMap(
        Map.Entry::getKey,
        Map.Entry::getValue,
        (e1, e2) -> e1,
        LinkedHashMap::new
    ))

// Build your new result set (no header in here – TestsUtils will re–insert it)
List<LinkedHashMap<String, Object>> result = new ArrayList<>()
sortedCountryCounts.forEach((country, count) -> {
    LinkedHashMap<String, Object> row = new LinkedHashMap<>()
    row.put("Country", country)
    row.put("CustomerCount", count.toString())
    result.add(row)
})
// Add header row
LinkedHashMap<String, Object> header = new LinkedHashMap<>()
header.put("Country", "Country")
header.put("CustomerCount", "CustomerCount")
result.add(0, header)

// Replace reportData – now contains header + data rows
ctx.reportData = result