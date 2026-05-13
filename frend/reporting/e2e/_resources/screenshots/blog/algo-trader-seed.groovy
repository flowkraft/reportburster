// @description Algo Trader: 12-table data model + 90 days of intraday bars + 200 strategy runs
//
// Idempotent — safe to re-run. Every execution begins with DROP ... IF EXISTS CASCADE
// for all 12 tables, the hypertable, the 3 continuous aggregates, and the position_now
// view, in child-first order. Partial state from a failed previous run is wiped clean
// before anything is recreated. Re-running after a successful run also works — same end
// state, just slower.
//
// Bindings provided by GenericSeedExecutor:
//   dbSql  — groovy.sql.Sql connected to the target database
//   vendor — String (uppercase): expects POSTGRES / POSTGRESQL / TIMESCALEDB / SUPABASE
//   log    — SLF4J Logger
//   params — Map with optional keys: N_INSTRUMENTS (default 30), DAYS (default 90), N_RUNS (default 200)

import net.datafaker.Faker
import java.sql.Timestamp
import java.time.*
import java.time.temporal.ChronoUnit

if (!(vendor in ['POSTGRES','POSTGRESQL','TIMESCALEDB','SUPABASE'])) {
    throw new RuntimeException("Algo Trader seeder requires PostgreSQL/TimescaleDB. Got: ${vendor}")
}

int N_INSTRUMENTS = params?.N_INSTRUMENTS ? Integer.parseInt(params.N_INSTRUMENTS.toString()) : 30
int DAYS          = params?.DAYS          ? Integer.parseInt(params.DAYS.toString())          : 90
int N_RUNS        = params?.N_RUNS        ? Integer.parseInt(params.N_RUNS.toString())        : 200
long SEED         = 42L
int  BATCH_SIZE   = 5000

log.info("=== Algo Trader Seed: starting (instruments={}, days={}, runs={}) ===", N_INSTRUMENTS, DAYS, N_RUNS)

def safe = { String s -> try { dbSql.execute(s) } catch (Exception e) { log.debug("DDL skipped: {}", e.message) } }

// ── 1. Drop existing objects (child-first, idempotent) ───────────────────────
safe("DROP MATERIALIZED VIEW IF EXISTS bar_1d CASCADE")
safe("DROP MATERIALIZED VIEW IF EXISTS bar_1h CASCADE")
safe("DROP MATERIALIZED VIEW IF EXISTS bar_5m CASCADE")
safe("DROP VIEW IF EXISTS position_now CASCADE")
safe("DROP TABLE IF EXISTS equity_curve CASCADE")
safe("DROP TABLE IF EXISTS trade CASCADE")
safe("DROP TABLE IF EXISTS position CASCADE")
safe("DROP TABLE IF EXISTS fill CASCADE")
safe('DROP TABLE IF EXISTS "order" CASCADE')
safe("DROP TABLE IF EXISTS signal CASCADE")
safe("DROP TABLE IF EXISTS strategy_run CASCADE")
safe("DROP TABLE IF EXISTS bar_1m CASCADE")
safe("DROP TABLE IF EXISTS strategy CASCADE")
safe("DROP TABLE IF EXISTS account CASCADE")
safe("DROP TABLE IF EXISTS instrument CASCADE")
safe("DROP TABLE IF EXISTS exchange CASCADE")

// ── 2. Schema: Layer 1 (reference) ───────────────────────────────────────────
dbSql.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")

dbSql.execute("""
    CREATE TABLE exchange (
        id        SERIAL PRIMARY KEY,
        code      TEXT NOT NULL UNIQUE,
        mic       TEXT,
        name      TEXT NOT NULL,
        timezone  TEXT NOT NULL,
        currency  TEXT NOT NULL
    )
""")

dbSql.execute("""
    CREATE TABLE instrument (
        id           SERIAL PRIMARY KEY,
        exchange_id  INT NOT NULL REFERENCES exchange(id),
        symbol       TEXT NOT NULL,
        asset_class  TEXT NOT NULL,
        name         TEXT,
        sector       TEXT,
        currency     TEXT NOT NULL,
        tick_size    NUMERIC(10,4) DEFAULT 0.01,
        lot_size     INT DEFAULT 1,
        is_active    BOOLEAN DEFAULT TRUE,
        UNIQUE(exchange_id, symbol)
    )
""")

dbSql.execute("""
    CREATE TABLE account (
        id             SERIAL PRIMARY KEY,
        broker         TEXT NOT NULL,
        base_currency  TEXT NOT NULL,
        equity         NUMERIC(18,2) NOT NULL,
        max_leverage   NUMERIC(5,2) DEFAULT 1.0,
        kill_switch    BOOLEAN DEFAULT FALSE,
        created_at     TIMESTAMPTZ DEFAULT now()
    )
""")

dbSql.execute("""
    CREATE TABLE strategy (
        id                  SERIAL PRIMARY KEY,
        name                TEXT NOT NULL UNIQUE,
        version             TEXT NOT NULL,
        description         TEXT,
        params_schema_json  JSONB,
        status              TEXT DEFAULT 'active',
        created_at          TIMESTAMPTZ DEFAULT now()
    )
""")

// ── 3. Schema: Layer 2 (market data) ─────────────────────────────────────────
dbSql.execute("""
    CREATE TABLE bar_1m (
        instrument_id  INT NOT NULL REFERENCES instrument(id),
        ts             TIMESTAMPTZ NOT NULL,
        open           NUMERIC(18,4) NOT NULL,
        high           NUMERIC(18,4) NOT NULL,
        low            NUMERIC(18,4) NOT NULL,
        close          NUMERIC(18,4) NOT NULL,
        volume         BIGINT NOT NULL,
        vwap           NUMERIC(18,4),
        trade_count    INT,
        PRIMARY KEY (instrument_id, ts)
    )
""")

dbSql.execute("SELECT create_hypertable('bar_1m', 'ts', chunk_time_interval => INTERVAL '7 days')")

// Three continuous aggregates (5m, 1h, 1d) — written out explicitly because Groovy SQL
// treats GString interpolation as JDBC parameter binding, and you can't parameterize identifiers.
dbSql.execute("""
    CREATE MATERIALIZED VIEW bar_5m
    WITH (timescaledb.continuous) AS
    SELECT instrument_id,
           time_bucket('5 minutes', ts) AS ts,
           first(open, ts) AS open,
           max(high)       AS high,
           min(low)        AS low,
           last(close, ts) AS close,
           sum(volume)     AS volume,
           sum(close * volume) / nullif(sum(volume), 0) AS vwap,
           sum(trade_count) AS trade_count
    FROM bar_1m
    GROUP BY 1, 2
    WITH NO DATA
""")

dbSql.execute("""
    CREATE MATERIALIZED VIEW bar_1h
    WITH (timescaledb.continuous) AS
    SELECT instrument_id,
           time_bucket('1 hour', ts) AS ts,
           first(open, ts) AS open,
           max(high)       AS high,
           min(low)        AS low,
           last(close, ts) AS close,
           sum(volume)     AS volume,
           sum(close * volume) / nullif(sum(volume), 0) AS vwap,
           sum(trade_count) AS trade_count
    FROM bar_1m
    GROUP BY 1, 2
    WITH NO DATA
""")

dbSql.execute("""
    CREATE MATERIALIZED VIEW bar_1d
    WITH (timescaledb.continuous) AS
    SELECT instrument_id,
           time_bucket('1 day', ts) AS ts,
           first(open, ts) AS open,
           max(high)       AS high,
           min(low)        AS low,
           last(close, ts) AS close,
           sum(volume)     AS volume,
           sum(close * volume) / nullif(sum(volume), 0) AS vwap,
           sum(trade_count) AS trade_count
    FROM bar_1m
    GROUP BY 1, 2
    WITH NO DATA
""")

// ── 4. Schema: Layer 3 (trading lifecycle) ───────────────────────────────────
dbSql.execute("""
    CREATE TABLE strategy_run (
        id                       SERIAL PRIMARY KEY,
        strategy_id              INT NOT NULL REFERENCES strategy(id),
        account_id               INT NOT NULL REFERENCES account(id),
        mode                     TEXT NOT NULL CHECK (mode IN ('backtest','paper','live')),
        from_ts                  TIMESTAMPTZ NOT NULL,
        to_ts                    TIMESTAMPTZ,
        params_snapshot_json     JSONB,
        market_data_window_hash  TEXT,
        status                   TEXT DEFAULT 'completed',
        started_at               TIMESTAMPTZ DEFAULT now(),
        ended_at                 TIMESTAMPTZ
    )
""")

dbSql.execute("""
    CREATE TABLE signal (
        id               BIGSERIAL PRIMARY KEY,
        strategy_run_id  INT NOT NULL REFERENCES strategy_run(id),
        instrument_id    INT NOT NULL REFERENCES instrument(id),
        ts               TIMESTAMPTZ NOT NULL,
        side             TEXT NOT NULL CHECK (side IN ('buy','sell','flat')),
        strength         NUMERIC(5,4),
        reason_text      TEXT,
        implied_price    NUMERIC(18,4),
        source_bar_ts    TIMESTAMPTZ
    )
""")

dbSql.execute('''
    CREATE TABLE "order" (
        id               BIGSERIAL PRIMARY KEY,
        strategy_run_id  INT NOT NULL REFERENCES strategy_run(id),
        signal_id        BIGINT REFERENCES signal(id),
        instrument_id    INT NOT NULL REFERENCES instrument(id),
        ts_submitted     TIMESTAMPTZ NOT NULL,
        side             TEXT NOT NULL,
        qty              NUMERIC(18,4) NOT NULL,
        type             TEXT NOT NULL CHECK (type IN ('market','limit','stop')),
        limit_price      NUMERIC(18,4),
        time_in_force    TEXT DEFAULT 'DAY',
        status           TEXT NOT NULL,
        ts_terminal      TIMESTAMPTZ,
        parent_order_id  BIGINT
    )
''')

dbSql.execute('''
    CREATE TABLE fill (
        id              BIGSERIAL PRIMARY KEY,
        order_id        BIGINT NOT NULL REFERENCES "order"(id),
        ts              TIMESTAMPTZ NOT NULL,
        qty             NUMERIC(18,4) NOT NULL,
        qty_signed      NUMERIC(18,4) NOT NULL,
        price           NUMERIC(18,4) NOT NULL,
        fee             NUMERIC(18,4) DEFAULT 0,
        venue           TEXT,
        liquidity_flag  TEXT CHECK (liquidity_flag IN ('maker','taker')),
        external_id     TEXT
    )
''')

dbSql.execute("""
    CREATE TABLE position (
        account_id     INT NOT NULL REFERENCES account(id),
        instrument_id  INT NOT NULL REFERENCES instrument(id),
        ts             TIMESTAMPTZ NOT NULL,
        qty            NUMERIC(18,4) NOT NULL,
        avg_cost       NUMERIC(18,4),
        realized_pnl   NUMERIC(18,2),
        last_fill_id   BIGINT,
        PRIMARY KEY (account_id, instrument_id, ts)
    )
""")

// position_now: derived view — one row per (account, instrument) currently holding a non-zero net qty
dbSql.execute('''
    CREATE VIEW position_now AS
    SELECT sr.account_id,
           o.instrument_id,
           sum(f.qty_signed)                                          AS net_qty,
           sum(f.qty_signed * f.price) / nullif(sum(f.qty_signed), 0) AS avg_cost
    FROM fill f
    JOIN "order"       o  ON o.id = f.order_id
    JOIN strategy_run  sr ON sr.id = o.strategy_run_id
    GROUP BY 1, 2
    HAVING sum(f.qty_signed) <> 0
''')

// v_positions_marked: Dashboard 2's single base view — positions ⋈ latest bar ⋈ instrument ⋈ account.
// Computes mark price, unrealized P&L (absolute + %), gross / net exposure, % of portfolio. Every
// Dashboard 2 widget (positions table, gauges, top winners/losers, asset-class donut) reads from
// this view via the visual builder — no per-widget joins needed.
// Documented in § 3 Dashboard 2 Phase 1 above; same DDL repeated here so a clean install gets it.
dbSql.execute('''
    CREATE OR REPLACE VIEW v_positions_marked AS
    WITH latest_bar AS (
      SELECT DISTINCT ON (instrument_id)
             instrument_id,
             ts    AS mark_ts,
             close AS mark_price
      FROM bar_1m
      ORDER BY instrument_id, ts DESC
    )
    SELECT
      pn.account_id,
      pn.instrument_id,
      i.symbol,
      i.name,
      i.asset_class,
      i.sector,
      i.currency,
      pn.net_qty,
      pn.avg_cost,
      lb.mark_price,
      lb.mark_ts,
      (lb.mark_price - pn.avg_cost) * pn.net_qty                AS unrealized_pnl,
      CASE WHEN pn.avg_cost <> 0
           THEN (lb.mark_price - pn.avg_cost) / pn.avg_cost
           ELSE NULL
      END                                                       AS unrealized_pnl_pct,
      pn.net_qty * lb.mark_price                                AS net_value,
      abs(pn.net_qty) * lb.mark_price                           AS gross_value,
      abs(pn.net_qty * lb.mark_price) / NULLIF(a.equity, 0)     AS pct_of_portfolio,
      a.equity                                                  AS account_equity,
      a.max_leverage                                            AS account_max_leverage
    FROM position_now pn
    JOIN latest_bar  lb ON lb.instrument_id = pn.instrument_id
    JOIN instrument  i  ON i.id = pn.instrument_id
    JOIN account     a  ON a.id = pn.account_id
''')

// v_executions: Dashboard 3's single base view — order ⋈ signal ⋈ first fill ⋈ instrument.
// Computes per-order latency (signal → first fill, in milliseconds) and signed slippage in
// basis points (positive = bad regardless of buy/sell). All D3 widgets (latency percentile
// tiles, fill-rate / partial / rejected tiles, slippage histogram, drill-down tables) read
// from this view. Documented in § 3 Dashboard 3 Phase 1; same DDL repeated here so a clean
// install gets it.
dbSql.execute('''
    CREATE OR REPLACE VIEW v_executions AS
    WITH first_fill AS (
      SELECT DISTINCT ON (order_id)
             order_id,
             ts    AS first_fill_ts,
             price AS first_fill_price,
             qty   AS first_fill_qty
      FROM fill
      ORDER BY order_id, ts
    )
    SELECT
      o.id                                                  AS order_id,
      o.strategy_run_id,
      o.signal_id,
      o.instrument_id,
      i.symbol,
      o.side,
      o.qty                                                 AS qty_submitted,
      o.status,
      s.ts                                                  AS signal_ts,
      o.ts_submitted,
      ff.first_fill_ts,
      ff.first_fill_price,
      s.implied_price,
      EXTRACT(EPOCH FROM (ff.first_fill_ts - s.ts)) * 1000  AS latency_ms,
      CASE WHEN s.implied_price IS NULL OR s.implied_price = 0 THEN NULL
           WHEN o.side = 'buy'
             THEN (ff.first_fill_price - s.implied_price) / s.implied_price * 10000
           ELSE (s.implied_price - ff.first_fill_price) / s.implied_price * 10000
      END                                                   AS slippage_bps_signed
    FROM "order"      o
    JOIN signal       s  ON s.id = o.signal_id
    JOIN instrument   i  ON i.id = o.instrument_id
    LEFT JOIN first_fill ff ON ff.order_id = o.id
''')

// ── 5. Schema: Layer 4 (analytics) ───────────────────────────────────────────
dbSql.execute("""
    CREATE TABLE trade (
        id                      BIGSERIAL PRIMARY KEY,
        strategy_run_id         INT NOT NULL REFERENCES strategy_run(id),
        instrument_id           INT NOT NULL REFERENCES instrument(id),
        opened_at               TIMESTAMPTZ NOT NULL,
        closed_at               TIMESTAMPTZ NOT NULL,
        side                    TEXT NOT NULL,
        qty                     NUMERIC(18,4) NOT NULL,
        entry_price             NUMERIC(18,4) NOT NULL,
        exit_price              NUMERIC(18,4) NOT NULL,
        gross_pnl               NUMERIC(18,2),
        fees                    NUMERIC(18,2),
        net_pnl                 NUMERIC(18,2),
        return_pct              NUMERIC(10,4),
        holding_period_minutes  INT,
        mfe                     NUMERIC(18,2),
        mae                     NUMERIC(18,2)
    )
""")

dbSql.execute("""
    CREATE TABLE equity_curve (
        strategy_run_id  INT NOT NULL REFERENCES strategy_run(id),
        ts               TIMESTAMPTZ NOT NULL,
        equity           NUMERIC(18,2) NOT NULL,
        cash             NUMERIC(18,2),
        gross_exposure   NUMERIC(18,2),
        net_exposure     NUMERIC(18,2),
        drawdown_pct     NUMERIC(10,4),
        PRIMARY KEY (strategy_run_id, ts)
    )
""")

log.info("Schema created: 12 tables + 1 hypertable + 3 continuous aggregates + position_now view")

// ── 6. Reference data ────────────────────────────────────────────────────────
def faker = new Faker(new Random(SEED))
def rand  = new Random(SEED + 1)

dbSql.execute("""
    INSERT INTO exchange (code, mic, name, timezone, currency) VALUES
        ('NYSE',   'XNYS', 'New York Stock Exchange', 'America/New_York', 'USD'),
        ('NASDAQ', 'XNAS', 'NASDAQ',                  'America/New_York', 'USD')
""")

// Universe: 30 large-cap US tickers across 5 sectors with realistic base prices
def TICKERS = [
    ['NASDAQ','AAPL','Apple Inc.','Technology',180.0],
    ['NASDAQ','MSFT','Microsoft Corp.','Technology',410.0],
    ['NASDAQ','GOOGL','Alphabet Inc.','Technology',145.0],
    ['NASDAQ','AMZN','Amazon.com Inc.','Consumer Discretionary',180.0],
    ['NASDAQ','META','Meta Platforms','Technology',480.0],
    ['NASDAQ','NVDA','NVIDIA Corp.','Technology',850.0],
    ['NASDAQ','TSLA','Tesla Inc.','Consumer Discretionary',175.0],
    ['NASDAQ','AVGO','Broadcom Inc.','Technology',1300.0],
    ['NASDAQ','AMD','Advanced Micro Devices','Technology',165.0],
    ['NASDAQ','INTC','Intel Corp.','Technology',35.0],
    ['NYSE','JPM','JPMorgan Chase','Financials',200.0],
    ['NYSE','BAC','Bank of America','Financials',38.0],
    ['NYSE','WFC','Wells Fargo','Financials',56.0],
    ['NYSE','GS','Goldman Sachs','Financials',420.0],
    ['NYSE','MS','Morgan Stanley','Financials',95.0],
    ['NYSE','C','Citigroup','Financials',60.0],
    ['NYSE','JNJ','Johnson & Johnson','Healthcare',155.0],
    ['NYSE','UNH','UnitedHealth Group','Healthcare',510.0],
    ['NYSE','PFE','Pfizer Inc.','Healthcare',28.0],
    ['NYSE','MRK','Merck & Co.','Healthcare',130.0],
    ['NYSE','ABBV','AbbVie Inc.','Healthcare',175.0],
    ['NYSE','LLY','Eli Lilly and Co.','Healthcare',760.0],
    ['NYSE','XOM','Exxon Mobil','Energy',115.0],
    ['NYSE','CVX','Chevron Corp.','Energy',155.0],
    ['NYSE','COP','ConocoPhillips','Energy',115.0],
    ['NYSE','WMT','Walmart Inc.','Consumer Staples',60.0],
    ['NYSE','PG','Procter & Gamble','Consumer Staples',165.0],
    ['NYSE','KO','Coca-Cola Co.','Consumer Staples',60.0],
    ['NYSE','PEP','PepsiCo Inc.','Consumer Staples',175.0],
    ['NYSE','NKE','Nike Inc.','Consumer Discretionary',95.0]
].take(N_INSTRUMENTS)

def exchangeIds = [:]
dbSql.eachRow("SELECT id, code FROM exchange") { row -> exchangeIds[row.code] = row.id }

dbSql.withBatch("INSERT INTO instrument (exchange_id, symbol, asset_class, name, sector, currency, tick_size, lot_size) VALUES (?,?,?,?,?,'USD',0.01,1)") { ps ->
    TICKERS.each { row ->
        ps.addBatch([exchangeIds[row[0]], row[1], 'stock', row[2], row[3]])
    }
}

// SINGLE account for the tutorial. The schema is multi-account-capable
// (production setups commonly partition capital across IB live, Alpaca paper,
// per-strategy capital pools, etc.) — but seeding one account keeps every
// dashboard's numbers immediately meaningful without forcing a per-account
// dashboard parameter. Equity sized so realistic gross exposure (~$2.5M)
// produces ~0.5× leverage — a healthy "green band" for the Leverage gauge.
dbSql.execute("""
    INSERT INTO account (broker, base_currency, equity, max_leverage) VALUES
        ('Interactive Brokers', 'USD', 5000000.00, 2.0)
""")

dbSql.execute("""
    INSERT INTO strategy (name, version, description, params_schema_json) VALUES
        ('mean_reversion_5m', '1.0', 'Mean reversion on 5-minute bars',  '{"lookback":{"type":"int","default":20},"z_threshold":{"type":"float","default":2.0}}'::jsonb),
        ('breakout_1h',       '1.0', 'Breakout on hourly highs/lows',    '{"lookback":{"type":"int","default":24}}'::jsonb),
        ('pairs_bank_stocks', '1.0', 'Pairs trade on bank stocks',       '{"window":{"type":"int","default":60}}'::jsonb),
        ('momentum_eod',      '1.0', 'End-of-day momentum',              '{"lookback":{"type":"int","default":10}}'::jsonb)
""")

log.info("Reference data: 2 exchanges, {} instruments, 1 account, 4 strategies", TICKERS.size())

// ── 7. Market data: 90 days of 1m bars per instrument ────────────────────────
def instruments = dbSql.rows("SELECT id, symbol FROM instrument ORDER BY id")
def basePriceBySymbol = TICKERS.collectEntries { [(it[1]): it[4]] }

LocalDate today = LocalDate.now()
LocalDate startDay = today.minusDays(DAYS as long)

log.info("Generating ~{} bars (~70s on a 2024 laptop)...", DAYS * 390 * instruments.size())

int totalBars = 0
def conn = dbSql.connection
def barPs = conn.prepareStatement(
    "INSERT INTO bar_1m (instrument_id, ts, open, high, low, close, volume, vwap, trade_count) VALUES (?,?,?,?,?,?,?,?,?)")

try {
    instruments.eachWithIndex { inst, idx ->
        double price = (basePriceBySymbol[inst.symbol] as Double) ?: 100.0
        int batchInThisInst = 0

        LocalDate day = startDay
        while (day.isBefore(today)) {
            DayOfWeek dow = day.getDayOfWeek()
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                day = day.plusDays(1); continue
            }
            // 09:30 ET ≈ 13:30 UTC (DST-naive — fine for synthetic data)
            ZonedDateTime sessionOpen = day.atTime(13, 30).atZone(ZoneOffset.UTC)

            for (int m = 0; m < 390; m++) {
                ZonedDateTime ts = sessionOpen.plusMinutes(m)
                double drift   = rand.nextGaussian() * (price * 0.0008)
                double volMult = (m < 30 || m > 360) ? 2.5 : 1.0  // open/close volume bumps

                double o = price
                double c = price + drift
                double h = Math.max(o, c) + Math.abs(rand.nextGaussian()) * (price * 0.0005)
                double l = Math.min(o, c) - Math.abs(rand.nextGaussian()) * (price * 0.0005)
                long volume = (long) ((50000 + rand.nextInt(50000)) * volMult)
                double vwap = (o + h + l + c) / 4.0
                int tradeCount = (int) (volume / 100)

                barPs.setInt(1, inst.id as int)
                barPs.setTimestamp(2, Timestamp.from(ts.toInstant()))
                barPs.setDouble(3, o); barPs.setDouble(4, h); barPs.setDouble(5, l); barPs.setDouble(6, c)
                barPs.setLong(7, volume); barPs.setDouble(8, vwap); barPs.setInt(9, tradeCount)
                barPs.addBatch()
                batchInThisInst++; totalBars++

                if (batchInThisInst % BATCH_SIZE == 0) { barPs.executeBatch() }
                price = c
            }
            day = day.plusDays(1)
        }
        barPs.executeBatch()
        log.info("Bars: {}/{} ({}) — {} rows so far", idx + 1, instruments.size(), inst.symbol, totalBars)
    }
} finally {
    barPs.close()
}

log.info("Refreshing continuous aggregates (5m / 1h / 1d)...")
dbSql.execute("CALL refresh_continuous_aggregate('bar_5m', NULL, NULL)")
dbSql.execute("CALL refresh_continuous_aggregate('bar_1h', NULL, NULL)")
dbSql.execute("CALL refresh_continuous_aggregate('bar_1d', NULL, NULL)")

log.info("Inserted {} bars + refreshed aggregates", totalBars)

// ── 8. Strategy runs + lifecycle (signals → orders → fills → trades + equity) ─
//
// Design choices for "tutorial-meaningful" data:
//
//   1. Each strategy_run gets its own $100K capital allocation, INDEPENDENT
//      of account.equity. Dashboard 1's Equity Curve chart can then compare
//      runs on the same baseline (lines start at $100K, diverge based on
//      strategy P&L). Without this, runs would inherit different starting
//      equities from the account they're tied to, producing wildly different
//      scales that visually mash together (one line at $1M, four at $250K).
//
//   2. Each strategy has a "personality" (mu / sigma / win-rate / win-size /
//      loss-size). The mean-reversion archetype is the tutorial's "good"
//      strategy (positive Sharpe); momentum_eod intentionally underperforms
//      so Dashboard 1's filter shows variety, not 4 identical random walks.
//
//   3. Drawdowns track the running peak — (equity − peak) / peak ≤ 0, the
//      conventional definition. The previous "vs. start" formula misnamed
//      the metric and produced flat-line drawdowns above the starting equity.
//
//   4. Backtest/paper runs FORCE-CLOSE every position at run end. Dashboard 2's
//      live positions come from a separate live run inserted in § 9 below —
//      that's the only contributor to position_now / v_positions_marked.
def strategies = dbSql.rows("SELECT id, name FROM strategy")
def accountRow = dbSql.firstRow("SELECT id FROM account ORDER BY id LIMIT 1")
long ACCOUNT_ID = accountRow.id as long
double RUN_STARTING_EQUITY = 100000.0d

// Order outcome mix — broadly realistic for a working algo against a real
// broker. Adjust to taste; numbers chosen so D3's three rate tiles each show
// non-trivial values:
//   Fill Rate ≈ 95%, Partial Fill ≈ 3%, Rejected ≈ 2%
double ORDER_PCT_PARTIAL  = 0.03
double ORDER_PCT_REJECTED = 0.02
// Partial fills cover 50–90% of the requested quantity:
double PARTIAL_QTY_FRACTION_MIN = 0.50
double PARTIAL_QTY_FRACTION_MAX = 0.90

// Per-strategy daily-return profiles (drives equity curves AND trade P&L draws).
//   mu      — daily mean return
//   sigma   — daily standard deviation
//   winRate — fraction of trades that close as wins
//   avgWin  — mean winning-trade return (positive)
//   avgLoss — mean losing-trade return  (negative)
def STRATEGY_PROFILES = [
    'mean_reversion_5m': [mu: 0.0008d,   sigma: 0.011d, winRate: 0.62d, avgWin: 0.008d,  avgLoss: -0.006d],
    'breakout_1h':       [mu: 0.0004d,   sigma: 0.018d, winRate: 0.52d, avgWin: 0.018d,  avgLoss: -0.013d],
    'pairs_bank_stocks': [mu: 0.0003d,   sigma: 0.007d, winRate: 0.58d, avgWin: 0.005d,  avgLoss: -0.004d],
    'momentum_eod':      [mu: -0.00005d, sigma: 0.014d, winRate: 0.49d, avgWin: 0.012d,  avgLoss: -0.011d]
]

log.info("Generating {} strategy runs with full lifecycle...", N_RUNS)

int totalSignals = 0, totalOrders = 0, totalFills = 0, totalTrades = 0, totalEquityPoints = 0

(1..N_RUNS).each { runIdx ->
    // Round-robin strategies so any (1, 5, 10, 50, 100) Strategy Runs filter
    // on Dashboard 1 surfaces all 4 archetypes together.
    def strat = strategies[(runIdx - 1) % strategies.size()]
    def profile = STRATEGY_PROFILES[strat.name as String]
    String mode = (runIdx % 7 == 0) ? 'paper' : 'backtest'
    int durationDays = 30 + rand.nextInt(60)
    int offsetDays = rand.nextInt(Math.max(1, DAYS - durationDays))
    ZonedDateTime fromTs = today.minusDays((DAYS - offsetDays) as long).atStartOfDay(ZoneOffset.UTC)
    ZonedDateTime toTs   = fromTs.plusDays(durationDays as long)

    def runRow = dbSql.firstRow("""
        INSERT INTO strategy_run (strategy_id, account_id, mode, from_ts, to_ts,
            params_snapshot_json, market_data_window_hash, status, started_at, ended_at)
        VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, 'completed', ?, ?)
        RETURNING id
    """, [strat.id, ACCOUNT_ID, mode, Timestamp.from(fromTs.toInstant()), Timestamp.from(toTs.toInstant()),
          '{"lookback": 20, "snapshot": true}', "hash_${runIdx}".toString(),
          Timestamp.from(fromTs.toInstant()), Timestamp.from(toTs.toInstant())])
    long runId = runRow.id as long

    // 2-5 instruments per run
    def runInstruments = []
    int ni = 2 + rand.nextInt(4)
    ni.times { runInstruments << instruments[rand.nextInt(instruments.size())] }

    int numTrades = 20 + rand.nextInt(30)  // 20-50 round-trips per run
    def openTrades = [:]  // instrument_id -> {entry_price, entry_ts, qty}

    numTrades.times { tIdx ->
        def inst = runInstruments[rand.nextInt(runInstruments.size())]
        // Spread trades evenly through the run window with mild jitter.
        long secOff = (long)(((tIdx + 0.5d) / (double) numTrades) * durationDays * 86400L
                              + (rand.nextDouble() - 0.5d) * 3600.0d)
        if (secOff < 0) secOff = 0
        Timestamp sigTs = Timestamp.from(fromTs.toInstant().plusSeconds(secOff))

        double basePrice = (basePriceBySymbol[inst.symbol] as Double) ?: 100.0d

        if (!openTrades.containsKey(inst.id)) {
            // OPEN a long position.
            double execPrice = basePrice * (1.0d + rand.nextGaussian() * 0.005d)
            double qty = 100 + rand.nextInt(400)  // 100-500 shares per trade

            def sigRow = dbSql.firstRow("""
                INSERT INTO signal (strategy_run_id, instrument_id, ts, side, strength,
                                    reason_text, implied_price, source_bar_ts)
                VALUES (?, ?, ?, 'buy', ?, 'auto', ?, ?) RETURNING id
            """, [runId, inst.id, sigTs, rand.nextDouble(),
                  execPrice, new Timestamp(sigTs.time - (sigTs.time % 60000L))])
            totalSignals++

            // Outcome roll: filled / partial / rejected. See ORDER_PCT_* near the
            // top of § 8 for the distribution. Open rejections mean no position
            // is taken (the slot stays empty for this instrument until the next
            // signal); partials open with a smaller-than-requested quantity.
            double  outcomeRoll = rand.nextDouble()
            String  orderStatus
            double  filledQty
            boolean writeFill
            if (outcomeRoll < ORDER_PCT_REJECTED) {
                orderStatus = 'rejected'; filledQty = 0.0d; writeFill = false
            } else if (outcomeRoll < ORDER_PCT_REJECTED + ORDER_PCT_PARTIAL) {
                orderStatus = 'partial'
                double frac = PARTIAL_QTY_FRACTION_MIN +
                              rand.nextDouble() * (PARTIAL_QTY_FRACTION_MAX - PARTIAL_QTY_FRACTION_MIN)
                filledQty = qty * frac
                writeFill = true
            } else {
                orderStatus = 'filled'; filledQty = qty; writeFill = true
            }

            Timestamp orderTs   = new Timestamp(sigTs.time + 50 + rand.nextInt(500))
            Timestamp orderTermTs = new Timestamp(
                orderStatus == 'rejected' ? orderTs.time + 50 : orderTs.time + 100)
            def ordRow = dbSql.firstRow('''
                INSERT INTO "order" (strategy_run_id, signal_id, instrument_id, ts_submitted, side, qty, type, status, ts_terminal)
                VALUES (?, ?, ?, ?, 'buy', ?, 'market', ?, ?) RETURNING id
            ''', [runId, sigRow.id, inst.id, orderTs, qty, orderStatus, orderTermTs])
            totalOrders++

            if (writeFill) {
                Timestamp fillTs = new Timestamp(orderTs.time + 100 + rand.nextInt(400))
                double fillPrice = execPrice * (1.0d + rand.nextGaussian() * 0.0005d)
                double fee = filledQty * 0.005d
                dbSql.execute("""
                    INSERT INTO fill (order_id, ts, qty, qty_signed, price, fee, venue, liquidity_flag)
                    VALUES (?, ?, ?, ?, ?, ?, 'NYSE_ARCA', 'taker')
                """, [ordRow.id, fillTs, filledQty, filledQty, fillPrice, fee])
                totalFills++

                openTrades[inst.id] = [entry_price: fillPrice, entry_ts: fillTs, qty: filledQty]
            }
            // If rejected, no fill row and no openTrades entry — the next signal
            // for this instrument will get a fresh open attempt.
        } else {
            // CLOSE the open position with a profile-driven P&L draw.
            // Peek at the position (don't remove yet — partial/rejected closes
            // leave it open for EOD force-close to handle).
            def open = openTrades[inst.id]
            boolean isWin = rand.nextDouble() < (profile.winRate as double)
            double rPct = isWin
                ? (profile.avgWin  as double) * (0.4d + 1.2d * rand.nextDouble())
                : (profile.avgLoss as double) * (0.4d + 1.2d * rand.nextDouble())
            double closePrice = (open.entry_price as double) * (1.0d + rPct)

            def sigRow = dbSql.firstRow("""
                INSERT INTO signal (strategy_run_id, instrument_id, ts, side, strength,
                                    reason_text, implied_price, source_bar_ts)
                VALUES (?, ?, ?, 'sell', ?, 'auto', ?, ?) RETURNING id
            """, [runId, inst.id, sigTs, rand.nextDouble(),
                  closePrice, new Timestamp(sigTs.time - (sigTs.time % 60000L))])
            totalSignals++

            // Outcome roll for the close. A rejected close leaves the position
            // open; the EOD force-close loop below will catch it. A partial
            // close is treated as a logical close at the partial qty (the
            // remaining sliver isn't tracked separately — keeps the trade-book
            // bookkeeping tractable for a tutorial seed).
            double  outcomeRoll = rand.nextDouble()
            String  orderStatus
            double  filledQty
            boolean writeFill
            if (outcomeRoll < ORDER_PCT_REJECTED) {
                orderStatus = 'rejected'; filledQty = 0.0d; writeFill = false
            } else if (outcomeRoll < ORDER_PCT_REJECTED + ORDER_PCT_PARTIAL) {
                orderStatus = 'partial'
                double frac = PARTIAL_QTY_FRACTION_MIN +
                              rand.nextDouble() * (PARTIAL_QTY_FRACTION_MAX - PARTIAL_QTY_FRACTION_MIN)
                filledQty = (open.qty as double) * frac
                writeFill = true
            } else {
                orderStatus = 'filled'; filledQty = (open.qty as double); writeFill = true
            }

            Timestamp orderTs     = new Timestamp(sigTs.time + 50 + rand.nextInt(500))
            Timestamp orderTermTs = new Timestamp(
                orderStatus == 'rejected' ? orderTs.time + 50 : orderTs.time + 100)
            def ordRow = dbSql.firstRow('''
                INSERT INTO "order" (strategy_run_id, signal_id, instrument_id, ts_submitted, side, qty, type, status, ts_terminal)
                VALUES (?, ?, ?, ?, 'sell', ?, 'market', ?, ?) RETURNING id
            ''', [runId, sigRow.id, inst.id, orderTs, open.qty, orderStatus, orderTermTs])
            totalOrders++

            if (writeFill) {
                Timestamp fillTs = new Timestamp(orderTs.time + 100 + rand.nextInt(400))
                double fee = filledQty * 0.005d
                dbSql.execute("""
                    INSERT INTO fill (order_id, ts, qty, qty_signed, price, fee, venue, liquidity_flag)
                    VALUES (?, ?, ?, ?, ?, ?, 'NYSE_ARCA', 'taker')
                """, [ordRow.id, fillTs, filledQty, -filledQty, closePrice, fee])
                totalFills++

                // Trade row only on a complete close. Partial closes leave the
                // remaining position to be force-closed at EOD.
                if (orderStatus == 'filled') {
                    openTrades.remove(inst.id)

                    double grossPnl = (closePrice - (open.entry_price as double)) * (open.qty as double)
                    double fees = (open.qty as double) * 0.005d * 2.0d
                    double netPnl = grossPnl - fees
                    long holdMin = ((fillTs.time - (open.entry_ts as Timestamp).time) / 60000L) as long
                    // MFE/MAE: realistic-ish. Winning trade saw further upside before exit;
                    // losing trade had drawdown beyond the final loss. ±0.4–1.4× |P&L|.
                    double mfe = Math.abs(grossPnl) * (0.8d + rand.nextDouble() * 0.6d)
                    double mae = -Math.abs(grossPnl) * (0.4d + rand.nextDouble() * 0.6d)
                    dbSql.execute("""
                        INSERT INTO trade (strategy_run_id, instrument_id, opened_at, closed_at, side, qty,
                                           entry_price, exit_price, gross_pnl, fees, net_pnl, return_pct,
                                           holding_period_minutes, mfe, mae)
                        VALUES (?, ?, ?, ?, 'long', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, [runId, inst.id, open.entry_ts, fillTs, open.qty,
                          open.entry_price, closePrice, grossPnl, fees, netPnl, rPct, holdMin, mfe, mae])
                    totalTrades++
                }
            }
            // If rejected: no fill, no trade — position stays open. EOD loop
            // handles it as a final cleanup.
        }
    }

    // Force-close any positions still open at run end so position_now stays
    // clean — only the live run in § 9 contributes to it.
    Timestamp eodCloseTs = Timestamp.from(toTs.toInstant().minus(1, ChronoUnit.HOURS))
    openTrades.each { instId, open ->
        boolean isWin = rand.nextDouble() < (profile.winRate as double)
        double rPct = isWin
            ? (profile.avgWin  as double) * (0.4d + 1.2d * rand.nextDouble())
            : (profile.avgLoss as double) * (0.4d + 1.2d * rand.nextDouble())
        double closePrice = (open.entry_price as double) * (1.0d + rPct)

        def sigRow = dbSql.firstRow("""
            INSERT INTO signal (strategy_run_id, instrument_id, ts, side, strength,
                                reason_text, implied_price, source_bar_ts)
            VALUES (?, ?, ?, 'sell', 0.5, 'eod_close', ?, ?) RETURNING id
        """, [runId, instId, eodCloseTs,
              closePrice, new Timestamp(eodCloseTs.time - (eodCloseTs.time % 60000L))])
        totalSignals++

        Timestamp orderTs = new Timestamp(eodCloseTs.time + 100)
        def ordRow = dbSql.firstRow('''
            INSERT INTO "order" (strategy_run_id, signal_id, instrument_id, ts_submitted, side, qty, type, status, ts_terminal)
            VALUES (?, ?, ?, ?, 'sell', ?, 'market', 'filled', ?) RETURNING id
        ''', [runId, sigRow.id, instId, orderTs, open.qty, new Timestamp(orderTs.time + 200)])
        totalOrders++

        Timestamp fillTs = new Timestamp(orderTs.time + 200)
        double fee = (open.qty as double) * 0.005d
        dbSql.execute("""
            INSERT INTO fill (order_id, ts, qty, qty_signed, price, fee, venue, liquidity_flag)
            VALUES (?, ?, ?, ?, ?, ?, 'NYSE_ARCA', 'taker')
        """, [ordRow.id, fillTs, open.qty, -(open.qty as double), closePrice, fee])
        totalFills++

        double grossPnl = (closePrice - (open.entry_price as double)) * (open.qty as double)
        double fees = (open.qty as double) * 0.005d * 2.0d
        double netPnl = grossPnl - fees
        long holdMin = ((fillTs.time - (open.entry_ts as Timestamp).time) / 60000L) as long
        double mfe = Math.abs(grossPnl) * (0.8d + rand.nextDouble() * 0.6d)
        double mae = -Math.abs(grossPnl) * (0.4d + rand.nextDouble() * 0.6d)
        dbSql.execute("""
            INSERT INTO trade (strategy_run_id, instrument_id, opened_at, closed_at, side, qty,
                               entry_price, exit_price, gross_pnl, fees, net_pnl, return_pct,
                               holding_period_minutes, mfe, mae)
            VALUES (?, ?, ?, ?, 'long', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [runId, instId, open.entry_ts, fillTs, open.qty,
              open.entry_price, closePrice, grossPnl, fees, netPnl, rPct, holdMin, mfe, mae])
        totalTrades++
    }
    openTrades.clear()

    // Equity curve — daily snapshot. Returns drawn from the strategy's profile;
    // drawdown is conventional peak-tracking, ≤ 0 (Dashboard 1's Drawdown
    // Ribbon's negative-y area makes this visually obvious).
    double equity = RUN_STARTING_EQUITY
    double peak = equity
    (0..durationDays).each { d ->
        Timestamp ts = Timestamp.from(fromTs.toInstant().plus(d as long, ChronoUnit.DAYS))
        double dailyReturn = (profile.mu as double) + rand.nextGaussian() * (profile.sigma as double)
        equity = equity * (1.0d + dailyReturn)
        peak = Math.max(peak, equity)
        double drawdownPct = (equity - peak) / peak  // ≤ 0
        dbSql.execute("""
            INSERT INTO equity_curve (strategy_run_id, ts, equity, cash, gross_exposure, net_exposure, drawdown_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [runId, ts, equity, equity * 0.3d, equity * 0.7d, equity * 0.4d, drawdownPct])
        totalEquityPoints++
    }

    if (runIdx % 25 == 0) {
        log.info("Runs: {}/{} (signals={}, fills={}, trades={})",
            runIdx, N_RUNS, totalSignals, totalFills, totalTrades)
    }
}

// ── 9. Live run with open positions (sole contributor to position_now) ───────
//
// All previous backtest/paper runs force-close their positions at run end,
// so position_now / v_positions_marked sees only the unmatched fills below.
// The 5 positions are sized to ≈ $2.5M gross exposure (~50% leverage on the
// $5M account — comfortably in the green band) with a long bias (4 long /
// 1 short) so Net Exposure on Dashboard 2 is meaningfully positive.
log.info("Inserting live run with 5 open positions for Dashboard 2...")

def liveStrat = strategies.find { it.name == 'momentum_eod' }
ZonedDateTime liveStartTs = today.atStartOfDay(ZoneOffset.UTC).minusDays(2L)

def liveRunRow = dbSql.firstRow("""
    INSERT INTO strategy_run (strategy_id, account_id, mode, from_ts, to_ts,
        params_snapshot_json, market_data_window_hash, status, started_at, ended_at)
    VALUES (?, ?, 'live', ?, NULL, ?::jsonb, ?, 'running', ?, NULL)
    RETURNING id
""", [liveStrat.id, ACCOUNT_ID, Timestamp.from(liveStartTs.toInstant()),
      '{"live": true}', "hash_live".toString(), Timestamp.from(liveStartTs.toInstant())])
long liveRunId = liveRunRow.id as long

// 20 positions across 6 sectors. Sized to ~$125K each so total gross is
// ~$2.5M (≈ 0.5× leverage on the $5M account — comfortably green band).
// 13 long + 7 short → net long bias ≈ $700K. Entry prices match the bar
// series base price so each position's unrealized P&L is purely a function
// of the random-walk drift over the past 90 days (some instruments drifted
// up, some down → naturally varied wins/losses for Top 5 Winners/Losers).
//
// Why 20 and not 5: "Top 5 Winners / Losers" widgets are only meaningful
// when the population is materially larger than 5. With 5 positions, both
// widgets just show the same 5 rows in different orders. 20 makes "filter
// to the top 5" a meaningful 25% slice.
def OPEN_POSITIONS = [
    // ── Tech (4 long) ──────────────────────────────────────────────────
    [symbol: 'AAPL',  qty:  700, side: 'buy',  basePrice: 180.0d],
    [symbol: 'MSFT',  qty:  300, side: 'buy',  basePrice: 410.0d],
    [symbol: 'NVDA',  qty:  150, side: 'buy',  basePrice: 850.0d],
    [symbol: 'GOOGL', qty:  850, side: 'buy',  basePrice: 145.0d],
    // ── Financials (3 long) ────────────────────────────────────────────
    [symbol: 'JPM',   qty:  600, side: 'buy',  basePrice: 200.0d],
    [symbol: 'GS',    qty:  300, side: 'buy',  basePrice: 420.0d],
    [symbol: 'BAC',   qty: 3000, side: 'buy',  basePrice:  38.0d],
    // ── Healthcare (3 long) ────────────────────────────────────────────
    [symbol: 'UNH',   qty:  240, side: 'buy',  basePrice: 510.0d],
    [symbol: 'JNJ',   qty:  800, side: 'buy',  basePrice: 155.0d],
    [symbol: 'LLY',   qty:  160, side: 'buy',  basePrice: 760.0d],
    // ── Consumer Staples (2 long) ──────────────────────────────────────
    [symbol: 'WMT',   qty: 2000, side: 'buy',  basePrice:  60.0d],
    [symbol: 'KO',    qty: 2000, side: 'buy',  basePrice:  60.0d],
    // ── Consumer Discretionary (1 long) ────────────────────────────────
    [symbol: 'TSLA',  qty:  700, side: 'buy',  basePrice: 175.0d],
    // ── Tech (1 short) ─────────────────────────────────────────────────
    [symbol: 'INTC',  qty: 4000, side: 'sell', basePrice:  35.0d],
    // ── Financials (1 short) ───────────────────────────────────────────
    [symbol: 'WFC',   qty: 2200, side: 'sell', basePrice:  56.0d],
    // ── Healthcare (1 short) ───────────────────────────────────────────
    [symbol: 'PFE',   qty: 4500, side: 'sell', basePrice:  28.0d],
    // ── Energy (3 short — bearish energy thesis) ───────────────────────
    [symbol: 'XOM',   qty: 1100, side: 'sell', basePrice: 115.0d],
    [symbol: 'CVX',   qty:  800, side: 'sell', basePrice: 155.0d],
    [symbol: 'COP',   qty: 1100, side: 'sell', basePrice: 115.0d],
    // ── Consumer Discretionary (1 short) ───────────────────────────────
    [symbol: 'NKE',   qty: 1300, side: 'sell', basePrice:  95.0d],
]

OPEN_POSITIONS.each { pos ->
    def inst = instruments.find { it.symbol == pos.symbol }
    if (inst == null) {
        log.warn("Live position skipped: instrument '{}' not in seeded universe", pos.symbol)
        return
    }
    Timestamp openTs = Timestamp.from(liveStartTs.toInstant().plusSeconds(rand.nextInt(7200)))

    def sigRow = dbSql.firstRow("""
        INSERT INTO signal (strategy_run_id, instrument_id, ts, side, strength,
                            reason_text, implied_price, source_bar_ts)
        VALUES (?, ?, ?, ?, 0.85, 'live_entry', ?, ?) RETURNING id
    """, [liveRunId, inst.id, openTs, pos.side,
          (pos.basePrice as double), new Timestamp(openTs.time - (openTs.time % 60000L))])
    totalSignals++

    Timestamp orderTs = new Timestamp(openTs.time + 100)
    def ordRow = dbSql.firstRow('''
        INSERT INTO "order" (strategy_run_id, signal_id, instrument_id, ts_submitted, side, qty, type, status, ts_terminal)
        VALUES (?, ?, ?, ?, ?, ?, 'market', 'filled', ?) RETURNING id
    ''', [liveRunId, sigRow.id, inst.id, orderTs, pos.side, pos.qty, new Timestamp(orderTs.time + 250)])
    totalOrders++

    Timestamp fillTs = new Timestamp(orderTs.time + 250)
    double signedQty = (pos.side == 'buy') ? (pos.qty as double) : -(pos.qty as double)
    double fillPrice = pos.basePrice as double
    double fee = (pos.qty as double) * 0.005d
    dbSql.execute("""
        INSERT INTO fill (order_id, ts, qty, qty_signed, price, fee, venue, liquidity_flag)
        VALUES (?, ?, ?, ?, ?, ?, 'NYSE_ARCA', 'taker')
    """, [ordRow.id, fillTs, pos.qty, signedQty, fillPrice, fee])
    totalFills++
    // No closing fill — position remains open and surfaces in position_now / v_positions_marked.
}

log.info("=== Algo Trader Seed: COMPLETED ===")
log.info("Bars: {} | Runs: {} (+1 live) | Signals: {} | Orders: {} | Fills: {} | Trades: {} | Equity points: {} | Open positions: {}",
    totalBars, N_RUNS, totalSignals, totalOrders, totalFills, totalTrades, totalEquityPoints, OPEN_POSITIONS.size())
