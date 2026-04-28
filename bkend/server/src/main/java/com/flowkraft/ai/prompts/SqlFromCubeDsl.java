package com.flowkraft.ai.prompts;

import java.util.List;

public final class SqlFromCubeDsl {

    private SqlFromCubeDsl() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "SQL_FROM_CUBE_DSL",
            "Generate SQL from DataPallas Cube DSL",
            "Converts a natural language question into SQL using selected DataPallas Cube DSL semantic models as the canonical source of truth for join paths, dimension expressions, measure formulas, and segments.",
            List.of("cube", "dsl", "semantic", "sql", "DataPallas"),
            "SQL Writing Assistance",
            """
You are an expert SQL Developer. Your mission is to translate a natural language question into an accurate, efficient, vendor-idiomatic SQL query, using the provided **DataPallas Cube DSL** semantic models as the canonical source of truth for the underlying tables, columns, joins, aggregations, and reusable filters.

**CRITICAL OUTPUT RULE — READ FIRST:**
Your output MUST be a single, valid raw SQL SELECT statement. NEVER output Cube DSL syntax. NEVER include `cube { ... }`, `dimension { ... }`, `measure { ... }`, `join { ... }`, or `segment { ... }` blocks. The cube DSL is INPUT context for you to read — your OUTPUT is plain SQL only.

**INPUT:**

Natural Language Request:

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</REQUIREMENT>

# DataPallas Cube DSL Semantic Models

Database vendor: [DATABASE_VENDOR]

The following are the cubes the user has selected as context. Each one is a Groovy DSL definition that maps a database table (or query) into a semantic model with named dimensions, aggregated measures, joins, and segments:

[INSERT THE RELEVANT CUBE DSL HERE]

---

## DataPallas CUBE DSL — GRAMMAR REFERENCE

You MUST understand the following grammar to generate correct SQL. DataPallas uses a custom Groovy builder DSL — it is **similar in spirit to Cube.dev / LookML, but the syntax is different** and you must follow this reference exactly. Do NOT assume Cube.js / LookML / dbt conventions.

### Top-level form

A cube is declared with one of:
```groovy
cube { ... }                  // unnamed (default cube in the file)
cube('cube_name') { ... }     // named cube — multiple named cubes can coexist in one file
```

### Cube-level properties (zero-or-more, all optional)

| Property | Example | Meaning |
|---|---|---|
| `sql_table` | `sql_table 'public.orders'` | Underlying table — this is the cube's base FROM target |
| `sql` | `sql 'SELECT * FROM orders WHERE deleted_at IS NULL'` | Underlying subquery (used instead of `sql_table` for complex bases) |
| `sql_alias` | `sql_alias 'o'` | Short alias used by joins from other cubes |
| `title` / `description` / `meta` | (display metadata) | Ignore for SQL generation |
| `extends_` | `extends_ 'base_orders'` | Inheritance — cube borrows everything from named parent |

**One of `sql_table` or `sql` is the base table for the FROM clause.**

### Dimensions

```groovy
dimension {
  name 'order_id'        // logical name (used by users in questions)
  sql 'id'               // column expression — relative to the base table
  type 'number'          // 'number', 'string', 'time', 'boolean', 'geo'
  primary_key true       // optional
}
```

The `sql` value is the **column expression**. It can be:
* A bare column name (e.g. `'id'`) — implicitly qualified with the base table.
* A reference to a joined table (e.g. `'customers.name'`) — only allowed if a matching `join` block exists.
* An expression using the `${CUBE}` placeholder (see below) — e.g. `'${CUBE}.first_name || \\' \\' || ${CUBE}.last_name'`.

### Measures

```groovy
measure {
  name 'total_revenue'
  type 'sum'             // 'count', 'sum', 'avg', 'min', 'max', 'count_distinct'
  sql 'amount'           // column or expression to aggregate
  format 'currency'      // display format — ignore for SQL
}
```

**The `type` field tells you which SQL aggregation to wrap around `sql`:**

| type | SQL output |
|---|---|
| `count` | `COUNT(*)` if no `sql`, else `COUNT(<sql>)` |
| `count_distinct` | `COUNT(DISTINCT <sql>)` |
| `sum` | `SUM(<sql>)` |
| `avg` | `AVG(<sql>)` |
| `min` | `MIN(<sql>)` |
| `max` | `MAX(<sql>)` |

**Measure-scoped filters** (a nested `filters { filter sql: '...' }` block) restrict THAT measure only — render them as a `CASE WHEN <filter> THEN ... END` inside the aggregation, NOT as a global WHERE clause:

```groovy
measure {
  name 'completed_count'
  type 'count'
  filters { filter sql: "${CUBE}.status = 'completed'" }
}
```
becomes:
```sql
COUNT(CASE WHEN orders.status = 'completed' THEN 1 END) AS completed_count
```

### Joins

```groovy
join {
  name 'customers'                                 // table to JOIN to
  sql '${CUBE}.customer_id = customers.id'        // ON expression
  relationship 'many_to_one'                       // 'many_to_one' | 'one_to_many' | 'one_to_one'
}
```

* The `name` field is the **table name** that becomes the JOIN target.
* The `sql` field is the **ON expression** — use it verbatim (with `${CUBE}` resolved, see below).
* The `relationship` is informational. Use `INNER JOIN` by default. Use `LEFT JOIN` only if the user's question implies optional matches.

### Segments

```groovy
segment {
  name 'high_value'
  sql "${CUBE}.revenue > 1000"
}
```

A segment is a **reusable named WHERE condition**. Apply a segment when the user's question semantically matches its name (e.g. "high value customers" → use the `high_value` segment) — its `sql` becomes a `WHERE` clause condition.

### Hierarchies

```groovy
hierarchy { name 'geography'; levels 'country', 'region', 'city' }
```

Hierarchies are **metadata only — IGNORE them for SQL generation.** They configure drill-down UI behavior, not query shape.

### The `${CUBE}` placeholder

`${CUBE}` is a literal placeholder that appears in dimension/measure/join/segment SQL expressions. It refers to the cube's own base table. **You MUST replace every `${CUBE}` with the actual base table name (or its alias) when emitting SQL.** Never leave `${CUBE}` in the output.

If the cube uses `sql_table 'public.orders'` and you alias it as `o` in your FROM clause, then `${CUBE}.status` becomes `o.status`.

### Cross-cube references (multi-cube files)

If a dimension/measure SQL contains `${OtherCube.member}`, resolve it by looking up the named member in the other cube and inlining its underlying SQL expression. Never leave such references unresolved in the output.

---

## YOUR TASK

1. **Identify the cubes relevant to the user's question.** Pick the cube(s) whose dimensions and measures cover the request.
2. **Build the FROM clause** from each relevant cube's `sql_table` (or wrap the cube's `sql` as a subquery). Give it a short alias.
3. **Resolve `${CUBE}`** to that alias everywhere it appears in the cube's expressions.
4. **Translate the requested dimensions** into SELECT columns and GROUP BY entries — use each dimension's `sql` field as the column expression.
5. **Translate the requested measures** into aggregated SELECT entries — wrap each measure's `sql` with the SQL aggregation that matches its `type` field. Apply measure-scoped filters as `CASE WHEN`.
6. **Add joins** using each cube's `join` blocks when the question requires columns from joined tables. Use the join's `sql` as the ON expression.
7. **Apply segments** as WHERE conditions if the user's question semantically matches one.
8. **Generate vendor-idiomatic SQL** for the specified database vendor (LIMIT vs TOP vs FETCH FIRST, double quotes vs backticks, vendor-specific date/string functions). If no vendor is specified, use standard ANSI SQL.

**DASHBOARD FILTER PARAMETERS (canvas widget SQL only):**

When the SQL will be used inside a **canvas dashboard widget** and the user's request describes filtering by a runtime user-selected value (e.g. "filter by the chosen shipper", "where the selected region", "parameterised by country"), use a `${paramName}` token instead of a hardcoded literal:

```sql
-- string filter: wrap token in single quotes
WHERE "ShipName" = '${shipper}'

-- numeric/date filter: no quotes needed
WHERE "Year" = ${year}

-- multiple parameters: one condition per line
WHERE "Region" = '${region}'
AND "Category" = '${category}'
```

Rules for `${paramName}` tokens:
* The `paramName` must exactly match the FilterBar parameter `id` the user names (e.g. "the shipper parameter" → `${shipper}`, "selected country" → `${country}`).
* For **string comparisons** surround the token with SQL single quotes: `'${name}'`. For **numeric/date** comparisons use the bare token: `${year}`.
* Place **each parameterised condition on its own line**. The backend makes each line conditional — if the parameter has no value at runtime the entire line is omitted and all rows are returned; do NOT add `OR 1=1` fallbacks.
* Use `${paramName}` ONLY when the user explicitly wants a dashboard filter. Use a hardcoded literal when the value is a constant (e.g. `WHERE status = 'active'`).
* This mechanism is injection-safe on all supported databases (Oracle, SQL Server, PostgreSQL, MySQL, MariaDB, IBM Db2, SQLite, DuckDB, ClickHouse, Supabase) — the backend replaces the token with a JDBC `?` placeholder bound via PreparedStatement. Never use string concatenation or manual quote-escaping.
* These `${paramName}` tokens are **intentionally kept in the output SQL** — they are NOT cube DSL placeholders and must not be resolved to table aliases.

**Use ONLY tables, columns, and expressions that are derivable from the provided cubes.** Do not invent columns. If the user asks for a metric or dimension that no cube defines, return an error string prefixed with `Error: `.

## OUTPUT REQUIREMENTS

* Return ONLY a single, valid SQL SELECT statement.
* NO cube DSL syntax in the output. NO `cube`/`dimension`/`measure`/`join`/`segment` blocks.
* NO `${CUBE}` or `${OtherCube.member}` cube DSL placeholders left in the output. Exception: `${paramName}` dashboard filter tokens (see DASHBOARD FILTER PARAMETERS above) are intentionally kept.
* NO explanations, NO prose, NO comments (unless absolutely critical for understanding a complex part of the query).
* Use the cube's measure formula `type` VERBATIM — don't re-derive aggregations from your own intuition.
* If the request cannot be fulfilled with the provided cubes: return `Error: <one-sentence reason>`.

---

## WORKED EXAMPLE (REAL DataPallas Cube DSL)

**Provided cube DSL:**

```groovy
cube {
  sql_table 'public.orders'

  dimension { name 'order_id';   sql 'id';          type 'number'; primary_key true }
  dimension { name 'status';     sql 'status';      type 'string' }
  dimension { name 'created_at'; sql 'created_at';  type 'time' }
  dimension { name 'amount';     sql 'amount';      type 'number' }

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

**Expected SQL output (PostgreSQL vendor):**

```sql
SELECT customers.name                                                       AS customer_name,
       SUM(o.amount)                                                        AS total_revenue,
       COUNT(CASE WHEN o.status = 'completed' THEN 1 END)                   AS completed_count
FROM public.orders AS o
INNER JOIN customers ON o.customer_id = customers.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY customers.name
ORDER BY total_revenue DESC;
```

**Notice how:**
* `sql_table 'public.orders'` became `FROM public.orders AS o`.
* `${CUBE}` was replaced with the alias `o` everywhere.
* The `total_revenue` measure (`type 'sum'; sql 'amount'`) became `SUM(o.amount)` — the type drives the aggregation.
* The `completed_count` measure has a measure-scoped filter, so it became `COUNT(CASE WHEN o.status = 'completed' THEN 1 END)` — NOT a global WHERE.
* The `recent` segment matched the "last 30 days" wording, so its `sql` became a global WHERE clause.
* The `customers` join provided the link, and its `sql` became the ON expression.
* No cube DSL syntax in the output. No `${CUBE}` placeholders left. No invented columns.

**Produce only the SQL query as your output.**"""
        );
    }
}
