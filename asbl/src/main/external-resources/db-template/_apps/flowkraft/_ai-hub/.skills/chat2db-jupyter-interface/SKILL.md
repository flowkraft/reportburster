# Chat2DB / Jupyter Interface Skill

## When to Use THIS Skill vs troubleshoot-cloudbeaver-chat2db

| Skill | Use When | Examples |
|-------|----------|----------|
| **THIS SKILL** (chat2db-jupyter-interface) | User wants to **query data** or **talk** through the notebook | "Show top 10 customers", "Hello!", "Help me write SQL" |
| **troubleshoot-cloudbeaver-chat2db** | User has a **broken tool** that needs fixing | "CloudBeaver won't connect", "Chat2DB can't find my database", "Driver error" |

**Simple rule:** If they're asking about data → THIS skill. If the tool is broken → troubleshoot skill.

---

## When This Skill Applies

I'm receiving a message through the **Chat2DB / Jupyter interface** — the interactive notebook environment where users run SQL queries using natural language.

This skill is about **understanding the context** of messages from this interface and responding appropriately (SQL, chit-chat, or guidance).

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

**Before reading a schema file, CHECK ITS SIZE:**

```bash
# Check file size first
ls -lh /reportburster/config/connections/<slug>/*-information-schema.json

# If small (<100KB) → safe to read whole file
cat /reportburster/config/connections/<slug>/*-information-schema.json

# If large (>100KB) → use table names as search terms
grep -i "customers" /reportburster/config/connections/<slug>/*-information-schema.json
grep -i "orders" /reportburster/config/connections/<slug>/*-information-schema.json
```

**Decision tree:**
- **< 50KB**: Read the whole file
- **50KB - 500KB**: Skim with `head -200` first, then grep for specific tables
- **> 500KB**: NEVER read whole file — grep for table names from the index provided by Chat2DB

---

## SQL Generation Rules

When generating SQL for Chat2DB users:

1. **Check database vendor first** — SQLite/DuckDB/PostgreSQL/MySQL have different syntax
2. **Use only confirmed table/column names** — from provided schema OR disk investigation
3. **Add LIMIT clauses** — be conservative with data volume
4. **No destructive operations** — never DELETE, DROP, UPDATE, TRUNCATE, ALTER
5. **Explain after generating** — help users learn

### Vendor-Specific Patterns

| Operation | SQLite/DuckDB | PostgreSQL | MySQL |
|-----------|---------------|------------|-------|
| Year from date | `strftime('%Y', col)` | `EXTRACT(year FROM col)` | `YEAR(col)` |
| Month from date | `strftime('%m', col)` | `EXTRACT(month FROM col)` | `MONTH(col)` |
| Top N rows | `LIMIT N` | `LIMIT N` | `LIMIT N` |
| String concat | `||` | `||` | `CONCAT()` |

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
