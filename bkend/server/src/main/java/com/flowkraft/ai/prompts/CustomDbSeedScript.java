package com.flowkraft.ai.prompts;

import java.util.List;

public final class CustomDbSeedScript {

    private CustomDbSeedScript() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "CUSTOM_DB_SEED_SCRIPT",
            "Write a Custom Database Seed Script",
            "Generate a Groovy script that creates custom tables and populates them with sample data alongside the existing Northwind schema",
            List.of("database", "groovy", "seed", "custom-schema"),
            "Database Schema",
            """
Write a Groovy database seed script for [VENDOR] that creates custom tables and populates them with realistic sample data.

**YOUR SCHEMA & DATA REQUIREMENTS:**

<REQUIREMENT>
- Table: my_departments (dept_id PK, dept_name, location) — 6 rows with fixed names: Engineering, Marketing, Sales, HR, Finance, Operations

- Table: my_employees (emp_id PK, first_name, last_name, email, salary, dept_id FK→my_departments) — 20 rows

- Use DataFaker for realistic first/last names, email addresses, salaries between 45000-150000
- Each employee assigned to a random department
</REQUIREMENT>

The script receives these pre-configured variables (do NOT create them yourself):
- `dbSql` — a groovy.sql.Sql instance already connected to the [VENDOR] database
- `vendor` — String with the database vendor name
- `log` — SLF4J Logger for logging

The DataFaker library (net.datafaker.Faker) is available on the classpath.
Documentation: https://www.datafaker.net/documentation/getting-started/#usage
GitHub: https://github.com/datafaker-net/datafaker/
Usage:
```groovy
import net.datafaker.Faker
def faker = new Faker(new Random(42)) // fixed seed for deterministic data
faker.name().fullName()
faker.company().name()
faker.address().city()
faker.internet().emailAddress()
faker.commerce().productName()
faker.number().numberBetween(1, 100)
```

Key groovy.sql.Sql methods:
- `dbSql.execute("CREATE TABLE IF NOT EXISTS ...")` — DDL
- `dbSql.execute("INSERT INTO ... VALUES (?, ?)", [val1, val2])` — parameterized DML (SQL injection safe)
- `dbSql.rows("SELECT * FROM my_table")` — query returning list of maps
- `dbSql.withTransaction { ... }` — automatic rollback on error

Requirements:
1. Use CREATE TABLE IF NOT EXISTS for all tables
2. Use CREATE INDEX IF NOT EXISTS for indexes
3. TRUNCATE only YOUR custom tables — NEVER touch any Northwind tables!
4. Re-insert sample data after truncating (idempotent — safe to run multiple times)
5. Use [VENDOR]-native DDL syntax, data types, and conventions throughout the script
6. Wrap all DML in `dbSql.withTransaction { ... }` for automatic rollback on error (skip this for ClickHouse which does not support transactions)
7. Use DataFaker with a fixed seed (e.g. 42) for deterministic, repeatable data
8. DDL (CREATE TABLE) should be OUTSIDE the transaction (some vendors auto-commit DDL)

Here is a working [VENDOR] example for reference (adapt the table structure and data to your needs):

```groovy
[VENDOR_EXAMPLE_SCRIPT]
```

The script must be completely idempotent — running it multiple times must produce the exact same result with no errors or duplicate data.

Please generate a complete, working Groovy script for [VENDOR] with realistic business-domain tables and sample data using DataFaker and groovy.sql.Sql (dbSql)."""
        );
    }
}
