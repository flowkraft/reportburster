<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Data Warehouse - ReportBurster</title>
    <style>
        rb-pivot-table { display: block; width: 100%; margin-bottom: 2rem; }
        rb-tabulator { display: block; width: 100%; min-height: 300px; }
        .code-block {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            color: #d4d4d4;
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            white-space: pre;
            line-height: 1.5;
            border: 1px solid #3d3d3d;
            max-height: 400px;
        }
        .engine-section {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            background: #ffffff;
        }
        .engine-section h6 {
            color: #1e40af;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .engine-section .engine-desc {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 1rem;
        }
        .howto-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        .howto-section h5 {
            color: #2563eb;
            margin-bottom: 1rem;
        }
        .howto-section h6 {
            color: #1e40af;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
        }
        .howto-section .step {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 0.75rem;
        }
        .howto-section .step-title {
            font-weight: 600;
            color: #334155;
            margin-bottom: 0.5rem;
        }
        .howto-section .step-action {
            font-family: monospace;
            background: #e0e7ff;
            padding: 2px 6px;
            border-radius: 4px;
            color: #3730a3;
        }
        .howto-section .insight {
            color: #059669;
            font-style: italic;
        }
        .howto-section ul {
            margin-bottom: 0;
        }
        .howto-section .sql-compare {
            background: #1e1e1e;
            color: #9cdcfe;
            font-family: monospace;
            font-size: 0.8rem;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 0.5rem 0;
        }
        .howto-section .pivot-compare {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 0.5rem 0;
        }
        .engine-section[id] {
            scroll-margin-top: 80px;
        }
        .tier-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            height: 100%;
            transition: border-color 0.2s;
        }
        .tier-card:hover {
            border-color: #93c5fd;
        }
        .tier-card .volume-badge {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 12px;
            margin-bottom: 0.5rem;
        }
        .tier-card.tier-browser .volume-badge { background: #dbeafe; color: #1e40af; }
        .tier-card.tier-duckdb .volume-badge { background: #fef3c7; color: #92400e; }
        .tier-card.tier-clickhouse .volume-badge { background: #fce7f3; color: #9d174d; }
    </style>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3"><i class="bi bi-database me-2"></i>Northwind Data Warehouse (Sample Data)</h4>
            <p class="text-muted mb-3">OLAP analysis on ~8,000 sample sales transactions with Browser, DuckDB, and ClickHouse engines.
                All three engines share the same data and the same pivot configuration &mdash; so you can compare them side by side and switch engines without changing anything else.</p>

            <!-- Data Warehouse Facts -->
            <div class="mb-4">
                <p class="mb-2">
                    Data warehouses store large volumes of business data for historical analysis and reporting.
                    Processing these volumes requires specialized techniques &mdash; but more tools mean more infrastructure, more complexity, and higher costs.
                </p>
                <p class="mb-3">
                    <strong>ReportBurster's approach:</strong> start with the simplest option. Only move to the next tier when your data volume actually demands it.
                </p>

                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <div class="tier-card tier-browser">
                            <h6 class="mb-1"><i class="bi bi-globe me-1"></i> Browser Pivot</h6>
                            <span class="volume-badge">Up to ~100K rows</span>
                            <p class="small text-muted mb-2">
                                The default. Zero setup, zero overhead. All processing happens in your browser.
                                Most reports never need anything else &mdash; just build your reports normally.
                            </p>
                            <a href="#engine-browser" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-arrow-down-short"></i> Jump to Browser
                            </a>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="tier-card tier-duckdb">
                            <h6 class="mb-1"><i class="bi bi-hdd me-1"></i> DuckDB</h6>
                            <span class="volume-badge">~100K &ndash; 100M rows</span>
                            <p class="small text-muted mb-2">
                                Almost no overhead &mdash; a single file on disk. Server-side aggregation handles
                                medium to large volumes. You just need to be aware it exists and use / enable it.
                            </p>
                            <a href="#engine-duckdb" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-arrow-down-short"></i> Jump to DuckDB
                            </a>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="tier-card tier-clickhouse">
                            <h6 class="mb-1"><i class="bi bi-server me-1"></i> ClickHouse</h6>
                            <span class="volume-badge">100M &ndash; 10B+ rows</span>
                            <p class="small text-muted mb-2">
                                For truly massive volumes. A dedicated OLAP server with sub-second queries on billions of rows.
                                Additional infrastructure and maintenance cost, but unmatched performance at scale.
                            </p>
                            <a href="#engine-clickhouse" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-arrow-down-short"></i> Jump to ClickHouse
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bootstrap 5 Tabs -->
            <ul class="nav nav-tabs" id="warehouseTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="warehouse-tab" data-bs-toggle="tab" data-bs-target="#warehouse-pane" type="button" role="tab" aria-controls="warehouse-pane" aria-selected="true">
                        <i class="bi bi-database"></i> Data Warehouse
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="rawdata-tab" data-bs-toggle="tab" data-bs-target="#rawdata-pane" type="button" role="tab" aria-controls="rawdata-pane" aria-selected="false">
                        <i class="bi bi-table"></i> Raw Data
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="config-tab" data-bs-toggle="tab" data-bs-target="#config-pane" type="button" role="tab" aria-controls="config-pane" aria-selected="false">
                        <i class="bi bi-gear"></i> Configuration
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="usage-tab" data-bs-toggle="tab" data-bs-target="#usage-pane" type="button" role="tab" aria-controls="usage-pane" aria-selected="false">
                        <i class="bi bi-code-slash"></i> Usage
                    </button>
                </li>
            </ul>

            <div class="tab-content border border-top-0 rounded-bottom p-3" id="warehouseTabContent">
                <!-- Data Warehouse Tab -->
                <div class="tab-pane fade show active" id="warehouse-pane" role="tabpanel" aria-labelledby="warehouse-tab">

                    <div class="alert alert-info mb-3">
                        <strong>~8,000 sales transactions</strong> across 10 Countries × 8 Product Categories × 8 Quarters (2023–2024),
                        built on a star schema (<code>vw_sales_detail</code>) with realistic regional preferences, seasonal patterns,
                        and market-size variation. Same data served from 3 engines below — all produce identical results.
                    </div>

                    <!-- Browser Engine -->
                    <div class="engine-section" id="engine-browser">
                        <h6><i class="bi bi-globe"></i> Browser Engine</h6>
                        <p class="engine-desc">
                            All ~8,000 rows loaded to your browser, aggregated client-side in JavaScript.
                            Drag-and-drop rearrangement is instant. Ideal for up to <strong>50K–100K rows</strong> (snappy).
                            Works acceptably up to <strong>~500K rows</strong>. Beyond that, switch to DuckDB or ClickHouse.
                        </p>
                        <rb-pivot-table
                            id="warehousePivotBrowser"
                            report-code="piv-northwind-warehouse-browser"
                            api-base-url="${RbUtils.apiBaseUrl}"
                            api-key="${RbUtils.apiKey}"
                        ></rb-pivot-table>
                    </div>

                    <!-- DuckDB Engine -->
                    <div class="engine-section" id="engine-duckdb">
                        <h6><i class="bi bi-hdd"></i> DuckDB Engine</h6>
                        <p class="engine-desc">
                            Server-side embedded OLAP database (single file, zero setup).
                            Aggregation runs on the server, only results sent to browser.
                            Sweet spot: up to <strong>1–10 million rows</strong>. Handles <strong>10–100M rows</strong> with tuning.
                            Perfect for analyst workloads without infrastructure.
                        </p>
                        <rb-pivot-table
                            id="warehousePivotDuckdb"
                            report-code="piv-northwind-warehouse-duckdb"
                            api-base-url="${RbUtils.apiBaseUrl}"
                            api-key="${RbUtils.apiKey}"
                        ></rb-pivot-table>
                    </div>

                    <!-- ClickHouse Engine -->
                    <div class="engine-section" id="engine-clickhouse">
                        <h6><i class="bi bi-server"></i> ClickHouse Engine</h6>
                        <p class="engine-desc">
                            Server-side columnar OLAP database (requires ClickHouse starter pack).
                            Built for scale: handles <strong>millions to billions of rows</strong> with sub-second queries.
                            The go-to for production analytics — <strong>100M–10B+ rows</strong> is everyday territory.
                        </p>
                        <div id="clickhouseWarning" class="alert alert-warning mb-3 small">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Start the ClickHouse starter pack from the Connections page to see warehouse data.
                        </div>
                        <rb-pivot-table
                            id="warehousePivotClickhouse"
                            report-code="piv-northwind-warehouse-clickhouse"
                            api-base-url="${RbUtils.apiBaseUrl}"
                            api-key="${RbUtils.apiKey}"
                        ></rb-pivot-table>
                    </div>

                    <!-- How to Use Guide -->
                    <div class="howto-section">
                        <h5><i class="bi bi-lightbulb"></i> How to Use This Warehouse Pivot</h5>

                        <p><strong>What you're looking at right now:</strong></p>
                        <p>
                            The default view shows <strong>Country → Category</strong> as rows, <strong>Year-Quarter</strong> as columns,
                            and <strong>Sum of net_revenue</strong> in each cell. This is a real data warehouse layout — the same kind of
                            analysis people build in Excel every Monday morning, except here it's instant and interactive.
                        </p>
                        <p>~8,000 transactions. 10 countries. 8 product categories. 8 quarters. 30 customers. 16 products. 3 sales reps. Try everything below — every step works on the live data in front of you.</p>

                        <h6>Step-by-Step: Do These Now</h6>

                        <div class="step">
                            <div class="step-title">1. Find the Biggest Market</div>
                            <p class="mb-1">Look at the <strong>row totals</strong> (rightmost column). Which country drives the most revenue?</p>
                            <p class="mb-1"><strong>Try:</strong> Scan the <span class="step-action">Totals</span> column. USA and Germany should be at the top — they're the largest markets.</p>
                            <p class="mb-0 insight">→ You just answered "Where should we focus sales effort?" without writing a single query.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">2. Drill Into a Country</div>
                            <p class="mb-1">Each country row has category sub-rows (Country → Category hierarchy).</p>
                            <p class="mb-1"><strong>Try:</strong> Find <span class="step-action">Germany</span> and look at its category breakdown. <strong>Dairy Products</strong> and <strong>Confections</strong> should be notably higher than Meat — Europeans buy more dairy.</p>
                            <p class="mb-1">Now find <span class="step-action">USA</span>. <strong>Meat/Poultry</strong> and <strong>Condiments</strong> should be stronger — different regional preferences.</p>
                            <p class="mb-0 insight">→ Same product catalog, completely different buying patterns by geography. This is exactly what OLAP reveals.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">3. Compare Continents Instead of Countries</div>
                            <p class="mb-1"><strong>Try:</strong> Drag <span class="step-action">continent</span> from the unused fields area → Drop it into the <strong>rows area</strong>, above <code>customer_country</code>. Then drag <code>customer_country</code> out (back to unused).</p>
                            <p class="mb-1">Now you see: <strong>Europe vs North America vs South America</strong> — clean continent-level totals per quarter.</p>
                            <p class="mb-0 insight">→ "Is Europe or the Americas our bigger market?" — answered. One drag, zero SQL.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">4. Spot the Seasonal Pattern</div>
                            <p class="mb-1">Look across the quarter columns (2023-Q1 through 2024-Q4).</p>
                            <p class="mb-1"><strong>Try:</strong> Compare any country's <span class="step-action">Q4</span> vs <span class="step-action">Q1</span> values. Q4 (holiday season) should be noticeably higher than Q1 (post-holiday slowdown).</p>
                            <p class="mb-0 insight">→ "Is our business seasonal?" — the pattern is right there: Q1 &lt; Q2 &lt; Q3 &lt; Q4, every year. Plan inventory accordingly.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">5. Check Year-over-Year Growth</div>
                            <p class="mb-1"><strong>Try:</strong> Compare <span class="step-action">2023-Q1</span> column totals vs <span class="step-action">2024-Q1</span>. The 2024 numbers should be ~5% higher across the board.</p>
                            <p class="mb-0 insight">→ "Are we growing?" — yes, consistently. This is how CFOs track performance without a BI team.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">6. Gross vs Net — What Are Discounts Costing Us?</div>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">net_revenue ▼</span> dropdown in the values area → Select <strong>gross_revenue</strong> instead.</p>
                            <p class="mb-1">The numbers go up. The difference = discount impact. Switch back to <code>net_revenue</code>.</p>
                            <p class="mb-1">Now try: Select <strong>both</strong> <code>net_revenue</code> and <code>gross_revenue</code> at the same time (if supported) or toggle between them.</p>
                            <p class="mb-0 insight">→ "How much margin are we giving away in discounts?" — the gap between gross and net tells you instantly.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">7. Who's Selling What? (Sales Rep Analysis)</div>
                            <p class="mb-1"><strong>Try:</strong> Drag <span class="step-action">employee_name</span> into rows. You'll see Nancy Davolio, Andrew Fuller, and Janet Leverling.</p>
                            <p class="mb-1">Now drag <span class="step-action">category_name</span> below <code>employee_name</code> in rows.</p>
                            <p class="mb-0 insight">→ "Which rep sells the most Seafood?" "Who's our Dairy specialist?" — it's a performance review in one glance.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">8. Average Transaction Value (Not Just Totals)</div>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">Sum ▼</span> dropdown (top-left) → Select <strong>Average</strong>.</p>
                            <p class="mb-1">Now cells show average revenue per transaction, not totals. High-volume countries might have <em>lower</em> averages.</p>
                            <p class="mb-0 insight">→ "Are we making money through volume or premium pricing?" — Average separates the two.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">9. Filter to Focus</div>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">▼</span> triangle next to <code>customer_country</code> → Uncheck everything except <strong>USA</strong>, <strong>Germany</strong>, and <strong>France</strong>.</p>
                            <p class="mb-0 insight">→ Noise gone. Three key markets compared side by side. This is how you prepare a board presentation in 10 seconds.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">10. Visualize It</div>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">Table ▼</span> renderer dropdown → Select <strong>Grouped Column Chart</strong>.</p>
                            <p class="mb-1">Countries become colored bars, quarters become groups. Trends jump out visually.</p>
                            <p class="mb-1">Try <strong>Stacked Bar Chart</strong> (see category proportions) or <strong>Line Chart</strong> (see trends over time).</p>
                            <p class="mb-0 insight">→ Same data, different presentation. Charts make the pattern obvious for non-technical stakeholders.</p>
                        </div>

                        <h6>Real Questions This Data Answers</h6>
                        <ul>
                            <li><strong>"Which country-category combo is our gold mine?"</strong> — Default view. Scan for the biggest cells. Germany × Dairy? USA × Meat?</li>
                            <li><strong>"Should we invest more in Europe or the Americas?"</strong> — Drag <code>continent</code> to rows. Compare totals. Decision made.</li>
                            <li><strong>"Are discounts eating our margins?"</strong> — Toggle between <code>gross_revenue</code> and <code>net_revenue</code>. The gap = discount cost.</li>
                            <li><strong>"What's our Q4 holiday uplift?"</strong> — Compare Q4 vs Q2 columns. The difference is your seasonal revenue.</li>
                            <li><strong>"Do Europeans buy different products than Americans?"</strong> — Rows: <code>continent</code> → <code>category_name</code>. Europe leans Dairy + Confections. Americas lean Meat + Condiments.</li>
                            <li><strong>"Which product should we discontinue?"</strong> — Drag <code>product_name</code> to rows, remove countries. Sort by totals. Lowest performer = candidate.</li>
                            <li><strong>"Who gets the sales bonus this quarter?"</strong> — Drag <code>employee_name</code> to rows. Highest total wins.</li>
                            <li><strong>"Is Sweden worth keeping as a market?"</strong> — Filter to just Sweden. Small revenue? Compare cost of operations vs revenue. The data tells the story.</li>
                        </ul>

                        <h6>Why This Matters — The "Excel Problem"</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>What teams do today:</strong></p>
                                <div class="sql-compare">
<pre>
1. Export data to CSV
2. Open in Excel
3. Build pivot table manually
4. Email the spreadsheet
5. Someone asks "now show me by quarter"
6. Rebuild the pivot table
7. Repeat 47 times...
</pre>
</div>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>What this does instead:</strong></p>
                                <div class="pivot-compare">
<strong>✓</strong> Data stays in the warehouse (no CSV exports)<br>
<strong>✓</strong> Anyone opens the link, drags dimensions, gets answers<br>
<strong>✓</strong> "Show me by quarter" = one drag, 2 seconds<br>
<strong>✓</strong> Always live data, never a stale spreadsheet<br>
<strong>✓</strong> Works on 8,000 rows or 8 million (switch engines)</div>
                            </div>
                        </div>

                        <p class="mt-3 mb-0">
                            <strong>Bottom line:</strong> If your team currently exports to Excel to build pivot tables, they already know
                            how to use this — it's the same concept, except it's live, connected to the database, and sharable via URL.
                            No more "which version of the spreadsheet is correct?" conversations.
                        </p>
                    </div>

                </div>

                <!-- Raw Data Tab -->
                <div class="tab-pane fade" id="rawdata-pane" role="tabpanel" aria-labelledby="rawdata-tab">
                    <p class="text-muted small mb-3">
                        <i class="bi bi-info-circle"></i> Raw source data (~8,000 rows) that feeds the warehouse pivot tables.
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <label class="small text-muted me-2">Page size:</label>
                            <select id="rawDataPageSize" class="form-select form-select-sm d-inline-block" style="width: auto;">
                                <option value="10" selected>10</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        <span id="rawDataInfo" class="small text-muted"></span>
                    </div>
                    <div id="rawDataLoading" class="text-center py-4 d-none">
                        <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                        <span class="text-muted ms-2">Loading data...</span>
                    </div>
                    <div id="rawDataError" class="alert alert-danger d-none"></div>
                    <div class="table-responsive">
                        <table id="rawDataTable" class="table table-striped table-sm table-hover d-none">
                            <thead id="rawDataHead" class="table-light"></thead>
                            <tbody id="rawDataBody"></tbody>
                        </table>
                    </div>
                    <nav id="rawDataPagination" class="d-none" aria-label="Raw data pagination">
                        <ul class="pagination pagination-sm justify-content-center"></ul>
                    </nav>
                </div>

                <!-- Configuration Tab -->
                <div class="tab-pane fade" id="config-pane" role="tabpanel" aria-labelledby="config-tab">
                    <p class="text-muted small mb-3">
                        <i class="bi bi-info-circle me-1"></i>
                        All three reports use the same pivot table configuration &mdash; only the OLAP backend engine differs.
                        This lets you choose the engine that matches your data volume without changing your report definition.
                    </p>
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-globe"></i> Browser Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-config-btn" data-target="configCodeBrowser" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="configCodeBrowser" class="code-block mt-2"><code class="text-muted">Loading configuration...</code></pre>
                    </div>
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-hdd"></i> DuckDB Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-config-btn" data-target="configCodeDuckdb" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="configCodeDuckdb" class="code-block mt-2"><code class="text-muted">Loading configuration...</code></pre>
                    </div>
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-server"></i> ClickHouse Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-config-btn" data-target="configCodeClickhouse" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="configCodeClickhouse" class="code-block mt-2"><code class="text-muted">Loading configuration...</code></pre>
                    </div>
                </div>

                <!-- Usage Tab -->
                <div class="tab-pane fade" id="usage-pane" role="tabpanel" aria-labelledby="usage-tab">
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-globe"></i> Browser Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-usage-btn" data-target="usageCodeBrowser" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="usageCodeBrowser" class="bg-light p-3 border rounded mb-0 mt-2"><code>&lt;rb-pivot-table
    report-code="piv-northwind-warehouse-browser"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-pivot-table&gt;</code></pre>
                    </div>
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-hdd"></i> DuckDB Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-usage-btn" data-target="usageCodeDuckdb" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="usageCodeDuckdb" class="bg-light p-3 border rounded mb-0 mt-2"><code>&lt;rb-pivot-table
    report-code="piv-northwind-warehouse-duckdb"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-pivot-table&gt;</code></pre>
                    </div>
                    <div class="engine-section mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-server"></i> ClickHouse Engine</h6>
                            <button class="btn btn-outline-secondary btn-sm copy-usage-btn" data-target="usageCodeClickhouse" title="Copy to clipboard">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <pre id="usageCodeClickhouse" class="bg-light p-3 border rounded mb-0 mt-2"><code>&lt;rb-pivot-table
    report-code="piv-northwind-warehouse-clickhouse"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-pivot-table&gt;</code></pre>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Copy-to-clipboard toast -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="copyToast" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-1"></i> Copied to clipboard!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {

            // ================================================================
            // Copy to Clipboard (matching pivot-tables pattern)
            // ================================================================
            var copyToast = new bootstrap.Toast(document.getElementById('copyToast'), { delay: 2000 });

            function copyWithFeedback(btn, text) {
                navigator.clipboard.writeText(text).then(function() {
                    var icon = btn.querySelector('i');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-check');
                    copyToast.show();
                    setTimeout(function() {
                        icon.classList.remove('bi-check');
                        icon.classList.add('bi-clipboard');
                    }, 2000);
                });
            }

            document.querySelectorAll('.copy-config-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var preEl = document.getElementById(this.dataset.target);
                    copyWithFeedback(this, preEl ? preEl.textContent : '');
                });
            });

            document.querySelectorAll('.copy-usage-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var preEl = document.getElementById(this.dataset.target);
                    copyWithFeedback(this, preEl ? preEl.textContent : '');
                });
            });

            // ================================================================
            // ClickHouse: show/hide warning based on data fetch result
            // ================================================================
            var clickhouseComponent = document.getElementById('warehousePivotClickhouse');
            var clickhouseWarning = document.getElementById('clickhouseWarning');
            if (clickhouseComponent) {
                clickhouseComponent.addEventListener('pivotExecuted', function() {
                    if (clickhouseWarning) clickhouseWarning.classList.add('d-none');
                });
                clickhouseComponent.addEventListener('error', function(event) {
                    console.warn('[data-warehouse] ClickHouse connection failed:', event.detail);
                    if (clickhouseWarning) clickhouseWarning.classList.remove('d-none');
                    showClickHouseWarningToast();
                });
            }

            // ================================================================
            // Configuration tab: read configDsl from each pivot component
            // ================================================================
            var engines = [
                { id: 'warehousePivotBrowser', configId: 'configCodeBrowser' },
                { id: 'warehousePivotDuckdb', configId: 'configCodeDuckdb' },
                { id: 'warehousePivotClickhouse', configId: 'configCodeClickhouse' },
            ];

            engines.forEach(function(engine) {
                var comp = document.getElementById(engine.id);
                var codeEl = document.getElementById(engine.configId);
                if (!comp || !codeEl) return;

                function updateConfig() {
                    if (comp.configDsl) {
                        var escaped = comp.configDsl
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');
                        codeEl.innerHTML = '<code>' + escaped + '</code>';
                    }
                }

                comp.addEventListener('configLoaded', updateConfig);
                comp.addEventListener('dataFetched', updateConfig);
                setTimeout(updateConfig, 500);
                setTimeout(updateConfig, 2000);
            });

            // ================================================================
            // Raw Data tab: server-side paginated Bootstrap table
            // ================================================================
            (function() {
                var apiBase = '${RbUtils.apiBaseUrl}';
                var reportCode = 'piv-northwind-warehouse-browser';
                var currentPage = 0;
                var pageSize = 10;
                var totalRows = 0;
                var columns = null;
                var loaded = false;

                function fetchPage() {
                    var offset = currentPage * pageSize;
                    document.getElementById('rawDataLoading').classList.remove('d-none');
                    document.getElementById('rawDataError').classList.add('d-none');

                    fetch(apiBase + '/reports/' + reportCode + '/data?offset=' + offset + '&limit=' + pageSize)
                        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                        .then(function(result) {
                            var data = result.reportData || [];
                            totalRows = result.totalRows || 0;

                            // Build header once
                            if (!columns) {
                                columns = result.reportColumnNames || (data.length ? Object.keys(data[0]) : []);
                                var headRow = '<tr>' + columns.map(function(c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
                                document.getElementById('rawDataHead').innerHTML = headRow;
                            }

                            // Build body
                            var rows = data.map(function(row) {
                                return '<tr>' + columns.map(function(c) {
                                    return '<td>' + (row[c] != null ? row[c] : '') + '</td>';
                                }).join('') + '</tr>';
                            }).join('');
                            document.getElementById('rawDataBody').innerHTML = rows;

                            // Info text
                            var from = offset + 1;
                            var to = Math.min(offset + pageSize, totalRows);
                            document.getElementById('rawDataInfo').textContent =
                                'Showing ' + from + '-' + to + ' of ' + totalRows + ' rows';

                            // Show table, hide loading
                            document.getElementById('rawDataLoading').classList.add('d-none');
                            document.getElementById('rawDataTable').classList.remove('d-none');
                            document.getElementById('rawDataPagination').classList.remove('d-none');

                            renderPagination();
                            loaded = true;
                        })
                        .catch(function(err) {
                            document.getElementById('rawDataLoading').classList.add('d-none');
                            document.getElementById('rawDataError').textContent = 'Failed to load data: ' + err.message;
                            document.getElementById('rawDataError').classList.remove('d-none');
                        });
                }

                function renderPagination() {
                    var totalPages = Math.ceil(totalRows / pageSize);
                    var ul = document.querySelector('#rawDataPagination ul');
                    var html = '';

                    html += '<li class="page-item ' + (currentPage === 0 ? 'disabled' : '') + '">'
                         +  '<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">&laquo;</a></li>';

                    for (var i = 0; i < totalPages; i++) {
                        if (totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2) {
                            html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '">'
                                 +  '<a class="page-link" href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
                        } else if (i === 1 || i === totalPages - 2) {
                            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                        }
                    }

                    html += '<li class="page-item ' + (currentPage >= totalPages - 1 ? 'disabled' : '') + '">'
                         +  '<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">&raquo;</a></li>';

                    ul.innerHTML = html;

                    ul.querySelectorAll('a[data-page]').forEach(function(a) {
                        a.addEventListener('click', function(e) {
                            e.preventDefault();
                            var p = parseInt(this.dataset.page);
                            if (p >= 0 && p < totalPages) { currentPage = p; fetchPage(); }
                        });
                    });
                }

                // Load on tab show
                var rawTab = document.getElementById('rawdata-tab');
                if (rawTab) {
                    rawTab.addEventListener('shown.bs.tab', function() {
                        if (!loaded) fetchPage();
                    });
                }

                // Page size change
                var pageSizeEl = document.getElementById('rawDataPageSize');
                if (pageSizeEl) {
                    pageSizeEl.addEventListener('change', function() {
                        pageSize = parseInt(this.value);
                        currentPage = 0;
                        fetchPage();
                    });
                }
            })();
        });

        function showClickHouseWarningToast() {
            var toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toastContainer';
                toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
                toastContainer.style.zIndex = '9999';
                document.body.appendChild(toastContainer);
            }

            var toastHtml =
                '<div class="toast align-items-center text-bg-warning border-0" role="alert" aria-live="assertive" aria-atomic="true">'
              + '  <div class="d-flex">'
              + '    <div class="toast-body">'
              + '      <i class="bi bi-exclamation-triangle me-2"></i>'
              + '      <strong>ClickHouse Unavailable:</strong> Start the ClickHouse starter pack to enable the ClickHouse pivot table.'
              + '    </div>'
              + '    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>'
              + '  </div>'
              + '</div>';

            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = toastHtml;
            var toastElement = tempDiv.firstElementChild;
            toastContainer.appendChild(toastElement);

            var toast = new bootstrap.Toast(toastElement, { delay: 5000 });
            toast.show();

            toastElement.addEventListener('hidden.bs.toast', function() {
                toastElement.remove();
            });
        }
    </script>
    </content>
</body>
</html>
