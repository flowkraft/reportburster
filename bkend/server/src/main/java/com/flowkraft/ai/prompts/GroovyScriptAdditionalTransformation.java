package com.flowkraft.ai.prompts;

import java.util.List;

public final class GroovyScriptAdditionalTransformation {

    private GroovyScriptAdditionalTransformation() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "GROOVY_SCRIPT_ADDITIONAL_TRANSFORMATION",
            "Groovy `Additional Data Transformation` Script (Java 8 Stream API)",
            "Generates a Groovy script for the \"Additional Data Transformation\" step in DataPallas, transforming ctx.reportData using Java 8 Stream API.",
            List.of("groovy", "transformation", "java8=stream-api"),
            "Script Writing Assistance",
            """
You are an expert Groovy Developer specializing in data transformation for the reporting tool DataPallas.

Your task is to write a complete Groovy script that performs **additional data transformation** on a dataset that has already been fetched and is available as a `List<Map<String, Object>>` in the variable `ctx.reportData`.

**YOUR TASK:**

Based on all the rules and examples below, write a complete Groovy script for the following business requirement.
Provide **only** the final Groovy script in a single Markdown code block, with no other text or explanation.

<REQUIREMENT>
[USER: PASTE YOUR PLAIN ENGLISH BUSINESS REQUIREMENT HERE]
</REQUIREMENT>

This script will be used as the "Additional Data Transformation" step in DataPallas.
It runs within a Java application and has access to a context object named `ctx`.
The input data is already available as `ctx.reportData`, which is a `List<Map<String, Object>>` (each map is a row, keys are column names).

**CRITICAL INSTRUCTIONS: You must follow these "Golden Rules" precisely.**

1.  **The Script's One Job: Transform `ctx.reportData`**
    *   The script's entire purpose is to take the existing `ctx.reportData` (a `List<Map<String, Object>>`), apply the required transformations, and assign the transformed list back to `ctx.reportData`.
    *   You may also update `ctx.reportColumnNames` if you add or remove columns.

2.  **Think in Rows and Columns: `List<Map>` is Law**
    *   The data structure must remain a `List` of `Map`s.
    *   The **`List`** represents the entire dataset (all the rows).
    *   Each **`Map`** inside the list represents a single row of data.
    *   The **`Map`'s keys** (which must be `String`s) are the column names available in the report template (e.g., `${OrderID}`, `${CustomerName}`, etc.). Use `LinkedHashMap` if column order is important.

3.  **Use Java 8 Stream API for Transformation**
    *   **DO** use Groovy's support for Java 8 Stream API (e.g., `ctx.reportData.stream()...collect(Collectors.toList())`) for filtering, mapping, grouping, and other transformations.
    *   **DO** use Groovy closures and idioms where appropriate, but focus on demonstrating the Java 8 Stream approach.

4.  **Transform, Don't Fetch**
    *   **DO NOT** fetch new data from the database or external sources. Only transform the data already present in `ctx.reportData`.
    *   **DO** perform calculations, filtering, enrichment, aggregation, or restructuring as required by the business requirement.

5.  **Prepare Data for the Template**
    *   **DO** perform all complex calculations, data lookups, and business logic inside the script to create the final, clean `Map` of data for each row. The template should be as simple as possible.
    *   **DON'T** put complex conditional logic or calculations in the report template. Prepare the data fully in the script first.

6.  **Logging**
    *   **DO** use `log.info`, `log.debug`, and `log.error` for important steps. Exceptions propagate naturally — do not wrap in try/catch.

---

**EXAMPLES OF HIGH-QUALITY TRANSFORMATION SCRIPTS:**

Here are examples of scripts that correctly follow these rules for different transformation scenarios.

**Example 1: Filter Rows and Add a Calculated Column**

```groovy
import java.util.stream.Collectors
import java.math.BigDecimal

log.info("Starting additional data transformation: filter and add TotalPrice column...")

def transformedData = ctx.reportData.stream()
    .filter { row -> row.Status == 'Active' }
    .map { row ->
        def newRow = new LinkedHashMap<>(row)
        BigDecimal unitPrice = row.UnitPrice instanceof BigDecimal ? row.UnitPrice : new BigDecimal(row.UnitPrice.toString())
        BigDecimal quantity = row.Quantity instanceof BigDecimal ? row.Quantity : new BigDecimal(row.Quantity.toString())
        newRow.TotalPrice = unitPrice.multiply(quantity)
        return newRow
    }
    .collect(Collectors.toList())

ctx.reportData = transformedData
if (!transformedData.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(transformedData.get(0).keySet())
}
log.info("Transformation complete. Rows after filter: {}", ctx.reportData.size())
```

**Example 2: Group and Aggregate Data**

```groovy
import java.util.stream.Collectors
import java.math.BigDecimal

log.info("Starting additional data transformation: group by Department and sum Salary...")

def grouped = ctx.reportData.stream()
    .collect(Collectors.groupingBy(
        { row -> row.Department },
        Collectors.reducing(
            null,
            { row -> row },
            { a, b ->
                if (a == null) return b
                if (b == null) return a
                def sumSalary = (a.Salary ?: 0) + (b.Salary ?: 0)
                def result = new LinkedHashMap<>(a)
                result.Salary = sumSalary
                return result
            }
        )
    ))

def aggregatedData = grouped.values().stream()
    .filter { it != null }
    .collect(Collectors.toList())

ctx.reportData = aggregatedData
if (!aggregatedData.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(aggregatedData.get(0).keySet())
}
log.info("Transformation complete. Departments: {}", ctx.reportData.size())
```

**Example 3: Pivot/Crosstab Transformation**

```groovy
import java.util.stream.Collectors
import java.util.TreeSet

log.info("Starting additional data transformation: pivot by Region...")

def allRegions = new TreeSet(ctx.reportData.collect { it.Region })
def grouped = ctx.reportData.stream()
    .collect(Collectors.groupingBy({ row -> row.Category }))

def pivotedData = grouped.entrySet().stream()
    .map { entry ->
        def category = entry.key
        def rows = entry.value
        def rowMap = new LinkedHashMap<String, Object>()
        rowMap.Category = category
        allRegions.each { region ->
            def sum = rows.findAll { it.Region == region }
                .collect { it.Sales ?: 0 }
                .sum()
            rowMap[region] = sum
        }
        return rowMap
    }
    .collect(Collectors.toList())

ctx.reportData = pivotedData
if (!pivotedData.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(pivotedData.get(0).keySet())
}
log.info("Transformation complete. Categories: {}", ctx.reportData.size())
```

---

**REMEMBER:**
- Your script must only transform the data in `ctx.reportData` using Java 8 Stream API and Groovy idioms.
- Do not fetch new data or perform I/O.
- Output only the final Groovy script in a single Markdown code block."""
        );
    }
}
