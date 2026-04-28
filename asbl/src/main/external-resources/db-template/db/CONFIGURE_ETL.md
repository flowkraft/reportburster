# Configure dbt Transforms (OLTP Raw Data → OLAP Star Schema)

Transforms raw OLTP tables in ClickHouse into a proper OLAP star schema using [dbt Core](https://docs.getdbt.com/) with the [dbt-clickhouse adapter](https://github.com/ClickHouse/dbt-clickhouse).

**What it produces:**
- **Dimensions:** `dim_customer`, `dim_product`, `dim_employee`, `dim_time`
- **Fact:** `fact_sales` (one row per order line item)
- **Views:** `vw_sales_detail` (denormalized), `vw_monthly_sales` (time-series)

**How it fits:**
1. **Extract + Load** — CDC sink connector replicates OLTP tables byte-for-byte into ClickHouse ([see how](./CONFIGURE_OLTP_2_OLAP_DATA_WAREHOUSE_SYNC.md))
2. **Transform** — dbt reads those raw tables and builds the star schema ← **this guide**

---

## Step 1: Ensure ClickHouse Has Raw OLTP Data

The dbt models read from raw OLTP tables (`Orders`, `OrderDetails`, `Customers`, `Products`, `Categories`, `Employees`).

These can be loaded via:
- **DataPallas's Java initializer** (happens automatically on first start)
- **CDC sink connector** (see [CONFIGURE_OLTP_2_OLAP_DATA_WAREHOUSE_SYNC.md](./CONFIGURE_OLTP_2_OLAP_DATA_WAREHOUSE_SYNC.md))

Verify tables exist:
```bash
curl "http://localhost:8123/?query=SHOW+TABLES" \
  --user default:clickhouse
```

---

## Step 2: Enable the dbt Service

Edit `db/docker-compose.yml` — uncomment the `dbt-transform` service block (near the bottom, after the CDC sink connector).

---

## Step 3: Run the Transform

```bash
cd db

# Build the dbt Docker image and run all models
docker compose run --build dbt-transform run
```

This creates 12 objects in ClickHouse:
- 5 staging views (thin rename/cast layer over OLTP tables)
- 4 dimension tables (MergeTree)
- 1 fact table (MergeTree)
- 2 analytical views

Run a specific model:
```bash
docker compose run dbt-transform run --select dim_customer
```

### Production Scheduling

The workhorse command is `docker compose run dbt-transform run` (no `--build`).

The `--build` flag rebuilds the Docker image — use it only on first run or after changing SQL models / Dockerfile. In recurring production runs, the image is already built.

**Cron (simplest):**
```bash
# Run dbt every hour at :30
30 * * * * cd /path/to/db && docker compose run dbt-transform run >> /var/log/dbt.log 2>&1
```

Adjust frequency to match your data freshness needs — every 15 minutes, hourly, or daily.

**Orchestrators** (for advanced needs — retries, alerting, dependency graphs):
- [Apache Airflow](https://airflow.apache.org/)
- [Dagster](https://dagster.io/) — has native dbt integration
- [Prefect](https://www.prefect.io/)

Start with cron. Graduate to an orchestrator when you need retries, alerting, or multi-step pipeline management.

---

## Step 4: Verify

```bash
# List all tables
curl "http://localhost:8123/?query=SHOW+TABLES" \
  --user default:clickhouse

# Count fact rows
curl "http://localhost:8123/?query=SELECT+count(*)+FROM+fact_sales" \
  --user default:clickhouse

# Query the denormalized view
curl "http://localhost:8123/" \
  --user default:clickhouse \
  --data "SELECT customer_country, count(*) as orders, round(sum(net_revenue),2) as revenue FROM vw_sales_detail GROUP BY customer_country ORDER BY revenue DESC LIMIT 5"
```

---

## Step 5: Run Tests

```bash
docker compose run dbt-transform test
```

Tests validate not-null constraints, unique keys, accepted values, and referential integrity between fact and dimension tables.

---

## Step 6: Use in DataPallas

1. **Configure a ClickHouse database connection** — [see how](https://www.reportburster.com/docs/data-exploration/database-connections)

2. **Create a Pivot Table** using your ClickHouse connection — [see how](https://www.reportburster.com/docs/bi-analytics/web-components/pivottables)

3. **Use or embed** in DataPallas's Analytics Portal or your own web apps — [see how](https://www.reportburster.com/docs/bi-analytics/web-components)

---

## Customization

The sample Northwind models in `db/dbt/models/` are demo templates. Replace them with your own:

1. Edit `db/dbt/models/staging/` to match your source tables
2. Edit `db/dbt/models/marts/` to define your star schema
3. Update `db/dbt/models/staging/_staging.yml` source definitions
4. Rebuild: `docker compose run --build dbt-transform run`

### Connection Settings

Edit `db/dbt/profiles.yml` to change ClickHouse connection details:

```yaml
northwind_clickhouse:
  target: dev
  outputs:
    dev:
      type: clickhouse
      schema: northwind        # ClickHouse database name
      host: clickhouse          # Docker service name (or your host)
      port: 8123                # HTTP interface
      user: default
      password: clickhouse
      secure: false
      threads: 1
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Connection refused | Is ClickHouse running? `docker compose ps clickhouse` |
| Source tables not found | Verify OLTP tables: `curl "http://localhost:8123/?query=SELECT+count(*)+FROM+Orders" --user default:clickhouse` |
| dbt build fails | Check Dockerfile: `docker compose build dbt-transform` |
| Wrong database | Verify `schema` in `profiles.yml` matches ClickHouse database name |

---

## Essential Documentation

- [dbt Core docs](https://docs.getdbt.com/docs/introduction)
- [dbt-clickhouse adapter](https://github.com/ClickHouse/dbt-clickhouse)
- [dbt-clickhouse configuration](https://docs.getdbt.com/reference/resource-configs/clickhouse-configs)
- [ClickHouse SQL reference](https://clickhouse.com/docs/en/sql-reference)
