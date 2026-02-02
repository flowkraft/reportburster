# Configure OLTP → ClickHouse Data Warehouse Sync

Real-time CDC replication from your OLTP databases to ClickHouse using the [Altinity Sink Connector](https://github.com/Altinity/clickhouse-sink-connector).

**Supported sources:** MySQL, PostgreSQL (out of the box) + SQL Server, Oracle, Db2, MongoDB via [Debezium](https://debezium.io/documentation/reference/stable/connectors/index.html)

---

## Step 1: Prepare Your ClickHouse Target

**Option A: Use ReportBurster's bundled ClickHouse** (for prototyping)

Start from ReportBurster Starter Packs UI, or:
```bash
cd db
docker-compose up -d clickhouse
```

**Option B: Use your existing ClickHouse** — update connection details in Step 3.

Verify connectivity:
```bash
curl "http://your-clickhouse-host:8123/?query=SELECT%20version()"
```

---

## Step 2: Configure Your OLTP Source for CDC

### MySQL

**1. Enable binlog** (mysql.cnf):
```ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
```

**2. Create replication user:**
```sql
CREATE USER 'replicator'@'%' IDENTIFIED BY 'repl_password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;
```

### PostgreSQL

**1. Enable WAL** (postgresql.conf):
```ini
wal_level = logical
max_replication_slots = 4
max_wal_senders = 4
```

**2. Create replication user and publication:**
```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
CREATE PUBLICATION my_publication FOR TABLE orders, customers;
```

📖 [MySQL Setup](https://debezium.io/documentation/reference/stable/connectors/mysql.html#setting-up-mysql) | [PostgreSQL WAL](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/postgres_wal.md)

---

## Step 3: Configure the Sink Connector

Edit `db/docker-compose.yml` — uncomment and configure the `clickhouse-sink-connector` service:

### MySQL Example

```yaml
clickhouse-sink-connector:
  image: altinityinfra/clickhouse-sink-connector:latest
  environment:
    # Source
    - DATABASE_HOSTNAME=host.docker.internal
    - DATABASE_PORT=3306
    - DATABASE_USER=replicator
    - DATABASE_PASSWORD=repl_password
    - DATABASE_NAME=your_database
    - DATABASE_SERVER_NAME=mysql-source
    - DATABASE_ALLOWPUBLICKEYRETRIEVAL=true
    # Target
    - CLICKHOUSE_URL=http://fkraft-clickhouse:8123
    - CLICKHOUSE_USER=default
    - CLICKHOUSE_PASSWORD=mysecret
    - CLICKHOUSE_DATABASE=default
    # Replication
    - TABLE_INCLUDE_LIST=your_database.orders,your_database.customers
    - AUTO_CREATE_TABLES=true
    - SINK_CONNECTOR_LIGHTWEIGHT_UPDATE_DELETE=true
```

### PostgreSQL Example

```yaml
clickhouse-sink-connector:
  image: altinityinfra/clickhouse-sink-connector:latest
  environment:
    # Source
    - DATABASE_HOSTNAME=host.docker.internal
    - DATABASE_PORT=5432
    - DATABASE_USER=replicator
    - DATABASE_PASSWORD=repl_password
    - DATABASE_NAME=your_database
    - DATABASE_SERVER_NAME=postgres-source
    - CONNECTOR_CLASS=io.debezium.connector.postgresql.PostgresConnector
    - SLOT_NAME=ch_sink_slot
    - PUBLICATION_NAME=my_publication
    # Target
    - CLICKHOUSE_URL=http://fkraft-clickhouse:8123
    - CLICKHOUSE_USER=default
    - CLICKHOUSE_PASSWORD=mysecret
    - CLICKHOUSE_DATABASE=default
    # Replication
    - TABLE_INCLUDE_LIST=public.orders,public.customers
    - AUTO_CREATE_TABLES=true
    - SINK_CONNECTOR_LIGHTWEIGHT_UPDATE_DELETE=true
```

📖 [Full configuration reference](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/configuration.md)

---

## Step 4: Start Replication

```bash
cd db
docker-compose up -d clickhouse-sink-connector
```

Verify:
```bash
docker-compose logs -f clickhouse-sink-connector
```

---

## Step 5: Test

Insert in your source:
```sql
INSERT INTO orders VALUES (1, 'Product A', 99.99, NOW());
```

Query ClickHouse:
```sql
SELECT * FROM orders WHERE id = 1;
```

---

## Step 6: Use in ReportBurster

1. **Configure a ClickHouse database connection** — [see how](https://www.reportburster.com/docs/report-generation#database-connections)

2. **Create a Pivot Table** using your ClickHouse connection — [see how](https://www.reportburster.com/docs/bi-analytics/embed-web-components/pivottables)

3. **Use or embed** in ReportBurster's Analytics Portal or your own web apps — [see how](https://www.reportburster.com/docs/bi-analytics/embed-web-components)

---

## Disable Sync

```bash
docker-compose stop clickhouse clickhouse-sink-connector
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Connector not starting | `docker-compose logs clickhouse-sink-connector` |
| No data replicating | Verify binlog/WAL enabled on source |
| Connection refused | `curl http://localhost:8123/ping` |

📖 [Troubleshooting guide](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/Troubleshooting.md)

---

## Essential Documentation

- [QuickStart MySQL](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/quickstart.md)
- [QuickStart PostgreSQL](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/quickstart_postgres.md)
- [Configuration Reference](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/configuration.md)
- [Production Setup](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/production_setup.md)
- [Troubleshooting](https://github.com/Altinity/clickhouse-sink-connector/blob/develop/doc/Troubleshooting.md)
