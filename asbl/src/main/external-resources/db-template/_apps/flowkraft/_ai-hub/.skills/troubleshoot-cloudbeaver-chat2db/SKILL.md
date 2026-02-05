# Troubleshoot CloudBeaver & Chat2DB (Athena's Data Lab)

## When to Use This Skill

Use this skill ONLY when CloudBeaver or Chat2DB/JupyterLab are **broken, misconfigured, or not working as expected**:
- "My database isn't showing in JupyterLab"
- "Chat2DB can't connect to my database"
- "CloudBeaver doesn't have my connection"
- "I get a driver not found error"
- "Athena isn't generating SQL in Jupyter"

## NOT for This Skill

Do NOT use this skill for normal data work. If the user asks data questions like "Which are my top 10 products?" or "Show me revenue by month" — just answer the question directly using SQL knowledge and database skills. This skill is about fixing infrastructure, not querying data.

---

## Architecture Overview

| Tool | Deployment | Container | Host Port |
|------|-----------|-----------|-----------|
| CloudBeaver | Standalone (`_apps/cloudbeaver/`) | `rb-cloudbeaver` | 8978 |
| Chat2DB / JupyterLab | AI Hub stack (`_ai-hub/`) | `flowkraft-ai-hub-chat2db` | 8441 |

---

## How Chat2DB Auto-Discovery Works (Internals)

Understanding the auto-discovery pipeline is essential for troubleshooting "why can't I see my connection" issues.

1. The chat2db container mounts `/reportburster` (read-only)
2. On startup, `rb_connections.py` scans `/reportburster/config/connections/db-*/db-*.xml`
3. It parses each XML file using defusedxml and auto-generates the JDBC driver class + connection URL
4. Connections become available via `Chat2DB.list_connections()` and `Chat2DB.connect("db-code")`

### ReportBurster Connection XML Structure

Each connection folder (`db-*/`) contains a `db-*.xml` file:
```xml
<documentburster>
  <connection>
    <code>db-northwind-postgres</code>
    <name>Northwind PostgreSQL</name>
    <default>false</default>
    <databaseserver>
      <type>postgresql</type>
      <host>localhost</host>
      <port>5432</port>
      <database>northwind</database>
      <userid>admin</userid>
      <userpassword>secret</userpassword>
      <usessl>false</usessl>
    </databaseserver>
  </connection>
</documentburster>
```

### Supported Database Types

Auto-detection covers: SQLite, DuckDB, PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, IBM DB2, ClickHouse.

The module also auto-detects the sample Northwind SQLite at `/reportburster/db/sample-northwind-sqlite/northwind.db`.

---

## Troubleshoot: Chat2DB / JupyterLab

### Volume Mounts (chat2db container)

| Mount | Path Inside Container | Access |
|-------|----------------------|--------|
| ReportBurster root | `/reportburster` | Read-only |
| Connections | `/reportburster/config/connections` | Read-only |
| JDBC drivers | `/reportburster/lib` | Read-only |
| Embedded DBs | `/reportburster/db` | Read-only |
| Notebooks | `/app/notebooks` | Read-write |

### Environment Variables (chat2db)

| Variable | Default | Purpose |
|----------|---------|---------|
| `JUPYTER_TOKEN` | `reportburster` | Access token for JupyterLab |
| `JUPYTER_PORT` | `8441` | Host port mapping |
| `REPORTBURSTER_CONNECTIONS_PATH` | `/reportburster/config/connections` | Where to scan for connection XMLs |
| `JDBC_DRIVERS_PATH` | `/reportburster/lib` | JDBC driver JARs |
| `REPORTBURSTER_DB_PATH` | `/reportburster/db` | Embedded databases |
| `LETTA_API_BASE_URL` | `http://flowkraft-ai-hub-letta:8283` | Letta API for Athena |
| `AGENT_ATHENA_ID` | (required) | Athena's agent ID in Letta |

### My Troubleshooting Access (Source Code)

I can read the full chat2db source code to diagnose issues:

| What | Path (from my /reportburster mount) |
|------|-------------------------------------|
| Connection parser | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/rb_connections.py` |
| Chat2DB main module | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/chat2db.py` |
| Letta integration | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/letta_chat2db.py` |
| LLM providers | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/llm_providers.py` |
| Dockerfile | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/Dockerfile` |
| Requirements | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/requirements.txt` |
| Docker compose | `/reportburster/_apps/flowkraft/_ai-hub/docker-compose.yml` |

### Diagnostic Steps

**Issue: "No connections found"**

1. Check if connection folders exist: `ls /reportburster/config/connections/`
2. Each connection must be in a `db-*/` folder with a matching `db-*.xml` file
3. Verify the XML structure matches the expected format (see above)
4. Check environment variable: `REPORTBURSTER_CONNECTIONS_PATH` must point to the right folder

**Issue: "Connection refused" or "Cannot connect"**

1. Is the database server actually running and reachable?
2. From inside Docker, use `host.docker.internal` instead of `localhost` for databases on the host machine
3. Check if the port in the XML matches the actual database port
4. Firewall or Docker network issues — the chat2db container is on `ai-hub-network`

**Issue: "Driver not found"**

1. Check `/reportburster/lib/` for the matching JDBC JAR
2. The `rb_connections.py` module maps db types to JAR patterns — verify the JAR filename matches
3. Read the source code at `rb_connections.py` lines 84-120 to see the exact JAR pattern mapping

**Issue: "Authentication failed"**

1. Verify credentials in the connection XML: `<userid>` and `<userpassword>`
2. Check if password is encrypted (look for `encrypted="true"` attribute)
3. Test credentials using ReportBurster's connection test feature first

**Issue: "Athena isn't generating SQL" or "ask() returns errors"**

1. Check if `AGENT_ATHENA_ID` is set in the chat2db container environment
2. Verify Letta is healthy: the chat2db container depends on Letta
3. Check `letta_chat2db.py` for the Letta API integration logic
4. Fallback: use `chat.sql("SELECT ...")` for direct SQL without Athena

---

## Troubleshoot: CloudBeaver

### When User Asks
- "Can you help me configure my database into CloudBeaver?"
- "How do I add my ReportBurster connection to CloudBeaver?"
- "My database is in ReportBurster but I don't see it in CloudBeaver"

### What I Can Do

I can **read the ReportBurster connection XML** and give the user the exact values to type into CloudBeaver's UI. This turns a guessing game into a 2-step copy-paste.

### Step-by-Step Procedure

**Step 1: I Read the Connection XML**

I read `/reportburster/config/connections/db-<name>/db-<name>.xml` and extract:
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
- Docker compose: `/reportburster/_apps/cloudbeaver/docker-compose.yml`
- Container: `rb-cloudbeaver`
- Workspace: `/reportburster/_apps/cloudbeaver/workspace/` (from my perspective)
- Config inside container: `/opt/cloudbeaver/workspace/.data/.dbeaver/`
- Data sources file: `data-sources.json` (created after first connection is added via UI)

I can read CloudBeaver's workspace files at `/reportburster/_apps/cloudbeaver/workspace/` because both CloudBeaver and I (via Letta) mount the same ReportBurster installation root. If CloudBeaver has been started at least once, I can inspect its `data-sources.json` to see what's already configured.

### JDBC Drivers

Both CloudBeaver and JupyterLab can use JDBC drivers from `/reportburster/lib/`:
- `postgresql-*.jar`, `mysql-connector-*.jar`, `mssql-jdbc-*.jar`, `ojdbc*.jar`
- `h2-*.jar`, `hsqldb-*.jar`, `sqlite-jdbc*.jar`, `duckdb_jdbc*.jar`, `clickhouse-jdbc*.jar`

---

## Restart Services

```bash
# Restart JupyterLab (chat2db)
docker compose -f _apps/flowkraft/_ai-hub/docker-compose.yml restart chat2db

# Restart CloudBeaver (separate compose)
docker compose -f _apps/cloudbeaver/docker-compose.yml restart cloudbeaver

# View chat2db logs
docker compose -f _apps/flowkraft/_ai-hub/docker-compose.yml logs -f chat2db
```

---

## Quick Reference

| Task | Location/Command |
|------|------------------|
| JupyterLab UI | `http://localhost:8441` (token: `reportburster`) |
| CloudBeaver UI | `http://localhost:8978` |
| ReportBurster connections | `/reportburster/config/connections/` |
| JDBC drivers | `/reportburster/lib/` |
| Chat2DB source code | `/reportburster/_apps/flowkraft/_ai-hub/helpers/chat2db/py/` |
| CloudBeaver workspace | `/reportburster/_apps/cloudbeaver/workspace/` |
