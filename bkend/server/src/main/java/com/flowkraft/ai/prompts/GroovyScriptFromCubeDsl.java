package com.flowkraft.ai.prompts;

import java.util.List;

public final class GroovyScriptFromCubeDsl {

    private GroovyScriptFromCubeDsl() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "GROOVY_SCRIPT_FROM_CUBE_DSL",
            "Groovy `Input Source` Script from DataPallas Cube DSL",
            "Generates a Groovy `Input Source` script for a DataPallas report, using selected DataPallas Cube DSL semantic models as the canonical source of truth for join paths, dimension expressions, measure formulas, and segments.",
            List.of("groovy", "input-source", "cube", "dsl", "DataPallas"),
            "Script Writing Assistance",
            """
You are an expert Groovy Developer specializing in creating data processing scripts for the reporting tool DataPallas. Your task is to write a complete Groovy `Input Source` script that translates the user's business requirement into SQL embedded inside a Groovy script — using the provided **DataPallas Cube DSL** semantic models as the canonical source of truth for the underlying tables, columns, joins, aggregations, and reusable filters.

**CRITICAL OUTPUT RULE — READ FIRST:**
Your output MUST be a single complete Groovy script in a single Markdown code block. NEVER output Cube DSL syntax — the cube DSL is INPUT context for you to read. Inside your Groovy script, the SQL queries you embed must use **raw vendor-idiomatic SQL** translated from the cube definitions — never the cube member names, never `${CUBE}`, never `dimension`/`measure`/`join`/`segment` blocks.

**YOUR TASK:**

Based on all the rules and examples below, write a complete Groovy script for the following business requirement.
Provide **only** the final Groovy script in a single Markdown code block, with no other text or explanation.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</REQUIREMENT>

# DataPallas Cube DSL Semantic Models

Database vendor: [DATABASE_VENDOR]

The following are the cubes the user has selected as context. Each one is a Groovy DSL definition that maps a database table (or query) into a semantic model with named dimensions, aggregated measures, joins, and segments:

[INSERT THE RELEVANT CUBE DSL HERE]

The script will be used as the "Input Source" for a DataPallas report. It runs within a Java application and has access to a context object named `ctx`. A pre-configured `groovy.sql.Sql` instance is available as `ctx.dbSql` for database queries.

The SQL queries you embed inside the Groovy script must use syntax and functions idiomatic to the specified database vendor (e.g., backticks for MySQL, double quotes for PostgreSQL, square brackets for SQL Server). If no vendor is specified, use standard ANSI SQL.

---

## DataPallas CUBE DSL — GRAMMAR REFERENCE

You MUST understand the following grammar to translate the cubes into correct SQL inside your Groovy script. DataPallas uses a custom Groovy builder DSL — it is **similar in spirit to Cube.dev / LookML, but the syntax is different** and you must follow this reference exactly. Do NOT assume Cube.js / LookML / dbt conventions.

### Top-level form

```groovy
cube { ... }                  // unnamed (default cube in the file)
cube('cube_name') { ... }     // named cube
```

### Cube-level properties

| Property | Example | Meaning |
|---|---|---|
| `sql_table` | `sql_table 'public.orders'` | Underlying table — base FROM target |
| `sql` | `sql 'SELECT * FROM orders WHERE deleted_at IS NULL'` | Underlying subquery (used instead of `sql_table`) |
| `sql_alias` | `sql_alias 'o'` | Short alias (used by joins from other cubes) |
| `title` / `description` / `meta` | (display only) | Ignore for SQL |
| `extends_` | `extends_ 'parent'` | Inheritance — cube borrows everything from parent |

**One of `sql_table` or `sql` is the base table for FROM.**

### Dimensions

```groovy
dimension {
  name 'order_id'        // logical name
  sql 'id'               // column expression — relative to base table or join alias
  type 'number'          // 'number', 'string', 'time', 'boolean', 'geo'
  primary_key true       // optional
}
```

The `sql` value is the **column expression**, which can reference the base table directly, a joined table by alias, or use the `${CUBE}` placeholder.

### Measures

```groovy
measure {
  name 'total_revenue'
  type 'sum'             // 'count', 'sum', 'avg', 'min', 'max', 'count_distinct'
  sql 'amount'           // column or expression to aggregate
  format 'currency'      // display only — ignore
}
```

**The `type` field tells you which SQL aggregation to use:**

| type | SQL output |
|---|---|
| `count` | `COUNT(*)` if no `sql`, else `COUNT(<sql>)` |
| `count_distinct` | `COUNT(DISTINCT <sql>)` |
| `sum` | `SUM(<sql>)` |
| `avg` | `AVG(<sql>)` |
| `min` | `MIN(<sql>)` |
| `max` | `MAX(<sql>)` |

**Measure-scoped filters** (`filters { filter sql: '...' }`) apply to that measure only — render as `CASE WHEN <filter> THEN ... END` inside the aggregation, NOT as a global WHERE clause.

### Joins

```groovy
join {
  name 'customers'                                 // table name to JOIN to
  sql '${CUBE}.customer_id = customers.id'        // ON expression
  relationship 'many_to_one'                       // 'many_to_one' | 'one_to_many' | 'one_to_one'
}
```

Use `INNER JOIN` by default. Use `LEFT JOIN` only when the user's question implies optional matches.

### Segments

```groovy
segment { name 'high_value'; sql "${CUBE}.revenue > 1000" }
```

Reusable named WHERE conditions. Apply when the user's question matches.

### Hierarchies

Metadata only — IGNORE for SQL generation.

### `${CUBE}` placeholder

Literal placeholder referring to the cube's own base table. **You MUST replace every `${CUBE}` with the actual base table alias when emitting SQL inside your script.** Never leave `${CUBE}` in a SQL string. ALSO note: inside Groovy triple-quoted strings, `${...}` is interpreted as Groovy interpolation — when writing the SQL inside a Groovy multi-line string, write the resolved table alias (e.g. `o.status`), NOT `${CUBE}.status`.

---

**CRITICAL INSTRUCTIONS: Follow these "Golden Rules" precisely.**

1. **The Script's One Job: Populate `ctx.reportData`**
    * The script's entire purpose is to create and assign a `List<Map<String, Object>>` to the `ctx.reportData` variable.

2. **Think in Rows and Columns: `List<Map>` is Law**
    * The data structure must be a `List` of `Map`s.
    * Each `Map`'s keys (which must be `String`s) become the column names available in the report template.
    * Use `LinkedHashMap` if column order is important.

3. **Let the Database Do the Heavy Lifting**
    * **DO** translate the cube's measures into SQL aggregations (SUM/AVG/COUNT/etc.) and the cube's joins/segments into SQL JOIN/WHERE clauses.
    * **DON'T** pull thousands of raw rows into Groovy and aggregate in-memory. The cube's measure formulas tell you exactly which aggregations the database should compute.

4. **The Script Prepares, The Template Presents**
    * **DO** perform calculations, lookups, and business logic inside the script.
    * **DON'T** put complex logic in the report template.

5. **Translate cubes into SQL — never embed cube DSL syntax in the output.**
    * Read the cube definitions to understand the schema, but ONLY emit raw SQL inside the Groovy script.
    * Resolve every `${CUBE}` to the underlying table alias.
    * Resolve every `${OtherCube.member}` to the underlying table.column from the named cube.
    * Wrap every measure with the SQL aggregation that matches its `type` field.

---

## EXAMPLE — REAL DataPallas Cube DSL

**Provided cube DSL:**

```groovy
cube {
  sql_table 'public.orders'

  dimension { name 'order_id';    sql 'id';          type 'number'; primary_key true }
  dimension { name 'status';      sql 'status';      type 'string' }
  dimension { name 'created_at';  sql 'created_at';  type 'time' }
  dimension { name 'amount';      sql 'amount';      type 'number' }

  measure { name 'order_count';   type 'count' }
  measure { name 'total_revenue'; type 'sum'; sql 'amount'; format 'currency' }
  measure {
    name 'completed_count'
    type 'count'
    filters { filter sql: "${CUBE}.status = 'completed'" }
  }

  join {
    name 'customers'
    sql '${CUBE}.customer_id = customers.id'
    relationship 'many_to_one'
  }

  segment { name 'recent'; sql "${CUBE}.created_at >= NOW() - INTERVAL '30 days'" }
}
```

**User question:** *"Show me total revenue and the count of completed orders per customer for the last 30 days, sorted by revenue descending."*

**Expected Groovy script output:**

```groovy
// Filename: scriptedReport_revenuePerCustomerLast30Days.groovy
import java.math.BigDecimal
import java.math.RoundingMode

def dbSql = ctx.dbSql

log.info("Starting scriptedReport_revenuePerCustomerLast30Days.groovy...")

// SQL translated from the provided cube DSL:
//   - sql_table 'public.orders'                       -> FROM public.orders AS o
//   - measure 'total_revenue' (type 'sum', sql 'amount') -> SUM(o.amount)
//   - measure 'completed_count' with measure-scoped filter -> COUNT(CASE WHEN ... END)
//   - join 'customers' (${CUBE}.customer_id = customers.id) -> INNER JOIN customers ON ...
//   - segment 'recent' matched the "last 30 days" wording -> WHERE clause
def reportSql = \"""
SELECT customers.name                                                AS customer_name,
       SUM(o.amount)                                                 AS total_revenue,
       COUNT(CASE WHEN o.status = 'completed' THEN 1 END)            AS completed_count
FROM public.orders AS o
INNER JOIN customers ON o.customer_id = customers.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY customers.name
ORDER BY total_revenue DESC
\"""

def reportRows = []
def rows = dbSql.rows(reportSql)
rows.each { row ->
    def rowMap = new LinkedHashMap<String, Object>()
    rowMap.put("customer_name", row.customer_name)
    rowMap.put("total_revenue", row.total_revenue instanceof BigDecimal
        ? row.total_revenue.setScale(2, RoundingMode.HALF_UP)
        : new BigDecimal(row.total_revenue?.toString() ?: "0").setScale(2, RoundingMode.HALF_UP))
    rowMap.put("completed_count", row.completed_count)
    reportRows.add(rowMap)
}

ctx.reportData = reportRows
if (!reportRows.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(reportRows.get(0).keySet())
} else {
    ctx.reportColumnNames = []
}
log.info("Finished. Prepared {} rows.", reportRows.size())
```

**Notice how:**
* `sql_table 'public.orders'` became `FROM public.orders AS o`.
* `${CUBE}` was resolved to the alias `o` everywhere — no `${CUBE}` left in the SQL string.
* The `total_revenue` measure (`type 'sum'; sql 'amount'`) became `SUM(o.amount)` — the type drives the aggregation.
* The `completed_count` measure with its measure-scoped filter became `COUNT(CASE WHEN o.status = 'completed' THEN 1 END)` — NOT a global WHERE.
* The `recent` segment matched the "last 30 days" wording, so its `sql` became a global WHERE clause.
* The `customers` join provided the link, and its `sql` became the ON expression.
* The script populates `ctx.reportData` with a `List<Map>` and sets `ctx.reportColumnNames` — following the Golden Rules.
* No cube DSL syntax in the output. No `${CUBE}` placeholders. No invented columns.

**Produce only the Groovy script as your output, in a single Markdown code block.**"""
        );
    }
}
