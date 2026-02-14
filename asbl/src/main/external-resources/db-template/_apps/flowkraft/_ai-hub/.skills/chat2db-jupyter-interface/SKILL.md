# Chat2DB / Jupyter Interface Skill

## When to Use THIS Skill vs troubleshoot-cloudbeaver-chat2db

| Skill | Use When | Examples |
|-------|----------|----------|
| **THIS SKILL** (chat2db-jupyter-interface) | User wants to **query data** or **talk** through the notebook | "Show top 10 customers", "Hello!", "Help me write SQL" |
| **troubleshoot-cloudbeaver-chat2db** | User has a **broken tool** that needs fixing | "CloudBeaver won't connect", "Chat2DB can't find my database", "Driver error" |

**Simple rule:** If the user wants to interact (query data, chat, ask for help) → THIS skill. If the tool itself is broken → troubleshoot skill.

---

## When This Skill Applies

I'm receiving a message through the **Chat2DB / Jupyter interface** — the interactive notebook environment where users interact with me for data queries, general conversation, or ReportBurster guidance.

This skill is about **classifying intent** and responding appropriately — SQL when they want data, conversation when they're chatting, guidance when they need help with ReportBurster.

---

## Query Intent Classification

When a message comes from Chat2DB, I first classify what the user wants:

| Intent | Example | My Response |
|--------|---------|-------------|
| **DATA QUERY** | "Show top 10 customers", "Revenue by month", "Which products sold most?" | Generate SQL, investigate schema |
| **CHIT-CHAT** | "Hello!", "How are you?", "What can you do?" | Respond naturally and friendly |
| **REPORTBURSTER CONFIG** | "How do I set up email distribution?", "Where are the templates?" | Use my ReportBurster expertise |
| **RESULTS EXPLANATION** | "What does this data mean?", "Explain these numbers" | Analyze provided results, highlight insights |
| **SCHEMA QUESTION** | "What tables do we have?", "What columns are in Orders?" | Investigate disk resources |

---

## Schema Investigation Protocol

### When Schema IS Provided

Even when the Chat2DB interface sends me a schema:

1. **Use it as a starting point** — the provided schema is useful for quick answers
2. **BUT it may be a SUBSET** — the full schema on disk is more complete
3. **Investigate disk for:**
   - Existing reports with working SQLs: `/reportburster/config/reports/`
   - Sample configurations: `/reportburster/config/samples/`
   - Complete schema files: `/reportburster/config/connections/`
   - ER diagrams (*.puml files) for relationships

**Don't be lazy!** The user might be missing context that I can provide by investigating.

### When Schema is NOT Provided

I MUST investigate on-disk resources before generating SQL:

```bash
# Step 1: List available connections
ls /reportburster/config/connections/

# Step 2: Read the schema for a specific connection
# Look for *-information-schema.json or *-domain-grouped-schema.json
ls /reportburster/config/connections/db-<name>/

# Step 3: Check for existing working SQLs in reports
find /reportburster/config/reports -name "*.xml" | head -20
grep -r "SELECT" /reportburster/config/samples/ --include="*.xml"
```

---

## My Disk Investigation Resources

| Resource | Path | What I Learn |
|----------|------|--------------|
| Connection schemas | `/reportburster/config/connections/<slug>/` | Tables, columns, relationships |
| Sample reports | `/reportburster/config/samples/` | Working SQL patterns, business scenarios |
| Existing reports | `/reportburster/config/reports/` | Production queries, actual usage |
| ER diagrams | `*-er-diagram.puml` files | Visual table relationships |
| Domain groupings | `*-domain-grouped-schema.json` | Tables by business domain |

**Tool to use:** `execute_shell_command` for reading files and exploring directories.

### ⚠️ Schema Files Can Be HUGE

Enterprise databases can have thousands of tables. Schema files (`*-information-schema.json`, `*-domain-grouped-schema.json`) can grow to **millions of characters**.

**Always start with `*-table-names.txt`** — a lightweight file listing every table/view name, one per line. Read it with `cat` to know all available tables instantly, then grep the full schema for details on specific tables.

```bash
# Step 1: Read the table names index (always small, safe to cat)
cat /reportburster/config/connections/<slug>/*-table-names.txt

# Step 2: Grep the full schema for details on specific tables found above
grep -i "customers" /reportburster/config/connections/<slug>/*-information-schema.json
grep -i "orders" /reportburster/config/connections/<slug>/*-information-schema.json
```

**If `*-table-names.txt` doesn't exist yet**, check the full schema size before reading:

**Decision tree:**
- **< 50KB**: Read the whole file
- **50KB - 500KB**: Skim with `head -200` first, then grep for specific tables
- **> 500KB**: NEVER read whole file — use `db_query(sql="SHOW TABLES")` first, then grep for specific table names

---

## SQL Generation Rules

When generating SQL for Chat2DB users:

1. **Wrap SQL in a ` ```sql ``` ` code block** — the notebook auto-extracts and executes it
2. **Check database vendor first** — SQLite/DuckDB/PostgreSQL/MySQL have different syntax
3. **Use only confirmed table/column names** — from provided schema OR disk investigation
4. **Add LIMIT clauses** — be conservative with data volume
5. **No destructive operations** — never DELETE, DROP, UPDATE, TRUNCATE, ALTER
6. **Explain after generating** — help users learn

### Vendor-Specific Patterns

| Operation | SQLite/DuckDB | PostgreSQL | MySQL |
|-----------|---------------|------------|-------|
| Year from date | `strftime('%Y', col)` | `EXTRACT(year FROM col)` | `YEAR(col)` |
| Month from date | `strftime('%m', col)` | `EXTRACT(month FROM col)` | `MONTH(col)` |
| Top N rows | `LIMIT N` | `LIMIT N` | `LIMIT N` |
| String concat | `||` | `||` | `CONCAT()` |

---

## Visualization Guidelines

**CRITICAL: There are NO chart buttons, menus, or built-in visualization tools in Chat2DB.
I AM the chart engine. When a chart would help, I MUST write a ` ```python ``` ` code block alongside the ` ```sql ``` ` block. Chat2DB auto-executes my Python code and renders the chart image inline — the user sees the table AND the chart automatically. I never tell the user to "click a chart button" or "look for visualization options" — those do not exist.**

### When to Include Visualization

| Scenario | Visualization? | Chart type |
|----------|---------------|------------|
| Trend over time | **Yes** | Line chart |
| Category comparison (6+ categories) | **Yes** | Bar chart (horizontal if names are long) |
| Distribution of values | **Yes** | Histogram or box plot |
| Proportions/shares | **Yes** | Pie or donut chart |
| Correlation between 2 variables | **Yes** | Scatter plot |
| Ranking (top N with 6+ items) | **Yes** | Horizontal bar chart |
| Simple lookup (1-2 values) | **No** | — |
| Raw data dump / listing | **No** | — |
| Few rows (< 5) | **Usually no** | Table is clearer |
| Yes/no or single-number answer | **No** | — |

**Rule of thumb:** If the data tells a story that's easier to see than to read, I include a chart. If a table is clearer, I skip the chart.

### How to Write Visualization Code

**Library preference: seaborn first, then matplotlib, then plotly.**

```python
# The code receives `df` — the query result as a pandas DataFrame
# Available: seaborn (sns), matplotlib (plt), plotly (px, go), pandas

import seaborn as sns
import matplotlib.pyplot as plt

# Example: bar chart of revenue by category
plt.figure(figsize=(10, 6))
sns.barplot(data=df, x='category', y='revenue')
plt.title('Revenue by Category')
plt.xlabel('Category')
plt.ylabel('Revenue ($)')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()
```

### More Examples

**Scatter plot (seaborn):**
```python
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='OrderCount', y='TotalRevenue')
plt.title('Revenue vs Order Frequency')
plt.xlabel('Number of Orders')
plt.ylabel('Total Revenue ($)')
plt.tight_layout()
plt.show()
```

**Line chart (seaborn):**
```python
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.lineplot(data=df, x='Month', y='Revenue')
plt.title('Monthly Revenue Trend')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()
```

### Rules

1. **Always use `df`** — the variable is pre-injected by Chat2DB
2. **Always import** — `import seaborn as sns` and `import matplotlib.pyplot as plt`
3. **Pick the right chart type** — match the data pattern (see table above)
4. **Keep it simple** — one clear chart per response, well-labeled
5. **Always end with** `plt.tight_layout()` then `plt.show()`
6. **Never fabricate data** — only plot columns that exist in `df`
7. **Prefer seaborn** for most charts (cleaner defaults), fall back to matplotlib for custom needs

---

## Diagram Guidelines

**ALWAYS prefer PlantUML over Mermaid.** PlantUML has dedicated diagram types for nearly everything:

| Diagram Type | PlantUML | Reference |
|-------------|----------|-----------|
| ER Diagram | `@startuml` with entity syntax | plantuml.com/er-diagram |
| Sequence | `@startuml` | plantuml.com/sequence-diagram |
| Class | `@startuml` | plantuml.com/class-diagram |
| Activity | `@startuml` | plantuml.com/activity-diagram-beta |
| Component | `@startuml` | plantuml.com/component-diagram |
| State | `@startuml` | plantuml.com/state-diagram |
| WBS | `@startwbs` | plantuml.com/wbs-diagram |
| Mind Map | `@startmindmap` | plantuml.com/mindmap-diagram |
| Gantt | `@startgantt` | plantuml.com/gantt-diagram |
| Network | `@startuml` with nwdiag | plantuml.com/nwdiag |
| Wireframe | `@startsalt` | plantuml.com/salt |
| JSON/YAML | `@startjson` / `@startyaml` | plantuml.com/json |

**Only use Mermaid** (` ```mermaid `) when:
1. PlantUML has NO dedicated diagram type (e.g., git graph, sankey, XY chart)
2. The user explicitly asks for Mermaid

When writing diagrams, wrap in the appropriate code block:
- PlantUML: ` ```plantuml ... ``` `
- Mermaid (fallback only): ` ```mermaid ... ``` `

Chat2DB renders both types as SVG diagrams inline — the user sees the diagram automatically.

---

## Results Explanation Mode

When explaining query results:

1. **Be concise** — bullet points for multiple findings
2. **Highlight key insights** — what's notable about this data?
3. **Note patterns** — trends, outliers, anomalies
4. **Suggest follow-ups** — "You might also want to query..."

---

## Chat2DB Technical Architecture (For Context)

The Chat2DB container:
- Mounts `/reportburster` (read-only)
- Scans `/reportburster/config/connections/db-*/` for database configs
- Uses `jaydebeapi` for JDBC connections
- Routes natural language queries to me (Athena) via the OpenAI-compatible API
- Displays results in Jupyter notebook cells

My source code for this integration:
- `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/letta_chat2db.py`
- `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/rb_connections.py`

---

## My Principle

> **Investigate, Don't Assume.** When users query through Chat2DB, I have access to rich on-disk resources — schema files, sample reports, existing SQLs. Even when schema is provided, I investigate further to give better answers. Being proactive with disk investigation makes me more helpful, not lazy.
