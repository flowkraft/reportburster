# Enabling ClickHouse with CDC Sink Connector

**Default:** ClickHouse analytics is **disabled** (not running).

---

## Quick Start

```bash
# Option A: Use the sample ClickHouse from _apps/clickhouse
cd _apps/clickhouse
docker-compose up -d

# Option B: Use your own ClickHouse database
# Just configure the connection in ReportBurster (see Section 4)

# Verify ClickHouse is running
curl "http://localhost:8123/?query=SELECT%20version()"

# (Optional) Enable CDC replication from MySQL/PostgreSQL
# Uncomment clickhouse-sink-connector in flowkraft/docker-compose.yml
docker-compose -f flowkraft/docker-compose.yml up -d clickhouse-sink-connector
```

---

## Overview

### What is ClickHouse?

ClickHouse is a high-performance columnar OLAP database optimized for:
- **Real-time analytics** on billions of rows
- **Fast aggregations** (SUM, COUNT, AVG) over large datasets
- **Pivot table queries** via `<rb-pivot-table engine="clickhouse">`

### What is the Sink Connector?

The [Altinity ClickHouse Sink Connector](https://github.com/Altinity/clickhouse-sink-connector) provides:
- **CDC (Change Data Capture)** from MySQL/PostgreSQL to ClickHouse
- **Real-time replication** of transactional data for analytics
- **Lightweight mode** - runs without Kafka for simpler setups

### Architecture

```
┌─────────────┐     CDC      ┌────────────────────┐     JDBC     ┌────────────────┐
│   MySQL/    │ ──────────►  │  Sink Connector    │ ──────────►  │   ClickHouse   │
│  PostgreSQL │  (binlog/    │  (lightweight)     │   INSERT     │   (analytics)  │
│  (source)   │   WAL)       └────────────────────┘              └────────────────┘
└─────────────┘                                                          │
                                                                         │
┌─────────────────────────────────────────────────────────────────────────
│                                                                         │
│  ┌─────────────────┐      REST API        ┌─────────────────────────┐  │
│  │ rb-pivot-table  │ ──────────────────►  │ AnalyticsController.java │──┘
│  │ engine="click-  │   /api/analytics/    │ ClickHouseAnalyticsService│
│  │ house"          │       pivot          └─────────────────────────┘
│  └─────────────────┘
```

---

## 1. Start ClickHouse

### Option A: Use Sample ClickHouse (Recommended for Testing)

A sample ClickHouse is available at `_apps/clickhouse/`:

```bash
cd _apps/clickhouse
docker-compose up -d
```

Default credentials:
- **Host:** localhost
- **Port:** 8123 (HTTP) / 9000 (Native)
- **User:** default
- **Password:** mysecret

### Option B: Use Your Own ClickHouse

Connect to any existing ClickHouse instance - just configure the connection in ReportBurster (see Section 4).

**Verify:**
```bash
# Check version
curl "http://localhost:8123/?query=SELECT%20version()"

# Test query
curl "http://localhost:8123/?query=SELECT%201"
```

---

## 2. Use with Pivot Table Component

Once ClickHouse is running, use the `<rb-pivot-table>` web component:

### Grails GSP

```gsp
<rb-pivot-table 
    report-code="analytics-dashboard"
    api-base-url="${RbUtils.apiBaseUrl}"
    connection-code="clickhouse-default"
    table-name="sales_data"
    engine="clickhouse"
></rb-pivot-table>
```

### Next.js

```tsx
<RbPivotTable 
    reportCode="analytics-dashboard"
    apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
    connectionCode="clickhouse-default"
    tableName="sales_data"
    engine="clickhouse"
/>
```

### REST API

```bash
curl -X POST http://localhost:9090/api/analytics/pivot \
  -H "Content-Type: application/json" \
  -d '{
    "connectionCode": "clickhouse-default",
    "tableName": "sales_data",
    "rows": ["region", "product_category"],
    "cols": ["quarter"],
    "vals": ["revenue"],
    "aggregatorName": "Sum",
    "engine": "clickhouse"
  }'
```

---

## 3. Enable CDC Replication (Optional)

For real-time data replication from MySQL or PostgreSQL to ClickHouse.

### MySQL Source

**Prerequisites:**
- MySQL 8.0+ with binary logging enabled
- User with `REPLICATION SLAVE`, `REPLICATION CLIENT` privileges

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
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'replicator'@'%';
GRANT SELECT ON your_database.* TO 'replicator'@'%';
FLUSH PRIVILEGES;
```

**3. Uncomment sink connector** in docker-compose.yml:
```yaml
clickhouse-sink-connector:
  image: altinityinfra/clickhouse-sink-connector:latest
  container_name: fkraft-ch-sink
  environment:
    # MySQL Source
    - DATABASE_HOSTNAME=host.docker.internal  # Your MySQL host
    - DATABASE_PORT=3306
    - DATABASE_USER=replicator
    - DATABASE_PASSWORD=repl_password
    - DATABASE_NAME=your_database
    - DATABASE_SERVER_NAME=mysql-source
    - DATABASE_ALLOWPUBLICKEYRETRIEVAL=true
    
    # ClickHouse Target
    - CLICKHOUSE_URL=http://fkraft-clickhouse:8123
    - CLICKHOUSE_USER=default
    - CLICKHOUSE_PASSWORD=mysecret
    - CLICKHOUSE_DATABASE=default
    
    # Tables to replicate (comma-separated)
    - TABLE_INCLUDE_LIST=your_database.orders,your_database.customers
```

### PostgreSQL Source

**Prerequisites:**
- PostgreSQL 10+ with logical replication
- User with `REPLICATION` privilege

**1. Enable WAL** (postgresql.conf):
```ini
wal_level = logical
max_replication_slots = 4
max_wal_senders = 4
```

**2. Create replication user:**
```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
```

**3. Create publication:**
```sql
CREATE PUBLICATION my_publication FOR TABLE orders, customers;
```

**4. Configure sink connector:**
```yaml
clickhouse-sink-connector:
  environment:
    # PostgreSQL Source
    - DATABASE_HOSTNAME=host.docker.internal
    - DATABASE_PORT=5432
    - DATABASE_USER=replicator
    - DATABASE_PASSWORD=repl_password
    - DATABASE_NAME=your_database
    - DATABASE_SERVER_NAME=postgres-source
    - CONNECTOR_CLASS=io.debezium.connector.postgresql.PostgresConnector
    - SLOT_NAME=ch_sink_slot
    - PUBLICATION_NAME=my_publication
```

---

## 4. Configure Connection in ReportBurster

Add ClickHouse connection to your `connections.xml`:

```xml
<connection code="clickhouse-default">
    <driver>com.clickhouse.jdbc.ClickHouseDriver</driver>
    <url>jdbc:clickhouse://localhost:8123/default</url>
    <user>default</user>
    <password>mysecret</password>
    <properties>
        <property name="socket_timeout">300000</property>
        <property name="compress">true</property>
    </properties>
</connection>
```

---

## 5. Load Sample Data

Create a test table and load sample data:

```sql
-- Connect via HTTP API or DBeaver
CREATE TABLE IF NOT EXISTS sales_data (
    id UInt64,
    region String,
    product_category String,
    product_name String,
    quarter String,
    revenue Decimal(18, 2),
    quantity UInt32,
    sale_date Date
) ENGINE = MergeTree()
ORDER BY (region, product_category, sale_date);

-- Insert sample data
INSERT INTO sales_data VALUES
(1, 'North', 'Electronics', 'Laptop', 'Q1-2025', 1299.99, 10, '2025-01-15'),
(2, 'North', 'Electronics', 'Phone', 'Q1-2025', 899.99, 25, '2025-01-20'),
(3, 'South', 'Furniture', 'Desk', 'Q1-2025', 499.99, 8, '2025-02-01'),
(4, 'South', 'Electronics', 'Laptop', 'Q2-2025', 1299.99, 15, '2025-04-10'),
(5, 'East', 'Furniture', 'Chair', 'Q2-2025', 199.99, 50, '2025-04-15'),
(6, 'West', 'Electronics', 'Tablet', 'Q2-2025', 599.99, 30, '2025-05-01');
```

---

## Supported Aggregators

| Aggregator | ClickHouse Function |
|------------|---------------------|
| Sum | `SUM(x)` |
| Count | `COUNT(*)` |
| Average | `AVG(x)` |
| Minimum | `MIN(x)` |
| Maximum | `MAX(x)` |
| Median | `quantile(0.5)(x)` |
| Std Dev | `stddevPop(x)` |
| Variance | `varPop(x)` |
| Count Unique | `uniqExact(x)` |

---

## Comparison: DuckDB vs ClickHouse

| Feature | DuckDB | ClickHouse |
|---------|--------|------------|
| **Best for** | Local files, embedded | Large-scale analytics |
| **Data size** | GB range | TB/PB range |
| **Deployment** | In-process (JVM) | Separate server |
| **Setup** | Zero config | Requires container |
| **CDC replication** | ❌ No | ✅ Yes (sink connector) |
| **Use case** | Report-specific files | Enterprise data warehouse |

**Recommendation:**
- Use `engine="duckdb"` (default) for report-specific data files
- Use `engine="clickhouse"` for enterprise analytics on replicated data

---

## Troubleshooting

### ClickHouse won't start

```bash
# Check logs
docker-compose logs clickhouse

# Verify port available
netstat -an | findstr 8123
```

### Connection refused

```bash
# Test HTTP interface
curl -v "http://localhost:8123/ping"

# Check container running
docker ps | grep clickhouse
```

### Sink connector not replicating

```bash
# Check connector logs
docker-compose logs clickhouse-sink-connector

# Verify source DB binlog/WAL enabled
# MySQL: SHOW BINARY LOG STATUS;
# PostgreSQL: SELECT * FROM pg_replication_slots;
```

### Query timeout

Add timeout properties to connection:
```xml
<property name="socket_timeout">600000</property>
<property name="connection_timeout">30000</property>
```

---

## Security Notes

**Development defaults (change in production!):**
- ClickHouse password: `mysecret`
- Ports exposed: 8123, 9000

**Production checklist:**
- [ ] Change default password
- [ ] Use TLS for connections
- [ ] Restrict network access
- [ ] Enable query quotas
- [ ] Set up authentication profiles

---

## Quick Toggle

**Disable ClickHouse:**
```bash
# Stop services
docker-compose stop clickhouse clickhouse-sink-connector

# Remove data (optional)
docker volume rm fkraft_clickhouse_data
```

Apps automatically fall back to DuckDB when ClickHouse unavailable.
