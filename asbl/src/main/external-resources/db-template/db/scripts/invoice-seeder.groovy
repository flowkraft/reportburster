// @description Seeds large amounts of test invoice data into seed_inv_* tables (idempotent — safe to re-run)
// Bindings provided by GenericSeedExecutor:
//   dbSql  — groovy.sql.Sql connected to the target database
//   vendor — String (uppercase): POSTGRES, MYSQL, MARIADB, SQLSERVER, ORACLE, DB2, SUPABASE,
//                                CLICKHOUSE, SQLITE, DUCKDB
//   log    — SLF4J Logger
//   params — Map with optional keys: N (invoice count, default 10000)

import net.datafaker.Faker
import java.sql.Date
import java.time.LocalDate

// ── params ───────────────────────────────────────────────────────────────────

int N = (params?.N instanceof Number ? (params.N as int) :
         params?.N ? Integer.parseInt(params.N.toString()) : 10000)
long SEED = 42L
int BATCH_SIZE = 5000

int customerCount = Math.max(100, Math.min((int)(N / 10), 100_000))
int productCount  = Math.max(50,  Math.min((int)(N / 20), 10_000))

log.info("=== Invoice Seed: Starting for {}, N={} ===", vendor, N)
log.info("Scaling: {} customers, {} products for {} invoices", customerCount, productCount, N)

// ── vendor flags ─────────────────────────────────────────────────────────────

boolean isClickHouse    = (vendor == 'CLICKHOUSE')
boolean isMysqlFamily   = (vendor in ['MYSQL', 'MARIADB'])
boolean isPostgresFamily = (vendor in ['POSTGRES', 'SUPABASE', 'POSTGRESQL'])
boolean isSqlServer     = (vendor == 'SQLSERVER')
boolean isOracle        = (vendor == 'ORACLE')
boolean isDb2           = (vendor in ['DB2', 'IBMDB2'])
boolean isSqlite        = (vendor == 'SQLITE')
boolean isDuckdb        = (vendor == 'DUCKDB')

String intType  = isOracle ? 'NUMBER' : 'INT'
String varchar  = isOracle ? 'VARCHAR2' : (isClickHouse ? 'String' : 'VARCHAR')
String decType  = 'DECIMAL(10,2)'

def safeDdl = { String sql ->
    try { dbSql.execute(sql) }
    catch (Exception e) { log.debug("DDL skipped (already exists): {}", e.getMessage()) }
}

// ── 1. Create tables ─────────────────────────────────────────────────────────

if (isClickHouse) {
    safeDdl("""
        CREATE TABLE IF NOT EXISTS seed_inv_customer (
            customer_id  UInt32,
            company_name String,
            contact_name String,
            address      String,
            city         String,
            country      String,
            email        String
        ) ENGINE = MergeTree() ORDER BY customer_id""")

    safeDdl("""
        CREATE TABLE IF NOT EXISTS seed_inv_product (
            product_id   UInt32,
            product_name String,
            category     String,
            unit_price   Decimal64(2)
        ) ENGINE = MergeTree() ORDER BY product_id""")

    safeDdl("""
        CREATE TABLE IF NOT EXISTS seed_inv_invoice (
            invoice_id   UInt32,
            customer_id  UInt32,
            invoice_date Date,
            due_date     Date,
            status       String,
            freight      Decimal64(2),
            notes        String
        ) ENGINE = MergeTree() ORDER BY invoice_id""")

    safeDdl("""
        CREATE TABLE IF NOT EXISTS seed_inv_invoice_line (
            line_id      UInt32,
            invoice_id   UInt32,
            product_id   UInt32,
            quantity     Int32,
            unit_price   Decimal64(2),
            discount     Decimal64(2)
        ) ENGINE = MergeTree() ORDER BY line_id""")
} else {
    String fkInvoiceCust  = (isSqlite || isDuckdb) ? '' :
        ', CONSTRAINT fk_sinv_inv_cust FOREIGN KEY (customer_id) REFERENCES seed_inv_customer(customer_id)'
    String fkLineInvoice  = (isSqlite || isDuckdb) ? '' :
        ', CONSTRAINT fk_sinv_line_inv FOREIGN KEY (invoice_id) REFERENCES seed_inv_invoice(invoice_id)'
    String fkLineProd     = (isSqlite || isDuckdb) ? '' :
        ', CONSTRAINT fk_sinv_line_prod FOREIGN KEY (product_id) REFERENCES seed_inv_product(product_id)'

    safeDdl("""CREATE TABLE seed_inv_customer (
        customer_id  ${intType} NOT NULL PRIMARY KEY,
        company_name ${varchar}(100) NOT NULL,
        contact_name ${varchar}(60),
        address      ${varchar}(120),
        city         ${varchar}(40),
        country      ${varchar}(40),
        email        ${varchar}(100)
    )""")

    safeDdl("""CREATE TABLE seed_inv_product (
        product_id   ${intType} NOT NULL PRIMARY KEY,
        product_name ${varchar}(80) NOT NULL,
        category     ${varchar}(40),
        unit_price   ${decType}
    )""")

    safeDdl("""CREATE TABLE seed_inv_invoice (
        invoice_id   ${intType} NOT NULL PRIMARY KEY,
        customer_id  ${intType} NOT NULL,
        invoice_date DATE,
        due_date     DATE,
        status       ${varchar}(20),
        freight      ${decType},
        notes        ${varchar}(200)
        ${fkInvoiceCust}
    )""")

    safeDdl("""CREATE TABLE seed_inv_invoice_line (
        line_id      ${intType} NOT NULL PRIMARY KEY,
        invoice_id   ${intType} NOT NULL,
        product_id   ${intType} NOT NULL,
        quantity     INT,
        unit_price   ${decType},
        discount     DECIMAL(5,2)
        ${fkLineInvoice}
        ${fkLineProd}
    )""")

    safeDdl("CREATE INDEX idx_sinv_inv_cust  ON seed_inv_invoice(customer_id)")
    safeDdl("CREATE INDEX idx_sinv_line_inv  ON seed_inv_invoice_line(invoice_id)")
    safeDdl("CREATE INDEX idx_sinv_line_prod ON seed_inv_invoice_line(product_id)")
    safeDdl("CREATE INDEX idx_sinv_inv_date  ON seed_inv_invoice(invoice_date)")
    safeDdl("CREATE INDEX idx_sinv_inv_status ON seed_inv_invoice(status)")
    safeDdl("CREATE INDEX idx_sinv_cust_country ON seed_inv_customer(country)")
    safeDdl("CREATE INDEX idx_sinv_prod_cat ON seed_inv_product(category)")
}

log.info("Tables ready: seed_inv_customer, seed_inv_product, seed_inv_invoice, seed_inv_invoice_line")

// ── 2. Truncate + FK disable + batch insert ───────────────────────────────────

def truncateTables = {
    // ClickHouse runs outside any transaction — TRUNCATE is fine and fast there.
    // For every other vendor we use DELETE FROM (DML — fully rollback-safe inside
    // dbSql.withTransaction). TRUNCATE is faster but auto-commits as DDL on
    // Oracle/MySQL/MariaDB, breaking the rollback guarantee. For seeding typical
    // test sizes (10k–1M rows), DELETE is plenty fast.
    if (isClickHouse) {
        dbSql.execute("TRUNCATE TABLE IF EXISTS seed_inv_invoice_line")
        dbSql.execute("TRUNCATE TABLE IF EXISTS seed_inv_invoice")
        dbSql.execute("TRUNCATE TABLE IF EXISTS seed_inv_product")
        dbSql.execute("TRUNCATE TABLE IF EXISTS seed_inv_customer")
    } else {
        if (isMysqlFamily) dbSql.execute("SET FOREIGN_KEY_CHECKS = 0")
        dbSql.execute("DELETE FROM seed_inv_invoice_line")
        dbSql.execute("DELETE FROM seed_inv_invoice")
        dbSql.execute("DELETE FROM seed_inv_product")
        dbSql.execute("DELETE FROM seed_inv_customer")
        if (isMysqlFamily) dbSql.execute("SET FOREIGN_KEY_CHECKS = 1")
    }
    log.info("Cleared existing data (child-first order)")
}

// disableFk / enableFk are pure performance optimizations. Inserts run in
// parents-first order (customers → products → invoices → invoice_lines)
// so FK constraints stay satisfied without disabling — correctness doesn't
// depend on this. We only disable where we can do so safely:
//   • MySQL/MariaDB: SET FOREIGN_KEY_CHECKS — session-level, transactional, always works.
//   • SQL Server:    ALTER TABLE NOCHECK — DDL but transactional in SQL Server.
// Skipped (would either need SUPERUSER or auto-commit and break the transaction):
//   • Postgres-family: SET session_replication_role needs SUPERUSER (fails on Supabase
//     and any managed Postgres). A failed SET inside a tx aborts the whole tx in PG,
//     and try/catch can't fix it. Skipping is the only safe option.
//   • Oracle / DB2: ALTER TABLE auto-commits, breaking the rollback guarantee for
//     the prior DELETE FROM. Cost of FK validation during INSERT is acceptable.
def disableFk = {
    if (isMysqlFamily) {
        dbSql.execute("SET FOREIGN_KEY_CHECKS = 0")
        log.info("FK checks disabled for bulk insert")
    } else if (isSqlServer) {
        dbSql.execute("ALTER TABLE seed_inv_invoice NOCHECK CONSTRAINT ALL")
        dbSql.execute("ALTER TABLE seed_inv_invoice_line NOCHECK CONSTRAINT ALL")
        log.info("FK checks disabled for bulk insert")
    }
}

def enableFk = {
    if (isMysqlFamily) {
        dbSql.execute("SET FOREIGN_KEY_CHECKS = 1")
        log.info("FK checks re-enabled")
    } else if (isSqlServer) {
        dbSql.execute("ALTER TABLE seed_inv_invoice_line WITH CHECK CHECK CONSTRAINT ALL")
        dbSql.execute("ALTER TABLE seed_inv_invoice WITH CHECK CHECK CONSTRAINT ALL")
        log.info("FK checks re-enabled")
    }
}

def CATEGORIES   = ['Beverages','Condiments','Confections','Dairy Products',
                    'Grains/Cereals','Meat/Poultry','Produce','Seafood','Oils','Spices']
def PRICE_RANGES = [[3.50,28.00],[8.00,45.00],[10.00,30.00],[6.00,45.00],
                    [5.00,15.00],[15.00,50.00],[3.00,12.00],[18.00,55.00],[8.00,20.00],[5.00,25.00]]
def STATUSES     = ['PAID','PAID','PAID','PENDING','PENDING','OVERDUE']

def trunc  = { String s, int max -> s == null ? null : (s.length() <= max ? s : s[0..<max]) }
def round2 = { double v -> Math.round(v * 100.0) / 100.0 }

def faker     = new Faker(new Random(SEED))
def priceRand = new Random(SEED + 50)
def rand      = new Random(SEED + 100)
def BASE_DATE = LocalDate.of(2024, 1, 1)

def doInserts = {
    // ── Customers ────────────────────────────────────────────────────────────
    log.info("Inserting {} customers...", customerCount)
    dbSql.withBatch(BATCH_SIZE,
            "INSERT INTO seed_inv_customer (customer_id,company_name,contact_name,address,city,country,email) VALUES (?,?,?,?,?,?,?)") { ps ->
        (1..customerCount).each { i ->
            ps.addBatch([i,
                trunc(faker.company().name(), 100),
                trunc(faker.name().fullName(), 60),
                trunc(faker.address().streetAddress(), 120),
                trunc(faker.address().city(), 40),
                trunc(faker.address().country(), 40),
                trunc(faker.internet().emailAddress(), 100)])
        }
    }
    log.info("Inserted {} customers", customerCount)

    // ── Products ─────────────────────────────────────────────────────────────
    log.info("Inserting {} products...", productCount)
    dbSql.withBatch(BATCH_SIZE,
            "INSERT INTO seed_inv_product (product_id,product_name,category,unit_price) VALUES (?,?,?,?)") { ps ->
        (1..productCount).each { i ->
            int catIdx = (i - 1) % CATEGORIES.size()
            double minP = PRICE_RANGES[catIdx][0], maxP = PRICE_RANGES[catIdx][1]
            ps.addBatch([i,
                trunc(faker.commerce().productName(), 80),
                CATEGORIES[catIdx],
                round2(minP + priceRand.nextDouble() * (maxP - minP))])
        }
    }
    log.info("Inserted {} products", productCount)

    // ── Invoices + lines (dual-PS via raw JDBC to interleave batches) ─────────
    log.info("Inserting {} invoices...", N)
    int tenPct = Math.max(1, (int)(N / 10))
    int lineId = 0
    int totalLines = 0

    def conn  = dbSql.connection
    def invPs = conn.prepareStatement(
        "INSERT INTO seed_inv_invoice (invoice_id,customer_id,invoice_date,due_date,status,freight,notes) VALUES (?,?,?,?,?,?,?)")
    def linePs = conn.prepareStatement(
        "INSERT INTO seed_inv_invoice_line (line_id,invoice_id,product_id,quantity,unit_price,discount) VALUES (?,?,?,?,?,?)")
    try {
        (1..N).each { i ->
            int custId    = rand.nextInt(customerCount) + 1
            int daysOff   = rand.nextInt(730)
            LocalDate inv = BASE_DATE.plusDays(daysOff)
            LocalDate due = inv.plusDays(30)
            String status = STATUSES[rand.nextInt(STATUSES.size())]
            double fright = round2(5.0 + rand.nextDouble() * 95.0)

            invPs.setInt(1, i);        invPs.setInt(2, custId)
            invPs.setDate(3, Date.valueOf(inv)); invPs.setDate(4, Date.valueOf(due))
            invPs.setString(5, status); invPs.setDouble(6, fright)
            invPs.setString(7, "Invoice #${i}")
            invPs.addBatch()

            int numLines = 3 + rand.nextInt(3)
            numLines.times {
                lineId++; totalLines++
                int prodId   = rand.nextInt(productCount) + 1
                int qty      = 1 + rand.nextInt(50)
                double uPrc  = round2(5.0 + rand.nextDouble() * 50.0)
                double disc  = round2(rand.nextInt(4) * 0.05)
                linePs.setInt(1, lineId); linePs.setInt(2, i); linePs.setInt(3, prodId)
                linePs.setInt(4, qty);    linePs.setDouble(5, uPrc); linePs.setDouble(6, disc)
                linePs.addBatch()
            }

            if (i % BATCH_SIZE == 0) {
                invPs.executeBatch(); linePs.executeBatch()
            }
            if (i % tenPct == 0) {
                log.info("Inserting invoices... {}% ({}/{})", (int)(i * 100L / N), i, N)
            }
        }
        invPs.executeBatch(); linePs.executeBatch()
    } finally {
        invPs.close(); linePs.close()
    }
    log.info("Inserted {} invoices, {} invoice lines", N, totalLines)
}

// ── Execute (with or without transaction depending on vendor) ─────────────────

if (isClickHouse) {
    truncateTables()
    doInserts()
} else {
    dbSql.withTransaction {
        truncateTables()
        disableFk()
        doInserts()
        enableFk()
    }
}

log.info("=== Invoice Seed: COMPLETED — {} invoices for vendor {} ===", N, vendor)
