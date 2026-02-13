<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Pivot Tables - ReportBurster</title>
    <style>
        rb-pivot-table { display: block; width: 100%; }
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
    </style>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Pivot Tables</h4>
            <p class="text-muted mb-4">Drag-and-drop data analysis with aggregation and grouping.</p>
            
            <!-- Bootstrap 5 Tabs -->
            <ul class="nav nav-tabs" id="pivotTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="component-tab" data-bs-toggle="tab" data-bs-target="#component-pane" type="button" role="tab" aria-controls="component-pane" aria-selected="true">
                        <i class="bi bi-grid-3x3"></i> Pivot Table
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
            
            <div class="tab-content border border-top-0 rounded-bottom p-3" id="pivotTabContent">
                <!-- Pivot Table Tab -->
                <div class="tab-pane fade show active" id="component-pane" role="tabpanel" aria-labelledby="component-tab">
                    <div class="d-flex justify-content-end mb-2">
                        <button id="refreshBtn" class="btn btn-outline-secondary btn-sm" title="Refresh">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <rb-pivot-table 
                        id="demoPivot"
                        report-code="piv-sales-region-prod-qtr"
                        api-base-url="${RbUtils.apiBaseUrl}"
                        api-key="${RbUtils.apiKey}"
                    ></rb-pivot-table>

                    <!-- How to Use Section (demo pivot) -->
                    <div class="howto-section">
                        <h5><i class="bi bi-lightbulb"></i> How to Use This Pivot Table</h5>

                        <p><strong>What you're looking at:</strong> 64 rows of sales data — 4 Regions × 4 Products × 4 Quarters.
                        The pivot table transforms this into an instant analysis grid. No SQL, no formulas.</p>

                        <h6>Quick Actions (Try These Now)</h6>

                        <div class="step">
                            <div class="step-title">1. Change the Metric</div>
                            <p class="mb-1">Current: <span class="step-action">Sum of Revenue</span></p>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">Revenue ▼</span> dropdown (top area) → Select <strong>Profit</strong></p>
                            <p class="mb-0 insight">→ Now see profit margins. High revenue but low profit? You'll spot it instantly.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">2. Rearrange Dimensions</div>
                            <p class="mb-1"><strong>Try:</strong> Drag <span class="step-action">Quarter</span> from columns → Drop into rows below Region</p>
                            <p class="mb-0 insight">→ Now quarters are rows. "Which quarter was strongest?" — see row totals immediately.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">3. Add a Dimension</div>
                            <p class="mb-1"><strong>Try:</strong> Drag <span class="step-action">SalesRep</span> from unused area → Drop into rows after Product</p>
                            <p class="mb-0 insight">→ See Region → Product → SalesRep hierarchy. "Who sold most Laptops in North?" — answered.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">4. Filter Data</div>
                            <p class="mb-1"><strong>Try:</strong> Click the <span class="step-action">▼</span> triangle next to Region → Uncheck North and West</p>
                            <p class="mb-0 insight">→ Table now shows ONLY South and East. Focus on what matters.</p>
                        </div>

                        <div class="step">
                            <div class="step-title">5. Change Aggregation</div>
                            <p class="mb-1"><strong>Try:</strong> Click <span class="step-action">Sum ▼</span> dropdown (top left) → Select <strong>Average</strong></p>
                            <p class="mb-0 insight">→ See average per transaction, not totals. "Are Q4 prices higher or just more volume?"</p>
                        </div>

                        <div class="step">
                            <div class="step-title">6. Visualize as Chart</div>
                            <p class="mb-1"><strong>Try:</strong> Click <span class="step-action">Table ▼</span> dropdown → Select <strong>Grouped Column Chart</strong></p>
                            <p class="mb-0 insight">→ Same data, visual format. Trends jump out. Try "Stacked Bar" or "Line Chart" too.</p>
                        </div>

                        <h6>Real Business Questions This Answers</h6>
                        <ul>
                            <li><strong>"Which product is our cash cow?"</strong> — Put Product in rows, look at Totals column. Laptop = $258,000 (highest).</li>
                            <li><strong>"Is East region underperforming?"</strong> — Current view: East = $170,850 vs West = $173,850. Yes, investigate.</li>
                            <li><strong>"Who gets the sales bonus?"</strong> — Drag SalesRep to rows, sort by totals. Highest revenue wins.</li>
                            <li><strong>"Are we profitable or just busy?"</strong> — Switch from Revenue to Profit. High revenue + low margins? Now you see it.</li>
                        </ul>

                        <h6>The Point: Why This Matters</h6>

                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Without pivot table:</strong></p>
                                <div class="sql-compare">
  <pre>
-- Question 1: Revenue by region
SELECT Region, SUM(Revenue)
FROM sales GROUP BY Region;

-- Question 2: Revenue by product
SELECT Product, SUM(Revenue)
FROM sales GROUP BY Product;

-- 20 more queries for different angles...
  </pre>
</div>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>With pivot table:</strong></p>
                                <div class="pivot-compare">
<strong>✓</strong> Drag Region to rows → Question 1 answered<br>
<strong>✓</strong> Drag Product instead → Question 2 answered<br>
<strong>✓</strong> 3 seconds total, no coding<br>
<strong>✓</strong> 1000 ways to slice the same data</div>
                            </div>
                        </div>

                        <p class="mt-3 mb-0">
                            <strong>Bottom line:</strong> Pivot tables = SQL GROUP BY + Excel formulas + visualization — combined.
                            Drag and drop. Instant answers. Questions answered faster = better decisions.
                        </p>
                    </div>
                </div>

                <!-- Raw Data Tab -->
                <div class="tab-pane fade" id="rawdata-pane" role="tabpanel" aria-labelledby="rawdata-tab">
                    <p class="text-muted small mb-3">
                        <i class="bi bi-info-circle"></i> This is the raw source data (64 rows) that feeds the pivot table.
                    </p>
                    <rb-tabulator 
                        id="rawDataTable"
                        report-code="piv-sales-region-prod-qtr"
                        api-base-url="${RbUtils.apiBaseUrl}"
                        api-key="${RbUtils.apiKey}"
                    ></rb-tabulator>
                </div>
                
                <!-- Configuration Tab -->
                <div class="tab-pane fade" id="config-pane" role="tabpanel" aria-labelledby="config-tab">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <button id="copyConfigBtn" class="btn btn-outline-secondary btn-sm" title="Copy to clipboard">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <pre id="configCode" class="code-block"><code class="text-muted">Loading configuration...</code></pre>
                </div>
                
                <!-- Usage Tab -->
                <div class="tab-pane fade" id="usage-pane" role="tabpanel" aria-labelledby="usage-tab">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small">HTML Usage</span>
                        <button id="copyUsageBtn" class="btn btn-outline-secondary btn-sm" title="Copy to clipboard">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <pre id="usageCode" class="bg-light p-3 border rounded mb-0"><code>&lt;rb-pivot-table 
    report-code="piv-sales-region-prod-qtr"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-pivot-table&gt;</code></pre>
                </div>
            </div>

        </div>
    </div>

    <!-- Toast container -->
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
            const copyToast = new bootstrap.Toast(document.getElementById('copyToast'), { delay: 2000 });
            const component = document.getElementById('demoPivot');
            const configCodeEl = document.getElementById('configCode');
            
            function copyWithFeedback(btn, text) {
                navigator.clipboard.writeText(text).then(() => {
                    const icon = btn.querySelector('i');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-check');
                    copyToast.show();
                    setTimeout(() => {
                        icon.classList.remove('bi-check');
                        icon.classList.add('bi-clipboard');
                    }, 2000);
                });
            }
            
            function updateConfigDisplay() {
                console.log('[pivotTables GSP] updateConfigDisplay called, configDsl:', component.configDsl ? component.configDsl.length + ' chars' : 'null');
                if (component.configDsl) {
                    const escaped = component.configDsl
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    configCodeEl.innerHTML = '<code>' + escaped + '</code>';
                }
            }
            
            // Listen for component ready events
            component.addEventListener('configLoaded', updateConfigDisplay);
            component.addEventListener('dataFetched', updateConfigDisplay);
            
            // Also check immediately in case component already loaded before listener was attached
            setTimeout(updateConfigDisplay, 100);
            setTimeout(updateConfigDisplay, 500);
            
            // Refresh button (demo pivot)
            document.getElementById('refreshBtn').addEventListener('click', () => {
                component.fetchData({});
            });

            // Copy config button
            document.getElementById('copyConfigBtn').addEventListener('click', function() {
                copyWithFeedback(this, component.configDsl || '');
            });
            
            // Copy usage button
            document.getElementById('copyUsageBtn').addEventListener('click', function() {
                copyWithFeedback(this, document.getElementById('usageCode').innerText);
            });
        });
    </script>
    </content>
</body>
</html>
