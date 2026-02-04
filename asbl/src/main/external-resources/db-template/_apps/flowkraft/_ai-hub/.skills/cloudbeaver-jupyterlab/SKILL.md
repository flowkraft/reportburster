# CloudBeaver & JupyterLab Administration

## Overview

This skill covers administration and configuration of **CloudBeaver** (database manager) and **JupyterLab** (Athena's Data Lab) within ReportBurster's FlowKraft AI Hub.

Both tools are part of the AI Hub Docker stack and share access to the ReportBurster installation via the `/reportburster` volume mount.

---

## Architecture Context

### Docker Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| CloudBeaver | `flowkraft-ai-hub-cloudbeaver` | 8978 | Web-based database manager |
| JupyterLab | `flowkraft-ai-hub-chat2db` | 8888 | Athena's Data Lab (notebooks) |

### Shared Volume Mount

Both services mount the ReportBurster installation:
```yaml
volumes:
  - ${REPORTBURSTER_INSTALLATION_FOLDER}:/reportburster:ro
```

This gives them access to:
- `/reportburster/config/connections/` — Database connection definitions
- `/reportburster/lib/` — JDBC drivers
- `/reportburster/db/` — Embedded databases (H2, HSQLDB)

---

## Task: Add ReportBurster Database to CloudBeaver

### When User Asks
- "Can you help me configure my database into CloudBeaver?"
- "How do I add my ReportBurster connection to CloudBeaver?"
- "My database is in ReportBurster but I don't see it in CloudBeaver"

### Step-by-Step Procedure

**Step 1: Locate the ReportBurster Connection**

Check `/reportburster/config/connections/` for the existing connection folder. Each connection has:
- `<connection-name>.xml` — JDBC URL, host, port, credentials
- `<connection-name>-information-schema.json` — Database schema

**Step 2: Open CloudBeaver**

Navigate to `http://localhost:8978` (or the configured port).

**Step 3: Add New Connection in CloudBeaver**

1. Click **"New Connection"** in the CloudBeaver UI
2. Select the appropriate database driver (PostgreSQL, MySQL, Oracle, SQL Server, etc.)
3. Enter connection details from the ReportBurster XML file:
   - **Host**: From `<host>` element
   - **Port**: From `<port>` element  
   - **Database**: From `<database>` element
   - **Username**: From `<username>` element
   - **Password**: From `<password>` element (may need to decrypt if encrypted)
4. Click **"Test Connection"** to verify
5. Click **"Save"**

**Step 4: Restart CloudBeaver (if needed)**

If CloudBeaver doesn't show the connection, restart the service:
```bash
docker compose restart cloudbeaver
```

### CloudBeaver Configuration Files

CloudBeaver stores its configuration in Docker volumes. Manual configuration (advanced):
- Volume: `code-server-data` (shared)
- Config path inside container: `/opt/cloudbeaver/workspace/.data/`

---

## Task: Query Database from JupyterLab (Athena's Data Lab)

### When User Asks
- "How do I query my database from JupyterLab?"
- "Can I use my ReportBurster connection in Jupyter?"
- "I want to run SQL from Athena's Data Lab"

### Step-by-Step Procedure

**Step 1: Open Athena's Data Lab**

Navigate to `http://localhost:8401` (token: `reportburster` by default).

**Step 2: Use the Pre-configured Modules**

The JupyterLab container includes Python modules for database access:

```python
# Import the ReportBurster connections helper
from rb_connections import get_connection, list_connections

# List available connections
connections = list_connections()
print(connections)

# Get a specific connection
conn = get_connection('my-database-name')
```

**Step 3: Query Using pandas**

```python
import pandas as pd
from rb_connections import get_jdbc_url, get_credentials

# Get connection details
jdbc_url = get_jdbc_url('my-database-name')
username, password = get_credentials('my-database-name')

# Using jaydebeapi for JDBC
import jaydebeapi

conn = jaydebeapi.connect(
    'org.postgresql.Driver',  # Adjust for your database
    jdbc_url,
    [username, password],
    '/reportburster/lib/postgresql-42.7.3.jar'  # Path to JDBC driver
)

# Query and load into DataFrame
df = pd.read_sql("SELECT * FROM customers LIMIT 10", conn)
df
```

**Step 4: Using the chat2db Module (Recommended)**

```python
from chat2db import Chat2DB

# Initialize with connection name
db = Chat2DB('my-database-name')

# Natural language query (uses Athena via Letta)
result = db.ask("Show me top 10 customers by revenue")

# Direct SQL
df = db.query("SELECT * FROM orders WHERE status = 'pending'")

# Visualize
db.chart("revenue by month", chart_type="bar")
```

### JDBC Drivers Location

JDBC drivers are available at `/reportburster/lib/`:
- `postgresql-*.jar` — PostgreSQL
- `mysql-connector-*.jar` — MySQL
- `mssql-jdbc-*.jar` — SQL Server
- `ojdbc*.jar` — Oracle
- `h2-*.jar` — H2 (embedded)
- `hsqldb-*.jar` — HSQLDB (embedded)

---

## Task: Troubleshoot Connection Issues

### Common Issues

**Issue: "Connection refused" or "Cannot connect"**

1. Verify the database server is running and accessible
2. Check firewall/network settings
3. From inside Docker, use `host.docker.internal` instead of `localhost` for databases on the host machine

**Issue: "Driver not found"**

1. Verify JDBC driver exists in `/reportburster/lib/`
2. Check the driver JAR filename matches what you're specifying
3. Ensure the driver version is compatible with your database version

**Issue: "Authentication failed"**

1. Verify credentials in ReportBurster connection XML
2. Check if password is encrypted (look for `encrypted="true"`)
3. Test credentials using ReportBurster's connection test feature first

### Restart Services

```bash
# Restart CloudBeaver
docker compose restart cloudbeaver

# Restart JupyterLab (chat2db-jupyter)
docker compose restart chat2db-jupyter

# Restart entire AI Hub stack
docker compose down && docker compose up -d
```

---

## Environment Variables

### JupyterLab (chat2db-jupyter)

| Variable | Default | Purpose |
|----------|---------|---------|
| `JUPYTER_TOKEN` | `reportburster` | Access token for JupyterLab |
| `JUPYTER_PORT` | `8888` | Host port mapping |
| `REPORTBURSTER_CONNECTIONS_PATH` | `/reportburster/config/connections` | Connection definitions |
| `JDBC_DRIVERS_PATH` | `/reportburster/lib` | JDBC driver location |
| `LETTA_API_BASE_URL` | `http://flowkraft-ai-hub-letta:8283` | Letta API for AI queries |

### CloudBeaver

CloudBeaver uses its own configuration stored in Docker volumes. Connection details are managed through the web UI.

---

## Quick Reference

| Task | Location/Command |
|------|------------------|
| CloudBeaver UI | `http://localhost:8978` |
| JupyterLab UI | `http://localhost:8401` |
| ReportBurster connections | `/reportburster/config/connections/` |
| JDBC drivers | `/reportburster/lib/` |
| Restart CloudBeaver | `docker compose restart cloudbeaver` |
| Restart JupyterLab | `docker compose restart chat2db-jupyter` |
| View logs | `docker compose logs -f cloudbeaver` or `chat2db-jupyter` |

---

## Related Skills

- `reportburster-database-connections` — How ReportBurster manages database connections
- `sql-queries-plain-english-queries-expert` — Writing SQL queries
- `olap-data-warehouse-analytics` — Data warehouse and analytics patterns
