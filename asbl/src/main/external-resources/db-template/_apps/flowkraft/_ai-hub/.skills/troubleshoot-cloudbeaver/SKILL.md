# Troubleshoot CloudBeaver

## When to Use This Skill

Use this skill ONLY when CloudBeaver is **broken, misconfigured, or not working as expected**:
- "CloudBeaver doesn't have my connection"
- "I get a driver not found error"

## NOT for This Skill

Do NOT use this skill for normal data work. If the user asks data questions like "Which are my top 10 products?" or "Show me revenue by month" — just answer the question directly using SQL knowledge and database skills. This skill is about fixing infrastructure, not querying data.

---

## Architecture Overview

| Tool | Deployment | Container | Host Port |
|------|-----------|-----------|-----------|
| CloudBeaver | Standalone (`_apps/cloudbeaver/`) | `rb-cloudbeaver` | 8978 |

---

## Troubleshoot: CloudBeaver

### When User Asks
- "Can you help me configure my database into CloudBeaver?"
- "How do I add my DataPallas connection to CloudBeaver?"
- "My database is in DataPallas but I don't see it in CloudBeaver"

### What I Can Do

I can **read the DataPallas connection XML** and give the user the exact values to type into CloudBeaver's UI. This turns a guessing game into a 2-step copy-paste.

### Step-by-Step Procedure

**Step 1: I Read the Connection XML**

I read `/datapallas/config/connections/db-<name>/db-<name>.xml` and extract:
- Database type, host, port, database name
- Username and password
- Whether SSL is required

**Step 2: User Opens CloudBeaver**

Navigate to `http://localhost:8978`.

**Step 3: User Creates the Connection (I dictate, they click)**

1. Click **"New Connection"** → select the database driver (PostgreSQL, MySQL, etc.)
2. Enter the values I extracted:
   - **Host**: `<value from XML>`
   - **Port**: `<value from XML>`
   - **Database**: `<value from XML>`
   - **Username**: `<value from XML>`
   - **Password**: `<value from XML>`
3. Click **"Test Connection"** → then **"Save"**

### CloudBeaver Architecture

CloudBeaver is a **standalone service** (separate docker-compose, not part of AI Hub):
- Docker compose: `/datapallas/_apps/cloudbeaver/docker-compose.yml`
- Container: `rb-cloudbeaver`
- Workspace: `/datapallas/_apps/cloudbeaver/workspace/` (from my perspective)
- Config inside container: `/opt/cloudbeaver/workspace/.data/.dbeaver/`
- Data sources file: `data-sources.json` (created after first connection is added via UI)

I can read CloudBeaver's workspace files at `/datapallas/_apps/cloudbeaver/workspace/` because both CloudBeaver and I (via Letta) mount the same DataPallas installation root. If CloudBeaver has been started at least once, I can inspect its `data-sources.json` to see what's already configured.

### JDBC Drivers

CloudBeaver can use JDBC drivers from `/datapallas/lib/`:
- `postgresql-*.jar`, `mysql-connector-*.jar`, `mssql-jdbc-*.jar`, `ojdbc*.jar`
- `h2-*.jar`, `hsqldb-*.jar`, `sqlite-jdbc*.jar`, `duckdb_jdbc*.jar`, `clickhouse-jdbc*.jar`

---

## Restart Services

```bash
# Restart CloudBeaver (separate compose)
docker compose -f _apps/cloudbeaver/docker-compose.yml restart cloudbeaver
```

---

## Quick Reference

| Task | Location/Command |
|------|------------------|
| CloudBeaver UI | `http://localhost:8978` |
| DataPallas connections | `/datapallas/config/connections/` |
| JDBC drivers | `/datapallas/lib/` |
| CloudBeaver workspace | `/datapallas/_apps/cloudbeaver/workspace/` |
